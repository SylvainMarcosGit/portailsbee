/**
 * Marque d'un champ obligatoire : astérisque rouge SBEE après le libellé.
 * Règle du portail : seuls les champs requis sont signalés ; les champs facultatifs ne portent aucune mention.
 * Le champ associé doit aussi porter required / aria-required pour les lecteurs d'écran.
 */
export default function RequiredMark() {
  return (
    <span className="text-sbee-red ml-0.5" aria-hidden="true">
      *
    </span>
  );
}
