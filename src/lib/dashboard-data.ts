import serum from "@/assets/produit-serum.jpg";
import lotion from "@/assets/produit-lotion.jpg";
import creme from "@/assets/produit-creme.jpg";
import savon from "@/assets/produit-savon.jpg";

/**
 * Données de démonstration du tableau de bord.
 * À remplacer par des requêtes Lovable Cloud lors de la prochaine étape.
 */

export const formatFCFA = (value: number) =>
  `${new Intl.NumberFormat("fr-FR").format(Math.round(value))} FCFA`;

export type Kpi = {
  id: string;
  label: string;
  value: string;
  hint: string;
  trend: number | null;
  icon:
    | "revenue"
    | "month"
    | "sales"
    | "stock"
    | "out"
    | "low"
    | "cash"
    | "clients"
    | "staff";
  tone: "primary" | "neutral" | "success" | "warning" | "danger";
};

export const kpis: Kpi[] = [
  {
    id: "ca-jour",
    label: "Chiffre d'affaires du jour",
    value: formatFCFA(412500),
    hint: "vs hier",
    trend: 12.4,
    icon: "revenue",
    tone: "primary",
  },
  {
    id: "ca-mois",
    label: "Chiffre d'affaires du mois",
    value: formatFCFA(7840000),
    hint: "vs mois dernier",
    trend: 8.1,
    icon: "month",
    tone: "primary",
  },
  {
    id: "ventes-jour",
    label: "Ventes aujourd'hui",
    value: "34",
    hint: "vs hier",
    trend: 5.6,
    icon: "sales",
    tone: "neutral",
  },
  {
    id: "produits-stock",
    label: "Produits en stock",
    value: "1 248",
    hint: "vs semaine dernière",
    trend: -2.3,
    icon: "stock",
    tone: "neutral",
  },
  {
    id: "ruptures",
    label: "Produits en rupture",
    value: "4",
    hint: "vs semaine dernière",
    trend: 2,
    icon: "out",
    tone: "danger",
  },
  {
    id: "stock-faible",
    label: "Produits en stock faible",
    value: "9",
    hint: "vs semaine dernière",
    trend: -1,
    icon: "low",
    tone: "warning",
  },
  {
    id: "caisse",
    label: "Argent disponible en caisse",
    value: formatFCFA(268000),
    hint: "depuis l'ouverture",
    trend: 3.2,
    icon: "cash",
    tone: "success",
  },
  {
    id: "clients",
    label: "Clients enregistrés",
    value: "512",
    hint: "vs mois dernier",
    trend: 4.8,
    icon: "clients",
    tone: "neutral",
  },
  {
    id: "employes",
    label: "Employés connectés aujourd'hui",
    value: "5 / 7",
    hint: "présence du jour",
    trend: null,
    icon: "staff",
    tone: "neutral",
  },
];

export type SalesPoint = { label: string; ventes: number };

export const salesSeries: Record<"jour" | "7j" | "30j" | "12m", SalesPoint[]> = {
  jour: [
    { label: "08h", ventes: 18000 },
    { label: "10h", ventes: 54000 },
    { label: "12h", ventes: 96000 },
    { label: "14h", ventes: 72000 },
    { label: "16h", ventes: 118000 },
    { label: "18h", ventes: 54500 },
  ],
  "7j": [
    { label: "Lun", ventes: 285000 },
    { label: "Mar", ventes: 342000 },
    { label: "Mer", ventes: 298000 },
    { label: "Jeu", ventes: 401000 },
    { label: "Ven", ventes: 468000 },
    { label: "Sam", ventes: 615000 },
    { label: "Dim", ventes: 412500 },
  ],
  "30j": Array.from({ length: 30 }, (_, i) => ({
    label: `${i + 1}`,
    ventes: 220000 + Math.round(Math.sin(i / 2.4) * 90000) + i * 4200,
  })),
  "12m": [
    { label: "Août", ventes: 5120000 },
    { label: "Sept", ventes: 5680000 },
    { label: "Oct", ventes: 6040000 },
    { label: "Nov", ventes: 6720000 },
    { label: "Déc", ventes: 8940000 },
    { label: "Janv", ventes: 6210000 },
    { label: "Févr", ventes: 6480000 },
    { label: "Mars", ventes: 7010000 },
    { label: "Avr", ventes: 6890000 },
    { label: "Mai", ventes: 7320000 },
    { label: "Juin", ventes: 7560000 },
    { label: "Juil", ventes: 7840000 },
  ],
};

export const salesRangeLabels = {
  jour: "Aujourd'hui",
  "7j": "7 jours",
  "30j": "30 jours",
  "12m": "12 mois",
} as const;

export type CategorySlice = { name: string; value: number; color: string };

export const categoryBreakdown: CategorySlice[] = [
  { name: "Soins du visage", value: 38, color: "var(--chart-1)" },
  { name: "Soins du corps", value: 27, color: "var(--chart-2)" },
  { name: "Parfums", value: 16, color: "var(--chart-3)" },
  { name: "Savons", value: 12, color: "var(--chart-4)" },
  { name: "Accessoires", value: 7, color: "var(--chart-5)" },
];

export type Sale = {
  id: string;
  heure: string;
  produit: string;
  client: string;
  quantite: number;
  montant: number;
  employe: string;
  statut: "Payée" | "En attente" | "Annulée";
};

export const recentSales: Sale[] = [
  {
    id: "V-1048",
    heure: "18:42",
    produit: "Sérum éclat 501",
    client: "Aminata Diallo",
    quantite: 2,
    montant: 34000,
    employe: "Fatou K.",
    statut: "Payée",
  },
  {
    id: "V-1047",
    heure: "18:15",
    produit: "Lait corporel 501",
    client: "Moussa Traoré",
    quantite: 1,
    montant: 12500,
    employe: "Ibrahim S.",
    statut: "Payée",
  },
  {
    id: "V-1046",
    heure: "17:58",
    produit: "Crème visage 501",
    client: "Client de passage",
    quantite: 3,
    montant: 45000,
    employe: "Fatou K.",
    statut: "En attente",
  },
  {
    id: "V-1045",
    heure: "17:20",
    produit: "Savon éclaircissant 501",
    client: "Mariam Coulibaly",
    quantite: 5,
    montant: 17500,
    employe: "Aïcha B.",
    statut: "Payée",
  },
  {
    id: "V-1044",
    heure: "16:47",
    produit: "Coffret 501 Prestige",
    client: "Salon Belle Vie",
    quantite: 1,
    montant: 68000,
    employe: "Ibrahim S.",
    statut: "Payée",
  },
  {
    id: "V-1043",
    heure: "16:05",
    produit: "Huile nourrissante 501",
    client: "Kadiatou Sow",
    quantite: 2,
    montant: 21000,
    employe: "Aïcha B.",
    statut: "Annulée",
  },
];

export type TopProduct = {
  id: string;
  nom: string;
  image: string;
  quantiteVendue: number;
  stockRestant: number;
};

export const topProducts: TopProduct[] = [
  { id: "p1", nom: "Sérum éclat 501", image: serum, quantiteVendue: 142, stockRestant: 68 },
  { id: "p2", nom: "Lait corporel 501", image: lotion, quantiteVendue: 118, stockRestant: 34 },
  { id: "p3", nom: "Crème visage 501", image: creme, quantiteVendue: 96, stockRestant: 12 },
  { id: "p4", nom: "Savon éclaircissant 501", image: savon, quantiteVendue: 87, stockRestant: 5 },
];

export type LowStockItem = {
  id: string;
  nom: string;
  stockActuel: number;
  stockMinimum: number;
};

export const lowStockItems: LowStockItem[] = [
  { id: "l1", nom: "Savon éclaircissant 501", stockActuel: 5, stockMinimum: 20 },
  { id: "l2", nom: "Crème visage 501", stockActuel: 12, stockMinimum: 25 },
  { id: "l3", nom: "Huile nourrissante 501", stockActuel: 8, stockMinimum: 15 },
  { id: "l4", nom: "Parfum 501 Intense", stockActuel: 3, stockMinimum: 12 },
  { id: "l5", nom: "Lait corporel 501", stockActuel: 34, stockMinimum: 30 },
];

export type Notification = {
  id: string;
  heure: string;
  message: string;
  type: "vente" | "rupture" | "livraison" | "caisse" | "employe";
  priorite: "Haute" | "Moyenne" | "Basse";
};

export const notifications: Notification[] = [
  {
    id: "n1",
    heure: "18:42",
    message: "Une vente de 34 000 FCFA vient d'être enregistrée.",
    type: "vente",
    priorite: "Basse",
  },
  {
    id: "n2",
    heure: "17:55",
    message: "Le produit « Parfum 501 Intense » est en rupture de stock.",
    type: "rupture",
    priorite: "Haute",
  },
  {
    id: "n3",
    heure: "15:30",
    message: "Une nouvelle livraison de 120 articles est arrivée.",
    type: "livraison",
    priorite: "Moyenne",
  },
  {
    id: "n4",
    heure: "13:10",
    message: "La caisse du matin a été fermée avec 186 000 FCFA.",
    type: "caisse",
    priorite: "Moyenne",
  },
  {
    id: "n5",
    heure: "08:02",
    message: "Fatou K. s'est connectée à l'application.",
    type: "employe",
    priorite: "Basse",
  },
];

export type EmployeeActivity = {
  id: string;
  nom: string;
  initiales: string;
  ventes: number;
  montant: number;
  derniereActivite: string;
};

export const employeeActivity: EmployeeActivity[] = [
  {
    id: "e1",
    nom: "Fatou Konaté",
    initiales: "FK",
    ventes: 14,
    montant: 186000,
    derniereActivite: "Il y a 4 min",
  },
  {
    id: "e2",
    nom: "Ibrahim Sanogo",
    initiales: "IS",
    ventes: 11,
    montant: 142500,
    derniereActivite: "Il y a 22 min",
  },
  {
    id: "e3",
    nom: "Aïcha Bagayoko",
    initiales: "AB",
    ventes: 7,
    montant: 68000,
    derniereActivite: "Il y a 1 h",
  },
  {
    id: "e4",
    nom: "Salif Doumbia",
    initiales: "SD",
    ventes: 2,
    montant: 16000,
    derniereActivite: "Il y a 3 h",
  },
];

export const monthlyGoal = {
  objectif: 10000000,
  realise: 7840000,
};
