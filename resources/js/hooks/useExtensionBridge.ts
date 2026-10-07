import { useCallback, useEffect, useRef } from 'react';
import { vaultApi } from '@/services/api';
import {
  getExtensionInstanceId,
  notifyExtensionLogout,
  onExtensionMessage,
  pingExtension,
  sendExtensionToken,
  useExtensionStatus,
} from '@/services/extensionBridge';

// Renouvellement du jeton avant son expiration
const RENEW_BEFORE_MS = 5 * 60 * 1000;
// Délai minimal avant renouvellement (jeton très court ou horloge décalée)
const MIN_RENEW_DELAY_MS = 30 * 1000;
// Une demande de l'extension juste après un envoi est ignorée (les deux se croisent au chargement)
const REQUEST_DEBOUNCE_MS = 5 * 1000;

/**
 * Pont avec l'extension SBEE : détecte l'extension et lui transmet un jeton dédié au coffre
 * quand l'utilisateur est connecté et a changé son mot de passe initial.
 * Le jeton n'est ni stocké ni journalisé : il est remis à l'extension puis oublié.
 */
export function useExtensionBridge(eligible: boolean): void {
  const { status } = useExtensionStatus();
  const detected = status === 'detected';

  const eligibleRef = useRef(eligible);
  const inFlightRef = useRef(false);
  const sentAtRef = useRef(0);
  const renewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasEligibleRef = useRef(false);

  eligibleRef.current = eligible;

  const clearRenewTimer = () => {
    if (renewTimerRef.current) {
      clearTimeout(renewTimerRef.current);
      renewTimerRef.current = null;
    }
  };

  const deliverToken = useCallback(async () => {
    if (!eligibleRef.current || inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const { data } = await vaultApi.extensionToken(getExtensionInstanceId());
      // Déconnexion pendant la requête : ne rien transmettre
      if (!eligibleRef.current) return;
      sendExtensionToken(data.token, data.expires_at, data.api_base);
      sentAtRef.current = Date.now();

      clearRenewTimer();
      const expiresAt = Date.parse(data.expires_at);
      if (!Number.isNaN(expiresAt)) {
        const delay = Math.max(expiresAt - Date.now() - RENEW_BEFORE_MS, MIN_RENEW_DELAY_MS);
        renewTimerRef.current = setTimeout(() => {
          renewTimerRef.current = null;
          void deliverToken();
        }, delay);
      }
    } catch {
      // Échec silencieux : l'extension redemandera un jeton (SBEE_TOKEN_REQUEST)
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  // Annonce au chargement : l'extension répond par READY
  useEffect(() => {
    pingExtension();
  }, []);

  // Demande explicite de l'extension (navigateur redémarré, jeton expiré)
  useEffect(() => {
    return onExtensionMessage((msg) => {
      if (msg.type !== 'SBEE_TOKEN_REQUEST') return;
      if (Date.now() - sentAtRef.current < REQUEST_DEBOUNCE_MS) return;
      void deliverToken();
    });
  }, [deliverToken]);

  // Premier envoi dès que l'utilisateur est éligible et l'extension détectée
  useEffect(() => {
    if (eligible && detected && sentAtRef.current === 0) {
      void deliverToken();
    }
  }, [eligible, detected, deliverToken]);

  // Fin d'éligibilité (déconnexion, mot de passe à changer) : oublier l'état et prévenir l'extension
  useEffect(() => {
    if (eligible) {
      wasEligibleRef.current = true;
      return;
    }
    clearRenewTimer();
    sentAtRef.current = 0;
    if (wasEligibleRef.current) {
      wasEligibleRef.current = false;
      notifyExtensionLogout();
    }
  }, [eligible]);

  useEffect(() => clearRenewTimer, []);
}
