// Pont portail <-> extension SBEE (window.postMessage, même origine que le portail).
// Règles : messages toujours ciblés sur window.location.origin ; seuls les messages
// de la fenêtre courante, de la même origine et marqués « sbee-extension » sont acceptés.
// Le jeton d'extension n'est jamais conservé ici (ni stockage navigateur, ni journal).

import { useSyncExternalStore } from 'react';

export const BRIDGE_PORTAIL = 'sbee-portail';
export const BRIDGE_EXTENSION = 'sbee-extension';

export type ExtensionMessage =
  | { source: typeof BRIDGE_EXTENSION; type: 'SBEE_EXTENSION_READY'; version: string; instance_id: string }
  | { source: typeof BRIDGE_EXTENSION; type: 'SBEE_VAULT_TOKEN_ACK' }
  | { source: typeof BRIDGE_EXTENSION; type: 'SBEE_TOKEN_REQUEST' };

type PortailMessage =
  | { source: typeof BRIDGE_PORTAIL; type: 'SBEE_PING' }
  | { source: typeof BRIDGE_PORTAIL; type: 'SBEE_VAULT_TOKEN'; token: string; expires_at: string; api_base: string }
  | { source: typeof BRIDGE_PORTAIL; type: 'SBEE_VAULT_LOGOUT' };

/** checking : PING envoyé, pas encore de réponse ; detected : READY reçu ; absent : pas de réponse. */
export type ExtensionStatus = 'checking' | 'detected' | 'absent';

export interface ExtensionState {
  status: ExtensionStatus;
  version: string | null;
}

// Identifiant de l'installation de l'extension dans ce navigateur (pas un secret) :
// joint à la demande de jeton pour qu'un agent puisse relier plusieurs navigateurs.
let instanceId: string | null = null;

export function getExtensionInstanceId(): string | null {
  return instanceId;
}

// Délai au-delà duquel l'absence de READY signifie « extension non installée »
const DETECTION_TIMEOUT_MS = 1500;

let state: ExtensionState = { status: 'checking', version: null };
const stateListeners = new Set<() => void>();
const messageListeners = new Set<(msg: ExtensionMessage) => void>();
let detectionTimer: ReturnType<typeof setTimeout> | null = null;

function setState(next: ExtensionState): void {
  if (next.status === state.status && next.version === state.version) return;
  state = next;
  stateListeners.forEach((listener) => listener());
}

function post(msg: PortailMessage): void {
  if (typeof window === 'undefined') return;
  window.postMessage(msg, window.location.origin);
}

function parseMessage(event: MessageEvent): ExtensionMessage | null {
  if (event.source !== window || event.origin !== window.location.origin) return null;
  const data: unknown = event.data;
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (d.source !== BRIDGE_EXTENSION) return null;

  switch (d.type) {
    case 'SBEE_EXTENSION_READY':
      return {
        source: BRIDGE_EXTENSION,
        type: 'SBEE_EXTENSION_READY',
        version: typeof d.version === 'string' ? d.version : '',
        instance_id: typeof d.instance_id === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(d.instance_id) ? d.instance_id : '',
      };
    case 'SBEE_VAULT_TOKEN_ACK':
      return { source: BRIDGE_EXTENSION, type: 'SBEE_VAULT_TOKEN_ACK' };
    case 'SBEE_TOKEN_REQUEST':
      return { source: BRIDGE_EXTENSION, type: 'SBEE_TOKEN_REQUEST' };
    default:
      return null;
  }
}

function onWindowMessage(event: MessageEvent): void {
  const msg = parseMessage(event);
  if (!msg) return;

  // Tout message valide de l'extension prouve sa présence
  if (detectionTimer) {
    clearTimeout(detectionTimer);
    detectionTimer = null;
  }
  if (msg.type === 'SBEE_EXTENSION_READY' && msg.instance_id) instanceId = msg.instance_id;
  setState({
    status: 'detected',
    version: msg.type === 'SBEE_EXTENSION_READY' ? msg.version || state.version : state.version,
  });

  messageListeners.forEach((listener) => listener(msg));
}

// Écoute installée dès le chargement du module : l'extension annonce READY très tôt
if (typeof window !== 'undefined') {
  window.addEventListener('message', onWindowMessage);
}

/** Demande à l'extension de s'annoncer (réponse : SBEE_EXTENSION_READY). */
export function pingExtension(): void {
  if (state.status !== 'detected' && !detectionTimer) {
    detectionTimer = setTimeout(() => {
      detectionTimer = null;
      if (state.status !== 'detected') setState({ status: 'absent', version: null });
    }, DETECTION_TIMEOUT_MS);
  }
  post({ source: BRIDGE_PORTAIL, type: 'SBEE_PING' });
}

/** Transmet le jeton d'extension (jamais conservé côté portail). */
export function sendExtensionToken(token: string, expiresAt: string, apiBase: string): void {
  post({ source: BRIDGE_PORTAIL, type: 'SBEE_VAULT_TOKEN', token, expires_at: expiresAt, api_base: apiBase });
}

/** Informe l'extension de la déconnexion du portail (le serveur révoque aussi le jeton). */
export function notifyExtensionLogout(): void {
  post({ source: BRIDGE_PORTAIL, type: 'SBEE_VAULT_LOGOUT' });
}

/** Abonnement aux messages validés de l'extension. */
export function onExtensionMessage(listener: (msg: ExtensionMessage) => void): () => void {
  messageListeners.add(listener);
  return () => {
    messageListeners.delete(listener);
  };
}

function subscribeState(listener: () => void): () => void {
  stateListeners.add(listener);
  return () => {
    stateListeners.delete(listener);
  };
}

function getState(): ExtensionState {
  return state;
}

/** État de détection de l'extension, partagé par toutes les pages. */
export function useExtensionStatus(): ExtensionState {
  return useSyncExternalStore(subscribeState, getState, getState);
}
