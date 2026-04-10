import { AlertTriangle, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';

interface AccessDeniedProps {
  onBack: () => void;
  applicationName?: string;
}

export default function AccessDenied({ onBack, applicationName = "cette application" }: AccessDeniedProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <Card className="max-w-2xl w-full shadow-lg border-red-200">
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>

            {/* Error Code */}
            <div className="mb-4">
              <span className="inline-block px-4 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                Erreur 403 - Accès Refusé
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Vous n'êtes pas autorisé
            </h1>

            {/* Description */}
            <p className="text-lg text-gray-700 mb-2">
              Vous n'avez pas les permissions nécessaires pour accéder à {applicationName}.
            </p>
            <p className="text-sm text-gray-600 mb-8">
              Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre administrateur système.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={onBack}
                size="lg"
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 min-w-[200px]"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Retour au tableau de bord</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex items-center space-x-2 min-w-[200px]"
                onClick={() => window.location.href = 'mailto:support@sbee.bj'}
              >
                <Mail className="w-5 h-5" />
                <span>Contacter l'administrateur</span>
              </Button>
            </div>

            {/* Additional Information */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Pour demander un accès à cette application, veuillez envoyer un email à{' '}
                <a href="mailto:support@sbee.bj" className="text-blue-600 hover:underline">
                  support@sbee.bj
                </a>
                {' '}avec votre nom d'utilisateur et le nom de l'application.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
