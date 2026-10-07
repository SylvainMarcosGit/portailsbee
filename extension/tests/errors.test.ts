import { describe, expect, it } from 'vitest';
import { ApiError, MSG_FORBIDDEN_APP, MSG_UNAVAILABLE, classifyError } from '../src/lib/api';

describe('classifyError', () => {
  it('401 : jeton à renouveler', () => {
    expect(classifyError(401, 'Unauthenticated.')).toBe('auth');
    expect(classifyError(401, null)).toBe('auth');
  });

  it('403 de jeton invalide ou mal typé : jeton à renouveler', () => {
    expect(classifyError(403, "Réservé à l'extension SBEE.")).toBe('auth');
    expect(classifyError(403, "Ce jeton n'est pas autorisé pour cette opération.")).toBe('auth');
    expect(classifyError(403, "  Réservé à l'extension SBEE.  ")).toBe('auth');
  });

  it('403 métier (application non attribuée, désactivée) : pas de déconnexion', () => {
    expect(classifyError(403, 'This action is unauthorized.')).toBe('forbidden_app');
    expect(classifyError(403, '')).toBe('forbidden_app');
    expect(classifyError(403, undefined)).toBe('forbidden_app');
  });

  it('503 : coffre non configuré', () => {
    expect(classifyError(503, 'Service Unavailable')).toBe('unavailable');
  });

  it('autres statuts', () => {
    expect(classifyError(404, 'Aucun identifiant enregistré pour cette application.')).toBe('other');
    expect(classifyError(422, 'Données invalides.')).toBe('other');
    expect(classifyError(0, 'Portail injoignable.')).toBe('other');
  });
});

describe('ApiError', () => {
  it('expose la classification et le message à afficher', () => {
    expect(new ApiError(401, 'x').isAuthError).toBe(true);
    const app = new ApiError(403, 'This action is unauthorized.');
    expect(app.isAuthError).toBe(false);
    expect(app.userMessage).toBe(MSG_FORBIDDEN_APP);
    expect(new ApiError(503, 'x').userMessage).toBe(MSG_UNAVAILABLE);
    expect(new ApiError(422, 'Données invalides.').userMessage).toBe('Données invalides.');
  });
});
