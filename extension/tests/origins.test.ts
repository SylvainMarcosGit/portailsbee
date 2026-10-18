import { describe, expect, it } from 'vitest';
import {
  chromiumMatch,
  firefoxMatch,
  isAllowedOrigin,
  isAllowedUrl,
  isValidApiBase,
  parseOrigin,
  parseOriginList,
  resolvePortalOrigins,
  uniqueMatches,
} from '../src/lib/origins';

const ALLOWED = ['http://127.0.0.1:8000', 'http://localhost:8000', 'https://portail.sbee.bj'];

describe('parseOrigin', () => {
  it('normalise une origine valide', () => {
    expect(parseOrigin('https://portail.sbee.bj')).toBe('https://portail.sbee.bj');
    expect(parseOrigin(' https://portail.sbee.bj/ ')).toBe('https://portail.sbee.bj');
    expect(parseOrigin('http://127.0.0.1:8000')).toBe('http://127.0.0.1:8000');
    expect(parseOrigin('https://PORTAIL.sbee.bj:443')).toBe('https://portail.sbee.bj');
  });

  it('refuse les schémas autres que http et https', () => {
    expect(() => parseOrigin('ftp://portail.sbee.bj')).toThrow(/http ou https/);
    expect(() => parseOrigin('javascript:alert(1)')).toThrow();
    expect(() => parseOrigin('file:///C:/portail')).toThrow();
  });

  it('refuse un chemin, un paramètre, un fragment ou des identifiants', () => {
    expect(() => parseOrigin('https://portail.sbee.bj/api')).toThrow(/chemin/);
    expect(() => parseOrigin('https://portail.sbee.bj/?a=1')).toThrow();
    expect(() => parseOrigin('https://portail.sbee.bj?')).toThrow();
    expect(() => parseOrigin('https://portail.sbee.bj/#x')).toThrow();
    expect(() => parseOrigin('https://user:pass@portail.sbee.bj')).toThrow(/identifiants/);
  });

  it('refuse une valeur qui n est pas une adresse', () => {
    expect(() => parseOrigin('portail.sbee.bj')).toThrow(/invalide/);
    expect(() => parseOrigin('')).toThrow();
  });
});

describe('parseOriginList', () => {
  it('découpe, normalise et dédoublonne en gardant l ordre', () => {
    expect(parseOriginList('https://portail.sbee.bj, http://localhost:8000 ,https://portail.sbee.bj/,')).toEqual([
      'https://portail.sbee.bj',
      'http://localhost:8000',
    ]);
  });

  it('refuse une liste vide ou une origine invalide', () => {
    expect(() => parseOriginList(' , ')).toThrow(/Aucune origine/);
    expect(() => parseOriginList('https://portail.sbee.bj,https://autre.sbee.bj/chemin')).toThrow(/chemin/);
  });
});

describe('resolvePortalOrigins', () => {
  it('utilise PORTAL_ORIGINS en priorité', () => {
    expect(resolvePortalOrigins({ PORTAL_ORIGINS: 'https://a.sbee.bj,https://b.sbee.bj', PORTAL_ORIGIN: 'https://c.sbee.bj' })).toEqual([
      'https://a.sbee.bj',
      'https://b.sbee.bj',
    ]);
  });

  it('reprend PORTAL_ORIGIN (singulier) si PORTAL_ORIGINS est absent', () => {
    expect(resolvePortalOrigins({ PORTAL_ORIGIN: 'https://portail.sbee.bj' })).toEqual(['https://portail.sbee.bj']);
    expect(resolvePortalOrigins({ PORTAL_ORIGINS: '  ', PORTAL_ORIGIN: 'https://portail.sbee.bj' })).toEqual(['https://portail.sbee.bj']);
  });

  it('retombe sur les origines locales par défaut', () => {
    expect(resolvePortalOrigins({})).toEqual(['http://127.0.0.1:8000', 'http://localhost:8000']);
  });
});

describe('contrôles à l exécution', () => {
  it('isAllowedOrigin compare exactement', () => {
    expect(isAllowedOrigin('http://localhost:8000', ALLOWED)).toBe(true);
    expect(isAllowedOrigin('http://localhost:8001', ALLOWED)).toBe(false);
    expect(isAllowedOrigin('http://portail.sbee.bj', ALLOWED)).toBe(false);
    expect(isAllowedOrigin(undefined, ALLOWED)).toBe(false);
  });

  it('isAllowedUrl vérifie l origine de l adresse', () => {
    expect(isAllowedUrl('https://portail.sbee.bj/coffre', ALLOWED)).toBe(true);
    expect(isAllowedUrl('http://127.0.0.1:8000/', ALLOWED)).toBe(true);
    expect(isAllowedUrl('https://portail.sbee.bj.malveillant.example/', ALLOWED)).toBe(false);
    expect(isAllowedUrl('http://127.0.0.1/', ALLOWED)).toBe(false);
    expect(isAllowedUrl('pas une adresse', ALLOWED)).toBe(false);
    expect(isAllowedUrl(undefined, ALLOWED)).toBe(false);
  });

  it('isValidApiBase exige une origine de la liste suivie de « / »', () => {
    expect(isValidApiBase('https://portail.sbee.bj/api', ALLOWED)).toBe(true);
    expect(isValidApiBase('http://localhost:8000/api', ALLOWED)).toBe(true);
    expect(isValidApiBase('https://portail.sbee.bj', ALLOWED)).toBe(false);
    expect(isValidApiBase('https://portail.sbee.bj.malveillant.example/api', ALLOWED)).toBe(false);
    expect(isValidApiBase('https://portail.sbee.bj@malveillant.example/api', ALLOWED)).toBe(false);
    expect(isValidApiBase('https://autre.sbee.bj/api', ALLOWED)).toBe(false);
    expect(isValidApiBase('https://portail.sbee.bj:443/api', ALLOWED)).toBe(false);
    expect(isValidApiBase(42, ALLOWED)).toBe(false);
  });
});

describe('motifs de correspondance', () => {
  it('garde le port pour Chromium et le retire pour Firefox', () => {
    expect(chromiumMatch('http://127.0.0.1:8000')).toBe('http://127.0.0.1:8000/*');
    expect(firefoxMatch('http://127.0.0.1:8000')).toBe('http://127.0.0.1/*');
    expect(firefoxMatch('https://portail.sbee.bj')).toBe('https://portail.sbee.bj/*');
  });

  it('dédoublonne les motifs Firefox de même hôte', () => {
    expect(uniqueMatches(['http://localhost:8000', 'http://localhost:9000'], firefoxMatch)).toEqual(['http://localhost/*']);
  });
});
