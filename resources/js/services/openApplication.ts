import { toast } from 'sonner';
import { applicationsApi } from '@/services/api';

/**
 * Ouvre une application du portail dans un nouvel onglet.
 * L'onglet est ouvert de façon synchrone (sinon le bloqueur de fenêtres l'empêche),
 * puis le serveur vérifie l'accès, journalise l'ouverture et renvoie l'adresse.
 */
export async function openApplication(applicationId: number): Promise<void> {
  const w = window.open('', '_blank');
  try {
    const res = await applicationsApi.accessApp(applicationId);
    if (w) {
      w.opener = null;
      w.location.href = res.data.url;
    }
  } catch (error: any) {
    w?.close();
    toast.error(error?.response?.data?.message || "Impossible d'ouvrir cette application.");
  }
}
