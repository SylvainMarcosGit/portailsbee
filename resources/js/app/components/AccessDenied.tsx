import { ShieldAlert, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface AccessDeniedProps {
  onBack: () => void;
  applicationName?: string;
}

export default function AccessDenied({ onBack, applicationName = "cette application" }: AccessDeniedProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full bg-surface border border-border rounded-lg rail-accent px-6 py-12 sm:px-12">
        <div className="text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-sbee-red mb-6" strokeWidth={1.5} />

          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Erreur <span className="num">403</span> · Accès refusé
          </p>

          <h1 className="text-2xl font-semibold text-foreground mb-4">
            Cette page ne fait pas partie de vos accès
          </h1>

          <p className="text-foreground mb-2">
            Votre rôle ne donne pas accès à {applicationName}.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Si cet accès vous est nécessaire, l'administrateur du portail peut l'ajouter à votre rôle.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center">
            <Button onClick={onBack} size="lg">
              <ArrowLeft className="w-5 h-5" />
              Revenir au tableau de bord
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.location.href = 'mailto:info@sbee.bj'}
            >
              <Mail className="w-5 h-5" />
              Écrire à l'administrateur
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Pour demander un accès, écrivez à{' '}
              <a href="mailto:info@sbee.bj" className="text-foreground font-medium underline underline-offset-2 hover:text-sbee-red transition-colors duration-[120ms]">
                info@sbee.bj
              </a>
              {' '}en indiquant votre matricule et le nom de l'application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
