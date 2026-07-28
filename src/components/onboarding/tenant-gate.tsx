import { useState, type ReactNode } from "react";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/layout/brand-mark";
import { useCreerEntreprise, useEntreprise } from "@/hooks/use-entreprise";
import { signalerErreur } from "@/lib/db/errors";

/**
 * Garde multi-entreprise : tant que le compte connecté n'est rattaché à aucune
 * entreprise, le RLS masque toutes les données — on propose donc la création
 * du tenant avant d'afficher l'application.
 */
export function TenantGate({ children }: { children: ReactNode }) {
  const { data, isPending, isError, error, refetch } = useEntreprise();

  if (isPending) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface px-4 text-center">
        <div className="flex max-w-sm flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Impossible de charger votre espace : {(error as Error).message}
          </p>
          <Button onClick={() => refetch()}>Réessayer</Button>
        </div>
      </div>
    );
  }

  if (!data?.entreprise) return <OnboardingEntreprise />;

  return <>{children}</>;
}

function OnboardingEntreprise() {
  const [nom, setNom] = useState("");
  const [secteur, setSecteur] = useState("cosmetiques");
  const [devise, setDevise] = useState("XOF");
  const creation = useCreerEntreprise();

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    try {
      await creation.mutateAsync({ nom: nom.trim(), secteur, devise });
      toast.success("Entreprise créée", { description: "Votre espace est prêt." });
    } catch (erreur) {
      signalerErreur("Création de l'entreprise impossible", erreur);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark />
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Créez votre entreprise
          </h1>
          <p className="text-sm text-muted-foreground">
            Dernière étape avant d'accéder à votre espace de gestion. Vos données seront totalement
            isolées de celles des autres entreprises.
          </p>
        </div>

        <form onSubmit={soumettre} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nom-entreprise">Nom de l'entreprise</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="nom-entreprise"
                className="pl-9"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Bekaye Sora Cosmétiques"
                required
                minLength={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="secteur">Secteur</Label>
              <Input
                id="secteur"
                value={secteur}
                onChange={(e) => setSecteur(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="devise">Devise</Label>
              <Input
                id="devise"
                value={devise}
                onChange={(e) => setDevise(e.target.value.toUpperCase())}
                maxLength={5}
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={creation.isPending} className="mt-1 w-full">
            {creation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer mon espace
          </Button>
        </form>
      </div>
    </main>
  );
}
