import { toast } from "sonner";

/** Traduit une erreur Supabase/JS en message lisible en français. */
export function messageErreur(erreur: unknown): string {
  if (!erreur) return "Une erreur inconnue est survenue.";
  const brut =
    typeof erreur === "string"
      ? erreur
      : erreur instanceof Error
        ? erreur.message
        : ((erreur as { message?: string }).message ?? "");

  if (!brut) return "Une erreur inconnue est survenue.";
  if (/row-level security|permission denied/i.test(brut))
    return "Accès refusé : votre compte n'a pas les droits nécessaires sur cette donnée.";
  if (/duplicate key|unique constraint/i.test(brut))
    return "Cet enregistrement existe déjà (valeur en double).";
  if (/foreign key/i.test(brut))
    return "Impossible : cet élément est encore utilisé ailleurs dans l'application.";
  if (/JWT|not authenticated|Auth session missing/i.test(brut))
    return "Session expirée. Reconnectez-vous pour continuer.";
  if (/Failed to fetch|NetworkError/i.test(brut))
    return "Connexion au serveur impossible. Vérifiez votre réseau.";
  return brut;
}

/** Affiche proprement une erreur à l'utilisateur et la trace en console. */
export function signalerErreur(contexte: string, erreur: unknown) {
  console.error(`[${contexte}]`, erreur);
  toast.error(contexte, { description: messageErreur(erreur) });
}
