import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, PackagePlus, Printer, Search } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { OrderFormDialog } from "@/components/suppliers/order-form-dialog";
import { OrdersTable } from "@/components/suppliers/orders-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProductsStore } from "@/lib/products/store";
import { exporterCommandesCSV, imprimerCommande } from "@/lib/suppliers/print";
import {
  ajouterCommande,
  changerStatutCommande,
  modifierCommande,
  nomFournisseur,
  receptionnerCommande,
  supprimerCommande,
  useSuppliersStore,
} from "@/lib/suppliers/store";
import {
  STATUTS_COMMANDE,
  STATUT_COMMANDE_LABEL,
  type CommandeAchat,
  type StatutCommande,
} from "@/lib/suppliers/types";
import { cn } from "@/lib/utils";

const TITLE = "Commandes d'achat";
const DESCRIPTION = "Créez, suivez et réceptionnez vos commandes fournisseurs.";

export const Route = createFileRoute("/_authenticated/fournisseurs/commandes/")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: CommandesPage,
});

function CommandesPage() {
  const { commandes, fournisseurs } = useSuppliersStore();
  const { produits } = useProductsStore();

  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState<StatutCommande | "tous">("tous");
  const [formOuvert, setFormOuvert] = useState(false);
  const [edition, setEdition] = useState<CommandeAchat | null>(null);
  const [aSupprimer, setASupprimer] = useState<CommandeAchat | null>(null);
  const [aReceptionner, setAReceptionner] = useState<CommandeAchat | null>(null);

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return commandes
      .filter((c) => {
        if (statut !== "tous" && c.statut !== statut) return false;
        if (!q) return true;
        return [
          c.numero,
          nomFournisseur(c.fournisseurId),
          c.responsable,
          ...c.lignes.map((l) => l.nom),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [commandes, recherche, statut]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Approvisionnement"
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                exporterCommandesCSV(liste, nomFournisseur);
                toast.success("Export Excel généré");
              }}
            >
              <Download className="mr-1.5 h-4 w-4" /> Exporter
            </Button>
            <Button
              onClick={() => {
                setEdition(null);
                setFormOuvert(true);
              }}
            >
              <PackagePlus className="mr-1.5 h-4 w-4" /> Nouvelle commande
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un numéro, fournisseur, produit ou responsable…"
            className="pl-9"
            maxLength={80}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(["tous", ...STATUTS_COMMANDE] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatut(s)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                statut === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {s === "tous" ? "Toutes" : STATUT_COMMANDE_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <OrdersTable
        commandes={liste}
        nomFournisseur={nomFournisseur}
        onModifier={(c) => {
          setEdition(c);
          setFormOuvert(true);
        }}
        onSupprimer={setASupprimer}
        onImprimer={(c) => {
          const ok = imprimerCommande(
            c,
            fournisseurs.find((f) => f.id === c.fournisseurId) ?? null,
          );
          if (!ok) toast.error("Autorisez les fenêtres pop-up pour imprimer le bon de commande.");
        }}
        onEnvoyer={(c) => {
          changerStatutCommande(c.id, "envoyee");
          toast.success("Commande envoyée", {
            description: `${c.numero} · ${nomFournisseur(c.fournisseurId)}`,
          });
        }}
        onReceptionner={setAReceptionner}
      />

      <OrderFormDialog
        open={formOuvert}
        onOpenChange={setFormOuvert}
        commande={edition}
        fournisseurs={fournisseurs}
        produits={produits}
        responsable="Bekaye Sora"
        onSubmit={(values) => {
          if (edition) {
            modifierCommande(edition.id, values);
            toast.success("Commande mise à jour", { description: edition.numero });
          } else {
            const creee = ajouterCommande(values);
            toast.success("Commande créée", {
              description: `${creee.numero} · ${nomFournisseur(creee.fournisseurId)}`,
              icon: <Printer className="h-4 w-4" />,
            });
          }
          setEdition(null);
        }}
      />

      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette commande ?</AlertDialogTitle>
            <AlertDialogDescription>
              La commande {aSupprimer?.numero} sera définitivement supprimée. Le stock n'est pas
              modifié si elle n'a jamais été réceptionnée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!aSupprimer) return;
                supprimerCommande(aSupprimer.id);
                toast.success("Commande supprimée", { description: aSupprimer.numero });
                setASupprimer(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!aReceptionner} onOpenChange={(o) => !o && setAReceptionner(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la réception ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le stock des {aReceptionner?.lignes.length} produit(s) de la commande{" "}
              {aReceptionner?.numero} sera automatiquement augmenté, et les mouvements de stock, le
              tableau de bord et les statistiques seront mis à jour.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!aReceptionner) return;
                receptionnerCommande(aReceptionner.id);
                toast.success("Commande reçue", {
                  description: `${aReceptionner.numero} · stock mis à jour`,
                });
                setAReceptionner(null);
              }}
            >
              Réceptionner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
