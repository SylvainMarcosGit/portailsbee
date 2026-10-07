import { describe, expect, it } from 'vitest';
import { resolvePageUrl } from '../src/lib/url';

describe('resolvePageUrl', () => {
  it("retient l'adresse annoncée quand l'application monopage a changé de route", () => {
    expect(resolvePageUrl('https://rapport.example.com/login', 'https://rapport.example.com/')).toBe('https://rapport.example.com/login');
  });

  it("refuse une adresse annoncée d'une autre origine", () => {
    expect(resolvePageUrl('https://rapport.example.com/login', 'https://malveillant.example.net/')).toBe('https://malveillant.example.net/');
    expect(resolvePageUrl('http://rapport.example.com/login', 'https://rapport.example.com/')).toBe('https://rapport.example.com/');
    expect(resolvePageUrl('https://rapport.example.com:8443/login', 'https://rapport.example.com/')).toBe('https://rapport.example.com/');
  });

  it("garde l'adresse du navigateur si l'annonce est absente ou invalide", () => {
    expect(resolvePageUrl(undefined, 'https://a.example.com/x')).toBe('https://a.example.com/x');
    expect(resolvePageUrl('pas une adresse', 'https://a.example.com/x')).toBe('https://a.example.com/x');
  });

  it("ne renvoie rien sans adresse garantie par le navigateur", () => {
    expect(resolvePageUrl('https://a.example.com/login', undefined)).toBeNull();
  });
});
