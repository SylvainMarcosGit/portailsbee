// Décisions pures partagées par le background et content-app (testées) :
// validation automatique selon le mode, garde-fou anti-boucle, écran « Connexion invisible ».

import type { ExtApplication, FillStep, GuardMatchResponse, GuardResult, SsoMode } from './messages';

/** Une étape soumise automatiquement il y a moins de 30 s n'est pas resoumise. */
export const AUTOSUBMIT_GUARD_MS = 30_000;

export interface AutoSubmitMark {
  application_id: number;
  steps: { step: FillStep; at: number }[];
}

/** Modes qui valident le formulaire après remplissage. */
export function autoSubmitEnabled(mode: SsoMode): boolean {
  return mode === 'fill_submit' || mode === 'silent';
}

/** Étapes soumises automatiquement pour cette application dans l'onglet, dans la fenêtre du garde-fou. */
export function recentAutoSubmitSteps(mark: AutoSubmitMark | null | undefined, applicationId: number, now: number): FillStep[] {
  if (!mark || mark.application_id !== applicationId) return [];
  return mark.steps.filter((s) => now - s.at <= AUTOSUBMIT_GUARD_MS).map((s) => s.step);
}

export type GuardApp = Pick<ExtApplication, 'application_id' | 'name' | 'sso_mode' | 'has_credential'>;

/**
 * Faut-il masquer la page de connexion ? `app` est l'application dont le motif correspond
 * à l'adresse effective du cadre principal (null sinon). Une soumission automatique récente
 * signifie que la connexion vient d'échouer : la page reste visible.
 */
export function decideGuard(app: GuardApp | null, mark: AutoSubmitMark | null | undefined, now: number): GuardMatchResponse {
  if (!app || app.sso_mode === 'none') return { active: false, on_login_page: false };
  const active = app.sso_mode === 'silent' && app.has_credential && recentAutoSubmitSteps(mark, app.application_id, now).length === 0;
  return active ? { active: true, app_name: app.name, on_login_page: true } : { active: false, on_login_page: true };
}

export const NOTICE_CREDENTIALS = 'Connexion automatique refusée : vérifiez vos identifiants dans « Mes identifiants » du portail.';
export const NOTICE_MANUAL = 'Terminez la connexion manuellement.';
/** Délai maximal de l'écran sans changement d'adresse. */
export const GUARD_TIMEOUT_MS = 10_000;

/** Message affiché après le retrait de l'écran (null : aucun). */
export function guardNotice(result: GuardResult | 'timeout' | 'user'): string | null {
  if (result === 'failed_credentials') return NOTICE_CREDENTIALS;
  if (result === 'failed_manual' || result === 'timeout') return NOTICE_MANUAL;
  return null;
}
