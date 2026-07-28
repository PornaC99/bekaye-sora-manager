import { produitsDemo } from "@/lib/products/demo-data";
import type { NotificationVente, Retour, SessionCaisse, Vente } from "./types";
import { totalVente } from "./types";

export const VENDEURS = ["Aïcha Traoré", "Fatoumata Diallo", "Moussa Koné", "Bekaye Sora"] as const;

export const CLIENTS_FREQUENTS = [
  "Client comptoir",
  "Salon Belle Éclat",
  "Mariam Cissé",
  "Boutique Nour",
  "Awa Sanogo",
] as const;

const h = (joursAvant: number, heures: number, minutes: number) => {
  const d = new Date();
  d.setDate(d.getDate() - joursAvant);
  d.setHours(heures, minutes, 0, 0);
  return d.toISOString();
};

const p = (index: number) => produitsDemo[index % produitsDemo.length];

const ligne = (index: number, quantite: number) => {
  const produit = p(index);
  return {
    id: `LV-${produit.id}-${quantite}`,
    produitId: produit.id,
    nom: produit.nom,
    codeBarres: produit.codeBarres,
    prixUnitaire: produit.prixVente,
    quantite,
  };
};

const base = {
  telephoneClient: "",
  remise: 0,
  tauxTva: 0,
  observation: "",
} as const;

const brut: Omit<Vente, "montantRecu">[] = [
  {
    ...base,
    id: "V-1001",
    numero: "VTE-2026-1001",
    date: h(0, 9, 12),
    client: "Client comptoir",
    vendeur: "Aïcha Traoré",
    lignes: [ligne(0, 2), ligne(3, 1)],
    paiements: [{ mode: "especes", montant: 0 }],
    statut: "payee",
  },
  {
    ...base,
    id: "V-1002",
    numero: "VTE-2026-1002",
    date: h(0, 10, 45),
    client: "Salon Belle Éclat",
    telephoneClient: "+223 76 12 34 56",
    vendeur: "Fatoumata Diallo",
    lignes: [ligne(1, 4), ligne(2, 2), ligne(5, 1)],
    remise: 2000,
    paiements: [{ mode: "orange_money", montant: 0 }],
    statut: "payee",
  },
  {
    ...base,
    id: "V-1003",
    numero: "VTE-2026-1003",
    date: h(0, 12, 6),
    client: "Mariam Cissé",
    vendeur: "Moussa Koné",
    lignes: [ligne(4, 3)],
    paiements: [{ mode: "wave", montant: 0 }],
    statut: "payee",
  },
  {
    ...base,
    id: "V-1004",
    numero: "VTE-2026-1004",
    date: h(0, 14, 18),
    client: "Boutique Nour",
    vendeur: "Aïcha Traoré",
    lignes: [ligne(0, 6), ligne(6, 2)],
    tauxTva: 18,
    paiements: [{ mode: "especes", montant: 0 }],
    statut: "payee",
  },
  {
    ...base,
    id: "V-1005",
    numero: "VTE-2026-1005",
    date: h(1, 11, 30),
    client: "Awa Sanogo",
    vendeur: "Fatoumata Diallo",
    lignes: [ligne(2, 1), ligne(7, 2)],
    paiements: [{ mode: "moov_money", montant: 0 }],
    statut: "payee",
  },
  {
    ...base,
    id: "V-1006",
    numero: "VTE-2026-1006",
    date: h(1, 16, 4),
    client: "Client comptoir",
    vendeur: "Moussa Koné",
    lignes: [ligne(3, 2), ligne(8, 1)],
    paiements: [{ mode: "carte", montant: 0 }],
    statut: "retour",
  },
  {
    ...base,
    id: "V-1007",
    numero: "VTE-2026-1007",
    date: h(2, 10, 22),
    client: "Salon Belle Éclat",
    vendeur: "Bekaye Sora",
    lignes: [ligne(5, 5), ligne(1, 3)],
    remise: 3500,
    paiements: [
      { mode: "especes", montant: 20000 },
      { mode: "orange_money", montant: 0 },
    ],
    statut: "payee",
  },
  {
    ...base,
    id: "V-1008",
    numero: "VTE-2026-1008",
    date: h(3, 17, 40),
    client: "Client comptoir",
    vendeur: "Aïcha Traoré",
    lignes: [ligne(9, 1), ligne(4, 2)],
    paiements: [{ mode: "especes", montant: 0 }],
    statut: "annulee",
  },
];

export const ventesDemo: Vente[] = brut.map((vente) => {
  const total = totalVente(vente);
  const paiements = vente.paiements.map((paiement, index) =>
    index === vente.paiements.length - 1
      ? {
          ...paiement,
          montant: total - vente.paiements.slice(0, index).reduce((t, x) => t + x.montant, 0),
        }
      : paiement,
  );
  return {
    ...vente,
    paiements,
    montantRecu: vente.paiements[0]?.mode === "especes" ? Math.ceil(total / 500) * 500 : total,
  };
});

export const retoursDemo: Retour[] = [
  {
    id: "R-2001",
    numero: "RET-2026-2001",
    venteId: "V-1006",
    venteNumero: "VTE-2026-1006",
    date: h(1, 17, 12),
    utilisateur: "Moussa Koné",
    motif: "Emballage abîmé",
    lignes: [{ produitId: p(3).id, quantite: 1, montant: p(3).prixVente }],
    montant: p(3).prixVente,
  },
];

const ventesDuJour = ventesDemo.filter(
  (v) => v.statut !== "annulee" && new Date(v.date).toDateString() === new Date().toDateString(),
);

export const sessionsDemo: SessionCaisse[] = [
  {
    id: "C-3002",
    numero: "CAISSE-2026-0042",
    dateOuverture: h(0, 8, 0),
    montantOuverture: 50000,
    utilisateur: "Aïcha Traoré",
    dateFermeture: null,
    montantReel: null,
    observation: "",
    operations: [
      {
        id: "OP-3002-0",
        date: h(0, 8, 0),
        type: "ouverture",
        libelle: "Ouverture de caisse",
        montant: 0,
        utilisateur: "Aïcha Traoré",
      },
      ...ventesDuJour.map((vente, index) => ({
        id: `OP-3002-${index + 1}`,
        date: vente.date,
        type: "vente" as const,
        libelle: `Vente ${vente.numero} — ${vente.client}`,
        montant: vente.paiements
          .filter((p2) => p2.mode === "especes")
          .reduce((t, p2) => t + p2.montant, 0),
        utilisateur: vente.vendeur,
        mode: vente.paiements[0]?.mode,
      })),
      {
        id: "OP-3002-90",
        date: h(0, 13, 15),
        type: "depense",
        libelle: "Achat sachets d'emballage",
        montant: -4500,
        utilisateur: "Aïcha Traoré",
      },
    ],
  },
  {
    id: "C-3001",
    numero: "CAISSE-2026-0041",
    dateOuverture: h(1, 8, 5),
    montantOuverture: 50000,
    utilisateur: "Fatoumata Diallo",
    dateFermeture: h(1, 19, 30),
    montantReel: 121500,
    observation: "Petit écart lié à la monnaie rendue.",
    operations: [
      {
        id: "OP-3001-0",
        date: h(1, 8, 5),
        type: "ouverture",
        libelle: "Ouverture de caisse",
        montant: 0,
        utilisateur: "Fatoumata Diallo",
      },
      {
        id: "OP-3001-1",
        date: h(1, 11, 30),
        type: "vente",
        libelle: "Vente VTE-2026-1005 — Awa Sanogo",
        montant: 0,
        utilisateur: "Fatoumata Diallo",
        mode: "moov_money",
      },
      {
        id: "OP-3001-2",
        date: h(1, 15, 0),
        type: "vente",
        libelle: "Ventes comptoir espèces",
        montant: 78000,
        utilisateur: "Fatoumata Diallo",
        mode: "especes",
      },
      {
        id: "OP-3001-3",
        date: h(1, 17, 12),
        type: "retour",
        libelle: "Retour RET-2026-2001",
        montant: -p(3).prixVente,
        utilisateur: "Moussa Koné",
      },
      {
        id: "OP-3001-4",
        date: h(1, 19, 30),
        type: "cloture",
        libelle: "Clôture de caisse",
        montant: 0,
        utilisateur: "Fatoumata Diallo",
      },
    ],
  },
];

export const notificationsDemo: NotificationVente[] = [
  {
    id: "N-1",
    date: h(0, 14, 18),
    type: "vente",
    titre: "Nouvelle vente enregistrée",
    message: "VTE-2026-1004 · Boutique Nour · Vendeur : Aïcha Traoré",
  },
  {
    id: "N-2",
    date: h(0, 10, 45),
    type: "paiement",
    titre: "Paiement Orange Money reçu",
    message: "Salon Belle Éclat · VTE-2026-1002",
  },
  {
    id: "N-3",
    date: h(1, 17, 12),
    type: "retour",
    titre: "Retour produit",
    message: "RET-2026-2001 · Emballage abîmé · 1 article réintégré au stock",
  },
  {
    id: "N-4",
    date: h(1, 19, 30),
    type: "caisse",
    titre: "Caisse fermée",
    message: "CAISSE-2026-0041 · Écart constaté de -1 500 FCFA",
  },
];
