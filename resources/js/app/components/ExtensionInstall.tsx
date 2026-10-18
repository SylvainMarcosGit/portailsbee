import { useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, CheckCircle, Copy, Download, ExternalLink, Info, Puzzle, ShieldCheck } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';
import { useExtensionStatus } from '@/services/extensionBridge';

interface ExtensionInstallProps {
  onBack: () => void;
  onOpenVault?: () => void;
}

type BrowserId = 'edge' | 'chrome' | 'opera' | 'firefox' | 'other';

interface UserAgentDataLike {
  brands?: Array<{ brand: string; version: string }>;
  mobile?: boolean;
}

const BROWSER_NAMES: Record<BrowserId, string> = {
  edge: 'Microsoft Edge',
  chrome: 'Google Chrome',
  opera: 'Opera',
  firefox: 'Mozilla Firefox',
  other: 'Navigateur non pris en charge',
};

const EXTENSIONS_URL: Record<'edge' | 'chrome' | 'opera', string> = {
  edge: 'edge://extensions',
  chrome: 'chrome://extensions',
  opera: 'opera://extensions',
};

/**
 * Liens des fiches publiées dans les boutiques (null tant que l'extension n'y est pas publiée).
 * À renseigner par la DSI après publication (voir extension/store/PUBLICATION.md) : si un lien existe
 * pour le navigateur choisi, la page propose « Installer depuis la boutique » au lieu des étapes manuelles.
 */
const STORE_LINKS: Record<'edge' | 'firefox' | 'opera' | 'chrome', string | null> = {
  edge: null,
  firefox: null,
  opera: null,
  chrome: null,
};

const STORE_NAMES: Record<keyof typeof STORE_LINKS, string> = {
  edge: 'Microsoft Edge Add-ons',
  firefox: 'Modules complémentaires Firefox',
  opera: 'Opera Add-ons',
  chrome: 'Chrome Web Store',
};

const PRIVACY_URL = '/extension/confidentialite';

const CHROMIUM_PACKAGE = '/extension/sbee-extension-chromium.zip';
const FIREFOX_PACKAGE = '/extension/sbee-extension-firefox.zip';

function detectBrowser(): BrowserId {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  const uaData = (navigator as Navigator & { userAgentData?: UserAgentDataLike }).userAgentData;

  // Les extensions ne s'installent pas sur mobile
  if (uaData?.mobile || /Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return 'other';

  const brands = (uaData?.brands || []).map((b) => b.brand.toLowerCase());
  if (brands.some((b) => b.includes('edge'))) return 'edge';
  if (brands.some((b) => b.includes('opera'))) return 'opera';
  if (brands.some((b) => b === 'google chrome')) return 'chrome';

  if (/Edg\//.test(ua)) return 'edge';
  if (/OPR\/|Opera/.test(ua)) return 'opera';
  if (/Firefox\//.test(ua)) return 'firefox';
  // Navigateurs Chromium annoncés autrement (Brave, Vivaldi, Chromium…) : non pris en charge
  if (brands.length > 0) return 'other';
  if (/Chrome\//.test(ua) && !/Chromium|SamsungBrowser|YaBrowser|Vivaldi/.test(ua)) return 'chrome';
  return 'other';
}

function CopyableAddress({ value }: { value: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Adresse copiée');
    } catch {
      toast.error("La copie n'est pas disponible : saisissez l'adresse à la main.");
    }
  };
  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <code className="num text-sm text-foreground bg-surface-2 border border-border rounded-sm px-2 py-1">{value}</code>
      <Button variant="ghost" size="sm" onClick={copy} aria-label={`Copier l'adresse ${value}`}>
        <Copy className="w-4 h-4" strokeWidth={1.5} />
        Copier l'adresse
      </Button>
    </span>
  );
}

function Steps({ steps }: { steps: ReactNode[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => (
        <li key={index} className="flex items-start gap-4">
          <span className="w-8 h-8 flex-shrink-0 rounded-full bg-surface-3 border border-border text-foreground text-sm font-semibold num flex items-center justify-center">
            {index + 1}
          </span>
          <div className="text-sm text-foreground pt-1.5 min-w-0">{step}</div>
        </li>
      ))}
    </ol>
  );
}

export default function ExtensionInstall({ onBack, onOpenVault }: ExtensionInstallProps) {
  const { status } = useExtensionStatus();
  const detectedBrowser = useMemo(detectBrowser, []);
  const [browser, setBrowser] = useState<BrowserId>(detectedBrowser);

  const isChromium = browser === 'edge' || browser === 'chrome' || browser === 'opera';
  const packageUrl = browser === 'firefox' ? FIREFOX_PACKAGE : CHROMIUM_PACKAGE;
  const packageName = packageUrl.split('/').pop() || '';
  const storeLink = browser === 'other' ? null : STORE_LINKS[browser];

  const chromiumSteps: ReactNode[] = isChromium
    ? [
        <>Téléchargez le fichier <span className="font-medium">{packageName}</span> avec le bouton ci-dessus.</>,
        <>
          Décompressez-le dans un dossier que vous conservez (par exemple Documents\Extension SBEE).
          <span className="block text-muted-foreground mt-1">Ne supprimez pas ce dossier : le navigateur le lit à chaque démarrage.</span>
        </>,
        <>
          Ouvrez un nouvel onglet et saisissez l'adresse suivante :
          <span className="block mt-2"><CopyableAddress value={EXTENSIONS_URL[browser as 'edge' | 'chrome' | 'opera']} /></span>
        </>,
        <>
          Activez le <span className="font-medium">mode développeur</span>
          {browser === 'edge' ? ' (interrupteur dans le volet de gauche).' : ' (interrupteur en haut à droite).'}
        </>,
        <>
          Cliquez sur <span className="font-medium">« Charger l'extension non empaquetée »</span> et sélectionnez le dossier décompressé.
        </>,
        <>Revenez sur cette page et actualisez-la : la confirmation d'installation s'affiche.</>,
      ]
    : [];

  const firefoxSteps: ReactNode[] = [
    <>Téléchargez le fichier <span className="font-medium">{packageName}</span> avec le bouton ci-dessus, sans le décompresser.</>,
    <>
      Ouvrez un nouvel onglet et saisissez l'adresse suivante :
      <span className="block mt-2"><CopyableAddress value="about:debugging" /></span>
    </>,
    <>Dans le menu de gauche, cliquez sur <span className="font-medium">« Ce Firefox »</span>.</>,
    <>
      Cliquez sur <span className="font-medium">« Charger un module complémentaire temporaire »</span> et sélectionnez le fichier téléchargé.
    </>,
    <>Revenez sur cette page et actualisez-la : la confirmation d'installation s'affiche.</>,
  ];

  const choices: BrowserId[] = ['edge', 'chrome', 'opera', 'firefox'];

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
            <h1 className="text-2xl font-semibold text-foreground">Installer l'extension SBEE</h1>
            <p className="text-sm text-muted-foreground mt-1">
              L'extension remplit pour vous la page de connexion des applications SBEE avec vos identifiants enregistrés.
            </p>
          </div>
        </div>
      </div>

      {/* Extension déjà active */}
      {status === 'detected' && (
        <div role="status" className="bg-success-soft border border-border rounded-lg px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="flex items-center gap-3 text-sm font-medium text-success">
            <CheckCircle className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
            L'extension SBEE est installée et active.
          </p>
          {onOpenVault && (
            <Button variant="outline" onClick={onOpenVault} className="sm:self-center">
              Gérer mes identifiants
            </Button>
          )}
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        {/* Choix du navigateur */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Navigateur détecté</p>
            <p className="text-lg font-semibold text-foreground mt-1">{BROWSER_NAMES[detectedBrowser]}</p>
          </div>
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Afficher les instructions pour un autre navigateur">
            {choices.map((id) => {
              const isActive = browser === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBrowser(id)}
                  aria-pressed={isActive}
                  className={`h-9 px-3 rounded-sm border text-sm font-medium transition-colors duration-[120ms] ${
                    isActive
                      ? 'bg-foreground text-white border-foreground'
                      : 'bg-surface border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {BROWSER_NAMES[id].replace('Microsoft ', '').replace('Google ', '').replace('Mozilla ', '')}
                </button>
              );
            })}
          </div>
        </div>

        {browser === 'other' ? (
          <div className="bg-surface-2 border border-border rounded-lg px-5 py-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <div className="text-sm">
              <p className="font-medium text-foreground">Ce navigateur ne permet pas d'installer l'extension SBEE.</p>
              <p className="text-muted-foreground mt-1">
                Ouvrez le portail sur un ordinateur avec Microsoft Edge, Google Chrome, Opera ou Mozilla Firefox, ou choisissez votre navigateur ci-dessus.
              </p>
            </div>
          </div>
        ) : (
          <>
            {storeLink ? (
              <div className="border-t border-border pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Puzzle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-foreground">Disponible sur {STORE_NAMES[browser as keyof typeof STORE_LINKS]}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cliquez sur « Ajouter » dans la boutique, puis revenez sur cette page et actualisez-la.
                    </p>
                  </div>
                </div>
                <Button asChild size="lg" className="sm:self-center">
                  <a href={storeLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                    Installer depuis la boutique
                  </a>
                </Button>
              </div>
            ) : (
              <>
                <div className="border-t border-border pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Puzzle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <p className="text-sm font-medium text-foreground">Paquet pour {BROWSER_NAMES[browser]}</p>
                      <p className="text-xs text-muted-foreground mt-1 num">{packageName}</p>
                    </div>
                  </div>
                  <Button asChild size="lg" className="sm:self-center">
                    <a href={packageUrl} download>
                      <Download className="w-4 h-4" />
                      Télécharger l'extension
                    </a>
                  </Button>
                </div>

                <div className="border-t border-border pt-6 space-y-4">
                  <h2 className="text-base font-semibold text-foreground">Étapes d'installation</h2>
                  <Steps steps={browser === 'firefox' ? firefoxSteps : chromiumSteps} />
                </div>

                <p className="text-xs text-muted-foreground border-t border-border pt-4">
                  {browser === 'firefox'
                    ? "Le module temporaire est retiré à la fermeture de Firefox : refaites ces étapes au prochain démarrage, en attendant le paquet signé."
                    : "Installation provisoire en mode développeur, en attendant le déploiement automatique de l'extension par la DSI."}
                </p>
              </>
            )}
          </>
        )}

        <p className="text-xs text-muted-foreground border-t border-border pt-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
          <span>
            Données traitées, permissions et droits :{' '}
            <a href={PRIVACY_URL} target="_blank" rel="noopener" className="underline underline-offset-2 text-foreground hover:text-muted-foreground">
              politique de confidentialité de l'extension
            </a>
          </span>
        </p>
      </div>
    </div>
  );
}
