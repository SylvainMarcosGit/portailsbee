import { describe, expect, it } from 'vitest';
import { AUTOSUBMIT_GUARD_MS, autoSubmitEnabled, decideGuard, guardNotice, recentAutoSubmitSteps, type AutoSubmitMark, type GuardApp } from '../src/lib/guard';

const NOW = 1_000_000;
const app = (over: Partial<GuardApp> = {}): GuardApp => ({ application_id: 7, name: 'Rapport', sso_mode: 'silent', has_credential: true, ...over });
const mark = (at: number, application_id = 7): AutoSubmitMark => ({ application_id, steps: [{ step: 'full', at }] });

describe('validation automatique', () => {
  it("'silent' valide comme 'fill_submit'", () => {
    expect(autoSubmitEnabled('silent')).toBe(true);
    expect(autoSubmitEnabled('fill_submit')).toBe(true);
    expect(autoSubmitEnabled('fill')).toBe(false);
    expect(autoSubmitEnabled('none')).toBe(false);
  });
});

describe('garde-fou anti-boucle', () => {
  it('ne retient que les étapes récentes de la même application', () => {
    expect(recentAutoSubmitSteps(mark(NOW - 1000), 7, NOW)).toEqual(['full']);
    expect(recentAutoSubmitSteps(mark(NOW - AUTOSUBMIT_GUARD_MS - 1), 7, NOW)).toEqual([]);
    expect(recentAutoSubmitSteps(mark(NOW - 1000, 8), 7, NOW)).toEqual([]);
    expect(recentAutoSubmitSteps(undefined, 7, NOW)).toEqual([]);
  });
});

describe('décision de masquage (decideGuard)', () => {
  it('masque une page de connexion en mode silent avec identifiant enregistré', () => {
    expect(decideGuard(app(), undefined, NOW)).toEqual({ active: true, app_name: 'Rapport', on_login_page: true });
  });

  it('ne masque pas sans identifiant enregistré', () => {
    expect(decideGuard(app({ has_credential: false }), undefined, NOW)).toEqual({ active: false, on_login_page: true });
  });

  it('ne masque pas après une soumission automatique récente (connexion refusée)', () => {
    expect(decideGuard(app(), mark(NOW - 2000), NOW).active).toBe(false);
    expect(decideGuard(app(), mark(NOW - AUTOSUBMIT_GUARD_MS - 1), NOW).active).toBe(true);
    expect(decideGuard(app(), mark(NOW - 2000, 99), NOW).active).toBe(true);
  });

  it('ne masque pas dans les autres modes', () => {
    expect(decideGuard(app({ sso_mode: 'fill_submit' }), undefined, NOW)).toEqual({ active: false, on_login_page: true });
    expect(decideGuard(app({ sso_mode: 'fill' }), undefined, NOW).active).toBe(false);
    expect(decideGuard(app({ sso_mode: 'none' }), undefined, NOW)).toEqual({ active: false, on_login_page: false });
  });

  it("hors page de connexion : rien à masquer et l'écran doit disparaître", () => {
    expect(decideGuard(null, undefined, NOW)).toEqual({ active: false, on_login_page: false });
  });

  it("la réponse ne contient que le nom de l'application", () => {
    expect(Object.keys(decideGuard(app(), undefined, NOW)).sort()).toEqual(['active', 'app_name', 'on_login_page']);
  });
});

describe('messages après retrait', () => {
  it('distingue identifiants refusés et connexion manuelle', () => {
    expect(guardNotice('failed_credentials')).toBe('Connexion automatique refusée : vérifiez vos identifiants dans « Mes identifiants » du portail.');
    expect(guardNotice('failed_manual')).toBe('Terminez la connexion manuellement.');
    expect(guardNotice('timeout')).toBe('Terminez la connexion manuellement.');
    expect(guardNotice('user')).toBeNull();
    expect(guardNotice('filled')).toBeNull();
  });
});
