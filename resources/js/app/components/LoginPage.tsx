import { useState } from 'react';
import { Eye, EyeOff, Lock, User, Zap, Loader2 } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';


interface LoginPageProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await login(matricule, password);

    if (success) {
      onLoginSuccess();
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="mx-auto w-24 h-24 mb-6">
              <img
                src="/images/logo.png"
                alt="Logo SBEE"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
              Portail des applications SBEE
            </h2>
            <p className="mt-2 text-sm text-gray-600" style={{ fontFamily: 'var(--font-gothic)' }}>
              Connectez-vous à votre espace sécurisé
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              {/* Matricule Field */}
              <div>
                <Label htmlFor="matricule" className="text-sm font-medium text-gray-700">
                  Matricule
                </Label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="matricule"
                    name="matricule"
                    type="text"
                    autoComplete="username"
                    required
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full"
                    placeholder="Votre matricule"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mot de passe
                </Label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-12 py-2 w-full"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Se souvenir de moi
                </Label>
              </div>
              <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Mot de passe oublié ?
              </a>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#3b5998] hover:bg-[#2d4373] text-white py-3 rounded-lg transition-colors duration-200 font-medium disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>

            {/* Demo Credentials */}
            <div className="text-xs text-gray-500 text-center space-y-1 pt-2">
              <p><strong>Admin:</strong> ADMIN001 / Admin@2024</p>
              <p><strong>User:</strong> USER001 / User@2024</p>
            </div>

            {/* Security Notice */}
            <div className="flex items-center justify-center space-x-2 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00cc66]"></div>
                <p className="text-xs text-gray-600">
                  Connexion sécurisée
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Right Section - Background Image */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-[#3b5998] to-[#ed1f24]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1766081948832-fcbf6f4cbbd4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2FsJTIwcG93ZXIlMjBuZXR3b3JrJTIwaW5mcmFzdHJ1Y3R1cmV8ZW58MXx8fHwxNzY4OTIyMjE5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Infrastructure électrique SBEE"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <h1 className="text-4xl font-bold mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
            Société Béninoise d'Énergie Électrique
          </h1>
          <p className="text-xl mb-8 leading-relaxed" style={{ fontFamily: 'var(--font-gothic)' }}>
            Portail applicatif centralisé pour une gestion sécurisée et efficace de vos applications métier
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-[#00cc66] rounded-full"></div>
              <p className="text-lg">Accès sécurisé à tous vos services</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-[#f9a825] rounded-full"></div>
              <p className="text-lg">Gestion centralisée des applications</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <p className="text-lg">Protection des données institutionnelles</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}