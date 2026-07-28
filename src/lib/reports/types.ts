/**
 * Modèle de données du module « Rapports, Business Intelligence & Analyses ».
 * Aucune donnée n'est stockée ici : tout est dérivé des modules existants.
 * Structure pensée pour être branchée telle quelle sur Lovable Cloud (Supabase).
 */

export type ClePeriode =
  | "aujourdhui"
  | "hier"
  | "semaine"
  | "mois"
  | "trimestre"
  | "annee"
  | "personnalisee";

export const PERIODES: { value: ClePeriode; label: string }[] = [
  { value: "aujourdhui", label: "Aujourd'hui" },
  { value: "hier", label: "Hier" },
  { value: "semaine", label: "Cette semaine" },
  { value: "mois", label: "Ce mois" },
  { value: "trimestre", label: "Ce trimestre" },
  { value: "annee", label: "Cette année" },
  { value: "personnalisee", label: "Période personnalisée" },
];

export type Periode = {
  cle: ClePeriode;
  label: string;
  debut: Date;
  fin: Date;
};

const debutJour = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const finJour = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

export const jourISO = (d: Date) => d.toISOString().slice(0, 10);

export function construirePeriode(
  cle: ClePeriode,
  personnalisee?: { debut: string; fin: string },
): Periode {
  const maintenant = new Date();
  const label = PERIODES.find((p) => p.value === cle)?.label ?? "Période";

  switch (cle) {
    case "aujourdhui":
      return { cle, label, debut: debutJour(maintenant), fin: finJour(maintenant) };
    case "hier": {
      const hier = new Date(maintenant);
      hier.setDate(hier.getDate() - 1);
      return { cle, label, debut: debutJour(hier), fin: finJour(hier) };
    }
    case "semaine": {
      const jour = (maintenant.getDay() + 6) % 7; // lundi = 0
      const lundi = new Date(maintenant);
      lundi.setDate(lundi.getDate() - jour);
      return { cle, label, debut: debutJour(lundi), fin: finJour(maintenant) };
    }
    case "trimestre": {
      const debutTrimestre = new Date(
        maintenant.getFullYear(),
        Math.floor(maintenant.getMonth() / 3) * 3,
        1,
      );
      return { cle, label, debut: debutJour(debutTrimestre), fin: finJour(maintenant) };
    }
    case "annee":
      return {
        cle,
        label,
        debut: debutJour(new Date(maintenant.getFullYear(), 0, 1)),
        fin: finJour(maintenant),
      };
    case "personnalisee": {
      const debut = personnalisee?.debut ? new Date(personnalisee.debut) : maintenant;
      const fin = personnalisee?.fin ? new Date(personnalisee.fin) : maintenant;
      return {
        cle,
        label: `Du ${debut.toLocaleDateString("fr-FR")} au ${fin.toLocaleDateString("fr-FR")}`,
        debut: debutJour(debut),
        fin: finJour(fin),
      };
    }
    case "mois":
    default:
      return {
        cle: "mois",
        label: "Ce mois",
        debut: debutJour(new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)),
        fin: finJour(maintenant),
      };
  }
}

/** Période immédiatement précédente, de même durée (utilisée pour les comparaisons). */
export function periodePrecedente(periode: Periode): Periode {
  const duree = periode.fin.getTime() - periode.debut.getTime();
  const fin = new Date(periode.debut.getTime() - 1);
  const debut = new Date(fin.getTime() - duree);
  return { cle: "personnalisee", label: "Période précédente", debut, fin };
}

export function moisPeriode(annee: number, mois: number): Periode {
  const debut = new Date(annee, mois, 1);
  const fin = new Date(annee, mois + 1, 0, 23, 59, 59, 999);
  return {
    cle: "personnalisee",
    label: debut.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    debut,
    fin,
  };
}

export function anneePeriode(annee: number): Periode {
  return {
    cle: "personnalisee",
    label: String(annee),
    debut: new Date(annee, 0, 1),
    fin: new Date(annee, 11, 31, 23, 59, 59, 999),
  };
}

export const dansPeriode = (iso: string, periode: Periode) => {
  const t = new Date(iso).getTime();
  return t >= periode.debut.getTime() && t <= periode.fin.getTime();
};

export const formatPeriode = (periode: Periode) =>
  `${periode.debut.toLocaleDateString("fr-FR")} → ${periode.fin.toLocaleDateString("fr-FR")}`;

export const variation = (actuel: number, precedent: number) =>
  precedent === 0 ? (actuel > 0 ? 100 : 0) : Math.round(((actuel - precedent) / precedent) * 100);

/* ------------------------------------------------------------------ */
/* Rapports automatiques planifiés                                      */
/* ------------------------------------------------------------------ */

export type FrequenceRapport = "quotidien" | "hebdomadaire" | "mensuel";

export const FREQUENCES_RAPPORT: { value: FrequenceRapport; label: string }[] = [
  { value: "quotidien", label: "Chaque jour" },
  { value: "hebdomadaire", label: "Chaque semaine" },
  { value: "mensuel", label: "Chaque mois" },
];

export type PlanificationRapport = {
  id: string;
  nom: string;
  frequence: FrequenceRapport;
  heure: string; // HH:mm
  destinataires: string[];
  format: "pdf" | "excel" | "csv";
  actif: boolean;
  dateCreation: string;
};
