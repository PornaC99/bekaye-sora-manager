import { produitsDemo } from "@/lib/products/demo-data";
import type { Inventaire, LigneInventaire } from "./types";

const j = (n: number, h = 9) => {
  const d = new Date(Date.now() - n * 86_400_000);
  d.setHours(h, 15, 0, 0);
  return d.toISOString();
};

/** Construit les lignes d'inventaire à partir du catalogue 501. */
export function lignesDepuisProduits(
  produits: typeof produitsDemo,
  ecarts: Record<string, number> = {},
  saisirTout = true,
): LigneInventaire[] {
  return produits.map((p) => ({
    id: `LI-${p.id}`,
    produitId: p.id,
    nom: p.nom,
    codeBarres: p.codeBarres,
    image: p.image,
    stockTheorique: p.stock,
    stockPhysique: saisirTout ? p.stock + (ecarts[p.id] ?? 0) : null,
    prixAchat: p.prixAchat,
    commentaire: ecarts[p.id] ? "Écart constaté lors du comptage" : "",
  }));
}

export const inventairesDemo: Inventaire[] = [
  {
    id: "I-003",
    numero: "INV-2026-0003",
    nom: "Inventaire mensuel — Juin",
    date: j(12),
    responsable: "Bekaye Sora",
    magasin: "Boutique principale",
    observation: "Comptage complet réalisé après la fermeture de la boutique.",
    statut: "ajuste",
    signature: "Bekaye Sora",
    lignes: lignesDepuisProduits(produitsDemo.slice(0, 10), {
      "P-002": -4,
      "P-005": 2,
      "P-008": -12,
    }),
    historique: [
      { id: "HI-1", date: j(12), utilisateur: "Bekaye Sora", action: "Création de l'inventaire" },
      { id: "HI-2", date: j(12, 11), utilisateur: "Bekaye Sora", action: "Comptage terminé" },
      { id: "HI-3", date: j(12, 12), utilisateur: "Bekaye Sora", action: "Stock ajusté selon l'inventaire" },
    ],
  },
  {
    id: "I-002",
    numero: "INV-2026-0002",
    nom: "Contrôle réserve — Soins du visage",
    date: j(34),
    responsable: "Awa Traoré",
    magasin: "Réserve centrale",
    observation: "Contrôle partiel des références les plus vendues.",
    statut: "termine",
    signature: "Awa Traoré",
    lignes: lignesDepuisProduits(produitsDemo.slice(2, 8), { "P-004": -3, "P-006": -1 }),
    historique: [
      { id: "HI-4", date: j(34), utilisateur: "Awa Traoré", action: "Création de l'inventaire" },
      { id: "HI-5", date: j(34, 12), utilisateur: "Awa Traoré", action: "Comptage terminé" },
    ],
  },
  {
    id: "I-001",
    numero: "INV-2026-0001",
    nom: "Inventaire d'ouverture 2026",
    date: j(72),
    responsable: "Moussa Diallo",
    magasin: "Dépôt Ouaga 2000",
    observation: "Inventaire général de démarrage de l'exercice.",
    statut: "ajuste",
    signature: "Moussa Diallo",
    lignes: lignesDepuisProduits(produitsDemo, { "P-002": -6, "P-008": -9, "P-011": 5 }),
    historique: [
      { id: "HI-6", date: j(72), utilisateur: "Moussa Diallo", action: "Création de l'inventaire" },
      { id: "HI-7", date: j(72, 13), utilisateur: "Moussa Diallo", action: "Comptage terminé" },
      { id: "HI-8", date: j(72, 14), utilisateur: "Moussa Diallo", action: "Stock ajusté selon l'inventaire" },
    ],
  },
];
