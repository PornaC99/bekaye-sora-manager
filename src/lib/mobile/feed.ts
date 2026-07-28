import { useEffect, useMemo, useState } from "react";

import { useClientsStore } from "@/lib/clients/store";
import { useFinanceStore } from "@/lib/finance/store";
import { useHrStore } from "@/lib/hr/store";
import { useProductsStore } from "@/lib/products/store";
import { expirationProche, statutProduit } from "@/lib/products/types";
import { useSalesStore } from "@/lib/sales/store";
import { soldeCaisse, totalVente } from "@/lib/sales/types";
import { useSuppliersStore } from "@/lib/suppliers/store";

import { useMobileSession } from "./session";

/* ------------------------------------------------------------------ */
/* Horloge temps réel (rafraîchissement automatique sans rechargement)  */
/* ------------------------------------------------------------------ */

export function useHorloge(intervalle = 1000) {
  const [maintenant, setMaintenant] = useState<Date | null>(null);
  useEffect(() => {
    setMaintenant(new Date());
    const id = window.setInterval(() => setMaintenant(new Date()), intervalle);
    return () => window.clearInterval(id);
  }, [intervalle]);
  return maintenant;
}

export const formatHeureCourte = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export const formatJourHeure = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export function depuis(iso: string, reference: Date | null) {
  if (!reference) return formatHeureCourte(iso);
  const diff = Math.max(0, reference.getTime() - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  return jours === 1 ? "hier" : `il y a ${jours} j`;
}

/* ------------------------------------------------------------------ */
/* Flux unifié de notifications                                         */
/* ------------------------------------------------------------------ */

export type PrioriteNotif = "critique" | "haute" | "normale";

export type IconeNotif =
  | "vente"
  | "paiement"
  | "retour"
  | "caisse"
  | "stock"
  | "produit"
  | "employe"
  | "client"
  | "fournisseur"
  | "depense"
  | "alerte";

export type NotificationMobile = {
  id: string;
  date: string;
  titre: string;
  message: string;
  priorite: PrioriteNotif;
  icone: IconeNotif;
  module: string;
  lue: boolean;
};

/** Agrège les notifications de tous les modules en un flux unique trié. */
export function useNotificationsMobile(): NotificationMobile[] {
  const { notifications: ventes } = useSalesStore();
  const { notifications: clients } = useClientsStore();
  const { notifications: fournisseurs } = useSuppliersStore();
  const { notifications: finances } = useFinanceStore();
  const { activites } = useHrStore();
  const { lues } = useMobileSession();

  return useMemo(() => {
    const liste: Omit<NotificationMobile, "lue">[] = [];

    ventes.forEach((n) =>
      liste.push({
        id: `V-${n.id}`,
        date: n.date,
        titre: n.titre,
        message: n.message,
        module: "Ventes & Caisse",
        priorite: n.type === "retour" ? "haute" : "normale",
        icone: n.type === "caisse" ? "caisse" : n.type === "retour" ? "retour" : n.type,
      }),
    );

    clients.forEach((n) =>
      liste.push({
        id: `C-${n.id}`,
        date: n.date,
        titre: n.titre,
        message: n.message,
        module: "Clients",
        priorite: "normale",
        icone: "client",
      }),
    );

    fournisseurs.forEach((n) =>
      liste.push({
        id: `F-${n.id}`,
        date: n.date,
        titre: n.titre,
        message: n.message,
        module: "Fournisseurs",
        priorite: n.type === "retard" || n.type === "alerte" ? "haute" : "normale",
        icone: n.type === "reception" ? "stock" : "fournisseur",
      }),
    );

    finances.forEach((n) =>
      liste.push({
        id: `D-${n.id}`,
        date: n.date,
        titre: n.titre,
        message: n.message,
        module: "Finances",
        priorite: n.ton === "danger" ? "critique" : n.ton === "alerte" ? "haute" : "normale",
        icone: "depense",
      }),
    );

    activites.slice(0, 20).forEach((a) =>
      liste.push({
        id: `H-${a.id}`,
        date: a.date,
        titre: a.action,
        message: `${a.employe} · ${a.details}`,
        module: "Employés",
        priorite: "normale",
        icone: "employe",
      }),
    );

    return liste
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((n) => ({ ...n, lue: lues.includes(n.id) }));
  }, [ventes, clients, fournisseurs, finances, activites, lues]);
}

/* ------------------------------------------------------------------ */
/* Alertes critiques                                                    */
/* ------------------------------------------------------------------ */

export type AlerteCritique = {
  id: string;
  titre: string;
  message: string;
  niveau: "critique" | "eleve" | "moyen";
  icone: IconeNotif;
};

export function useAlertesCritiques(): AlerteCritique[] {
  const { produits } = useProductsStore();
  const { ventes, sessions } = useSalesStore();

  return useMemo(() => {
    const alertes: AlerteCritique[] = [];

    const ruptures = produits.filter((p) => statutProduit(p) === "rupture");
    if (ruptures.length) {
      alertes.push({
        id: "AL-RUPTURE",
        titre: `${ruptures.length} produit(s) en rupture`,
        message: ruptures
          .slice(0, 3)
          .map((p) => p.nom)
          .join(" · "),
        niveau: "critique",
        icone: "stock",
      });
    }

    const faibles = produits.filter((p) => statutProduit(p) === "faible");
    if (faibles.length) {
      alertes.push({
        id: "AL-FAIBLE",
        titre: `${faibles.length} produit(s) en stock faible`,
        message: "Pensez à lancer une commande fournisseur.",
        niveau: "eleve",
        icone: "stock",
      });
    }

    const expires = produits.filter(
      (p) => p.dateExpiration && new Date(p.dateExpiration).getTime() < Date.now(),
    );
    if (expires.length) {
      alertes.push({
        id: "AL-EXPIRES",
        titre: `${expires.length} produit(s) expiré(s)`,
        message: expires.map((p) => p.nom).join(" · "),
        niveau: "critique",
        icone: "produit",
      });
    }

    const bientot = produits.filter((p) => expirationProche(p, 60));
    if (bientot.length) {
      alertes.push({
        id: "AL-EXP-PROCHE",
        titre: `${bientot.length} produit(s) expirent bientôt`,
        message: bientot
          .slice(0, 3)
          .map((p) => p.nom)
          .join(" · "),
        niveau: "moyen",
        icone: "produit",
      });
    }

    sessions
      .filter((s) => s.dateFermeture && s.montantReel !== null)
      .slice(0, 3)
      .forEach((s) => {
        const ecart = (s.montantReel ?? 0) - soldeCaisse(s);
        if (Math.abs(ecart) >= 500) {
          alertes.push({
            id: `AL-CAISSE-${s.id}`,
            titre: "Écart de caisse constaté",
            message: `${s.numero} · écart de ${new Intl.NumberFormat("fr-FR").format(ecart)} FCFA`,
            niveau: "eleve",
            icone: "caisse",
          });
        }
      });

    const valides = ventes.filter((v) => v.statut !== "annulee");
    const jour = (d: Date) => d.toISOString().slice(0, 10);
    const aujourdHui = valides
      .filter((v) => jour(new Date(v.date)) === jour(new Date()))
      .reduce((t, v) => t + totalVente(v), 0);
    const sept = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (i + 1));
      return valides
        .filter((v) => jour(new Date(v.date)) === jour(d))
        .reduce((t, v) => t + totalVente(v), 0);
    });
    const moyenne = sept.reduce((t, v) => t + v, 0) / 7;
    if (moyenne > 0 && aujourdHui < moyenne * 0.5) {
      alertes.push({
        id: "AL-BAISSE",
        titre: "Forte baisse des ventes",
        message: `Aujourd'hui ${Math.round((aujourdHui / moyenne) * 100)} % de la moyenne des 7 derniers jours.`,
        niveau: "eleve",
        icone: "alerte",
      });
    }

    return alertes;
  }, [produits, ventes, sessions]);
}

/* ------------------------------------------------------------------ */
/* Surveillance en direct                                               */
/* ------------------------------------------------------------------ */

export type EvenementDirect = {
  id: string;
  date: string;
  titre: string;
  detail: string;
  icone: IconeNotif;
};

export function useFluxDirect(limite = 25): EvenementDirect[] {
  const { ventes, retours, sessions } = useSalesStore();
  const { mouvements, produits } = useProductsStore();
  const { commandes } = useSuppliersStore();
  const { clients } = useClientsStore();
  const { depenses } = useFinanceStore();

  return useMemo(() => {
    const evenements: EvenementDirect[] = [];

    ventes
      .filter((v) => v.statut !== "annulee")
      .forEach((v) =>
        evenements.push({
          id: `E-V-${v.id}`,
          date: v.date,
          titre: `Vente ${v.numero}`,
          detail: `${v.client || "Client comptoir"} · ${new Intl.NumberFormat("fr-FR").format(totalVente(v))} FCFA · ${v.vendeur}`,
          icone: "vente",
        }),
      );

    retours.forEach((r) =>
      evenements.push({
        id: `E-R-${r.id}`,
        date: r.date,
        titre: `Retour ${r.numero}`,
        detail: `${r.motif} · ${r.utilisateur}`,
        icone: "retour",
      }),
    );

    mouvements.slice(0, 40).forEach((m) => {
      const produit = produits.find((p) => p.id === m.produitId);
      evenements.push({
        id: `E-M-${m.id}`,
        date: m.date,
        titre: m.type === "entree" ? "Entrée de stock" : "Sortie de stock",
        detail: `${produit?.nom ?? "Produit"} · ${m.quantite} · ${m.utilisateur}`,
        icone: "stock",
      });
    });

    sessions.forEach((s) => {
      evenements.push({
        id: `E-CO-${s.id}`,
        date: s.dateOuverture,
        titre: "Ouverture de caisse",
        detail: `${s.numero} · ${s.utilisateur}`,
        icone: "caisse",
      });
      if (s.dateFermeture) {
        evenements.push({
          id: `E-CF-${s.id}`,
          date: s.dateFermeture,
          titre: "Fermeture de caisse",
          detail: `${s.numero} · ${s.utilisateur}`,
          icone: "caisse",
        });
      }
    });

    commandes.forEach((c) =>
      evenements.push({
        id: `E-CM-${c.id}`,
        date: c.dateReception ?? c.date,
        titre: c.statut === "recue" ? "Commande reçue" : `Commande ${c.numero}`,
        detail: `${c.responsable} · ${c.statut}`,
        icone: "fournisseur",
      }),
    );

    clients.forEach((c) =>
      evenements.push({
        id: `E-CL-${c.id}`,
        date: c.dateInscription,
        titre: "Nouveau client",
        detail: `${c.nom} · ${c.ville}`,
        icone: "client",
      }),
    );

    depenses.forEach((d) =>
      evenements.push({
        id: `E-DP-${d.id}`,
        date: d.date,
        titre: "Nouvelle dépense",
        detail: `${d.description} · ${new Intl.NumberFormat("fr-FR").format(d.montant)} FCFA`,
        icone: "depense",
      }),
    );

    return evenements
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limite);
  }, [ventes, retours, mouvements, produits, sessions, commandes, clients, depenses, limite]);
}
