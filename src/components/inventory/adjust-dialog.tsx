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

export function AdjustStockDialog({
  open,
  onOpenChange,
  nombreEcarts,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nombreEcarts: number;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">
            Voulez-vous mettre à jour le stock du système selon les résultats de cet inventaire ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {nombreEcarts > 0
              ? `${nombreEcarts} produit${nombreEcarts > 1 ? "s" : ""} présente${nombreEcarts > 1 ? "nt" : ""} un écart. `
              : ""}
            Le stock sera corrigé automatiquement et chaque modification sera enregistrée dans
            l'historique des mouvements.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Oui, ajuster le stock
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
