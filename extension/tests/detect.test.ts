// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { detectLoginForm } from '../src/lib/detect';
import { setNativeValue } from '../src/lib/fill';

function page(html: string): void {
  document.body.innerHTML = html;
}

describe('detectLoginForm', () => {
  beforeEach(() => page(''));

  it('repère un formulaire classique identifiant + mot de passe', () => {
    page(`
      <input type="search" name="q">
      <form id="f">
        <input type="hidden" name="_token" value="x">
        <input type="text" name="login" id="login">
        <input type="password" name="password" id="pw">
        <button type="submit" id="go">Se connecter</button>
      </form>`);
    const f = detectLoginForm(document);
    expect(f?.step).toBe('full');
    expect(f?.username?.id).toBe('login');
    expect(f?.password?.id).toBe('pw');
    expect(f?.submit?.id).toBe('go');
    expect(f?.form?.id).toBe('f');
  });

  it('prend le champ texte le plus proche avant le mot de passe', () => {
    page(`
      <form>
        <input type="text" name="societe" id="societe">
        <input type="email" name="email" id="email">
        <input type="password" id="pw">
      </form>`);
    expect(detectLoginForm(document)?.username?.id).toBe('email');
  });

  it('ignore les champs masqués', () => {
    page(`
      <form>
        <input type="text" id="leurre" style="display:none">
        <input type="text" id="user">
        <input type="password" id="cache" style="visibility:hidden">
        <input type="password" id="pw">
      </form>`);
    const f = detectLoginForm(document);
    expect(f?.password?.id).toBe('pw');
    expect(f?.username?.id).toBe('user');
  });

  it("n'utilise pas un formulaire à deux mots de passe (inscription, changement)", () => {
    page(`
      <form>
        <input type="text" name="email">
        <input type="password" id="p1">
        <input type="password" id="p2">
      </form>`);
    expect(detectLoginForm(document)).toBeNull();
  });

  it('respecte les sélecteurs configurés', () => {
    page(`
      <div>
        <input type="text" id="a">
        <input type="text" id="b">
        <input type="password" id="pw">
        <a id="btn" role="button">Entrer</a>
      </div>`);
    const f = detectLoginForm(document, { username_selector: '#a', password_selector: '#pw', submit_selector: '#btn' });
    expect(f?.username?.id).toBe('a');
    expect(f?.submit?.id).toBe('btn');
  });

  it("tolère un sélecteur invalide et revient à l'heuristique", () => {
    page(`<form><input type="text" id="u"><input type="password" id="pw"></form>`);
    const f = detectLoginForm(document, { username_selector: '##[', password_selector: '' });
    expect(f?.username?.id).toBe('u');
    expect(f?.password?.id).toBe('pw');
  });

  it("reconnaît l'étape « identifiant seul » d'une connexion en deux étapes", () => {
    page(`
      <form id="step1">
        <input type="email" name="loginfmt" id="ident" autocomplete="username">
        <button type="submit" id="next">Suivant</button>
      </form>`);
    const f = detectLoginForm(document);
    expect(f?.step).toBe('identifier');
    expect(f?.username?.id).toBe('ident');
    expect(f?.submit?.id).toBe('next');
  });

  it("reconnaît l'étape « mot de passe seul »", () => {
    page(`<form><input type="password" id="pw"><button>Connexion</button></form>`);
    const f = detectLoginForm(document);
    expect(f?.step).toBe('password');
    expect(f?.username).toBeNull();
  });

  it('ne prend pas un champ de recherche pour un identifiant', () => {
    page(`<form><input type="search" name="q"><button>Rechercher</button></form>`);
    expect(detectLoginForm(document)).toBeNull();
  });

  it('trouve un formulaire sans balise form (SPA)', () => {
    page(`
      <div class="login">
        <input type="text" placeholder="Matricule" id="m">
        <input type="password" id="pw">
        <button type="button" id="b">Connexion</button>
      </div>`);
    const f = detectLoginForm(document);
    expect(f?.form).toBeNull();
    expect(f?.username?.id).toBe('m');
    expect(f?.submit?.id).toBe('b');
  });
});

describe('setNativeValue', () => {
  it('écrit la valeur et émet input/change', () => {
    page(`<input type="text" id="u">`);
    const el = document.getElementById('u') as HTMLInputElement;
    const seen: string[] = [];
    el.addEventListener('input', () => seen.push('input'));
    el.addEventListener('change', () => seen.push('change'));
    setNativeValue(el, 'agent01');
    expect(el.value).toBe('agent01');
    expect(seen).toEqual(['input', 'change']);
  });
});
