// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { detectLoginForm } from '../src/lib/detect';
import { fillForm, readSecret } from '../src/lib/fill';

const boxes = (n: number) =>
  Array.from({ length: n }, () => '<input type="password" class="pin-box" inputmode="numeric" pattern="[0-9]" maxlength="1" autocomplete="off" value=""><span aria-hidden="true"></span>').join('');

// Reproduction de la page de connexion MaSBEE (testmasbee.sbee.bj/connection).
function masbeePage(): void {
  document.body.innerHTML = `
    <form id="login" method="POST" action="/auth/connection">
      <input type="hidden" name="_token" value="x">
      <input type="text" name="login" id="identifiant" autocomplete="username" placeholder="Ex: 0196000000 ou nom@email.com">
      <div class="pin-boxes" data-pin-target="login_password">${boxes(6)}</div>
      <input type="hidden" name="password" id="login_password" value="">
      <button type="submit" id="go">Se connecter</button>
    </form>
    <form id="signup" action="/auth/ajax/inscription">
      <input type="text" name="nom"><input type="email" name="email">
      <div class="pin-boxes" data-pin-target="mopassword">${boxes(6)}</div>
      <input type="hidden" name="password" id="mopassword" value="">
      <div class="pin-boxes" data-pin-target="cpassword">${boxes(6)}</div>
      <input type="hidden" name="password_confirmation" id="cpassword" value="">
      <button type="submit">Créer mon compte</button>
    </form>`;
  // Même logique que le script de la page : chaque saisie recompose le champ caché.
  document.querySelectorAll<HTMLElement>('.pin-boxes').forEach((group) => {
    const list = Array.from(group.querySelectorAll<HTMLInputElement>('.pin-box'));
    const hidden = document.getElementById(group.dataset.pinTarget ?? '') as HTMLInputElement;
    list.forEach((box) =>
      box.addEventListener('input', () => {
        box.value = box.value.replace(/[^0-9]/g, '').slice(0, 1);
        hidden.value = list.map((b) => b.value).join('');
      }),
    );
  });
}

describe('code PIN en cases séparées', () => {
  beforeEach(masbeePage);

  it('reconnaît le formulaire de connexion et ignore celui d’inscription (2 codes)', () => {
    const f = detectLoginForm(document);
    expect(f?.form?.id).toBe('login');
    expect(f?.step).toBe('full');
    expect(f?.username?.id).toBe('identifiant');
    expect(f?.pin).toHaveLength(6);
    expect(f?.submit?.id).toBe('go');
  });

  it('tape un chiffre par case et la page recompose son champ caché', () => {
    const f = detectLoginForm(document);
    expect(f).not.toBeNull();
    if (!f) return;
    fillForm(f, '0197000000', '123456');
    expect((document.getElementById('identifiant') as HTMLInputElement).value).toBe('0197000000');
    expect(f.pin?.map((b) => b.value).join('')).toBe('123456');
    expect((document.getElementById('login_password') as HTMLInputElement).value).toBe('123456');
  });

  it('ne capture le code que lorsqu’il est complet', () => {
    const f = detectLoginForm(document);
    if (!f?.pin) throw new Error('PIN non détecté');
    f.pin.slice(0, 3).forEach((b, i) => (b.value = String(i)));
    expect(readSecret(f)).toBe('');
    f.pin.forEach((b, i) => (b.value = String(i + 1)));
    expect(readSecret(f)).toBe('123456');
  });

  it('un formulaire avec seulement un code + sa confirmation n’est pas une connexion', () => {
    document.body.innerHTML = document.getElementById('signup')?.outerHTML ?? '';
    expect(detectLoginForm(document)).toBeNull();
  });
});
