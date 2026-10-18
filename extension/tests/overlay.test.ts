// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { detectLoginForm } from '../src/lib/detect';
import { GUARD_HOST_TAG, GUARD_REVEALED_EVENT, GUARD_STYLE_ID, ensureOverlay, hidePage, isPageHidden, reveal, showOverlay, type OverlayOptions } from '../src/lib/overlay';

const opts = (onShowLogin = () => undefined): OverlayOptions => ({ appName: 'Rapport', iconUrl: 'chrome-extension://x/icons/icon-48.png', onShowLogin, linkDelayMs: 3000 });

describe('écran « Connexion invisible »', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = '<head></head><body><form><input type="password"></form></body>';
  });
  afterEach(() => {
    reveal();
    vi.useRealTimers();
  });

  it('recouvre la page et pose l’écran sur documentElement', () => {
    hidePage();
    showOverlay(opts());
    const style = document.getElementById(GUARD_STYLE_ID);
    expect(style?.parentElement).toBe(document.documentElement);
    // Rideau opaque seulement : la page n'est jamais rendue invisible.
    expect(style?.textContent).toBe('html,body{overflow:hidden !important}');
    expect(style?.textContent).not.toContain('visibility');
    expect(style?.textContent).not.toContain('opacity');
    const host = document.querySelector(GUARD_HOST_TAG) as HTMLElement | null;
    expect(host?.parentElement).toBe(document.documentElement);
    expect(host?.style.getPropertyValue('visibility')).toBe('visible');
    expect(host?.style.getPropertyPriority('visibility')).toBe('important');
    expect(isPageHidden()).toBe(true);
  });

  it('laisse le formulaire détectable sous l’écran (sinon la connexion attend le délai)', () => {
    document.documentElement.innerHTML =
      '<head></head><body><form id="f"><input type="email" id="email"><input type="password" id="pw"><button type="submit">Se connecter</button></form></body>';
    hidePage();
    showOverlay(opts());
    const f = detectLoginForm(document);
    expect(f?.username?.id).toBe('email');
    expect(f?.password?.id).toBe('pw');
  });

  it('ne pose qu’un seul écran et un seul style', () => {
    hidePage();
    hidePage();
    showOverlay(opts());
    showOverlay(opts());
    ensureOverlay(opts());
    expect(document.querySelectorAll(`#${GUARD_STYLE_ID}`)).toHaveLength(1);
    expect(document.querySelectorAll(GUARD_HOST_TAG)).toHaveLength(1);
  });

  it('remet l’écran si la page l’a retiré', () => {
    hidePage();
    showOverlay(opts());
    document.querySelector(GUARD_HOST_TAG)?.remove();
    document.getElementById(GUARD_STYLE_ID)?.remove();
    ensureOverlay(opts());
    expect(isPageHidden()).toBe(true);
    expect(document.querySelector(GUARD_HOST_TAG)).not.toBeNull();
  });

  it('reveal retire style et écran, une seule fois (idempotent)', () => {
    const onRevealed = vi.fn();
    window.addEventListener(GUARD_REVEALED_EVENT, onRevealed);
    hidePage();
    showOverlay(opts());
    expect(reveal()).toBe(true);
    expect(document.getElementById(GUARD_STYLE_ID)).toBeNull();
    expect(document.querySelector(GUARD_HOST_TAG)).toBeNull();
    expect(isPageHidden()).toBe(false);
    expect(reveal()).toBe(false);
    expect(reveal()).toBe(false);
    expect(onRevealed).toHaveBeenCalledTimes(1);
    window.removeEventListener(GUARD_REVEALED_EVENT, onRevealed);
  });

  it('reveal sans écran ne fait rien', () => {
    expect(reveal()).toBe(false);
    expect(document.querySelector('form')).not.toBeNull();
  });

  it('n’affecte pas le reste de la page', () => {
    hidePage();
    showOverlay(opts());
    reveal();
    expect(document.querySelector('input[type=password]')).not.toBeNull();
    expect(document.documentElement.children).toHaveLength(2);
  });
});
