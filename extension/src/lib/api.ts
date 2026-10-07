// Appels à l'API coffre du portail (jeton Sanctum « sbee-extension », ability vault).
// Aucun secret n'est jamais écrit dans les journaux.

import type { AuthState, ExtConfig, RevealResult } from './messages';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get kind(): ErrorKind {
    return classifyError(this.status, this.message);
  }

  /** Jeton absent, expiré, révoqué ou mal typé : il faut purger et redemander un jeton. */
  get isAuthError(): boolean {
    return this.kind === 'auth';
  }

  /** Message à afficher dans la page pour une erreur qui ne déconnecte pas. */
  get userMessage(): string {
    return userMessageFor(this.kind, this.message);
  }
}

export type ErrorKind = 'auth' | 'forbidden_app' | 'unavailable' | 'other';

/** Messages 403 du portail qui signifient « jeton invalide ou mal typé ». */
export const TOKEN_FORBIDDEN_MESSAGES: readonly string[] = [
  "Réservé à l'extension SBEE.",
  "Ce jeton n'est pas autorisé pour cette opération.",
];

export const MSG_FORBIDDEN_APP = 'Cette application ne fait pas partie de vos accès dans le portail.';
export const MSG_UNAVAILABLE = "Le coffre SBEE n'est pas encore configuré. Contactez la DSI.";

/**
 * Classe une erreur HTTP de l'API coffre :
 * - 401, ou 403 avec un message de jeton -> « auth » (purge + nouveau jeton) ;
 * - autre 403 (application non attribuée ou désactivée) -> « forbidden_app » (pas de déconnexion) ;
 * - 503 (coffre non configuré) -> « unavailable » (pas de déconnexion).
 */
export function classifyError(status: number, message: string | null | undefined): ErrorKind {
  if (status === 401) return 'auth';
  if (status === 403) {
    const m = (message ?? '').trim();
    return TOKEN_FORBIDDEN_MESSAGES.includes(m) ? 'auth' : 'forbidden_app';
  }
  if (status === 503) return 'unavailable';
  return 'other';
}

export function userMessageFor(kind: ErrorKind, message: string): string {
  if (kind === 'forbidden_app') return MSG_FORBIDDEN_APP;
  if (kind === 'unavailable') return MSG_UNAVAILABLE;
  if (kind === 'auth') return 'Session du coffre expirée. Ouvrez le portail SBEE puis réessayez.';
  return message || "L'opération a échoué.";
}

async function request<T>(auth: AuthState, method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${auth.token}`,
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${auth.api_base.replace(/\/+$/, '')}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
    });
  } catch {
    throw new ApiError(0, 'Portail injoignable.');
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    const msg =
      data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : `Erreur ${res.status}.`;
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

export function fetchConfig(auth: AuthState): Promise<ExtConfig> {
  return request<ExtConfig>(auth, 'GET', '/vault/ext/config');
}

export function reveal(auth: AuthState, applicationId: number): Promise<RevealResult> {
  return request<RevealResult>(auth, 'POST', `/vault/ext/${applicationId}/reveal`);
}

export function saveCredential(auth: AuthState, applicationId: number, loginIdentifier: string, secret: string): Promise<unknown> {
  return request(auth, 'PUT', `/vault/ext/${applicationId}`, { login_identifier: loginIdentifier, secret });
}

export function logout(auth: AuthState): Promise<unknown> {
  return request(auth, 'POST', '/vault/ext/logout');
}
