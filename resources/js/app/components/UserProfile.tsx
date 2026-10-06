import { useState } from 'react';
import { ArrowLeft, Mail, Shield, Clock, Lock, Edit2, Check, X, Loader2, Phone, Briefcase, Building2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, profileApi } from '@/services/api';
import { toast } from 'sonner';
import RequiredMark from '@/app/components/RequiredMark';

// « Membre depuis » : date FR, '-' si absente ou invalide
const formatJoinDate = (value?: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

interface UserProfileProps {
  onBack: () => void;
}

export default function UserProfile({ onBack }: UserProfileProps) {
  const { user: authUser, updateUser } = useAuth();
  const [email, setEmail] = useState(authUser?.email || '');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Utiliser les données de l'utilisateur connecté
  const user = {
    name: authUser ? `${authUser.prenom} ${authUser.nom}` : 'Utilisateur',
    email: authUser?.email || '',
    initials: authUser ? `${authUser.prenom?.[0] || ''}${authUser.nom?.[0] || ''}` : 'U',
    role: authUser?.role?.name || 'Utilisateur',
    matricule: authUser?.matricule || '',
    joinDate: formatJoinDate(authUser?.created_at),
    telephone: authUser?.telephone || '',
    direction: authUser?.direction || '',
    titreDePoste: authUser?.titre_de_poste || '',
  };

  const trimmedEmail = email.trim();
  const isEmailUnchanged = trimmedEmail === (authUser?.email || '');

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedEmail || isEmailUnchanged) return;
    setIsSavingEmail(true);
    try {
      const response = await profileApi.update({ email: trimmedEmail });
      const updatedUser = response.data?.user;
      if (updatedUser) {
        updateUser(updatedUser);
        setEmail(updatedUser.email || trimmedEmail);
      } else if (authUser) {
        updateUser({ ...authUser, email: trimmedEmail });
      }
      toast.success(response.data?.message || 'Votre adresse e-mail a été modifiée.');
    } catch (error: any) {
      const data = error?.response?.data;
      const fieldError = data?.errors?.email?.[0];
      toast.error(fieldError || data?.message || "L'adresse e-mail n'a pas pu être modifiée.");
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Les deux nouveaux mots de passe ne sont pas identiques.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setIsSaving(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      toast.success('Votre mot de passe a été modifié.');
      setIsEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.message || "Le mot de passe n'a pas pu être modifié. Vérifiez votre mot de passe actuel puis réessayez.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Bandeau contexte */}
      <div className="bg-surface border border-border rounded-lg rail-accent px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="Revenir à la page précédente"
            className="text-muted-foreground -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Mon profil</h1>
            <p className="text-sm text-muted-foreground mt-1">Vos informations de compte et la sécurité de votre accès au portail</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : identité */}
        <div className="lg:col-span-1">
          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-surface-3 border border-border rounded-full flex items-center justify-center text-foreground text-3xl font-semibold mb-4">
                {user.initials}
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                {user.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {user.role}
              </p>
            </div>

            <ul className="space-y-3 mt-6 pt-6 border-t border-border text-sm">
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                <span className="text-foreground truncate">{user.email || <span className="text-muted-foreground">Aucune adresse e-mail</span>}</span>
              </li>
              <li className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                <span className="text-foreground"><span className="text-muted-foreground">Matricule </span><span className="num">{user.matricule}</span></span>
              </li>
              {user.titreDePoste ? (
                <li className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-foreground"><span className="text-muted-foreground">Poste </span>{user.titreDePoste}</span>
                </li>
              ) : null}
              {user.direction ? (
                <li className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-foreground"><span className="text-muted-foreground">Direction </span>{user.direction}</span>
                </li>
              ) : null}
              {user.telephone ? (
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-foreground"><span className="text-muted-foreground">Téléphone </span><span className="num">{user.telephone}</span></span>
                </li>
              ) : null}
              <li className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                <span className="text-foreground">
                  <span className="text-muted-foreground">{user.joinDate ? 'Membre depuis le ' : 'Membre depuis '}</span>
                  <span className="num">{user.joinDate ?? '-'}</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Colonne droite : e-mail et sécurité */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-lg">
            <div className="px-6 pt-6 pb-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Mail className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                Adresse e-mail
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Adresse utilisée pour vous contacter au sujet de votre compte
              </p>
            </div>
            <form onSubmit={handleEmailChange} className="px-6 pb-6 space-y-4 max-w-md">
              <div>
                <Label htmlFor="profile-email">E-mail<RequiredMark /></Label>
                <Input
                  id="profile-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={isSavingEmail || !trimmedEmail || isEmailUnchanged}
              >
                {isSavingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Enregistrer l'email
              </Button>
            </form>
          </div>

          <div className="bg-surface border border-border rounded-lg">
            <div className="px-6 pt-6 pb-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Lock className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                Sécurité
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Modifiez votre mot de passe d'accès au portail
              </p>
            </div>
            <div className="px-6 pb-6">
              {!isEditingPassword ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface-2 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Mot de passe</p>
                    <p className="text-sm text-muted-foreground" aria-hidden="true">••••••••••••</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingPassword(true)}
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifier le mot de passe
                  </Button>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <Label htmlFor="current-password">Mot de passe actuel<RequiredMark /></Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">Nouveau mot de passe<RequiredMark /></Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">8 caractères minimum.</p>
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe<RequiredMark /></Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Enregistrer le mot de passe
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditingPassword(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
