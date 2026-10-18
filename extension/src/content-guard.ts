// Content script du mode « Connexion invisible » (document_start, cadre principal seulement).
// Si le background confirme que l'adresse est la page de connexion d'une application en mode
// silent avec un identifiant enregistré, la page est masquée et l'écran SBEE affiché pendant
// que content-app remplit et valide en dessous. Aucun identifiant ni secret ne transite ici.

import browser from 'webextension-polyfill';
import { GUARD_TIMEOUT_MS, guardNotice } from './lib/guard';
import type { BgRequest, GuardMatchResponse, GuardResult, TabRequest } from './lib/messages';
import { ensureOverlay, hidePage, reveal, showOverlay, type OverlayOptions } from './lib/overlay';
import { hasPrompt, showNotice } from './lib/prompt';

const URL_POLL_MS = 250;

let active = false;
let overlay: OverlayOptions | null = null;
let timeout: ReturnType<typeof setTimeout> | null = null;
let lastUrl = window.location.href;
let checking = false;

function query(url: string): Promise<GuardMatchResponse | null> {
  const msg: BgRequest = { type: 'guard_match', url };
  return (browser.runtime.sendMessage(msg) as Promise<GuardMatchResponse | undefined>).then((r) => r ?? null).catch(() => null);
}

function notify(message: string): void {
  // Un message plus précis du background (application non attribuée, coffre indisponible) est conservé.
  const render = () => {
    if (!hasPrompt()) showNotice(message);
  };
  if (document.body) render();
  else window.addEventListener('DOMContentLoaded', render, { once: true });
}

function activate(appName: string): void {
  if (active) return;
  active = true;
  overlay = {
    appName,
    iconUrl: browser.runtime.getURL('icons/icon-48.png'),
    onShowLogin: () => finish('user'),
  };
  hidePage();
  // Sans documentElement (tout début du chargement), poll() pose l'écran au passage suivant.
  showOverlay(overlay);
  timeout = setTimeout(() => finish('timeout'), GUARD_TIMEOUT_MS);
}

/** Fin de l'écran : succès (null), échec, délai ou choix de l'agent. */
function finish(result: GuardResult | 'timeout' | 'user' | null): void {
  if (!active) return;
  active = false;
  overlay = null;
  if (timeout) clearTimeout(timeout);
  timeout = null;
  reveal();
  const message = result ? guardNotice(result) : null;
  if (message) notify(message);
}

/** Changement d'adresse sans rechargement (application monopage). */
async function poll(): Promise<void> {
  if (active && overlay) ensureOverlay(overlay);
  const url = window.location.href;
  if (url === lastUrl || checking) return;
  lastUrl = url;
  checking = true;
  const res = await query(url);
  checking = false;
  // L'adresse a encore changé : le prochain passage s'en charge.
  if (window.location.href !== url) return;
  if (active) {
    // L'adresse a quitté la page de connexion : connexion réussie.
    if (!res?.on_login_page) finish(null);
  } else if (res?.active && res.app_name) {
    activate(res.app_name);
  }
}

browser.runtime.onMessage.addListener((raw: unknown) => {
  const msg = raw as TabRequest | undefined;
  if (msg?.type !== 'guard_signal') return undefined;
  if (msg.result === 'filled') return undefined;
  if (active) {
    finish(msg.result);
  } else if (msg.result === 'failed_credentials') {
    // La page de connexion revient après une validation automatique : l'écran n'a pas été posé.
    const message = guardNotice(msg.result);
    if (message) notify(message);
  }
  return undefined;
});

async function start(): Promise<void> {
  const url = window.location.href;
  const res = await query(url);
  if (window.location.href === url && res?.active && res.app_name) activate(res.app_name);
  setInterval(() => void poll(), URL_POLL_MS);
}

if (window.top === window && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
  void start();
}
