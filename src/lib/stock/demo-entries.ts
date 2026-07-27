import type { EntreeStock } from "./types";

const iso = (joursAvant: number, heure: string) => {
  const d = new Date(Date.now() - joursAvant * 86_400_000);
  const [h, m] = heure.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const expire = (mois: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + mois);
  return d.toISOString();
};

export const UTILISATEURS = [
  "Bekaye Sora",
  "Aminata Traoré",
  "Moussa Diallo",
  "Fatoumata Keita",
] as const;

export const entreesDemo: EntreeStock[] = [
  {
    id: "E-1005",
    numero: "REC-2024-1005",
    date: iso(0, "09:15"),
    fournisseur: "Cosmetic Import SARL",
    referenceFacture: "FAC-88421",
    bonLivraison: "BL-2291",
    observation: "Livraison complète, cartons en bon état.",
    utilisateur: "Bekaye Sora",
    statut: "validee",
    lignes: [
      {
        id: "L-1",
        produitId: "P-001",
        codeBarres: "6001501000017",
        quantite: 60,
        prixAchat: 3200,
        prixVente: 5500,
        dateExpiration: expire(18),
        numeroLot: "LOT-501-A12",
      },
      {
        id: "L-2",
        produitId: "P-004",
        codeBarres: "6001501000048",
        quantite: 40,
        prixAchat: 4200,
        prixVente: 7500,
        dateExpiration: expire(14),
        numeroLot: "LOT-501-A13",
      },
      {
        id: "L-3",
        produitId: "P-006",
        codeBarres: "6001501000062",
        quantite: 25,
        prixAchat: 6800,
        prixVente: 12500,
        dateExpiration: expire(24),
        numeroLot: "LOT-501-A14",
      },
    ],
    historique: [
      {
        id: "H-1",
        date: iso(0, "09:15"),
        utilisateur: "Bekaye Sora",
        action: "Création et validation de la réception",
      },
    ],
  },
  {
    id: "E-1004",
    numero: "REC-2024-1004",
    date: iso(0, "14:40"),
    fournisseur: "Atelier 501",
    referenceFacture: "FAC-88399",
    bonLivraison: "BL-2288",
    observation: "Production interne du mois.",
    utilisateur: "Aminata Traoré",
    statut: "validee",
    lignes: [
      {
        id: "L-4",
        produitId: "P-002",
        codeBarres: "6001501000024",
        quantite: 200,
        prixAchat: 650,
        prixVente: 1250,
        dateExpiration: expire(30),
        numeroLot: "LOT-SAV-77",
      },
      {
        id: "L-5",
        produitId: "P-011",
        codeBarres: "6001501000116",
        quantite: 80,
        prixAchat: 1800,
        prixVente: 3500,
        dateExpiration: expire(20),
        numeroLot: "LOT-KAR-08",
      },
    ],
    historique: [
      {
        id: "H-2",
        date: iso(0, "14:40"),
        utilisateur: "Aminata Traoré",
        action: "Création et validation de la réception",
      },
    ],
  },
  {
    id: "E-1003",
    numero: "REC-2024-1003",
    date: iso(3, "11:05"),
    fournisseur: "Distribution Sahel",
    referenceFacture: "FAC-88104",
    bonLivraison: "BL-2270",
    observation: "2 cartons de gel douche légèrement abîmés, acceptés avec remise.",
    utilisateur: "Moussa Diallo",
    statut: "validee",
    lignes: [
      {
        id: "L-6",
        produitId: "P-007",
        codeBarres: "6001501000079",
        quantite: 120,
        prixAchat: 2100,
        prixVente: 3900,
        dateExpiration: expire(16),
        numeroLot: "LOT-GEL-31",
      },
      {
        id: "L-7",
        produitId: "P-009",
        codeBarres: "6001501000093",
        quantite: 90,
        prixAchat: 2800,
        prixVente: 4900,
        dateExpiration: expire(12),
        numeroLot: "LOT-LAI-19",
      },
      {
        id: "L-8",
        produitId: "P-012",
        codeBarres: "6001501000123",
        quantite: 150,
        prixAchat: 1200,
        prixVente: 2400,
        dateExpiration: expire(22),
        numeroLot: "LOT-DEO-45",
      },
    ],
    historique: [
      {
        id: "H-3",
        date: iso(3, "11:05"),
        utilisateur: "Moussa Diallo",
        action: "Création et validation de la réception",
      },
      {
        id: "H-3b",
        date: iso(3, "12:20"),
        utilisateur: "Bekaye Sora",
        action: "Modification de l'observation",
      },
    ],
  },
  {
    id: "E-1002",
    numero: "REC-2024-1002",
    date: iso(9, "08:30"),
    fournisseur: "Beauty Africa Group",
    referenceFacture: "FAC-87920",
    bonLivraison: "BL-2251",
    observation: "Réapprovisionnement mensuel accessoires.",
    utilisateur: "Fatoumata Keita",
    statut: "validee",
    lignes: [
      {
        id: "L-9",
        produitId: "P-010",
        codeBarres: "6001501000109",
        quantite: 300,
        prixAchat: 450,
        prixVente: 1000,
        dateExpiration: null,
        numeroLot: "LOT-EPO-02",
      },
      {
        id: "L-10",
        produitId: "P-003",
        codeBarres: "6001501000031",
        quantite: 140,
        prixAchat: 900,
        prixVente: 1800,
        dateExpiration: expire(10),
        numeroLot: "LOT-LIN-63",
      },
    ],
    historique: [
      {
        id: "H-4",
        date: iso(9, "08:30"),
        utilisateur: "Fatoumata Keita",
        action: "Création et validation de la réception",
      },
    ],
  },
  {
    id: "E-1001",
    numero: "REC-2024-1001",
    date: iso(21, "16:10"),
    fournisseur: "Cosmetic Import SARL",
    referenceFacture: "FAC-87610",
    bonLivraison: "BL-2210",
    observation: "En attente de la facture définitive du fournisseur.",
    utilisateur: "Bekaye Sora",
    statut: "brouillon",
    lignes: [
      {
        id: "L-11",
        produitId: "P-005",
        codeBarres: "6001501000055",
        quantite: 45,
        prixAchat: 5100,
        prixVente: 9000,
        dateExpiration: expire(15),
        numeroLot: "LOT-HUI-22",
      },
      {
        id: "L-12",
        produitId: "P-008",
        codeBarres: "6001501000086",
        quantite: 20,
        prixAchat: 9500,
        prixVente: 16500,
        dateExpiration: null,
        numeroLot: "LOT-COF-05",
      },
    ],
    historique: [
      {
        id: "H-5",
        date: iso(21, "16:10"),
        utilisateur: "Bekaye Sora",
        action: "Enregistrement en brouillon",
      },
    ],
  },
];
