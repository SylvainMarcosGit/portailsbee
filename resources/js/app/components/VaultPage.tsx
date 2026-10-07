import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, KeyRound, LayoutGrid, Loader2, Pencil, Plus, Puzzle, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { toast } from 'sonner';
import { vaultApi, IDENTIFIER_TYPE_LABELS, type VaultApplication } from '@/services/api';
import { useExtensionStatus } from '@/services/extensionBridge';
import RequiredMark from '@/app/components/RequiredMark';

interface VaultPageProps {
  onBack: () => void;
  onInstallExtension: () => void;
}

const IDENTIFIER_MAX = 255;
const SECRET_MAX = 1000;

// Message serveur (422 : première erreur de validation, sinon message)
const getErrorMessage = (error: any, fallback: string): string => {
  const data = error?.response?.data;
  const errors = data?.errors;
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors)[0];
    if (Array.isArray(first) && first[0]) return String(first[0]);
  }
  return data?.message || fallback;
};

const formatDateTime = (value: string | null): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
};

export default function VaultPage({ onBack, onInstallExtension }: VaultPageProps) {
  const { status: extensionStatus } = useExtensionStatus();

  const [applications, setApplications] = useState<VaultApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  // Coffre non configuré côté serveur (503) : message du serveur
  const [vaultUnavailable, setVaultUnavailable] = useState('');

  const [editingApp, setEditingApp] = useState<VaultApplication | null>(null);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [appToDelete, setAppToDelete] = useState<VaultApplication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadVault();
  }, []);

  const loadVault = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await vaultApi.list();
      const data = response.data?.applications;
      setApplications(Array.isArray(data) ? data : []);
    } catch (error: any) {
      if (error?.response?.status === 503) {
        setVaultUnavailable(getErrorMessage(error, "Le coffre d'identifiants n'est pas encore configuré sur le serveur."));
      } else {
        setLoadError(getErrorMessage(error, 'Impossible de charger vos applications pour le moment. Réessayez dans quelques instants.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openForm = (app: VaultApplication) => {
    setEditingApp(app);
    setLoginIdentifier(app.login_identifier || '');
    setSecret('');
    setShowSecret(false);
    setFormError('');
  };

  const closeForm = () => {
    if (isSaving) return;
    setEditingApp(null);
    // Le mot de passe saisi ne reste pas en mémoire après fermeture
    setSecret('');
    setShowSecret(false);
    setFormError('');
  };

  const isFormValid = loginIdentifier.trim() !== '' && secret !== '';

  const handleSave = async () => {
    if (!editingApp || !isFormValid) return;
    setIsSaving(true);
    setFormError('');
    try {
      const response = await vaultApi.save(editingApp.application_id, {
        login_identifier: loginIdentifier.trim(),
        secret,
      });
      const credential = response.data.credential;
      setApplications((prev) =>
        prev.map((app) =>
          app.application_id === editingApp.application_id
            ? {
                ...app,
                has_credential: true,
                login_identifier: credential?.login_identifier ?? loginIdentifier.trim(),
                last_used_at: credential?.last_used_at ?? app.last_used_at,
              }
            : app
        )
      );
      toast.success(response.data.message || 'Identifiants enregistrés.');
      setEditingApp(null);
      setSecret('');
      setShowSecret(false);
    } catch (error: any) {
      const message = getErrorMessage(error, "Les identifiants n'ont pas pu être enregistrés. Réessayez dans quelques instants.");
      if (error?.response?.status === 503) setVaultUnavailable(message);
      setFormError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!appToDelete) return;
    setIsDeleting(true);
    try {
      const response = await vaultApi.remove(appToDelete.application_id);
      setApplications((prev) =>
        prev.map((app) =>
          app.application_id === appToDelete.application_id
            ? { ...app, has_credential: false, login_identifier: null, last_used_at: null }
            : app
        )
      );
      toast.success(response.data.message || 'Identifiants supprimés.');
      setAppToDelete(null);
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Les identifiants n'ont pas pu être supprimés. Réessayez dans quelques instants."));
    } finally {
      setIsDeleting(false);
    }
  };

  const identifierLabel = editingApp ? IDENTIFIER_TYPE_LABELS[editingApp.identifier_type] || 'Identifiant' : 'Identifiant';

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-sbee-red animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement de vos identifiants…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Bandeau */}
      <div className="bg-surface border border-border rounded-lg rail-accent px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="Retour"
            className="-ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Mes identifiants</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enregistrez une fois vos identifiants : l'extension SBEE remplira la connexion de chaque application.
            </p>
          </div>
        </div>
        {extensionStatus === 'detected' && (
          <Badge variant="success" className="sm:self-center">
            <Puzzle className="w-3.5 h-3.5" strokeWidth={1.5} />
            Extension SBEE active
          </Badge>
        )}
      </div>

      {/* Extension absente */}
      {extensionStatus === 'absent' && (
        <div className="bg-surface border border-border rounded-lg px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Puzzle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-foreground">L'extension SBEE n'est pas détectée sur ce navigateur</p>
              <p className="text-sm text-muted-foreground mt-1">
                Vos identifiants restent enregistrés, mais les pages de connexion ne seront pas préremplies tant qu'elle n'est pas installée.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onInstallExtension} className="sm:self-center">
            Installer l'extension
          </Button>
        </div>
      )}

      {/* Coffre non configuré (503) */}
      {vaultUnavailable && (
        <div role="alert" className="bg-warning-soft border border-border rounded-lg px-6 py-4 text-sm text-foreground">
          {vaultUnavailable}
        </div>
      )}

      {/* Corps */}
      {loadError ? (
        <div className="bg-surface border border-border rounded-lg px-6 py-12 flex flex-col items-center text-center">
          <KeyRound className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-base font-medium text-foreground mt-4">Vos identifiants ne sont pas disponibles</p>
          <p className="text-sm text-muted-foreground mt-1">{loadError}</p>
          <Button variant="outline" className="mt-6" onClick={loadVault}>
            Recharger la liste
          </Button>
        </div>
      ) : applications.length > 0 ? (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Application</th>
                  <th className="text-left px-4 py-3">Catégorie</th>
                  <th className="text-left px-4 py-3">Identifiant enregistré</th>
                  <th className="text-right px-4 py-3">Dernière utilisation</th>
                  <th className="text-left px-4 py-3">Connexion</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr
                    key={app.application_id}
                    className="h-12 border-t border-border hover:bg-surface-2 transition-colors duration-[120ms]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="w-10 h-10 rounded-sm bg-surface-3 border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                          {app.logo_url ? (
                            <img src={app.logo_url} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <LayoutGrid className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                          )}
                        </div>
                        <p className="font-medium text-foreground truncate">{app.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{app.category || '-'}</td>
                    <td className="px-4 py-3 text-foreground whitespace-nowrap">
                      {app.has_credential && app.login_identifier ? app.login_identifier : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-3 text-right num text-muted-foreground whitespace-nowrap">
                      {formatDateTime(app.last_used_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {app.sso_mode !== 'none' ? (
                        <Badge variant="success">Remplissage automatique</Badge>
                      ) : (
                        <Badge variant="muted">Non configurée</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openForm(app)}
                          aria-label={`${app.has_credential ? 'Modifier' : 'Enregistrer'} les identifiants de ${app.name}`}
                        >
                          {app.has_credential ? (
                            <Pencil className="w-4 h-4" strokeWidth={1.5} />
                          ) : (
                            <Plus className="w-4 h-4" strokeWidth={1.5} />
                          )}
                          {app.has_credential ? 'Modifier' : 'Enregistrer'}
                        </Button>
                        {app.has_credential && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setAppToDelete(app)}
                            aria-label={`Supprimer les identifiants de ${app.name}`}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg px-6 py-12 flex flex-col items-center text-center">
          <KeyRound className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-base font-medium text-foreground mt-4">Aucune application ne vous est attribuée</p>
          <p className="text-sm text-muted-foreground mt-1">
            Les applications de votre rôle apparaîtront ici dès qu'elles vous seront ouvertes.
          </p>
          <Button variant="outline" className="mt-6" onClick={onBack}>
            Revenir à l'accueil
          </Button>
        </div>
      )}

      {/* Modale enregistrement / modification */}
      <Dialog open={!!editingApp} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingApp?.has_credential ? 'Modifier les identifiants' : 'Enregistrer les identifiants'}</DialogTitle>
            <DialogDescription>Connexion à {editingApp?.name}</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 py-4"
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="vault-identifier">{identifierLabel}<RequiredMark /></Label>
              <Input
                id="vault-identifier"
                value={loginIdentifier}
                maxLength={IDENTIFIER_MAX}
                required
                autoComplete="off"
                autoFocus
                onChange={(e) => {
                  setLoginIdentifier(e.target.value);
                  setFormError('');
                }}
                aria-invalid={formError ? true : undefined}
                aria-describedby={formError ? 'vault-form-error' : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vault-secret">Mot de passe<RequiredMark /></Label>
              <div className="relative">
                <Input
                  id="vault-secret"
                  type={showSecret ? 'text' : 'password'}
                  value={secret}
                  maxLength={SECRET_MAX}
                  required
                  autoComplete="new-password"
                  onChange={(e) => {
                    setSecret(e.target.value);
                    setFormError('');
                  }}
                  className="h-10 pr-10"
                  aria-describedby="vault-secret-hint"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  aria-label={showSecret ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground transition-colors duration-[120ms] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                </button>
              </div>
              <p id="vault-secret-hint" className="text-xs text-muted-foreground">
                Le mot de passe est chiffré et n'est jamais réaffiché.
              </p>
            </div>
            {formError && (
              <p
                id="vault-form-error"
                role="alert"
                className="text-sm text-foreground bg-warning-soft border border-border rounded-sm px-3 py-2"
              >
                {formError}
              </p>
            )}
            {/* Soumission par Entrée */}
            <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm} disabled={isSaving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !isFormValid}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Enregistrer les identifiants
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation de suppression */}
      <AlertDialog open={!!appToDelete} onOpenChange={(open) => { if (!open && !isDeleting) setAppToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer les identifiants de {appToDelete?.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'extension ne remplira plus la connexion de cette application. Vous pourrez les enregistrer de nouveau à tout moment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Supprimer les identifiants
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
