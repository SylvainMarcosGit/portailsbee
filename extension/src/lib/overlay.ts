// Écran SBEE « Connexion à {application} en cours… » du mode « Connexion invisible ».
// L'écran, isolé dans un shadow DOM fermé attaché à documentElement, recouvre la page
// comme un rideau opaque (position fixed, z-index maximal). La page n'est PAS rendue
// invisible : avec visibility:hidden ou opacity:0, la détection du formulaire (qui écarte
// les champs invisibles) ne trouverait rien et la connexion attendrait le délai.
// reveal() retire l'écran et le style.

/** Style posé pendant l'écran (bloque le défilement) ; sa présence indique aux autres scripts que l'écran est actif. */
export const GUARD_STYLE_ID = 'sbee-guard-style';
/** Élément hôte de l'écran (nom propre pour échapper aux règles de la page sur div). */
export const GUARD_HOST_TAG = 'sbee-guard-screen';
/** Émis sur window quand l'écran est retiré. */
export const GUARD_REVEALED_EVENT = 'sbee-guard-revealed';
/** Délai avant d'offrir « Afficher la page de connexion ». */
export const SHOW_LINK_DELAY_MS = 3000;

const HIDE_CSS = 'html,body{overflow:hidden !important}';

const CSS = `
:host { all: initial; }
.screen {
  position: fixed; inset: 0; z-index: 2147483647;
  display: flex; align-items: center; justify-content: center;
  background: #FFFFFF; color: #111111; padding: 16px; box-sizing: border-box;
  font: 14px/1.45 Poppins, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
}
.card {
  width: 420px; max-width: 100%; box-sizing: border-box;
  border: 1px solid #E5E5E5; border-left: 3px solid #ED1F24; border-radius: 4px;
  padding: 24px; display: flex; flex-direction: column; align-items: flex-start; gap: 16px;
}
.head { display: flex; align-items: center; gap: 12px; }
.head img { width: 48px; height: 48px; flex: none; }
.brand { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #ED1F24; }
.title { margin: 0; font-size: 16px; font-weight: 600; word-break: break-word; }
.loader { display: flex; align-items: center; gap: 12px; color: #444444; }
.spinner {
  width: 24px; height: 24px; box-sizing: border-box; flex: none;
  border: 3px solid #F2C4C5; border-top-color: #ED1F24; border-radius: 50%;
}
.link {
  min-height: 44px; min-width: 44px; padding: 0 4px; margin: 0;
  background: none; border: none; cursor: pointer; color: #111111;
  font: 600 14px/1 Poppins, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  text-decoration: underline; text-underline-offset: 3px;
}
.link:hover { color: #ED1F24; }
.link:focus-visible { outline: 2px solid #111111; outline-offset: 2px; }
.link[hidden] { display: none; }
@media (prefers-reduced-motion: no-preference) {
  .spinner { animation: spin 800ms linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
}
`;

export interface OverlayOptions {
  appName: string;
  /** Adresse de l'icône de l'extension (browser.runtime.getURL('icons/icon-48.png')). */
  iconUrl: string;
  /** Clic sur « Afficher la page de connexion ». */
  onShowLogin: () => void;
  linkDelayMs?: number;
}

let linkTimer: ReturnType<typeof setTimeout> | null = null;
let rootObserver: MutationObserver | null = null;

/** Pose le style de l'écran dès que possible (documentElement peut manquer au tout début du chargement). */
export function hidePage(doc: Document = document): void {
  if (doc.getElementById(GUARD_STYLE_ID)) return;
  const put = (root: Element) => {
    const style = doc.createElement('style');
    style.id = GUARD_STYLE_ID;
    style.textContent = HIDE_CSS;
    root.append(style);
  };
  if (doc.documentElement) {
    put(doc.documentElement);
    return;
  }
  if (rootObserver) return;
  rootObserver = new MutationObserver(() => {
    if (!doc.documentElement) return;
    rootObserver?.disconnect();
    rootObserver = null;
    if (!doc.getElementById(GUARD_STYLE_ID)) put(doc.documentElement);
  });
  rootObserver.observe(doc, { childList: true });
}

export function isPageHidden(doc: Document = document): boolean {
  return !!doc.getElementById(GUARD_STYLE_ID);
}

function findHost(doc: Document): Element | null {
  return doc.querySelector(GUARD_HOST_TAG);
}

/** Pose l'écran SBEE (une seule fois). */
export function showOverlay(opts: OverlayOptions, doc: Document = document): void {
  if (findHost(doc)) return;
  const root = doc.documentElement;
  if (!root) return;
  const host = doc.createElement(GUARD_HOST_TAG);
  // Protège l'écran contre les styles de la page (visibility, display, position).
  host.style.setProperty('visibility', 'visible', 'important');
  host.style.setProperty('display', 'block', 'important');
  host.style.setProperty('position', 'fixed', 'important');
  host.style.setProperty('inset', '0', 'important');
  host.style.setProperty('z-index', '2147483647', 'important');
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = doc.createElement('style');
  style.textContent = CSS;

  const screen = doc.createElement('div');
  screen.className = 'screen';

  const card = doc.createElement('div');
  card.className = 'card';
  card.setAttribute('role', 'status');
  card.setAttribute('aria-live', 'polite');
  card.setAttribute('aria-busy', 'true');

  const head = doc.createElement('div');
  head.className = 'head';
  const icon = doc.createElement('img');
  icon.src = opts.iconUrl;
  icon.alt = '';
  icon.width = 48;
  icon.height = 48;
  const brand = doc.createElement('p');
  brand.className = 'brand';
  brand.textContent = 'Coffre SBEE';
  head.append(icon, brand);

  const title = doc.createElement('p');
  title.className = 'title';
  title.textContent = `Connexion à ${opts.appName} en cours…`;

  const loader = doc.createElement('div');
  loader.className = 'loader';
  const spinner = doc.createElement('span');
  spinner.className = 'spinner';
  spinner.setAttribute('aria-hidden', 'true');
  const wait = doc.createElement('span');
  wait.textContent = 'Un instant, vous êtes connecté automatiquement.';
  loader.append(spinner, wait);

  const link = doc.createElement('button');
  link.type = 'button';
  link.className = 'link';
  link.textContent = 'Afficher la page de connexion';
  link.hidden = true;
  link.addEventListener('click', () => opts.onShowLogin());

  card.append(head, title, loader, link);
  screen.append(card);
  shadow.append(style, screen);
  root.append(host);

  if (linkTimer) clearTimeout(linkTimer);
  linkTimer = setTimeout(() => {
    linkTimer = null;
    link.hidden = false;
  }, opts.linkDelayMs ?? SHOW_LINK_DELAY_MS);
}

/** Remet style et écran s'ils ont été retirés par la page (sans en créer de second). */
export function ensureOverlay(opts: OverlayOptions, doc: Document = document): void {
  hidePage(doc);
  const host = findHost(doc);
  if (host?.isConnected) return;
  showOverlay(opts, doc);
}

/**
 * Retire le masquage et l'écran. Idempotent : renvoie true seulement au premier appel
 * qui a effectivement retiré quelque chose (l'événement GUARD_REVEALED_EVENT n'est émis qu'alors).
 */
export function reveal(doc: Document = document): boolean {
  if (linkTimer) clearTimeout(linkTimer);
  linkTimer = null;
  rootObserver?.disconnect();
  rootObserver = null;
  const style = doc.getElementById(GUARD_STYLE_ID);
  const host = findHost(doc);
  if (!style && !host) return false;
  style?.remove();
  host?.remove();
  doc.defaultView?.dispatchEvent(new Event(GUARD_REVEALED_EVENT));
  return true;
}
