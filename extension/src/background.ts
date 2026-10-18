// Service worker (Chromium) / script d'arrière-plan (Firefox).
// État : storage.session uniquement (jeton, configuration, captures en attente).

import browser, { type Runtime } from 'webextension-polyfill';
import * as api from './lib/api';
import { ApiError } from './lib/api';
import { findBestMatch, matchUrl } from './lib/glob';
import { AUTOSUBMIT_GUARD_MS, decideGuard, recentAutoSubmitSteps, type AutoSubmitMark } from './lib/guard';
import { isAllowedUrl, isValidApiBase } from './lib/origins';
import { resolvePageUrl } from './lib/url';
import type {
  AuthState,
  BgRequest,
  ExtApplication,
  ExtConfig,
  FillStep,
  GuardMatchResponse,
  GuardResult,
  MatchResponse,
  MatchedApp,
  PopupState,
  PromptInfo,
  PromptMode,
  RevealResponse,
  SimpleResult,
  TabRequest,
} from './lib/messages';

const PORTAL_ORIGINS = __PORTAL_ORIGINS__;
/** Origine principale : bouton « Ouvrir le portail » et page de confidentialité. */
const MAIN_PORTAL_ORIGIN = PORTAL_ORIGINS[0] ?? '';
const CONFIG_ALARM = 'sbee-refresh-config';
const CLEANUP_ALARM = 'sbee-cleanup';
const CAPTURE_TTL_MS = 60_000;

const session = browser.storage.session;

interface PendingCapture {
  application_id: number;
  app_name: string;
  login_identifier: string;
  secret: string;
  mode: PromptMode;
  at: number;
}

interface PartialIdentifier {
  application_id: number;
  login_identifier: string;
  at: number;
}

// ---------------------------------------------------------------------------
// Stockage de session

async function getItem<T>(key: string): Promise<T | undefined> {
  const res = await session.get(key);
  return res[key] as T | undefined;
}

function setItem(key: string, value: unknown): Promise<void> {
  return session.set({ [key]: value });
}

function removeItem(key: string | string[]): Promise<void> {
  return session.remove(key);
}

const captureKey = (tabId: number) => `capture:${tabId}`;
const identKey = (tabId: number) => `ident:${tabId}`;
const autoKey = (tabId: number) => `autosubmit:${tabId}`;
const knownKey = (appId: number) => `known:${appId}`;

async function getAuth(): Promise<AuthState | null> {
  const auth = await getItem<AuthState>('auth');
  if (!auth) return null;
  const exp = Date.parse(auth.expires_at);
  if (Number.isFinite(exp) && exp <= Date.now()) {
    await purge(true);
    return null;
  }
  return auth;
}

/** Efface tout l'état de session (jeton, configuration, captures). */
async function purge(askPortal: boolean): Promise<void> {
  await session.clear();
  await updateBadge(false);
  if (askPortal) await requestTokenFromPortal();
}

async function updateBadge(connected: boolean): Promise<void> {
  try {
    await browser.action.setBadgeText({ text: connected ? '' : '!' });
    await browser.action.setBadgeBackgroundColor({ color: '#ED1F24' });
    await browser.action.setTitle({ title: connected ? 'Coffre SBEE - connecté' : 'Coffre SBEE - non connecté' });
  } catch {
    // action indisponible : sans importance
  }
}

/** Demande un nouveau jeton à un onglet portail ouvert, s'il y en a un. */
async function requestTokenFromPortal(): Promise<void> {
  try {
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (tab.id === undefined || !isPortalUrl(tab.url)) continue;
      const msg: TabRequest = { type: 'request_token' };
      await browser.tabs.sendMessage(tab.id, msg, { frameId: 0 }).catch(() => undefined);
    }
  } catch {
    // aucun onglet portail
  }
}

function isPortalUrl(url: string | undefined): boolean {
  return isAllowedUrl(url, PORTAL_ORIGINS);
}

/** Exécute un appel API ; 401/403 -> purge + « Non connecté » + demande de jeton. */
async function withAuth<T>(fn: (auth: AuthState) => Promise<T>): Promise<T> {
  const auth = await getAuth();
  if (!auth) throw new ApiError(401, 'Non connecté au portail.');
  try {
    return await fn(auth);
  } catch (e) {
    if (e instanceof ApiError && e.isAuthError) await purge(true);
    throw e;
  }
}

async function refreshConfig(): Promise<ExtConfig | null> {
  try {
    const config = await withAuth((auth) => api.fetchConfig(auth));
    await setItem('config', config);
    await updateBadge(true);
    return config;
  } catch {
    return null;
  }
}

async function getConfig(): Promise<ExtConfig | null> {
  const auth = await getAuth();
  if (!auth) return null;
  const config = await getItem<ExtConfig>('config');
  return config ?? (await refreshConfig());
}

async function findApp(applicationId: number): Promise<ExtApplication | null> {
  const config = await getConfig();
  return config?.applications.find((a) => a.application_id === applicationId) ?? null;
}

function toMatched(app: ExtApplication): MatchedApp {
  const { login_url_pattern: _ignored, ...rest } = app;
  return rest;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

const credentialHash = (appId: number, identifier: string, secret: string) => sha256(`${appId}\n${identifier}\n${secret}`);

// ---------------------------------------------------------------------------
// Captures (proposition d'enregistrement)

async function getPendingCapture(tabId: number): Promise<PendingCapture | null> {
  const c = await getItem<PendingCapture>(captureKey(tabId));
  if (!c) return null;
  if (Date.now() - c.at > CAPTURE_TTL_MS) {
    await removeItem(captureKey(tabId));
    return null;
  }
  return c;
}

async function cleanupExpired(): Promise<void> {
  const all = await session.get(null);
  const now = Date.now();
  const stale: string[] = [];
  for (const [key, value] of Object.entries(all)) {
    if ((key.startsWith('capture:') || key.startsWith('ident:')) && now - ((value as { at?: number }).at ?? 0) > CAPTURE_TTL_MS) {
      stale.push(key);
    }
  }
  if (stale.length) await removeItem(stale);
}

async function handleCapture(msg: Extract<BgRequest, { type: 'capture' }>, sender: Runtime.MessageSender): Promise<{ mode: PromptMode | null }> {
  const tabId = sender.tab?.id;
  if (tabId === undefined) return { mode: null };
  const app = await findApp(msg.application_id);
  const url = effectiveUrl(msg.url, sender);
  if (!app || !url || !matchUrl(app.login_url_pattern, url)) return { mode: null };

  if (msg.kind === 'identifier') {
    const partial: PartialIdentifier = { application_id: app.application_id, login_identifier: msg.login_identifier, at: Date.now() };
    await setItem(identKey(tabId), partial);
    return { mode: null };
  }

  let identifier = msg.login_identifier?.trim() || null;
  if (!identifier) {
    const partial = await getItem<PartialIdentifier>(identKey(tabId));
    if (partial && partial.application_id === app.application_id && Date.now() - partial.at <= CAPTURE_TTL_MS) {
      identifier = partial.login_identifier;
    }
  }
  identifier ??= app.login_identifier;
  if (!identifier || !msg.secret) return { mode: null };

  let mode: PromptMode | null;
  if (!app.has_credential) {
    mode = 'save';
  } else {
    const hash = await credentialHash(app.application_id, identifier, msg.secret);
    const known = await getItem<string>(knownKey(app.application_id));
    mode = known === hash ? null : 'update';
  }
  if (!mode) return { mode: null };

  const capture: PendingCapture = {
    application_id: app.application_id,
    app_name: app.name,
    login_identifier: identifier,
    secret: msg.secret,
    mode,
    at: Date.now(),
  };
  await setItem(captureKey(tabId), capture);
  await removeItem(identKey(tabId));
  browser.alarms.create(CLEANUP_ALARM, { delayInMinutes: 1 });

  const prompt: PromptInfo = { mode, app_name: app.name, login_identifier: identifier };
  const show: TabRequest = { type: 'show_prompt', prompt };
  await browser.tabs.sendMessage(tabId, show, { frameId: 0 }).catch(() => undefined);
  return { mode };
}

async function commitCapture(sender: Runtime.MessageSender): Promise<SimpleResult> {
  const tabId = sender.tab?.id;
  if (tabId === undefined) return { ok: false };
  const capture = await getPendingCapture(tabId);
  if (!capture) return { ok: false, message: 'La proposition a expiré. Reconnectez-vous pour la retrouver.' };
  try {
    await withAuth((auth) => api.saveCredential(auth, capture.application_id, capture.login_identifier, capture.secret));
    await setItem(knownKey(capture.application_id), await credentialHash(capture.application_id, capture.login_identifier, capture.secret));
    await removeItem(captureKey(tabId));
    await refreshConfig();
    return { ok: true };
  } catch (e) {
    if (!(e instanceof ApiError)) return { ok: false, message: "L'enregistrement a échoué." };
    if (e.kind === 'forbidden_app') {
      // Application non attribuée ou désactivée : on oublie la capture, sans déconnecter.
      await removeItem(captureKey(tabId));
      return { ok: false, message: e.userMessage, final: true };
    }
    return { ok: false, message: e.userMessage, final: e.kind === 'unavailable' };
  }
}

async function showNotice(sender: Runtime.MessageSender, message: string): Promise<void> {
  const tabId = sender.tab?.id;
  if (tabId === undefined) return;
  const msg: TabRequest = { type: 'show_notice', message };
  await browser.tabs.sendMessage(tabId, msg, { frameId: 0 }).catch(() => undefined);
}

// ---------------------------------------------------------------------------
// Remplissage

function effectiveUrl(claimed: string | undefined, sender: Runtime.MessageSender): string | null {
  return resolvePageUrl(claimed, sender.url);
}

/** Application active (mode différent de « none ») dont le motif correspond à l'adresse. */
function matchApp(config: ExtConfig, url: string): ExtApplication | null {
  return findBestMatch(
    config.applications.filter((a) => a.sso_mode !== 'none'),
    url,
  );
}

async function handleMatch(claimedUrl: string, sender: Runtime.MessageSender): Promise<MatchResponse> {
  const empty: MatchResponse = { app: null, pending: null, recent_autosubmit: [] };
  const tabId = sender.tab?.id;
  if (tabId === undefined) return empty;
  const url = effectiveUrl(claimedUrl, sender);
  if (!url) return empty;

  let pending: PromptInfo | null = null;
  if (sender.frameId === 0) {
    const c = await getPendingCapture(tabId);
    if (c) pending = { mode: c.mode, app_name: c.app_name, login_identifier: c.login_identifier };
  }

  const config = await getConfig();
  if (!config) return { ...empty, pending };
  const app = matchApp(config, url);
  if (!app) return { ...empty, pending };

  const mark = await getItem<AutoSubmitMark>(autoKey(tabId));
  return { app: toMatched(app), pending, recent_autosubmit: recentAutoSubmitSteps(mark, app.application_id, Date.now()) };
}

/** Écran « Connexion invisible » : réponse légère au script du cadre principal, sans secret. */
async function handleGuardMatch(claimedUrl: string, sender: Runtime.MessageSender): Promise<GuardMatchResponse> {
  const none: GuardMatchResponse = { active: false, on_login_page: false };
  const tabId = sender.tab?.id;
  if (tabId === undefined || sender.frameId !== 0) return none;
  const url = effectiveUrl(claimedUrl, sender);
  if (!url) return none;
  const config = await getConfig();
  if (!config) return none;
  const app = matchApp(config, url);
  const mark = app ? await getItem<AutoSubmitMark>(autoKey(tabId)) : undefined;
  return decideGuard(app, mark, Date.now());
}

const GUARD_RESULTS: readonly GuardResult[] = ['filled', 'failed_credentials', 'failed_manual'];

/** Relaie le résultat de content-app (tout cadre) à l'écran du cadre principal. */
async function relayGuardSignal(result: unknown, sender: Runtime.MessageSender): Promise<SimpleResult> {
  const tabId = sender.tab?.id;
  if (tabId === undefined || !GUARD_RESULTS.includes(result as GuardResult)) return { ok: false };
  const msg: TabRequest = { type: 'guard_signal', result: result as GuardResult };
  await browser.tabs.sendMessage(tabId, msg, { frameId: 0 }).catch(() => undefined);
  return { ok: true };
}

async function handleReveal(applicationId: number, claimedUrl: string | undefined, sender: Runtime.MessageSender): Promise<RevealResponse> {
  const app = await findApp(applicationId);
  // Le secret n'est remis qu'à une page dont l'adresse correspond au motif de connexion de l'application.
  const url = effectiveUrl(claimedUrl, sender);
  if (!app || app.sso_mode === 'none' || !url || !matchUrl(app.login_url_pattern, url)) return { ok: false };
  try {
    const creds = await withAuth((auth) => api.reveal(auth, applicationId));
    await setItem(knownKey(applicationId), await credentialHash(applicationId, creds.login_identifier, creds.secret));
    return { ok: true, creds };
  } catch (e) {
    if (e instanceof ApiError && (e.kind === 'forbidden_app' || e.kind === 'unavailable')) {
      await showNotice(sender, e.userMessage);
      if (e.kind === 'forbidden_app') await refreshConfig();
    }
    return { ok: false };
  }
}

async function markAutoSubmit(applicationId: number, step: FillStep, sender: Runtime.MessageSender): Promise<void> {
  const tabId = sender.tab?.id;
  if (tabId === undefined) return;
  const current = await getItem<AutoSubmitMark>(autoKey(tabId));
  const steps = current && current.application_id === applicationId ? current.steps.filter((s) => Date.now() - s.at <= AUTOSUBMIT_GUARD_MS) : [];
  steps.push({ step, at: Date.now() });
  await setItem(autoKey(tabId), { application_id: applicationId, steps } satisfies AutoSubmitMark);
}

// ---------------------------------------------------------------------------
// Portail

async function handlePortalToken(msg: Extract<BgRequest, { type: 'portal_token' }>, sender: Runtime.MessageSender): Promise<SimpleResult> {
  if (!isPortalUrl(sender.url) || sender.frameId !== 0) return { ok: false };
  const { token, expires_at, api_base } = msg;
  if (typeof token !== 'string' || !token || typeof expires_at !== 'string' || typeof api_base !== 'string') return { ok: false };
  if (!isValidApiBase(api_base, PORTAL_ORIGINS)) return { ok: false };
  await session.clear();
  await setItem('auth', { token, expires_at, api_base } satisfies AuthState);
  await refreshConfig();
  return { ok: true };
}

async function handlePortalLogout(sender: Runtime.MessageSender): Promise<SimpleResult> {
  if (!isPortalUrl(sender.url)) return { ok: false };
  const auth = await getItem<AuthState>('auth');
  if (auth) await api.logout(auth).catch(() => undefined);
  await purge(false);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Popup

async function popupState(): Promise<PopupState> {
  const config = await getConfig();
  let tabApp: PopupState['tab_app'] = null;
  if (config) {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const app = matchApp(config, tab.url);
      if (app) tabApp = { name: app.name, has_credential: app.has_credential };
    }
  }
  return { connected: !!config, user: config?.user ?? null, portal_origins: [...PORTAL_ORIGINS], version: __VERSION__, tab_app: tabApp };
}

async function popupFill(): Promise<SimpleResult> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) return { ok: false, message: 'Aucun onglet actif.' };
  const msg: TabRequest = { type: 'fill_now' };
  try {
    const res = (await browser.tabs.sendMessage(tab.id, msg)) as SimpleResult | undefined;
    return res ?? { ok: false, message: 'Aucun formulaire de connexion trouvé sur cette page.' };
  } catch {
    return { ok: false, message: 'Aucun formulaire de connexion trouvé sur cette page.' };
  }
}

// ---------------------------------------------------------------------------
// Routage des messages

function isFromThisExtension(sender: Runtime.MessageSender): boolean {
  return sender.id === browser.runtime.id;
}

function isFromPopup(sender: Runtime.MessageSender): boolean {
  return !sender.tab && !!sender.url && sender.url.startsWith(browser.runtime.getURL(''));
}

browser.runtime.onMessage.addListener((raw: unknown, sender: Runtime.MessageSender) => {
  if (!isFromThisExtension(sender) || !raw || typeof raw !== 'object') return undefined;
  const msg = raw as BgRequest;
  switch (msg.type) {
    case 'portal_token':
      return handlePortalToken(msg, sender);
    case 'portal_logout':
      return handlePortalLogout(sender);
    case 'portal_status':
      return getAuth().then((a) => ({ ok: !!a }) satisfies SimpleResult);
    case 'match':
      return handleMatch(msg.url, sender);
    case 'guard_match':
      return handleGuardMatch(msg.url, sender);
    case 'guard_signal':
      return relayGuardSignal(msg.result, sender);
    case 'reveal':
      return handleReveal(msg.application_id, msg.url, sender);
    case 'mark_autosubmit':
      return markAutoSubmit(msg.application_id, msg.step, sender).then(() => ({ ok: true }));
    case 'capture':
      return handleCapture(msg, sender);
    case 'capture_commit':
      return commitCapture(sender);
    case 'capture_discard':
      return sender.tab?.id === undefined ? Promise.resolve({ ok: false }) : removeItem(captureKey(sender.tab.id)).then(() => ({ ok: true }));
    case 'popup_state':
      return isFromPopup(sender) ? popupState() : undefined;
    case 'popup_fill':
      return isFromPopup(sender) ? popupFill() : undefined;
    case 'open_portal':
      return isFromPopup(sender) ? browser.tabs.create({ url: `${MAIN_PORTAL_ORIGIN}/` }).then(() => ({ ok: true })) : undefined;
    case 'open_privacy':
      return isFromPopup(sender) ? browser.tabs.create({ url: `${MAIN_PORTAL_ORIGIN}/extension/confidentialite` }).then(() => ({ ok: true })) : undefined;
    default:
      return undefined;
  }
});

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CONFIG_ALARM) {
    void getAuth().then((auth) => (auth ? refreshConfig() : null));
  } else if (alarm.name === CLEANUP_ALARM) {
    void cleanupExpired();
  }
});

browser.tabs.onRemoved.addListener((tabId) => {
  void removeItem([captureKey(tabId), identKey(tabId), autoKey(tabId)]);
});

function init(): void {
  browser.alarms.create(CONFIG_ALARM, { periodInMinutes: 10 });
  void getAuth().then((auth) => updateBadge(!!auth));
}

browser.runtime.onInstalled.addListener(init);
browser.runtime.onStartup.addListener(init);
init();
