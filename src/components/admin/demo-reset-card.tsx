import { useState } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { AdminCard } from "@/components/admin/pieces";
import { Button } from "@/components/ui/button";
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
import { journaliser } from "@/lib/admin/store";
import { reinitialiserDonneesDemo, useDemoVierge } from "@/lib/demo/reset";

/**
 * Carte « Réinitialiser les données de démonstration ».
 * Remet à zéro l'activité (ventes, caisse, dépenses, trésorerie, inventaires,
 * notifications, statistiques) sans supprimer les produits, catégories,
 * clients, fournisseurs, employés ni les paramètres de l'entreprise.
 */
export function DemoResetCard() {
  const vierge = useDemoVierge();
  const [enCours, setEnCours] = useState(false);

  const lancer = async () => {
    setEnCours(true);
    try {
      await reinitialiserDonneesDemo();
      journaliser({
        action: "suppression",
        module: "Démonstration",
        details: "Réinitialisation des données de démonstration (activité remise à zéro).",
      });
      toast.success("Données de démonstration réinitialisées");
    } catch {
      toast.error("La réinitialisation a échoué. Réessayez.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <AdminCard
      titre="Réinitialiser les données de démonstration"
      description="Remettez les chiffres à zéro avant une présentation client."
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 rounded-2xl border border-primary/20 bg-primary-soft p-4">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 text-sm text-foreground">
            <p className="font-semibold text-primary">Action irréversible</p>
            <p className="mt-1 text-muted-foreground">
              Toutes les ventes, sessions de caisse, retours, dépenses, mouvements de trésorerie,
              inventaires et notifications seront définitivement supprimés. Les produits,
              catégories, clients, fournisseurs, employés et paramètres sont conservés.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={enCours}>
                <RotateCcw className="mr-1.5 h-4 w-4" />
                {enCours ? "Réinitialisation…" : "Réinitialiser les données de démonstration"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la réinitialisation ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. L'activité (chiffre d'affaires, ventes, caisse,
                  dépenses, statistiques) sera remise à zéro. Le catalogue, les clients et l'équipe
                  restent intacts.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={lancer}>Oui, réinitialiser</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {vierge && (
            <span className="text-xs font-medium text-muted-foreground">
              Activité actuellement remise à zéro — prête pour la démonstration.
            </span>
          )}
        </div>
      </div>
    </AdminCard>
  );
}
