// Détection d'un formulaire de connexion : sélecteurs configurés par
// l'administrateur, sinon heuristique (champ mot de passe visible + champ
// texte/email/tel visible qui le précède dans le même formulaire).
// Gère aussi les connexions en deux étapes (identifiant seul, puis mot de passe)
// et les codes PIN saisis dans plusieurs cases d'un chiffre (ex. MaSBEE).

import type { FillStep } from './messages';

export interface Selectors {
  username_selector?: string | null;
  password_selector?: string | null;
  submit_selector?: string | null;
}

export interface LoginForm {
  step: FillStep;
  form: HTMLFormElement | null;
  username: HTMLInputElement | null;
  password: HTMLInputElement | null;
  /** Code PIN en cases séparées (une case par chiffre) ; password vaut alors la première case. */
  pin: HTMLInputElement[] | null;
  submit: HTMLElement | null;
}

const PIN_MIN = 4;
const PIN_MAX = 8;

/** Case d'un code PIN : champ mot de passe d'un seul caractère. */
function isPinBox(el: HTMLInputElement): boolean {
  return inputType(el) === 'password' && el.getAttribute('maxlength') === '1';
}

/** Regroupe les cases PIN visibles par bloc parent ; seuls les blocs de 4 à 8 cases comptent. */
export function findPinGroups(scope: ParentNode, vis: (el: Element) => boolean): HTMLInputElement[][] {
  const groups = new Map<Element, HTMLInputElement[]>();
  for (const box of Array.from(scope.querySelectorAll('input')).filter((i) => isPinBox(i) && vis(i))) {
    const parent = box.parentElement;
    if (!parent) continue;
    const list = groups.get(parent) ?? [];
    list.push(box);
    groups.set(parent, list);
  }
  return Array.from(groups.values()).filter((g) => g.length >= PIN_MIN && g.length <= PIN_MAX);
}

export type Scope = Document | HTMLFormElement;

const TEXT_TYPES = new Set(['text', 'email', 'tel', 'number', '']);
const IDENTIFIER_HINT = /user|login|logon|email|e-mail|mail|courriel|identifiant|ident|matricule|compte|account|utilisateur|uid|pseudo|nom.?d.?utilisateur/i;
const SEARCH_HINT = /search|recherche|query|^q$/i;
const SUBMIT_HINT = /connexion|connecter|connect|login|log in|sign in|signin|suivant|next|continuer|continue|valider|envoyer|entrer|ok/i;

function isInput(el: Element | null): el is HTMLInputElement {
  return !!el && el.tagName === 'INPUT';
}

export function inputType(el: HTMLInputElement): string {
  return (el.getAttribute('type') ?? '').trim().toLowerCase();
}

export function isTextLike(el: HTMLInputElement): boolean {
  return TEXT_TYPES.has(inputType(el));
}

/** Visible et utilisable. Le contrôle de taille n'est appliqué que si une mise en page existe (navigateur réel). */
export function isVisible(el: Element): boolean {
  if (isInput(el)) {
    if (el.disabled || el.readOnly || inputType(el) === 'hidden') return false;
  }
  const view = el.ownerDocument.defaultView;
  for (let n: Element | null = el; n; n = n.parentElement) {
    if ((n as HTMLElement).hidden) return false;
    if (n.getAttribute('aria-hidden') === 'true' && n === el) return false;
    if (view) {
      const s = view.getComputedStyle(n);
      if (s.display === 'none' || s.visibility === 'hidden' || s.visibility === 'collapse') return false;
      if (s.opacity === '0') return false;
    }
  }
  const root = el.ownerDocument.documentElement.getBoundingClientRect();
  if (root.width > 0 || root.height > 0) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
  }
  return true;
}

export function safeQuery(scope: ParentNode, selector: string | null | undefined): Element | null {
  if (!selector || !selector.trim()) return null;
  try {
    return scope.querySelector(selector);
  } catch {
    return null;
  }
}

function inputs(scope: ParentNode): HTMLInputElement[] {
  return Array.from(scope.querySelectorAll('input'));
}

function precedes(a: Node, b: Node): boolean {
  return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}

function hintText(el: HTMLInputElement): string {
  return [
    el.name,
    el.id,
    el.getAttribute('autocomplete') ?? '',
    el.getAttribute('placeholder') ?? '',
    el.getAttribute('aria-label') ?? '',
    inputType(el) === 'email' ? 'email' : '',
  ].join(' ');
}

function looksLikeSearch(el: HTMLInputElement): boolean {
  return inputType(el) === 'search' || SEARCH_HINT.test(el.name) || SEARCH_HINT.test(el.id) || el.getAttribute('role') === 'searchbox';
}

export function looksLikeIdentifier(el: HTMLInputElement): boolean {
  if (!isTextLike(el) || looksLikeSearch(el)) return false;
  const ac = (el.getAttribute('autocomplete') ?? '').toLowerCase();
  if (ac.includes('username') || ac.includes('email')) return true;
  return IDENTIFIER_HINT.test(hintText(el));
}

function isButtonLike(el: Element): boolean {
  const tag = el.tagName;
  if (tag === 'BUTTON') return (el.getAttribute('type') ?? 'submit').toLowerCase() !== 'reset';
  if (tag === 'INPUT') return ['submit', 'image', 'button'].includes(inputType(el as HTMLInputElement));
  return el.getAttribute('role') === 'button';
}

function buttonLabel(el: Element): string {
  if (isInput(el)) return `${el.value} ${el.getAttribute('aria-label') ?? ''}`;
  return `${el.textContent ?? ''} ${el.getAttribute('aria-label') ?? ''} ${el.id}`;
}

/** Bouton de validation : celui du formulaire, sinon un bouton visible « connexion/suivant » après le champ. */
export function findSubmit(scope: Scope, form: HTMLFormElement | null, after: Element | null, vis = isVisible): HTMLElement | null {
  if (form) {
    const candidates = Array.from(
      form.querySelectorAll<HTMLElement>('button[type=submit], input[type=submit], input[type=image], button:not([type])'),
    ).filter((b) => vis(b));
    if (candidates[0]) return candidates[0];
  }
  const root: ParentNode = form ?? scope;
  const buttons = Array.from(root.querySelectorAll<HTMLElement>('button, input[type=submit], input[type=button], input[type=image], [role=button]'))
    .filter((b) => isButtonLike(b) && vis(b) && (!after || precedes(after, b)));
  return buttons.find((b) => SUBMIT_HINT.test(buttonLabel(b))) ?? null;
}

/**
 * Cherche un formulaire de connexion dans le document (ou dans un formulaire donné).
 * Renvoie null si rien d'exploitable.
 */
export function detectLoginForm(scope: Scope, sel: Selectors = {}, vis: (el: Element) => boolean = isVisible): LoginForm | null {
  const doc: Document = scope.nodeType === Node.DOCUMENT_NODE ? (scope as Document) : (scope.ownerDocument as Document);

  // 1. Mot de passe
  let password: HTMLInputElement | null = null;
  let pin: HTMLInputElement[] | null = null;
  const pwSel = safeQuery(doc, sel.password_selector);
  if (isInput(pwSel) && vis(pwSel) && (scope === doc || scope.contains(pwSel))) {
    password = pwSel;
  } else {
    // Les cases d'un code PIN ne sont pas des mots de passe séparés.
    const pws = inputs(scope).filter((i) => inputType(i) === 'password' && vis(i) && !isPinBox(i));
    const pinGroups = findPinGroups(scope, vis);
    if (pws.length === 0 && pinGroups.length > 0) {
      // Un seul code PIN dans son formulaire = connexion ; deux (code + confirmation) = inscription.
      const formOf = (g: HTMLInputElement[]) => g[0]?.form ?? null;
      const group = pinGroups.find((g) => pinGroups.filter((o) => formOf(o) === formOf(g)).length === 1);
      const first = group?.[0];
      if (!group || !first) return null;
      pin = group;
      password = first;
    }
    // Mots de passe visibles mais aucun exploitable : ni connexion, ni étape « identifiant ».
    if (pws.length > 0 && !pws.some((pw) => pws.filter((p) => p.form === pw.form).length === 1)) return null;
    for (const pw of pin ? [] : pws) {
      // Un formulaire à 2 mots de passe ou plus (création, changement) n'est pas une connexion.
      const sameForm = pws.filter((p) => p.form === pw.form);
      if (sameForm.length === 1) {
        password = pw;
        break;
      }
    }
  }

  // 2. Identifiant
  let username: HTMLInputElement | null = null;
  const userSel = safeQuery(doc, sel.username_selector);
  if (isInput(userSel) && vis(userSel) && (scope === doc || scope.contains(userSel))) username = userSel;

  if (password) {
    const form = password.form;
    if (!username) {
      const root: ParentNode = form ?? scope;
      const before = inputs(root).filter((i) => isTextLike(i) && vis(i) && !looksLikeSearch(i) && precedes(i, password as Node));
      username = before[before.length - 1] ?? null;
    }
    const submitSel = safeQuery(doc, sel.submit_selector) as HTMLElement | null;
    const submit = submitSel ?? findSubmit(scope, form, password, vis);
    return { step: username ? 'full' : 'password', form, username, password, pin, submit };
  }

  // 3. Pas de mot de passe visible : étape « identifiant seul » ?
  if (!username) {
    const candidates = inputs(scope).filter((i) => vis(i) && looksLikeIdentifier(i));
    for (const c of candidates) {
      const root: ParentNode = c.form ?? scope;
      const texts = inputs(root).filter((i) => isTextLike(i) && vis(i));
      // Un vrai écran d'identifiant n'a qu'un ou deux champs texte (exclut les formulaires d'inscription).
      if (texts.length <= 2) {
        username = c;
        break;
      }
    }
  }
  if (!username) return null;
  const form = username.form;
  const submitSel = safeQuery(doc, sel.submit_selector) as HTMLElement | null;
  const submit = submitSel ?? findSubmit(scope, form, username, vis);
  return { step: 'identifier', form, username, password: null, pin: null, submit };
}
