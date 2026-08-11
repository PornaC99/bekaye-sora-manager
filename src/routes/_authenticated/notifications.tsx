import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BellRing, CheckCheck, Search, Trash2, Inbox } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  MODULE_LABEL,
  TON_CLASSE,
  marquerLu,
  supprimerEvenement,
  toutMarquerLu,
  useCentreNotifications,
  viderCentre,
  type ModuleSysteme,
} from "@/lib/core/notifications";

const TITLE = "Notifications";
const DESCRIPTION =
  "Centre de liaisons : chaque vente, entrée de stock, réception, mouvement RH ou écriture financière remonte ici automatiquement.";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Page,
});

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const MODULES_FILTRE: (ModuleSysteme | "tous")[] = [
  "tous",
  "ventes",
  "caisse",
  "produits",
  "stock",
  "inventaire",
  "clients",
  "fournisseurs",
  "finances",
  "rh",
  "systeme",
];

function Stat({ label, valeur }: { label: string; valeur: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{valeur}</p>
    </div>
  );
}

function Page() {
  const { evenements } = useCentreNotifications();
  const [filtre, setFiltre] = useState<ModuleSysteme | "tous">("tous");
  const [recherche, setRecherche] = useState("");
  const [nonLuesSeulement, setNonLuesSeulement] = useState(false);
  const [supervisionSeulement, setSupervisionSeulement] = useState(false);

  const nonLus = evenements.filter((e) => !e.lu).length;
  const alertes = evenements.filter((e) => e.ton === "alerte" || e.ton === "danger").length;

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return evenements.filter((e) => {
      if (filtre !== "tous" && e.module !== filtre) return false;
      if (nonLuesSeulement && e.lu) return false;
      if (supervisionSeulement && e.audience !== "direction") return false;
      if (!q) return true;
      return (
        e.titre.toLowerCase().includes(q) ||
        e.message.toLowerCase().includes(q) ||
        MODULE_LABEL[e.module].toLowerCase().includes(q)
      );
    });
  }, [evenements, filtre, recherche, nonLuesSeulement, supervisionSeulement]);

  const compter = (cle: ModuleSysteme | "tous") =>
    cle === "tous" ? evenements.length : evenements.filter((e) => e.module === cle).length;

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5">
      <PageHeader
        eyebrow="Système"
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={nonLus === 0}
              onClick={() => {
                toutMarquerLu();
                toast.success("Toutes les notifications sont marquées comme lues");
              }}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Tout marquer comme lu
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={evenements.length === 0}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Tout supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Vider le centre de notifications ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Toutes les notifications enregistrées seront définitivement supprimées. Les
                    données métier (ventes, stock, clients) ne sont pas affectées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      viderCentre();
                      toast.success("Centre de notifications vidé");
                    }}
                  >
                    Supprimer tout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total" valeur={evenements.length} />
        <Stat label="Non lues" valeur={nonLus} />
        <Stat label="Alertes" valeur={alertes} />
        <Stat
          label="Supervision"
          valeur={evenements.filter((e) => e.audience === "direction").length}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une notification…"
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant={nonLuesSeulement ? "default" : "outline"}
            onClick={() => setNonLuesSeulement((v) => !v)}
          >
            Non lues uniquement
          </Button>
          <Button
            type="button"
            variant={supervisionSeulement ? "default" : "outline"}
            onClick={() => setSupervisionSeulement((v) => !v)}
          >
            Supervision direction
          </Button>
        </div>

        <div className="flex flex-wrap gap-1">
          {MODULES_FILTRE.map((cle) => (
            <button
              key={cle}
              type="button"
              onClick={() => setFiltre(cle)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                filtre === cle
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {cle === "tous" ? "Tout" : MODULE_LABEL[cle]}
              <span className="ml-1.5 text-[11px] opacity-70">{compter(cle)}</span>
            </button>
          ))}
        </div>
      </div>

      {liste.length === 0 ? (
        <section className="rounded-2xl border border-border bg-card p-12 text-center shadow-[var(--shadow-card)]">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary-soft">
            {evenements.length === 0 ? (
              <BellRing className="h-5 w-5 text-primary" />
            ) : (
              <Inbox className="h-5 w-5 text-primary" />
            )}
          </span>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            {evenements.length === 0 ? "Aucune notification" : "Aucun résultat"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {evenements.length === 0
              ? "Les évènements des modules apparaîtront ici dès la première opération (vente, réception, inventaire, salaire, dépense…)."
              : "Modifiez la recherche ou le filtre de module pour afficher davantage de notifications."}
          </p>
        </section>
      ) : (
        <ul className="flex flex-col gap-2">
          {liste.map((evenement) => (
            <li
              key={evenement.id}
              className={cn(
                "flex animate-in flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-colors fade-in slide-in-from-bottom-1 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between",
                !evenement.lu && "border-l-4 border-l-primary",
              )}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      TON_CLASSE[evenement.ton],
                    )}
                  >
                    {MODULE_LABEL[evenement.module]}
                  </span>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {evenement.titre}
                  </p>
                  {evenement.audience === "direction" && (
                    <span className="rounded-full border border-primary/40 bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Direction
                    </span>
                  )}
                  {!evenement.lu && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      Non lu
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{evenement.message}</p>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{formatDate(evenement.date)}</span>
                  {evenement.acteur && <span>Par {evenement.acteur}</span>}
                  {evenement.montant != null && (
                    <span>Montant : {Math.round(evenement.montant).toLocaleString("fr-FR")} F</span>
                  )}
                  {evenement.quantite != null && <span>Quantité : {evenement.quantite}</span>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button asChild variant="outline" size="sm" onClick={() => marquerLu(evenement.id)}>
                  <Link to={evenement.lien}>Ouvrir</Link>
                </Button>
                {!evenement.lu && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      marquerLu(evenement.id);
                      toast.success("Notification marquée comme lue");
                    }}
                  >
                    Lu
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Supprimer"
                  onClick={() => {
                    supprimerEvenement(evenement.id);
                    toast.success("Notification supprimée");
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
