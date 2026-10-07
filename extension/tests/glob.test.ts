import { describe, expect, it } from 'vitest';
import { findBestMatch, matchUrl } from '../src/lib/glob';

describe('matchUrl', () => {
  it('fait correspondre un motif exact', () => {
    expect(matchUrl('https://rh.sbee.bj/login', 'https://rh.sbee.bj/login')).toBe(true);
    expect(matchUrl('https://rh.sbee.bj/login', 'https://rh.sbee.bj/login2')).toBe(false);
  });

  it('gère le joker *', () => {
    expect(matchUrl('https://rh.sbee.bj/login*', 'https://rh.sbee.bj/login?next=/home')).toBe(true);
    expect(matchUrl('https://*.sbee.bj/auth/*', 'https://gmao.sbee.bj/auth/signin')).toBe(true);
    expect(matchUrl('https://*.sbee.bj/auth/*', 'https://gmao.example.com/auth/signin')).toBe(false);
  });

  it('traite « ? » et « . » comme des caractères littéraux', () => {
    expect(matchUrl('https://a.bj/login?x=1', 'https://a.bj/login?x=1')).toBe(true);
    expect(matchUrl('https://a.bj/login?x=1', 'https://a.bj/loginXx=1')).toBe(false);
    expect(matchUrl('https://a.bj/*', 'https://aXbj/')).toBe(false);
  });

  it('accepte un motif sans schéma (http et https)', () => {
    expect(matchUrl('intranet.sbee.bj/login*', 'http://intranet.sbee.bj/login')).toBe(true);
    expect(matchUrl('intranet.sbee.bj/login*', 'https://intranet.sbee.bj/login.php')).toBe(true);
    expect(matchUrl('intranet.sbee.bj/login*', 'ftp://intranet.sbee.bj/login')).toBe(false);
  });

  it('ignore le fragment si nécessaire', () => {
    expect(matchUrl('https://spa.bj/login', 'https://spa.bj/login#top')).toBe(true);
  });

  it("n'est pas sensible à la casse", () => {
    expect(matchUrl('https://RH.sbee.bj/Login', 'https://rh.sbee.bj/login')).toBe(true);
  });

  it('refuse un motif vide', () => {
    expect(matchUrl('', 'https://a.bj/')).toBe(false);
    expect(matchUrl(null, 'https://a.bj/')).toBe(false);
  });

  it("ne laisse pas un suffixe d'hôte passer pour l'hôte attendu", () => {
    expect(matchUrl('https://rh.sbee.bj/*', 'https://rh.sbee.bj.evil.com/login')).toBe(false);
  });
});

describe('findBestMatch', () => {
  it('préfère le motif le plus spécifique', () => {
    const apps = [
      { id: 1, login_url_pattern: 'https://*.sbee.bj/*' },
      { id: 2, login_url_pattern: 'https://rh.sbee.bj/login*' },
      { id: 3, login_url_pattern: null },
    ];
    expect(findBestMatch(apps, 'https://rh.sbee.bj/login')?.id).toBe(2);
    expect(findBestMatch(apps, 'https://gmao.sbee.bj/')?.id).toBe(1);
    expect(findBestMatch(apps, 'https://autre.bj/')).toBeNull();
  });
});
