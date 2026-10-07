import { useState } from 'react';
import { Eye, EyeOff, Lock, User, Loader2, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import RequiredMark from '@/app/components/RequiredMark';


interface LoginPageProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await login(matricule.trim(), password);

    if (result.success) {
      onLoginSuccess();
      return;
    }

    setErrorMessage(result.message || 'Connexion impossible.');
    setPassword('');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Formulaire de connexion */}
      <div className="flex-1 flex flex-col px-4 sm:px-8 lg:px-16">
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-sm">
            <img
              src="/images/logo.png"
              alt="Logo SBEE"
              className="h-24 w-auto object-contain mx-auto mb-8"
            />
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Espace agents
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-foreground leading-tight">
                Portail des applications
              </h1>
              <p className="mt-2 text-muted-foreground">
                Saisissez votre matricule pour accéder aux applications de votre service.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <Label htmlFor="matricule" className="text-sm font-medium text-foreground">
                  Matricule<RequiredMark />
                </Label>
                <div className="mt-2 relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" strokeWidth={1.5} />
                  <Input
                    id="matricule"
                    name="matricule"
                    type="text"
                    autoComplete="username"
                    required
                    value={matricule}
                    onChange={(e) => { setMatricule(e.target.value); setErrorMessage(null); }}
                    className="pl-10 pr-4 w-full"
                    placeholder="Votre matricule"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Mot de passe<RequiredMark />
                </Label>
                <div className="mt-2 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" strokeWidth={1.5} />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMessage(null); }}
                    className="pl-10 pr-12 w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" strokeWidth={1.5} />
                    ) : (
                      <Eye className="w-5 h-5" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="flex items-start gap-3 rounded-sm border border-sbee-red bg-sbee-red-soft px-4 py-3 text-sm text-foreground"
                >
                  <AlertCircle className="w-5 h-5 text-sbee-red flex-shrink-0" strokeWidth={2} />
                  <p className="font-medium">{errorMessage}</p>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connexion en cours…
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Mot de passe oublié ou compte bloqué ? Contactez l'administrateur du portail de votre direction.
              </p>
            </form>
          </div>
        </div>

        <footer className="py-6 w-full max-w-sm mx-auto flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-success" strokeWidth={1.5} />
          <span>Connexion chiffrée · Accès réservé au personnel de la SBEE</span>
        </footer>
      </div>

      {/* Panneau de marque */}
      <aside className="hidden lg:flex w-[44%] relative overflow-hidden bg-sbee-red text-white">
        {/* Photo du réseau sous un voile rouge SBEE léger ; le texte porte une ombre pour rester lisible */}
        <img
          src="/images/pylone-haute-tension.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-sbee-red/45" aria-hidden="true" />
        {/* Fondus sombres localisés : lisibilité du texte sans masquer le pylône au centre */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/45 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/80 via-black/45 to-transparent" aria-hidden="true" />
        {/*
          Trame de marque : déposer ici le fichier officiel de la trame SBEE
          (symbole du logo en motif, opacité 5-10 %). Ne pas redessiner le symbole.
          <img src="/images/trame-sbee.svg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-[0.08]" />
        */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full [text-shadow:0_1px_2px_rgb(0_0_0/0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
            Société Béninoise d'Énergie Électrique
          </p>

          <div className="max-w-lg">
            <span className="block h-[3px] w-12 bg-white mb-6" aria-hidden="true" />
            <h2 className="text-[2.75rem] xl:text-5xl font-semibold leading-[1.08] tracking-[-0.02em] [text-wrap:balance]">
              Toutes vos applications métier, une seule connexion.
            </h2>
            <ul className="mt-8 space-y-3 text-[1.0625rem] leading-snug text-white/95">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" strokeWidth={2.25} aria-hidden="true" />
                Un seul matricule pour l'ensemble des services
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" strokeWidth={2.25} aria-hidden="true" />
                Chaque connexion est journalisée
              </li>
            </ul>

            <p className="mt-12 inline-flex items-center bg-sbee-red px-4 py-2.5 text-sm font-semibold rounded-sm [text-shadow:none]">
              La SBEE, des femmes et des hommes à votre service 24h/24
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
