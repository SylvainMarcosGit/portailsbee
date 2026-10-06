import { useState } from 'react';
import { Eye, EyeOff, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, MOT_DE_PASSE_INITIAL } from '@/services/api';
import { toast } from 'sonner';
import RequiredMark from '@/app/components/RequiredMark';

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

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  hint?: string;
  autoFocus?: boolean;
}

function PasswordField({ id, label, value, onChange, autoComplete, hint, autoFocus }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}<RequiredMark /></Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoFocus={autoFocus}
          className="h-10 pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground transition-colors duration-[120ms] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {visible ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
        </button>
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function PasswordChangeRequired() {
  const { user, logout, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (newPassword.length < 8) return 'Le nouveau mot de passe doit contenir au moins 8 caractères.';
    if (newPassword === currentPassword) return 'Le nouveau mot de passe doit être différent du mot de passe actuel.';
    if (newPassword === MOT_DE_PASSE_INITIAL) return 'Le nouveau mot de passe doit être différent du mot de passe initial.';
    if (newPassword !== confirmPassword) return 'Les deux nouveaux mots de passe ne sont pas identiques.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      const fresh = await refreshUser();
      if (fresh?.needs_password_change) {
        setError("Le mot de passe a été enregistré mais le compte est toujours marqué comme initial. Reconnectez-vous puis réessayez.");
        return;
      }
      toast.success('Votre mot de passe a été défini. Bienvenue sur le portail.');
    } catch (err: any) {
      setError(getErrorMessage(err, "Le mot de passe n'a pas pu être modifié. Vérifiez votre mot de passe actuel puis réessayez."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-2 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-surface border border-border rounded-lg rail-accent p-6 sm:p-8">
        <img src="/images/logo.png" alt="Logo SBEE" className="h-16 w-auto object-contain mx-auto mb-6" />
        <div className="text-center">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground sm:whitespace-nowrap">Changement de mot de passe requis</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Vous utilisez le mot de passe initial. Choisissez un mot de passe personnel pour accéder au portail.
          </p>
          {user ? (
            <p className="text-xs text-muted-foreground mt-2">
              {user.prenom} {user.nom} - matricule <span className="num">{user.matricule}</span>
            </p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6" noValidate>
          <PasswordField
            id="pcr-current"
            label="Mot de passe actuel"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            autoFocus
          />
          <PasswordField
            id="pcr-new"
            label="Nouveau mot de passe"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            hint="8 caractères minimum, différent du mot de passe actuel et du mot de passe initial."
          />
          <PasswordField
            id="pcr-confirm"
            label="Confirmer le nouveau mot de passe"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />

          {error ? (
            <div role="alert" className="bg-sbee-red-soft border border-border rounded-sm px-3 py-2 text-sm text-foreground">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Définir mon mot de passe
          </Button>
        </form>

        <div className="mt-4 flex justify-center">
          <Button type="button" variant="ghost" onClick={() => logout()} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
}
