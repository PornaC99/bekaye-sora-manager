import type { EntreeAudit, EtapeConfiguration, Sauvegarde, Utilisateur } from "./types";

/** Indicateur du Centre de Santé du Système. */
export type IndicateurSante = {
  cle: string;
  label: string;
  valeur: string;
  detail: string;
  niveau: "bon" | "moyen" | "critique";
  progression: number; // 0 → 100
};

export const VERSION_LOGICIEL = "1.0.0";
export const EDITEUR = "NEXUSIA";
export const DATE_MISE_A_JOUR = "28 juillet 2026";

export function santeSysteme({
  utilisateurs,
  sauvegardes,
  audit,
}: {
  utilisateurs: Utilisateur[];
  sauvegardes: Sauvegarde[];
  audit: EntreeAudit[];
}): IndicateurSante[] {
  const connectes = utilisateurs.filter(
    (u) =>
      u.statut === "actif" &&
      u.derniereConnexion &&
      Date.now() - new Date(u.derniereConnexion).getTime() < 12 * 3_600_000,
  ).length;

  const derniere = sauvegardes.find((s) => s.statut === "reussie");
  const heuresDepuisSauvegarde = derniere
    ? Math.round((Date.now() - new Date(derniere.date).getTime()) / 3_600_000)
    : 999;

  const incidents = audit.filter(
    (a) => a.action === "connexion_echouee" || a.action === "acces_refuse",
  ).length;

  const scoreSecurite = Math.max(0, 100 - incidents * 8);

  return [
    {
      cle: "serveur",
      label: "Disponibilité du serveur",
      valeur: "99,98 %",
      detail: "Aucun incident sur les 30 derniers jours",
      niveau: "bon",
      progression: 99.98,
    },
    {
      cle: "base",
      label: "État de la base de données",
      valeur: "Opérationnelle",
      detail: "Connexion stable · latence 24 ms",
      niveau: "bon",
      progression: 96,
    },
    {
      cle: "utilisateurs",
      label: "Utilisateurs connectés",
      valeur: `${connectes}`,
      detail: `${utilisateurs.filter((u) => u.statut === "actif").length} comptes actifs au total`,
      niveau: "bon",
      progression: Math.min(100, connectes * 20),
    },
    {
      cle: "reponse",
      label: "Temps de réponse moyen",
      valeur: "182 ms",
      detail: "Objectif interne : moins de 400 ms",
      niveau: "bon",
      progression: 82,
    },
    {
      cle: "sauvegarde",
      label: "Dernière sauvegarde",
      valeur: heuresDepuisSauvegarde < 48 ? `il y a ${heuresDepuisSauvegarde} h` : "à planifier",
      detail: derniere ? `${derniere.id} · ${derniere.taille}` : "Aucune sauvegarde réussie",
      niveau: heuresDepuisSauvegarde <= 24 ? "bon" : heuresDepuisSauvegarde <= 72 ? "moyen" : "critique",
      progression: Math.max(0, 100 - heuresDepuisSauvegarde * 2),
    },
    {
      cle: "memoire",
      label: "Consommation mémoire",
      valeur: "38 %",
      detail: "1,5 Go utilisés sur 4 Go",
      niveau: "bon",
      progression: 38,
    },
    {
      cle: "stockage",
      label: "Consommation stockage",
      valeur: "64 %",
      detail: "6,4 Go utilisés sur 10 Go",
      niveau: "moyen",
      progression: 64,
    },
    {
      cle: "securite",
      label: "Sécurité globale",
      valeur: `${scoreSecurite} / 100`,
      detail: `${incidents} incident(s) détecté(s) dans le journal d'audit`,
      niveau: scoreSecurite >= 80 ? "bon" : scoreSecurite >= 60 ? "moyen" : "critique",
      progression: scoreSecurite,
    },
  ];
}

export const ETAPES_CONFIGURATION: Omit<EtapeConfiguration, "faite">[] = [
  {
    cle: "logo",
    titre: "Ajouter le logo",
    description: "Personnalisez vos factures et l'interface avec votre identité visuelle.",
    lien: "/administration/personnalisation",
  },
  {
    cle: "produits",
    titre: "Ajouter les produits",
    description: "Constituez votre catalogue de produits cosmétiques.",
    lien: "/produits",
  },
  {
    cle: "fournisseurs",
    titre: "Ajouter les fournisseurs",
    description: "Enregistrez vos partenaires d'approvisionnement.",
    lien: "/fournisseurs",
  },
  {
    cle: "employes",
    titre: "Ajouter les employés",
    description: "Créez les comptes de votre équipe et attribuez les rôles.",
    lien: "/employes",
  },
  {
    cle: "caisse",
    titre: "Ouvrir la première caisse",
    description: "Démarrez une session de caisse avec un fonds initial.",
    lien: "/caisse",
  },
  {
    cle: "vente",
    titre: "Effectuer la première vente",
    description: "Encaissez une vente et imprimez la facture.",
    lien: "/ventes",
  },
];

export function progressionConfiguration(faites: string[]) {
  const etapes: EtapeConfiguration[] = ETAPES_CONFIGURATION.map((e) => ({
    ...e,
    faite: faites.includes(e.cle),
  }));
  const total = etapes.length;
  const done = etapes.filter((e) => e.faite).length;
  return { etapes, pourcentage: Math.round((done / total) * 100), done, total };
}
