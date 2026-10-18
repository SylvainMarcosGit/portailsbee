// Proposition « Enregistrer / Mettre à jour » affichée dans la page, isolée
// dans un shadow DOM fermé (le style de la page ne la touche pas, et les
// scripts de la page ne peuvent pas la lire). Charte SBEE.

import type { PromptInfo, SimpleResult } from './messages';

const HOST_ID = 'sbee-vault-prompt-host';

const CSS = `
:host { all: initial; }
.box {
  position: fixed; top: 16px; right: 16px; z-index: 2147483647;
  width: 360px; max-width: calc(100vw - 32px); box-sizing: border-box;
  background: #FFFFFF; color: #111111;
  border: 1px solid #E5E5E5; border-left: 3px solid #ED1F24; border-radius: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
  padding: 16px;
  font: 14px/1.45 Poppins, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
}
.brand { margin: 0 0 8px; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #ED1F24; }
.title { margin: 0 0 4px; font-size: 15px; font-weight: 600; }
.detail { margin: 0 0 16px; color: #444444; word-break: break-word; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
button {
  min-height: 44px; min-width: 44px; padding: 0 16px; border-radius: 4px; cursor: pointer;
  font: 600 14px/1 Poppins, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
}
button:focus-visible { outline: 2px solid #111111; outline-offset: 2px; }
.primary { background: #ED1F24; color: #FFFFFF; border: 1px solid #ED1F24; }
.primary:hover { background: #C8161B; border-color: #C8161B; }
.secondary { background: #FFFFFF; color: #111111; border: 1px solid #C0C0C0; }
.secondary:hover { border-color: #111111; }
button[disabled] { opacity: 0.6; cursor: default; }
.status { margin: 12px 0 0; font-size: 13px; }
.status.error { color: #B00020; }
@media (prefers-reduced-motion: no-preference) {
  .box { animation: in 160ms ease-out; }
  @keyframes in { from { transform: translateY(-6px); opacity: 0; } to { transform: none; opacity: 1; } }
}
`;

export interface PromptHandlers {
  onSave: () => Promise<SimpleResult>;
  onDismiss: () => void;
}

/** Une proposition ou un message est déjà affiché. */
export function hasPrompt(doc: Document = document): boolean {
  return !!doc.getElementById(HOST_ID);
}

export function removePrompt(doc: Document = document): void {
  doc.getElementById(HOST_ID)?.remove();
}

export function showPrompt(info: PromptInfo, handlers: PromptHandlers, doc: Document = document): void {
  removePrompt(doc);
  const host = doc.createElement('div');
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = doc.createElement('style');
  style.textContent = CSS;

  const box = doc.createElement('div');
  box.className = 'box';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-live', 'polite');
  box.setAttribute('aria-label', 'Coffre SBEE');

  const brand = doc.createElement('p');
  brand.className = 'brand';
  brand.textContent = 'Coffre SBEE';

  const title = doc.createElement('p');
  title.className = 'title';
  title.textContent =
    info.mode === 'save' ? 'Enregistrer ces identifiants dans votre coffre SBEE ?' : 'Mettre à jour le mot de passe enregistré ?';

  const detail = doc.createElement('p');
  detail.className = 'detail';
  detail.textContent = `${info.app_name} - ${info.login_identifier}`;

  const actions = doc.createElement('div');
  actions.className = 'actions';

  const save = doc.createElement('button');
  save.type = 'button';
  save.className = 'primary';
  save.textContent = info.mode === 'save' ? 'Enregistrer' : 'Mettre à jour';

  const later = doc.createElement('button');
  later.type = 'button';
  later.className = 'secondary';
  later.textContent = 'Pas maintenant';

  const status = doc.createElement('p');
  status.className = 'status';
  status.hidden = true;

  save.addEventListener('click', () => {
    save.disabled = true;
    later.disabled = true;
    status.hidden = false;
    status.classList.remove('error');
    status.textContent = 'Enregistrement...';
    handlers
      .onSave()
      .then((res) => {
        if (res.ok) {
          status.textContent = 'Identifiants enregistrés dans votre coffre SBEE.';
          actions.remove();
          setTimeout(() => host.remove(), 2500);
        } else if (res.final) {
          status.classList.add('error');
          status.textContent = res.message ?? "L'enregistrement a échoué.";
          actions.remove();
          setTimeout(() => host.remove(), 6000);
        } else {
          status.classList.add('error');
          status.textContent = res.message ?? "L'enregistrement a échoué. Réessayez depuis le portail.";
          save.disabled = false;
          later.disabled = false;
        }
      })
      .catch(() => {
        status.classList.add('error');
        status.textContent = "L'enregistrement a échoué. Réessayez depuis le portail.";
        save.disabled = false;
        later.disabled = false;
      });
  });

  later.addEventListener('click', () => {
    handlers.onDismiss();
    host.remove();
  });

  actions.append(save, later);
  box.append(brand, title, detail, actions, status);
  shadow.append(style, box);
  (doc.body ?? doc.documentElement).append(host);
}

/** Message court dans la page (même composant, sans action), fermé après quelques secondes. */
export function showNotice(message: string, doc: Document = document, durationMs = 6000): void {
  removePrompt(doc);
  const host = doc.createElement('div');
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: 'closed' });
  const style = doc.createElement('style');
  style.textContent = CSS;
  const box = doc.createElement('div');
  box.className = 'box';
  box.setAttribute('role', 'status');
  box.setAttribute('aria-live', 'polite');
  const brand = doc.createElement('p');
  brand.className = 'brand';
  brand.textContent = 'Coffre SBEE';
  const text = doc.createElement('p');
  text.className = 'title';
  text.textContent = message;
  const actions = doc.createElement('div');
  actions.className = 'actions';
  const close = doc.createElement('button');
  close.type = 'button';
  close.className = 'secondary';
  close.textContent = 'Fermer';
  close.addEventListener('click', () => host.remove());
  actions.append(close);
  box.append(brand, text, actions);
  shadow.append(style, box);
  (doc.body ?? doc.documentElement).append(host);
  setTimeout(() => host.remove(), durationMs);
}
