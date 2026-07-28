import { produitsDemo } from "@/lib/products/demo-data";
import type { AchatClient, Client, NotificationClient, ReglesFidelite } from "./types";

const VENDEURS = ["Aïcha Traoré", "Fatoumata Diallo", "Moussa Koné", "Bekaye Sora"];
const MODES = ["Espèces", "Orange Money", "Wave", "Moov Money", "Carte bancaire"];

const jours = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + (n % 8), (n * 7) % 60, 0, 0);
  return d.toISOString();
};

const anniversaire = (mois: number, jour: number, annee: number) =>
  new Date(annee, mois - 1, jour, 12).toISOString();

const aujourdhui = new Date();
const anniversaireDuJour = anniversaire(
  aujourdhui.getMonth() + 1,
  aujourdhui.getDate(),
  1992,
).slice(0, 10);

type Graine = {
  nom: string;
  ville: string;
  sexe: Client["sexe"];
  tel: string;
  email: string;
  adresse: string;
  naissance: string | null;
  inscription: number; // jours avant aujourd'hui
  achats: { jours: number; produits: [number, number][] }[];
  dette?: number;
  notes?: string;
};

const graines: Graine[] = [
  {
    nom: "Mariam Cissé",
    ville: "Bamako",
    sexe: "F",
    tel: "+223 76 12 45 89",
    email: "mariam.cisse@example.com",
    adresse: "Rue 224, Hamdallaye ACI 2000",
    naissance: anniversaire(4, 12, 1990),
    inscription: 420,
    achats: [
      {
        jours: 3,
        produits: [
          [0, 2],
          [2, 1],
        ],
      },
      { jours: 21, produits: [[1, 3]] },
      {
        jours: 48,
        produits: [
          [0, 4],
          [3, 2],
        ],
      },
      { jours: 76, produits: [[4, 2]] },
      {
        jours: 110,
        produits: [
          [2, 5],
          [5, 1],
        ],
      },
      { jours: 150, produits: [[0, 6]] },
    ],
    notes: "Cliente historique, préfère les livraisons le samedi matin.",
  },
  {
    nom: "Salon Belle Éclat",
    ville: "Bamako",
    sexe: "non_precise",
    tel: "+223 66 88 21 30",
    email: "contact@belleeclat.ml",
    adresse: "Avenue de l'Indépendance, Badalabougou",
    naissance: null,
    inscription: 640,
    achats: [
      {
        jours: 1,
        produits: [
          [1, 10],
          [3, 6],
        ],
      },
      { jours: 14, produits: [[0, 12]] },
      {
        jours: 30,
        produits: [
          [2, 8],
          [4, 4],
        ],
      },
      { jours: 62, produits: [[5, 10]] },
      { jours: 95, produits: [[1, 14]] },
      {
        jours: 128,
        produits: [
          [0, 9],
          [2, 6],
        ],
      },
      { jours: 170, produits: [[3, 12]] },
    ],
    dette: 45_000,
    notes: "Compte professionnel — facturation mensuelle.",
  },
  {
    nom: "Awa Sanogo",
    ville: "Sikasso",
    sexe: "F",
    tel: "+223 70 45 12 77",
    email: "awa.sanogo@example.com",
    adresse: "Quartier Wayerma II",
    naissance: anniversaireDuJour + "T12:00:00.000Z",
    inscription: 260,
    achats: [
      { jours: 6, produits: [[3, 2]] },
      {
        jours: 40,
        produits: [
          [0, 1],
          [5, 2],
        ],
      },
      { jours: 88, produits: [[2, 3]] },
    ],
  },
  {
    nom: "Boutique Nour",
    ville: "Ségou",
    sexe: "non_precise",
    tel: "+223 65 33 90 14",
    email: "boutiquenour@example.com",
    adresse: "Marché central, allée 4",
    naissance: null,
    inscription: 500,
    achats: [
      {
        jours: 9,
        produits: [
          [4, 8],
          [1, 5],
        ],
      },
      { jours: 44, produits: [[0, 10]] },
      { jours: 80, produits: [[2, 7]] },
      { jours: 132, produits: [[3, 9]] },
      { jours: 190, produits: [[5, 6]] },
    ],
    dette: 18_500,
  },
  {
    nom: "Fatoumata Keïta",
    ville: "Bamako",
    sexe: "F",
    tel: "+223 74 09 55 21",
    email: "f.keita@example.com",
    adresse: "Kalaban Coura, Rue 390",
    naissance: anniversaire(9, 3, 1996),
    inscription: 180,
    achats: [
      { jours: 12, produits: [[5, 1]] },
      {
        jours: 55,
        produits: [
          [0, 2],
          [1, 1],
        ],
      },
    ],
  },
  {
    nom: "Oumar Diarra",
    ville: "Mopti",
    sexe: "H",
    tel: "+223 78 21 63 40",
    email: "oumar.diarra@example.com",
    adresse: "Komoguel I",
    naissance: anniversaire(1, 22, 1985),
    inscription: 310,
    achats: [{ jours: 140, produits: [[2, 2]] }],
    notes: "Ne répond pas depuis plusieurs mois — relance à prévoir.",
  },
  {
    nom: "Kadiatou Touré",
    ville: "Bamako",
    sexe: "F",
    tel: "+223 76 77 41 08",
    email: "kadiatou.toure@example.com",
    adresse: "Faladié Sema",
    naissance: anniversaire(6, 18, 1993),
    inscription: 95,
    achats: [
      {
        jours: 2,
        produits: [
          [0, 3],
          [4, 1],
        ],
      },
      { jours: 26, produits: [[3, 2]] },
      { jours: 60, produits: [[0, 2]] },
      { jours: 84, produits: [[1, 4]] },
    ],
  },
  {
    nom: "Institut Éclat d'Or",
    ville: "Bamako",
    sexe: "non_precise",
    tel: "+223 69 14 78 52",
    email: "institut.eclatdor@example.com",
    adresse: "Cité du Niger, Villa 12",
    naissance: null,
    inscription: 720,
    achats: [
      { jours: 5, produits: [[2, 15]] },
      {
        jours: 33,
        produits: [
          [0, 18],
          [5, 5],
        ],
      },
      { jours: 70, produits: [[1, 12]] },
      { jours: 105, produits: [[4, 10]] },
      { jours: 145, produits: [[3, 16]] },
      { jours: 200, produits: [[2, 20]] },
    ],
    notes: "Meilleur client — remise négociée sur les volumes.",
  },
  {
    nom: "Aminata Bagayoko",
    ville: "Koutiala",
    sexe: "F",
    tel: "+223 72 55 30 91",
    email: "aminata.b@example.com",
    adresse: "Quartier Kaniko",
    naissance: anniversaire(11, 7, 1999),
    inscription: 45,
    achats: [{ jours: 8, produits: [[5, 2]] }],
  },
  {
    nom: "Ibrahim Coulibaly",
    ville: "Kayes",
    sexe: "H",
    tel: "+223 75 60 12 33",
    email: "ibrahim.c@example.com",
    adresse: "Légal Ségou",
    naissance: anniversaire(3, 30, 1988),
    inscription: 400,
    achats: [
      { jours: 120, produits: [[1, 3]] },
      { jours: 210, produits: [[0, 2]] },
    ],
    dette: 7_500,
  },
  {
    nom: "Djeneba Sidibé",
    ville: "Bamako",
    sexe: "F",
    tel: "+223 79 82 44 16",
    email: "djeneba.sidibe@example.com",
    adresse: "Sotuba ACI",
    naissance: anniversaire(8, 15, 1991),
    inscription: 220,
    achats: [
      {
        jours: 4,
        produits: [
          [4, 3],
          [2, 2],
        ],
      },
      { jours: 29, produits: [[0, 5]] },
      { jours: 63, produits: [[3, 3]] },
      { jours: 99, produits: [[1, 6]] },
      { jours: 138, produits: [[5, 4]] },
    ],
  },
  {
    nom: "Client comptoir",
    ville: "Bamako",
    sexe: "non_precise",
    tel: "—",
    email: "",
    adresse: "Vente au comptoir",
    naissance: null,
    inscription: 900,
    achats: [{ jours: 1, produits: [[0, 1]] }],
    notes: "Profil générique pour les ventes sans client identifié.",
  },
];

let compteur = 0;
const achats: AchatClient[] = [];

export const clientsDemo: Client[] = graines.map((graine, index) => {
  const id = `CL-${index + 1}`;
  const numero = `CLI-${new Date().getFullYear()}-${String(index + 1).padStart(4, "0")}`;
  let total = 0;

  const achatsClient = graine.achats.map((achat) => {
    const produits = achat.produits.map(([i, quantite]) => {
      const produit = produitsDemo[i % produitsDemo.length];
      return {
        produitId: produit.id,
        nom: produit.nom,
        quantite,
        prixUnitaire: produit.prixVente,
      };
    });
    const montant = produits.reduce((t, p) => t + p.prixUnitaire * p.quantite, 0);
    total += montant;
    compteur += 1;
    return {
      id: `AC-${compteur}`,
      clientId: id,
      date: jours(achat.jours),
      reference: `VTE-${new Date().getFullYear()}-${1000 + compteur}`,
      produits,
      montant,
      modePaiement: MODES[compteur % MODES.length],
      vendeur: VENDEURS[compteur % VENDEURS.length],
    } satisfies AchatClient;
  });

  achats.push(...achatsClient);

  const dernier = achatsClient.length
    ? achatsClient.reduce((a, b) => (a.date > b.date ? a : b)).date
    : null;

  return {
    id,
    numero,
    nom: graine.nom,
    telephone: graine.tel,
    whatsapp: graine.tel,
    email: graine.email,
    adresse: graine.adresse,
    ville: graine.ville,
    sexe: graine.sexe,
    dateNaissance: graine.naissance,
    dateInscription: jours(graine.inscription),
    notes: graine.notes ?? "",
    photo: null,
    points: Math.floor(total / 1000),
    totalDepense: total,
    nombreAchats: achatsClient.length,
    dernierAchat: dernier,
    dette: graine.dette ?? 0,
  } satisfies Client;
});

export const achatsDemo: AchatClient[] = achats.sort((a, b) => (a.date < b.date ? 1 : -1));

export const reglesFideliteDemo: ReglesFidelite = {
  pointsActifs: true,
  trancheFCFA: 1000,
  pointsParTranche: 1,
  remiseActive: true,
  remisePourcent: 5,
  cadeauActif: true,
  achatsAvantCadeau: 10,
  cadeau: "Un savon 501 offert",
};

export const notificationsClientsDemo: NotificationClient[] = [
  {
    id: "NC-1",
    date: jours(0),
    type: "vip",
    titre: "Client devenu VIP",
    message: "Institut Éclat d'Or a dépassé 250 000 FCFA d'achats cumulés.",
  },
  {
    id: "NC-2",
    date: jours(1),
    type: "nouveau",
    titre: "Nouveau client ajouté",
    message: "Aminata Bagayoko a été enregistrée dans le fichier client.",
  },
  {
    id: "NC-3",
    date: jours(2),
    type: "inactif",
    titre: "Client inactif depuis 90 jours",
    message: "Oumar Diarra n'a pas effectué d'achat depuis plus de 3 mois.",
  },
];
