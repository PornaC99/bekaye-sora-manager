/**
 * Rôles applicatifs et contrôle d'accès par module.
 *
 * Chaque rôle donne accès à une liste de racines de routes. Le contrôle est
 * appliqué à deux endroits :
 *  - la barre latérale (les menus non autorisés ne sont pas affichés) ;
 *  - le garde de routes (`AccessGuard`), y compris lorsque l'URL est saisie
 *    directement dans le navigateur.
 */

export type RoleCle =
  | "directeur"
  | "comptable"
  | "caissier"
  | "vendeur"
  | "magasinier"
  | "gestionnaire_stock";

export type InfoRole = {
  cle: RoleCle;
  label: string;
  description: string;
};

export const ROLES: InfoRole[] = [
  {
    cle: "directeur",
    label: "Directeur",
    description: "Accès total à l'ensemble des modules, de l'administration et des finances.",
  },
  {
    cle: "comptable",
    label: "Comptable",
    description: "Dépenses, trésorerie, rapports et statistiques. Aucun accès catalogue ni RH.",
  },
  {
    cle: "caissier",
    label: "Caissier",
    description: "Encaissement, ventes du jour et fichier client. Aucun accès produits ni RH.",
  },
  {
    cle: "vendeur",
    label: "Vendeur",
    description: "Ventes, caisse, consultation du catalogue et clients.",
  },
  {
    cle: "magasinier",
    label: "Magasinier",
    description: "Stocks, entrées, sorties et inventaires. Aucun accès financier ni salaires.",
  },
  {
    cle: "gestionnaire_stock",
    label: "Gestionnaire de stock",
    description: "Pilotage complet du stock, du catalogue et des approvisionnements.",
  },
];

export const LABEL_ROLE: Record<RoleCle, string> = ROLES.reduce(
  (acc, r) => ({ ...acc, [r.cle]: r.label }),
  {} as Record<RoleCle, string>,
);

/** Racines de routes autorisées par rôle (`"*"` = accès total). */
export const ACCES: Record<RoleCle, "*" | string[]> = {
  directeur: "*",
  comptable: [
    "/",
    "/depenses",
    "/salaires",
    "/rapports",
    "/statistiques",
    "/ventes",
    "/clients",
    "/notifications",
    "/parametres",
  ],
  caissier: ["/", "/caisse", "/ventes", "/clients", "/notifications", "/parametres"],
  vendeur: ["/", "/caisse", "/ventes", "/clients", "/produits", "/notifications", "/parametres"],
  magasinier: [
    "/",
    "/produits",
    "/categories",
    "/entrees-stock",
    "/sorties-stock",
    "/inventaire",
    "/notifications",
    "/parametres",
  ],
  gestionnaire_stock: [
    "/",
    "/produits",
    "/categories",
    "/fournisseurs",
    "/entrees-stock",
    "/sorties-stock",
    "/inventaire",
    "/statistiques",
    "/notifications",
    "/parametres",
  ],
};

/** Convertit le rôle stocké côté base (`app_role`) en rôle applicatif. */
export function roleDepuisBase(role: string | null | undefined): RoleCle {
  switch (role) {
    case "comptable":
      return "comptable";
    case "caissier":
      return "caissier";
    case "vendeur":
      return "vendeur";
    case "magasinier":
      return "magasinier";
    case "manager":
      return "gestionnaire_stock";
    case "administrateur":
    case "directeur":
    default:
      return "directeur";
  }
}

const racine = (chemin: string) => {
  const nettoye = chemin.split("?")[0].replace(/\/+$/, "");
  if (!nettoye) return "/";
  return `/${nettoye.split("/").filter(Boolean)[0]}`;
};

export function peutAcceder(role: RoleCle, chemin: string): boolean {
  const acces = ACCES[role];
  if (acces === "*") return true;
  return acces.includes(racine(chemin));
}

export function modulesAutorises(role: RoleCle): string[] | "*" {
  return ACCES[role];
}
