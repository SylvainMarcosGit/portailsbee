// Correspondance d'URL par motif glob : seul « * » est un joker (toute suite de
// caractères, y compris vide). Tout le reste est littéral (« ? », « . », etc.).
// Un motif sans schéma (« intranet.sbee.bj/login* ») vaut pour http et https.

function escapeRegExp(s: string): string {
  return s.replace(/[.+?^${}()|[\]\\/]/g, '\\$&');
}

export function globToRegExp(pattern: string): RegExp {
  let p = pattern.trim();
  let prefix = '';
  if (!p.includes('://')) {
    prefix = 'https?:\\/\\/';
    p = p.replace(/^\/+/, '');
  }
  const body = p.split('*').map(escapeRegExp).join('.*');
  return new RegExp(`^${prefix}${body}$`, 'i');
}

/** Vrai si l'URL correspond au motif (le fragment « #... » est ignoré si besoin). */
export function matchUrl(pattern: string | null | undefined, url: string): boolean {
  if (!pattern || !pattern.trim()) return false;
  let re: RegExp;
  try {
    re = globToRegExp(pattern);
  } catch {
    return false;
  }
  if (re.test(url)) return true;
  const hash = url.indexOf('#');
  return hash >= 0 && re.test(url.slice(0, hash));
}

/** Choisit l'élément dont le motif correspond, le plus spécifique (le plus long) en premier. */
export function findBestMatch<T extends { login_url_pattern: string | null }>(items: T[], url: string): T | null {
  let best: T | null = null;
  for (const item of items) {
    if (!matchUrl(item.login_url_pattern, url)) continue;
    if (!best || (item.login_url_pattern ?? '').length > (best.login_url_pattern ?? '').length) best = item;
  }
  return best;
}
