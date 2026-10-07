/**
 * Adresse effective de la page qui écrit. Dans une application monopage, l'adresse change
 * sans rechargement (history.pushState) et l'adresse fournie par le navigateur (sender.url)
 * peut rester celle du chargement initial (constaté sous Firefox). On retient donc l'adresse
 * annoncée par la page, à condition qu'elle reste sur la même origine que celle garantie par
 * le navigateur : une page ne peut ainsi jamais se faire passer pour un autre site.
 */
export function resolvePageUrl(claimed: string | undefined | null, trusted: string | undefined | null): string | null {
  if (!trusted) return null;
  if (!claimed) return trusted;
  try {
    return new URL(claimed).origin === new URL(trusted).origin ? claimed : trusted;
  } catch {
    return trusted;
  }
}
