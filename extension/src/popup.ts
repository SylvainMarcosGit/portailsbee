// Fenêtre de l'icône d'extension : état de connexion, application reconnue, remplissage manuel.

import browser from 'webextension-polyfill';
import type { BgRequest, PopupState, SimpleResult } from './lib/messages';

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Élément manquant : ${id}`);
  return el;
}

function bg<T>(msg: BgRequest): Promise<T> {
  return browser.runtime.sendMessage(msg) as Promise<T>;
}

const ALL_SITES = { origins: ['<all_urls>'] };

async function checkPermission(): Promise<void> {
  const box = $('permission');
  try {
    box.hidden = await browser.permissions.contains(ALL_SITES);
  } catch {
    box.hidden = true;
  }
}

async function render(): Promise<void> {
  const status = $('status');
  const openPortal = $('open-portal') as HTMLButtonElement;
  const tabApp = $('tab-app');
  const fill = $('fill') as HTMLButtonElement;

  let state: PopupState;
  try {
    state = await bg<PopupState>({ type: 'popup_state' });
  } catch {
    status.textContent = 'Extension indisponible. Rechargez la page.';
    return;
  }

  // Origine principale en premier ; les autres origines autorisées sont indiquées par leur nombre.
  const [main, ...others] = state.portal_origins;
  const extra = others.length > 0 ? ` (+${others.length} autre${others.length > 1 ? 's' : ''})` : '';
  $('footer').textContent = `Version ${state.version} - ${main ?? ''}${extra}`;
  $('footer').title = state.portal_origins.join(', ');

  if (state.connected && state.user) {
    status.className = 'status ok';
    status.textContent = `Connecté au portail : ${state.user.prenom} ${state.user.nom}`;
    openPortal.hidden = true;
  } else {
    status.className = 'status off';
    status.textContent = 'Non connecté';
    openPortal.hidden = false;
  }

  if (!state.connected) {
    tabApp.textContent = 'Connectez-vous au portail SBEE pour utiliser le coffre.';
    fill.disabled = true;
  } else if (state.tab_app) {
    tabApp.textContent = state.tab_app.has_credential
      ? `Application reconnue : ${state.tab_app.name}`
      : `Application reconnue : ${state.tab_app.name} - aucun identifiant enregistré. Connectez-vous une première fois pour les enregistrer.`;
    fill.disabled = !state.tab_app.has_credential;
  } else {
    tabApp.textContent = 'Aucune application du coffre reconnue sur cet onglet.';
    fill.disabled = true;
  }
}

$('open-portal').addEventListener('click', () => {
  void bg({ type: 'open_portal' }).then(() => window.close());
});

$('privacy').addEventListener('click', (event) => {
  event.preventDefault();
  void bg({ type: 'open_privacy' }).then(() => window.close());
});

$('grant').addEventListener('click', () => {
  void browser.permissions
    .request(ALL_SITES)
    .then(() => checkPermission())
    .catch(() => undefined);
});

$('fill').addEventListener('click', () => {
  const fill = $('fill') as HTMLButtonElement;
  const feedback = $('feedback');
  fill.disabled = true;
  feedback.className = 'feedback';
  feedback.textContent = 'Remplissage...';
  void bg<SimpleResult>({ type: 'popup_fill' })
    .then((res) => {
      if (res.ok) {
        feedback.textContent = 'Identifiants remplis.';
        setTimeout(() => window.close(), 800);
      } else {
        feedback.className = 'feedback error';
        feedback.textContent = res.message ?? 'Remplissage impossible.';
        fill.disabled = false;
      }
    })
    .catch(() => {
      feedback.className = 'feedback error';
      feedback.textContent = 'Remplissage impossible.';
      fill.disabled = false;
    });
});

void render();
void checkPermission();
