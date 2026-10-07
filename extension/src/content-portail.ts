// Content script injecté uniquement sur PORTAL_ORIGIN/* : pont window.postMessage
// entre la page du portail et le background de l'extension.

import browser from 'webextension-polyfill';
import { BRIDGE_EXTENSION, BRIDGE_PORTAIL, type BgRequest, type ExtensionToPortail, type SimpleResult, type TabRequest } from './lib/messages';

const PORTAL_ORIGIN = __PORTAL_ORIGIN__;

function post(msg: ExtensionToPortail): void {
  // Toujours ciblé sur l'origine du portail, jamais « * ».
  window.postMessage(msg, PORTAL_ORIGIN);
}

const INSTANCE_KEY = 'instance_id';

/**
 * Identifiant de cette installation de l'extension (pas un secret) : le portail le joint
 * à sa demande de jeton pour que chaque navigateur relié garde son propre jeton.
 */
async function instanceId(): Promise<string> {
  const stored = (await browser.storage.local.get(INSTANCE_KEY))[INSTANCE_KEY];
  if (typeof stored === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(stored)) return stored;
  const created = crypto.randomUUID();
  await browser.storage.local.set({ [INSTANCE_KEY]: created });
  return created;
}

function sendReady(): void {
  void instanceId()
    .catch(() => '')
    .then((id) => post({ source: BRIDGE_EXTENSION, type: 'SBEE_EXTENSION_READY', version: __VERSION__, instance_id: id }));
}

function bg(msg: BgRequest): Promise<unknown> {
  return browser.runtime.sendMessage(msg);
}

function validApiBase(apiBase: unknown): apiBase is string {
  if (typeof apiBase !== 'string' || !apiBase.startsWith(`${PORTAL_ORIGIN}/`)) return false;
  try {
    return new URL(apiBase).origin === PORTAL_ORIGIN;
  } catch {
    return false;
  }
}

function onMessage(event: MessageEvent): void {
  if (event.source !== window || event.origin !== PORTAL_ORIGIN) return;
  const data: unknown = event.data;
  if (!data || typeof data !== 'object') return;
  const d = data as Record<string, unknown>;
  if (d.source !== BRIDGE_PORTAIL) return;

  switch (d.type) {
    case 'SBEE_PING':
      sendReady();
      break;
    case 'SBEE_VAULT_TOKEN': {
      const { token, expires_at, api_base } = d;
      if (typeof token !== 'string' || !token || typeof expires_at !== 'string' || !validApiBase(api_base)) return;
      void bg({ type: 'portal_token', token, expires_at, api_base })
        .then((res) => {
          if ((res as SimpleResult | undefined)?.ok) post({ source: BRIDGE_EXTENSION, type: 'SBEE_VAULT_TOKEN_ACK' });
        })
        .catch(() => undefined);
      break;
    }
    case 'SBEE_VAULT_LOGOUT':
      void bg({ type: 'portal_logout' }).catch(() => undefined);
      break;
    default:
      break;
  }
}

if (window.location.origin === PORTAL_ORIGIN && window.top === window) {
  window.addEventListener('message', onMessage);

  browser.runtime.onMessage.addListener((raw: unknown) => {
    const msg = raw as TabRequest | undefined;
    if (msg?.type === 'request_token') {
      post({ source: BRIDGE_EXTENSION, type: 'SBEE_TOKEN_REQUEST' });
      return Promise.resolve({ ok: true } satisfies SimpleResult);
    }
    return undefined;
  });

  sendReady();
  // La page peut ne pas encore écouter au document_start : on répète l'annonce.
  window.addEventListener('DOMContentLoaded', sendReady, { once: true });
  window.addEventListener('load', sendReady, { once: true });

  // Pas de jeton valide (navigateur redémarré, expiration) : on en redemande un.
  void bg({ type: 'portal_status' })
    .then((res) => {
      if (!(res as SimpleResult | undefined)?.ok) {
        const ask = () => post({ source: BRIDGE_EXTENSION, type: 'SBEE_TOKEN_REQUEST' });
        if (document.readyState === 'complete') ask();
        else window.addEventListener('load', ask, { once: true });
      }
    })
    .catch(() => undefined);
}
