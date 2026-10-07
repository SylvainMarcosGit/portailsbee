// Remplissage des champs compatible avec les frameworks (React, Vue, Angular) :
// on passe par le setter natif de HTMLInputElement.value, puis on émet les
// événements que ces frameworks écoutent.

import { safeQuery, type LoginForm } from './detect';

export function setNativeValue(el: HTMLInputElement, value: string): void {
  const view = el.ownerDocument.defaultView;
  const proto = view ? view.HTMLInputElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  el.focus({ preventScroll: true });
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new FocusEvent('blur'));
  el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
}

export function fillForm(f: LoginForm, identifier: string | null, secret: string | null): void {
  if (f.username && identifier !== null) setNativeValue(f.username, identifier);
  if (secret === null) return;
  if (f.pin) {
    // Un chiffre par case, comme une saisie au clavier : la page recompose son champ caché.
    const chars = Array.from(secret);
    f.pin.forEach((box, i) => setNativeValue(box, chars[i] ?? ''));
    return;
  }
  if (f.password) setNativeValue(f.password, secret);
}

/** Valeur saisie dans le champ secret (mot de passe ou code PIN complet), sinon chaîne vide. */
export function readSecret(f: LoginForm): string {
  if (f.pin) {
    const value = f.pin.map((b) => b.value).join('');
    return value.length === f.pin.length ? value : '';
  }
  return f.password?.value ?? '';
}

/**
 * Validation : clic sur submit_selector, sinon bouton submit du formulaire,
 * sinon form.requestSubmit(). Renvoie false si rien n'a pu être déclenché.
 */
export function submitForm(f: LoginForm, submitSelector: string | null): boolean {
  const doc = (f.password ?? f.username)?.ownerDocument ?? document;
  const configured = safeQuery(doc, submitSelector) as HTMLElement | null;
  const button = configured ?? f.submit;
  if (button) {
    button.click();
    return true;
  }
  if (f.form) {
    if (typeof f.form.requestSubmit === 'function') f.form.requestSubmit();
    else f.form.submit();
    return true;
  }
  const field = f.password ?? f.username;
  if (field) {
    for (const type of ['keydown', 'keypress', 'keyup'] as const) {
      field.dispatchEvent(new KeyboardEvent(type, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    }
    return true;
  }
  return false;
}
