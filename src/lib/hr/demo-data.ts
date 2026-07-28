import type { ActiviteJournal, BulletinPaie, Conge, Employe, Presence } from "./types";

/** Données de démonstration réalistes du module RH (marque 501, Bamako). */

const iso = (d: Date) => d.toISOString();
const jour = (d: Date) => d.toISOString().slice(0, 10);

const maintenant = new Date();
const aujourdhui = jour(maintenant);
const moisCourant = aujourdhui.slice(0, 7);

function moisPrecedent(mois: string, decalage: number) {
  const [a, m] = mois.split("-").map(Number);
  const d = new Date(a, m - 1 - decalage, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function ilYA(jours: number, heures = 0) {
  const d = new Date(maintenant);
  d.setDate(d.getDate() - jours);
  d.setHours(d.getHours() - heures);
  return iso(d);
}

function dansXJours(jours: number) {
  const d = new Date(maintenant);
  d.setDate(d.getDate() + jours);
  return jour(d);
}

/* ------------------------------------------------------------------ */
/* Employés — les noms correspondent aux vendeurs du module Ventes      */
/* ------------------------------------------------------------------ */

export const employesDemo: Employe[] = [
  {
    id: "EMP-001",
    matricule: "BS-2021-001",
    nom: "Bekaye Sora",
    photo: null,
    dateNaissance: "1985-03-14",
    sexe: "Homme",
    telephone: "+223 76 12 34 56",
    whatsapp: "+223 76 12 34 56",
    adresse: "Hamdallaye ACI 2000, Bamako",
    email: "bekaye.sora@501.ml",
    fonction: "Directeur général",
    departement: "Administration",
    role: "directeur",
    dateEmbauche: "2021-01-04",
    salaireBase: 600000,
    objectifMensuel: 0,
    statut: "actif",
    derniereConnexion: ilYA(0, 1),
    notes: "Fondateur de la marque 501, supervise l'ensemble des activités.",
    permissions: null,
  },
  {
    id: "EMP-002",
    matricule: "BS-2022-002",
    nom: "Aïcha Traoré",
    photo: null,
    dateNaissance: `1996-${String(maintenant.getMonth() + 1).padStart(2, "0")}-${String(
      Math.min(28, maintenant.getDate() + 3),
    ).padStart(2, "0")}`,
    sexe: "Femme",
    telephone: "+223 70 45 88 21",
    whatsapp: "+223 70 45 88 21",
    adresse: "Badalabougou, Bamako",
    email: "aicha.traore@501.ml",
    fonction: "Responsable des ventes",
    departement: "Ventes",
    role: "manager",
    dateEmbauche: "2022-02-15",
    salaireBase: 250000,
    objectifMensuel: 2500000,
    statut: "actif",
    derniereConnexion: ilYA(0, 2),
    notes: "Meilleure vendeuse depuis deux trimestres consécutifs.",
    permissions: null,
  },
  {
    id: "EMP-003",
    matricule: "BS-2022-003",
    nom: "Fatoumata Diallo",
    photo: null,
    dateNaissance: "1998-11-02",
    sexe: "Femme",
    telephone: "+223 66 78 90 12",
    whatsapp: "+223 66 78 90 12",
    adresse: "Sogoniko, Bamako",
    email: "fatoumata.diallo@501.ml",
    fonction: "Caissière principale",
    departement: "Caisse",
    role: "caissier",
    dateEmbauche: "2022-06-01",
    salaireBase: 180000,
    objectifMensuel: 1800000,
    statut: "actif",
    derniereConnexion: ilYA(0, 3),
    notes: "Très rigoureuse sur les clôtures de caisse.",
    permissions: null,
  },
  {
    id: "EMP-004",
    matricule: "BS-2023-004",
    nom: "Moussa Koné",
    photo: null,
    dateNaissance: "1994-07-19",
    sexe: "Homme",
    telephone: "+223 78 22 44 66",
    whatsapp: "+223 78 22 44 66",
    adresse: "Djélibougou, Bamako",
    email: "moussa.kone@501.ml",
    fonction: "Vendeur conseil",
    departement: "Ventes",
    role: "vendeur",
    dateEmbauche: "2023-03-20",
    salaireBase: 150000,
    objectifMensuel: 1500000,
    statut: "actif",
    derniereConnexion: ilYA(1),
    notes: "Excellent sur les coffrets et les parfums.",
    permissions: null,
  },
  {
    id: "EMP-005",
    matricule: "BS-2023-005",
    nom: "Salif Doumbia",
    photo: null,
    dateNaissance: "1990-01-25",
    sexe: "Homme",
    telephone: "+223 65 33 11 09",
    whatsapp: "+223 65 33 11 09",
    adresse: "Kalaban Coro, Bamako",
    email: "salif.doumbia@501.ml",
    fonction: "Magasinier",
    departement: "Magasin",
    role: "magasinier",
    dateEmbauche: "2023-09-11",
    salaireBase: 140000,
    objectifMensuel: 0,
    statut: "conge",
    derniereConnexion: ilYA(6),
    notes: "En congé annuel, retour prévu la semaine prochaine.",
    permissions: null,
  },
  {
    id: "EMP-006",
    matricule: "BS-2024-006",
    nom: "Kadiatou Sow",
    photo: null,
    dateNaissance: "1993-04-08",
    sexe: "Femme",
    telephone: "+223 74 90 55 32",
    whatsapp: "+223 74 90 55 32",
    adresse: "Faladié, Bamako",
    email: "kadiatou.sow@501.ml",
    fonction: "Comptable",
    departement: "Comptabilité",
    role: "comptable",
    dateEmbauche: "2024-05-02",
    salaireBase: 220000,
    objectifMensuel: 0,
    statut: "actif",
    derniereConnexion: ilYA(0, 5),
    notes: "Prépare les états financiers mensuels.",
    permissions: null,
  },
  {
    id: "EMP-007",
    matricule: "BS-2025-007",
    nom: "Ibrahim Sanogo",
    photo: null,
    dateNaissance: "2000-09-30",
    sexe: "Homme",
    telephone: "+223 79 14 27 85",
    whatsapp: "+223 79 14 27 85",
    adresse: "Magnambougou, Bamako",
    email: "ibrahim.sanogo@501.ml",
    fonction: "Vendeur",
    departement: "Ventes",
    role: "vendeur",
    dateEmbauche: dansXJours(-21),
    salaireBase: 130000,
    objectifMensuel: 1000000,
    statut: "actif",
    derniereConnexion: ilYA(0, 8),
    notes: "Nouvelle recrue en période d'intégration.",
    permissions: null,
  },
  {
    id: "EMP-008",
    matricule: "BS-2024-008",
    nom: "Awa Cissé",
    photo: null,
    dateNaissance: "1997-12-12",
    sexe: "Femme",
    telephone: "+223 62 40 73 18",
    whatsapp: "+223 62 40 73 18",
    adresse: "Lafiabougou, Bamako",
    email: "awa.cisse@501.ml",
    fonction: "Caissière",
    departement: "Caisse",
    role: "caissier",
    dateEmbauche: "2024-08-19",
    salaireBase: 160000,
    objectifMensuel: 900000,
    statut: "suspendu",
    derniereConnexion: ilYA(12),
    notes: "Compte suspendu suite à un écart de caisse en cours de vérification.",
    permissions: null,
  },
];

/* ------------------------------------------------------------------ */
/* Présence — 14 derniers jours                                         */
/* ------------------------------------------------------------------ */

const PROFILS_PRESENCE: Record<string, { arrivee: string; depart: string; fiabilite: number }> = {
  "EMP-001": { arrivee: "07:45", depart: "19:00", fiabilite: 0.98 },
  "EMP-002": { arrivee: "07:52", depart: "18:40", fiabilite: 0.96 },
  "EMP-003": { arrivee: "08:05", depart: "18:15", fiabilite: 0.9 },
  "EMP-004": { arrivee: "08:18", depart: "18:05", fiabilite: 0.82 },
  "EMP-005": { arrivee: "08:00", depart: "17:30", fiabilite: 0.7 },
  "EMP-006": { arrivee: "08:10", depart: "17:00", fiabilite: 0.93 },
  "EMP-007": { arrivee: "08:25", depart: "18:30", fiabilite: 0.86 },
  "EMP-008": { arrivee: "08:35", depart: "17:45", fiabilite: 0.6 },
};

function decale(heure: string, minutes: number) {
  const [h, m] = heure.split(":").map(Number);
  const total = Math.max(0, h * 60 + m + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function pseudoAleatoire(graine: number) {
  const x = Math.sin(graine) * 10000;
  return x - Math.floor(x);
}

export const presencesDemo: Presence[] = (() => {
  const lignes: Presence[] = [];
  employesDemo.forEach((employe, index) => {
    const profil = PROFILS_PRESENCE[employe.id];
    for (let j = 0; j < 14; j += 1) {
      const date = new Date(maintenant);
      date.setDate(date.getDate() - j);
      if (date.getDay() === 0) continue; // dimanche fermé
      const alea = pseudoAleatoire(index * 31 + j * 7);
      const dateStr = jour(date);
      let statut: Presence["statut"] = "present";
      if (employe.statut === "conge" && j < 5) statut = "conge";
      else if (employe.statut === "suspendu" && j < 10) statut = "absent";
      else if (alea > profil.fiabilite) statut = alea > 0.97 ? "absent" : "retard";

      const retardMinutes =
        statut === "retard"
          ? Math.round(8 + alea * 40)
          : Math.max(0, minutesRetard(profil.arrivee));
      const arrivee =
        statut === "absent" || statut === "conge"
          ? null
          : decale(profil.arrivee, statut === "retard" ? Math.round(alea * 45) : 0);
      const depart =
        statut === "absent" || statut === "conge"
          ? null
          : j === 0 && employe.statut === "actif"
            ? null
            : decale(profil.depart, Math.round((alea - 0.5) * 30));

      lignes.push({
        id: `PR-${employe.id}-${dateStr}`,
        employeId: employe.id,
        date: dateStr,
        arrivee,
        depart,
        retardMinutes: statut === "retard" ? retardMinutes : 0,
        statut: statut === "present" && retardMinutes > 10 ? "retard" : statut,
        methode: "manuel",
      });
    }
  });
  return lignes;
})();

function minutesRetard(arrivee: string) {
  const [h, m] = arrivee.split(":").map(Number);
  return h * 60 + m - 8 * 60;
}

/* ------------------------------------------------------------------ */
/* Congés                                                               */
/* ------------------------------------------------------------------ */

export const congesDemo: Conge[] = [
  {
    id: "CG-001",
    employeId: "EMP-005",
    type: "annuel",
    dateDebut: dansXJours(-5),
    dateFin: dansXJours(5),
    motif: "Congé annuel — voyage familial à Ségou.",
    statut: "approuve",
    dateDemande: ilYA(18),
    decidePar: "Bekaye Sora",
    commentaire: "Remplacement assuré par Ibrahim Sanogo.",
  },
  {
    id: "CG-002",
    employeId: "EMP-004",
    type: "exceptionnel",
    dateDebut: dansXJours(9),
    dateFin: dansXJours(11),
    motif: "Cérémonie familiale.",
    statut: "en_attente",
    dateDemande: ilYA(2),
    decidePar: null,
    commentaire: "",
  },
  {
    id: "CG-003",
    employeId: "EMP-003",
    type: "maladie",
    dateDebut: dansXJours(-24),
    dateFin: dansXJours(-22),
    motif: "Repos médical avec certificat.",
    statut: "approuve",
    dateDemande: ilYA(26),
    decidePar: "Aïcha Traoré",
    commentaire: "Certificat médical reçu.",
  },
  {
    id: "CG-004",
    employeId: "EMP-007",
    type: "sans_solde",
    dateDebut: dansXJours(14),
    dateFin: dansXJours(20),
    motif: "Déplacement personnel hors du pays.",
    statut: "en_attente",
    dateDemande: ilYA(1),
    decidePar: null,
    commentaire: "",
  },
  {
    id: "CG-005",
    employeId: "EMP-008",
    type: "annuel",
    dateDebut: dansXJours(-40),
    dateFin: dansXJours(-33),
    motif: "Congé annuel.",
    statut: "refuse",
    dateDemande: ilYA(52),
    decidePar: "Bekaye Sora",
    commentaire: "Période de forte activité, report demandé.",
  },
];

/* ------------------------------------------------------------------ */
/* Bulletins de paie                                                    */
/* ------------------------------------------------------------------ */

function bulletinsPour(mois: string, statut: BulletinPaie["statut"]): BulletinPaie[] {
  return employesDemo.map((employe, index) => ({
    id: `PAIE-${mois}-${employe.id}`,
    employeId: employe.id,
    mois,
    salaireBase: employe.salaireBase,
    primes: index % 2 === 0 ? 25000 : 15000,
    heuresSupplementaires: index % 3 === 0 ? 8 : 4,
    tauxHeureSupplementaire: 1500,
    avances: index % 4 === 0 ? 30000 : 0,
    retenues: index % 5 === 0 ? 10000 : 5000,
    statut,
    datePaiement: statut === "paye" ? `${mois}-28` : null,
    modePaiement: index % 3 === 0 ? "especes" : index % 3 === 1 ? "orange_money" : "virement",
    observation: "",
  }));
}

export const bulletinsDemo: BulletinPaie[] = [
  ...bulletinsPour(moisCourant, "brouillon"),
  ...bulletinsPour(moisPrecedent(moisCourant, 1), "paye"),
  ...bulletinsPour(moisPrecedent(moisCourant, 2), "paye"),
];

/* ------------------------------------------------------------------ */
/* Journal d'activité                                                   */
/* ------------------------------------------------------------------ */

export const activitesDemo: ActiviteJournal[] = [
  {
    id: "AC-001",
    date: ilYA(0, 1),
    employeId: "EMP-002",
    auteur: "Aïcha Traoré",
    type: "connexion",
    module: "Authentification",
    description: "Connexion à l'application depuis le magasin principal.",
  },
  {
    id: "AC-002",
    date: ilYA(0, 2),
    employeId: "EMP-003",
    auteur: "Fatoumata Diallo",
    type: "ajout",
    module: "Ventes",
    description: "Enregistrement de la vente V-2024-0148.",
  },
  {
    id: "AC-003",
    date: ilYA(0, 4),
    employeId: "EMP-001",
    auteur: "Bekaye Sora",
    type: "validation",
    module: "Congés",
    description: "Validation du congé annuel de Salif Doumbia.",
  },
  {
    id: "AC-004",
    date: ilYA(1, 3),
    employeId: "EMP-005",
    auteur: "Salif Doumbia",
    type: "modification",
    module: "Stock",
    description: "Ajustement du stock après réception fournisseur.",
  },
  {
    id: "AC-005",
    date: ilYA(1, 6),
    employeId: "EMP-006",
    auteur: "Kadiatou Sow",
    type: "ajout",
    module: "Salaires",
    description: "Préparation des bulletins de paie du mois.",
  },
  {
    id: "AC-006",
    date: ilYA(2, 2),
    employeId: "EMP-001",
    auteur: "Bekaye Sora",
    type: "suppression",
    module: "Employés",
    description: "Suppression d'un compte de test.",
  },
  {
    id: "AC-007",
    date: ilYA(2, 9),
    employeId: "EMP-004",
    auteur: "Moussa Koné",
    type: "deconnexion",
    module: "Authentification",
    description: "Déconnexion en fin de service.",
  },
];
