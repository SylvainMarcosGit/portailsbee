// Content script injecté partout (<all_urls>, all_frames). Il ne fait rien tant
// que le background ne lui a pas confirmé que l'URL correspond au
// login_url_pattern d'une application du coffre.

import browser from 'webextension-polyfill';
import { detectLoginForm, type LoginForm } from './lib/detect';
import { fillForm, readSecret, submitForm } from './lib/fill';
import { autoSubmitEnabled } from './lib/guard';
import type { BgRequest, FillStep, GuardResult, MatchResponse, MatchedApp, RevealResponse, SimpleResult, TabRequest } from './lib/messages';
import { GUARD_REVEALED_EVENT, isPageHidden } from './lib/overlay';
import { showNotice, showPrompt } from './lib/prompt';

const OBSERVE_MS = 10_000;
const isTop = window.top === window;

let app: MatchedApp | null = null;
let recentAutoSubmit: FillStep[] = [];
let identifierDone = false;
let passwordDone = false;
let lastFilled: { identifier: string | null; secret: string | null } | null = null;
let lastCaptureKey = '';
let lastCaptureAt = 0;

function bg<T>(msg: BgRequest): Promise<T> {
  return browser.runtime.sendMessage(msg) as Promise<T>;
}

// ---------------------------------------------------------------------------
// Proposition d'enregistrement

function displayPrompt(prompt: Parameters<typeof showPrompt>[0]): void {
  if (!isTop) return;
  const render = () =>
    showPrompt(prompt, {
      onSave: () => bg<SimpleResult>({ type: 'capture_commit' }),
      onDismiss: () => void bg({ type: 'capture_discard' }).catch(() => undefined),
    });
  // Écran « Connexion invisible » actif : la proposition attend qu'il soit retiré.
  if (isPageHidden(document)) {
    window.addEventListener(GUARD_REVEALED_EVENT, () => displayPrompt(prompt), { once: true });
    return;
  }
  if (document.body) render();
  else window.addEventListener('DOMContentLoaded', render, { once: true });
}

// ---------------------------------------------------------------------------
// Écran « Connexion invisible » (content-guard, cadre principal), via le background

function signalGuard(result: GuardResult): void {
  if (app?.sso_mode !== 'silent' || !app.has_credential) return;
  void bg({ type: 'guard_signal', result }).catch(() => undefined);
}

// ---------------------------------------------------------------------------
// Remplissage

async function attemptFill(manual: boolean): Promise<boolean> {
  const current = app;
  if (!current || !current.has_credential) return false;
  const f = detectLoginForm(document, current);
  if (!f) return false;
  const autoSubmit = autoSubmitEnabled(current.sso_mode);

  if (f.step === 'identifier') {
    if (identifierDone && !manual) return false;
    identifierDone = true;
    fillForm(f, current.login_identifier, null);
    lastFilled = { identifier: current.login_identifier, secret: null };
    if (autoSubmit) await submitIfAllowed(f, 'identifier', manual);
    // L'écran du mot de passe peut apparaître sans rechargement.
    observe();
    return true;
  }

  if (passwordDone && !manual) return false;
  passwordDone = true;
  identifierDone = true;
  const res = await bg<RevealResponse>({ type: 'reveal', application_id: current.application_id, url: window.location.href }).catch(() => null);
  if (!res?.ok) {
    signalGuard('failed_credentials');
    return false;
  }
  const creds = res.creds;
  // Le formulaire a pu être remplacé pendant l'appel réseau.
  const g = f.password?.isConnected ? f : detectLoginForm(document, current);
  if (!g?.password) return false;
  fillForm(g, g.username ? creds.login_identifier : null, creds.secret);
  lastFilled = { identifier: g.username ? creds.login_identifier : null, secret: creds.secret };
  if (autoSubmit) await submitIfAllowed(g, g.step, manual);
  return true;
}

async function submitIfAllowed(f: LoginForm, step: FillStep, manual: boolean): Promise<void> {
  // Garde-fou : si la même étape a déjà été soumise automatiquement il y a moins de 30 s
  // (identifiants refusés, la page revient), on remplit sans valider.
  if (!manual && recentAutoSubmit.includes(step)) {
    signalGuard('failed_credentials');
    return;
  }
  if (!app) return;
  await bg({ type: 'mark_autosubmit', application_id: app.application_id, step }).catch(() => undefined);
  if (submitForm(f, app.submit_selector)) signalGuard('filled');
}

let observer: MutationObserver | null = null;
let observeTimer: ReturnType<typeof setTimeout> | null = null;
let scheduled = false;

/** Surveille les formulaires affichés tardivement pendant 10 s. */
function observe(): void {
  if (!app || passwordDone) return;
  if (observeTimer) clearTimeout(observeTimer);
  observeTimer = setTimeout(onObserveTimeout, OBSERVE_MS);
  if (observer) return;
  observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      if (passwordDone) {
        stopObserving();
        return;
      }
      void attemptFill(false);
    }, 150);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['type', 'style', 'class', 'hidden'] });
}

/** Fin de l'observation sans formulaire rempli : l'agent termine lui-même. */
function onObserveTimeout(): void {
  stopObserving();
  if (!passwordDone) signalGuard('failed_manual');
}

function stopObserving(): void {
  observer?.disconnect();
  observer = null;
  if (observeTimer) clearTimeout(observeTimer);
  observeTimer = null;
}

// ---------------------------------------------------------------------------
// Capture à la soumission (submit, clic sur un bouton, touche Entrée)

function capture(scopeEl: Element | null): void {
  const current = app;
  if (!current) return;
  const form = scopeEl?.closest('form') ?? null;
  const f = (form && detectLoginForm(form, current, () => true)) || detectLoginForm(document, current);
  if (!f) return;

  const identifier = f.username?.value.trim() || null;
  const secret = readSecret(f);

  if (f.password && secret) {
    if (lastFilled && lastFilled.secret === secret && (!identifier || identifier === lastFilled.identifier)) return;
    const key = `${identifier ?? ''}\n${secret.length}\n${secret.slice(-1)}`;
    if (key === lastCaptureKey && Date.now() - lastCaptureAt < 1500) return;
    lastCaptureKey = key;
    lastCaptureAt = Date.now();
    void bg({ type: 'capture', application_id: current.application_id, url: window.location.href, kind: 'full', login_identifier: identifier, secret }).catch(() => undefined);
    return;
  }

  if (f.step === 'identifier' && identifier) {
    const key = `id\n${identifier}`;
    if (key === lastCaptureKey && Date.now() - lastCaptureAt < 1500) return;
    lastCaptureKey = key;
    lastCaptureAt = Date.now();
    void bg({ type: 'capture', application_id: current.application_id, url: window.location.href, kind: 'identifier', login_identifier: identifier }).catch(() => undefined);
  }
}

function isSubmitControl(el: Element): boolean {
  const btn = el.closest('button, input[type=submit], input[type=image], input[type=button], [role=button]');
  if (!btn) return false;
  if (btn.tagName === 'BUTTON' && (btn.getAttribute('type') ?? 'submit').toLowerCase() === 'reset') return false;
  return true;
}

let captureListenersInstalled = false;

function installCaptureListeners(): void {
  if (captureListenersInstalled) return;
  captureListenersInstalled = true;
  window.addEventListener(
    'submit',
    (e) => {
      if (e.target instanceof Element) capture(e.target);
    },
    true,
  );
  window.addEventListener(
    'click',
    (e) => {
      const t = e.target;
      if (t instanceof Element && isSubmitControl(t)) capture(t);
    },
    true,
  );
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      const t = e.target;
      if (t instanceof HTMLInputElement) capture(t);
    },
    true,
  );
}

// ---------------------------------------------------------------------------
// Messages du background

browser.runtime.onMessage.addListener((raw: unknown) => {
  const msg = raw as TabRequest | undefined;
  if (!msg) return undefined;
  if (msg.type === 'show_prompt') {
    if (!isTop) return undefined;
    displayPrompt(msg.prompt);
    return Promise.resolve({ ok: true } satisfies SimpleResult);
  }
  if (msg.type === 'show_notice') {
    if (!isTop) return undefined;
    const render = () => showNotice(msg.message);
    if (document.body) render();
    else window.addEventListener('DOMContentLoaded', render, { once: true });
    return Promise.resolve({ ok: true } satisfies SimpleResult);
  }
  if (msg.type === 'fill_now') {
    if (!app) return undefined;
    if (!app.has_credential) {
      return Promise.resolve({
        ok: false,
        message: 'Aucun identifiant enregistré pour cette application. Connectez-vous une première fois pour les enregistrer.',
      } satisfies SimpleResult);
    }
    return attemptFill(true).then((ok) =>
      ok ? ({ ok: true } satisfies SimpleResult) : ({ ok: false, message: 'Aucun formulaire de connexion trouvé sur cette page.' } satisfies SimpleResult),
    );
  }
  return undefined;
});

// ---------------------------------------------------------------------------
// Démarrage

async function start(): Promise<void> {
  const url = window.location.href;
  let res: MatchResponse;
  try {
    res = await bg<MatchResponse>({ type: 'match', url });
  } catch {
    return;
  }
  // L'adresse a encore changé pendant l'appel : le prochain passage s'en charge.
  if (window.location.href !== url) return;
  if (res.pending) displayPrompt(res.pending);
  if (!res.app) return;
  app = res.app;
  recentAutoSubmit = res.recent_autosubmit;
  installCaptureListeners();
  const filled = await attemptFill(false);
  if (!filled || !passwordDone) observe();
}

// ---------------------------------------------------------------------------
// Applications monopage (React, Vue, Angular) : l'adresse change sans rechargement
// (ex. « / » qui redirige vers « /login »). Le script isolé ne peut pas intercepter
// history.pushState : on surveille donc l'adresse et on relance la détection.

const URL_POLL_MS = 500;
let lastUrl = window.location.href;

function onUrlChange(): void {
  const url = window.location.href;
  if (url === lastUrl) return;
  lastUrl = url;
  stopObserving();
  app = null;
  identifierDone = false;
  passwordDone = false;
  lastFilled = null;
  void start();
}

if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
  void start();
  window.addEventListener('popstate', onUrlChange);
  window.addEventListener('hashchange', onUrlChange);
  setInterval(onUrlChange, URL_POLL_MS);
}
