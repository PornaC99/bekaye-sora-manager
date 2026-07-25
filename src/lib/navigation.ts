import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  ShoppingCart,
  Banknote,
  Users,
  BadgeCheck,
  Wallet,
  Receipt,
  FileText,
  BarChart3,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  to: string;
  icon: LucideIcon;
  description: string;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    label: "Pilotage",
    items: [
      {
        title: "Tableau de bord",
        to: "/",
        icon: LayoutDashboard,
        description: "Vue d'ensemble de l'activité de Bekaye Sora.",
      },
    ],
  },
  {
    label: "Catalogue",
    items: [
      {
        title: "Produits",
        to: "/produits",
        icon: Package,
        description: "Gérez le catalogue des produits cosmétiques 501.",
      },
      {
        title: "Catégories",
        to: "/categories",
        icon: Tags,
        description: "Organisez vos produits par familles et gammes.",
      },
      {
        title: "Fournisseurs",
        to: "/fournisseurs",
        icon: Truck,
        description: "Centralisez les partenaires d'approvisionnement.",
      },
    ],
  },
  {
    label: "Stock",
    items: [
      {
        title: "Entrées de stock",
        to: "/entrees-stock",
        icon: ArrowDownToLine,
        description: "Enregistrez les réceptions de marchandises.",
      },
      {
        title: "Sorties de stock",
        to: "/sorties-stock",
        icon: ArrowUpFromLine,
        description: "Suivez les sorties et transferts de produits.",
      },
      {
        title: "Inventaire",
        to: "/inventaire",
        icon: ClipboardList,
        description: "Contrôlez les quantités réelles disponibles.",
      },
    ],
  },
  {
    label: "Commerce",
    items: [
      {
        title: "Ventes",
        to: "/ventes",
        icon: ShoppingCart,
        description: "Historique et suivi des ventes réalisées.",
      },
      {
        title: "Caisse",
        to: "/caisse",
        icon: Banknote,
        description: "Encaissements, ouvertures et clôtures de caisse.",
      },
      {
        title: "Clients",
        to: "/clients",
        icon: Users,
        description: "Fichier client et historique d'achats.",
      },
    ],
  },
  {
    label: "Ressources humaines",
    items: [
      {
        title: "Employés",
        to: "/employes",
        icon: BadgeCheck,
        description: "Équipe, rôles et informations du personnel.",
      },
      {
        title: "Salaires",
        to: "/salaires",
        icon: Wallet,
        description: "Préparation et suivi des rémunérations.",
      },
      {
        title: "Dépenses",
        to: "/depenses",
        icon: Receipt,
        description: "Charges et frais de fonctionnement.",
      },
    ],
  },
  {
    label: "Analyse",
    items: [
      {
        title: "Rapports",
        to: "/rapports",
        icon: FileText,
        description: "Documents de synthèse exportables.",
      },
      {
        title: "Statistiques",
        to: "/statistiques",
        icon: BarChart3,
        description: "Indicateurs de performance et tendances.",
      },
    ],
  },
  {
    label: "Système",
    items: [
      {
        title: "Notifications",
        to: "/notifications",
        icon: Bell,
        description: "Alertes de stock, ventes et rappels.",
      },
      {
        title: "Paramètres",
        to: "/parametres",
        icon: Settings,
        description: "Configuration générale de l'application.",
      },
    ],
  },
];

export const navItems: NavItem[] = navSections.flatMap((section) => section.items);

export const BRAND = {
  name: "Bekaye Sora",
  app: "Business Manager",
  slogan: "501 – Révélez votre éclat.",
} as const;

export const currentUser = {
  name: "Bekaye Sora",
  role: "Propriétaire",
  initials: "BS",
} as const;
