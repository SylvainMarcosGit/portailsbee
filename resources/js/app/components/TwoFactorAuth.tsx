import { useState } from 'react';
import { ArrowLeft, Shield, Smartphone, Check, AlertTriangle, QrCode } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';

interface TwoFactorAuthProps {
  onBack: () => void;
}

export default function TwoFactorAuth({ onBack }: TwoFactorAuthProps) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);

  const handleToggle2FA = (enabled: boolean) => {
    if (enabled) {
      setShowQRCode(true);
    } else {
      if (confirm('Êtes-vous sûr de vouloir désactiver la 2FA ? Cela réduira la sécurité de votre compte.')) {
        setIs2FAEnabled(false);
        setShowQRCode(false);
      }
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate verification
    if (verificationCode.length === 6) {
      setIs2FAEnabled(true);
      setShowQRCode(false);
      alert('Double authentification activée avec succès !');
      setVerificationCode('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </Button>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Authentification à Double Facteur</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Information Card */}
          <Card className="shadow-sm border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Pourquoi activer la 2FA ?
                  </h3>
                  <p className="text-sm text-blue-800">
                    La double authentification ajoute une couche de sécurité supplémentaire à votre compte. 
                    Même si quelqu'un obtient votre mot de passe, il ne pourra pas accéder à votre compte 
                    sans le code de vérification généré par votre appareil.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2FA Toggle Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>État de la 2FA</CardTitle>
              <CardDescription>
                Activez ou désactivez l'authentification à double facteur pour votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    is2FAEnabled ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {is2FAEnabled ? (
                      <Check className="w-6 h-6 text-green-600" />
                    ) : (
                      <Shield className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {is2FAEnabled ? 'Activée' : 'Désactivée'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {is2FAEnabled 
                        ? 'Votre compte est protégé par la 2FA' 
                        : 'Activez la 2FA pour plus de sécurité'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={is2FAEnabled}
                  onCheckedChange={handleToggle2FA}
                />
              </div>
            </CardContent>
          </Card>

          {/* Setup 2FA with QR Code */}
          {showQRCode && !is2FAEnabled && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Configuration de la 2FA</CardTitle>
                <CardDescription>
                  Suivez les étapes ci-dessous pour configurer votre authentification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Download App */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <h3 className="font-semibold text-gray-900">Téléchargez une application d'authentification</h3>
                  </div>
                  <p className="text-sm text-gray-600 ml-10">
                    Installez Google Authenticator, Microsoft Authenticator ou Authy sur votre smartphone
                  </p>
                </div>

                {/* Step 2: Scan QR Code */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <h3 className="font-semibold text-gray-900">Scannez le code QR</h3>
                  </div>
                  <div className="ml-10">
                    <div className="inline-block p-6 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
                      <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                        <QrCode className="w-24 h-24 text-gray-400" />
                      </div>
                      <p className="text-xs text-center text-gray-500 mt-3 font-mono">
                        Code de secours: ABCD-EFGH-IJKL-MNOP
                      </p>
                    </div>
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">
                        Conservez le code de secours dans un endroit sûr. Il vous permettra de récupérer 
                        l'accès à votre compte si vous perdez votre appareil.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 3: Enter Code */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <h3 className="font-semibold text-gray-900">Entrez le code de vérification</h3>
                  </div>
                  <form onSubmit={handleVerifyCode} className="ml-10 space-y-4">
                    <div className="max-w-xs">
                      <Label htmlFor="verification-code">Code de vérification (6 chiffres)</Label>
                      <Input
                        id="verification-code"
                        type="text"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="mt-1 text-center text-lg tracking-widest font-mono"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Vérifier et Activer</span>
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SMS Option */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5" />
                <span>Authentification par SMS (Option alternative)</span>
              </CardTitle>
              <CardDescription>
                Recevez les codes de vérification par SMS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+229 XX XX XX XX"
                    className="mt-1"
                  />
                </div>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Configurer SMS 2FA</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
