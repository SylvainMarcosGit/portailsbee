// Types partagés : pont portail (window.postMessage) et messages internes
// (content scripts / popup <-> background via runtime.sendMessage).

export type SsoMode = 'none' | 'fill' | 'fill_submit';
export type IdentifierType = 'email' | 'matricule' | 'username' | 'autre';

/** Application telle que renvoyée par GET /vault/ext/config. */
export interface ExtApplication {
  application_id: number;
  name: string;
  sso_mode: SsoMode;
  login_url_pattern: string | null;
  identifier_type: IdentifierType;
  username_selector: string | null;
  password_selector: string | null;
  submit_selector: string | null;
  has_credential: boolean;
  login_identifier: string | null;
}

export interface ExtUser {
  matricule: string;
  prenom: string;
  nom: string;
}

export interface ExtConfig {
  user: ExtUser;
  applications: ExtApplication[];
}

export interface AuthState {
  token: string;
  expires_at: string;
  api_base: string;
}

export interface RevealResult {
  login_identifier: string;
  secret: string;
}

export type PromptMode = 'save' | 'update';

/** Ce que le content script affiche (jamais le secret). */
export interface PromptInfo {
  mode: PromptMode;
  app_name: string;
  login_identifier: string;
}

export type FillStep = 'full' | 'identifier' | 'password';

// ---------------------------------------------------------------------------
// Pont portail <-> extension (contrat section 5)

export const BRIDGE_PORTAIL = 'sbee-portail';
export const BRIDGE_EXTENSION = 'sbee-extension';

export type PortailToExtension =
  | { source: typeof BRIDGE_PORTAIL; type: 'SBEE_PING' }
  | { source: typeof BRIDGE_PORTAIL; type: 'SBEE_VAULT_TOKEN'; token: string; expires_at: string; api_base: string }
  | { source: typeof BRIDGE_PORTAIL; type: 'SBEE_VAULT_LOGOUT' };

export type ExtensionToPortail =
  | { source: typeof BRIDGE_EXTENSION; type: 'SBEE_EXTENSION_READY'; version: string; instance_id: string }
  | { source: typeof BRIDGE_EXTENSION; type: 'SBEE_VAULT_TOKEN_ACK' }
  | { source: typeof BRIDGE_EXTENSION; type: 'SBEE_TOKEN_REQUEST' };

// ---------------------------------------------------------------------------
// Messages vers le background

export type BgRequest =
  // content-portail
  | { type: 'portal_token'; token: string; expires_at: string; api_base: string }
  | { type: 'portal_logout' }
  | { type: 'portal_status' }
  // content-app
  | { type: 'match'; url: string }
  | { type: 'reveal'; application_id: number; url: string }
  | { type: 'mark_autosubmit'; application_id: number; step: FillStep }
  | { type: 'capture'; application_id: number; url: string; kind: 'identifier'; login_identifier: string }
  | { type: 'capture'; application_id: number; url: string; kind: 'full'; login_identifier: string | null; secret: string }
  | { type: 'capture_commit' }
  | { type: 'capture_discard' }
  // popup
  | { type: 'popup_state' }
  | { type: 'popup_fill' }
  | { type: 'open_portal' };

/** Application transmise au content script (sans secret). */
export type MatchedApp = Omit<ExtApplication, 'login_url_pattern'>;

export interface MatchResponse {
  app: MatchedApp | null;
  pending: PromptInfo | null;
  /** Étapes déjà soumises automatiquement dans cet onglet il y a moins de 30 s. */
  recent_autosubmit: FillStep[];
}

export interface PopupState {
  connected: boolean;
  user: ExtUser | null;
  portal_origin: string;
  version: string;
  tab_app: { name: string; has_credential: boolean } | null;
}

export interface SimpleResult {
  ok: boolean;
  message?: string;
  /** Échec définitif (inutile de réessayer) : la proposition est oubliée. */
  final?: boolean;
}

export type RevealResponse = { ok: true; creds: RevealResult } | { ok: false };

// Messages du background vers les content scripts
export type TabRequest =
  | { type: 'show_prompt'; prompt: PromptInfo }
  | { type: 'show_notice'; message: string }
  | { type: 'fill_now' }
  | { type: 'request_token' };
