// Origines du portail autorisées (fonctions pures, sans dépendance au navigateur).
// Utilisé au build (scripts/build.mjs : validation et motifs de correspondance) et à
// l'exécution (content-portail, background : contrôle des origines et de api_base).

export const DEFAULT_PORTAL_ORIGINS = 'http://127.0.0.1:8000,http://localhost:8000';

/** Valide une origine (http ou https, sans chemin, paramètre, fragment ni identifiants) et la normalise. */
export function parseOrigin(raw: string): string {
  const value = raw.trim();
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Origine invalide : « ${value} ».`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Origine invalide : « ${value} » doit être en http ou https.`);
  }
  if (url.username || url.password) throw new Error(`Origine invalide : « ${value} » ne doit pas contenir d'identifiants.`);
  if (url.pathname !== '/' || url.search || url.hash || /[?#]/.test(value)) {
    throw new Error(`Origine invalide : « ${value} » ne doit contenir ni chemin, ni paramètre, ni fragment.`);
  }
  return url.origin;
}

/** Liste séparée par des virgules -> origines normalisées, sans doublon, dans l'ordre (la première est l'origine principale). */
export function parseOriginList(raw: string): string[] {
  const items = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '');
  if (items.length === 0) throw new Error('Aucune origine de portail fournie.');
  const out: string[] = [];
  for (const item of items) {
    const origin = parseOrigin(item);
    if (!out.includes(origin)) out.push(origin);
  }
  return out;
}

/**
 * Choisit la liste à partir des variables de construction : PORTAL_ORIGINS, sinon
 * PORTAL_ORIGIN (singulier, rétrocompatibilité), sinon la valeur par défaut.
 */
export function resolvePortalOrigins(env: { PORTAL_ORIGINS?: string; PORTAL_ORIGIN?: string }): string[] {
  const list = env.PORTAL_ORIGINS?.trim();
  if (list) return parseOriginList(list);
  const single = env.PORTAL_ORIGIN?.trim();
  if (single) return parseOriginList(single);
  return parseOriginList(DEFAULT_PORTAL_ORIGINS);
}

export function isAllowedOrigin(origin: unknown, allowed: readonly string[]): boolean {
  return typeof origin === 'string' && allowed.includes(origin);
}

/** Vrai si l'adresse a exactement l'une des origines autorisées. */
export function isAllowedUrl(url: unknown, allowed: readonly string[]): boolean {
  if (typeof url !== 'string' || !url) return false;
  try {
    return allowed.includes(new URL(url).origin);
  } catch {
    return false;
  }
}

/** api_base doit avoir une origine autorisée et commencer par « <origine>/ ». */
export function isValidApiBase(apiBase: unknown, allowed: readonly string[]): apiBase is string {
  if (typeof apiBase !== 'string') return false;
  let origin: string;
  try {
    origin = new URL(apiBase).origin;
  } catch {
    return false;
  }
  return allowed.includes(origin) && apiBase.startsWith(`${origin}/`);
}

/** Motif de correspondance Chromium (le port est accepté). */
export function chromiumMatch(origin: string): string {
  return `${origin}/*`;
}

/** Motif de correspondance Firefox : sans port (non accepté), l'origine exacte est contrôlée à l'exécution. */
export function firefoxMatch(origin: string): string {
  const url = new URL(origin);
  return `${url.protocol}//${url.hostname}/*`;
}

export function uniqueMatches(origins: readonly string[], toMatch: (origin: string) => string): string[] {
  return [...new Set(origins.map(toMatch))];
}
