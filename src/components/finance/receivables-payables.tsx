import { Check, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatFCFA } from "@/lib/products/types";
import { basculerReglementCreance, basculerReglementDette } from "@/lib/finance/store";
import {
  STATUT_ECHEANCE_CLASSE,
  STATUT_ECHEANCE_LABEL,
  formatDateCourte,
  statutEcheance,
  type Creance,
  type Dette,
} from "@/lib/finance/types";
import { cn } from "@/lib/utils";

type Ligne = {
  id: string;
  nom: string;
  montant: number;
  date: string;
  echeance: string;
  regle: boolean;
  observation: string;
};

function TableauEcheances({
  titre,
  description,
  entete,
  lignes,
  onBasculer,
}: {
  titre: string;
  description: string;
  entete: string;
  lignes: Ligne[];
  onBasculer: (id: string) => void;
}) {
  const total = lignes.filter((l) => !l.regle).reduce((t, l) => t + l.montant, 0);

  return (
    <SectionCard
      title={titre}
      description={`${description} · ${formatFCFA(total)} en attente`}
    >
      {lignes.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Aucune ligne à suivre.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                <th className="px-3 py-2 font-medium">{entete}</th>
                <th className="px-3 py-2 text-right font-medium">Montant</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Échéance</th>
                <th className="px-3 py-2 font-medium">Statut</th>
                <th className="px-3 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne) => {
                const statut = statutEcheance(ligne);
                return (
                  <tr
                    key={ligne.id}
                    className="border-b border-border/70 transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-foreground">{ligne.nom}</p>
                      {ligne.observation && (
                        <p className="max-w-[260px] truncate text-xs text-muted-foreground">
                          {ligne.observation}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-foreground">
                      {formatFCFA(ligne.montant)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                      {formatDateCourte(ligne.date)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                      {formatDateCourte(ligne.echeance)}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge
                        variant="secondary"
                        className={cn("border-0", STATUT_ECHEANCE_CLASSE[statut])}
                      >
                        {STATUT_ECHEANCE_LABEL[statut]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          onBasculer(ligne.id);
                          toast.success(
                            ligne.regle ? "Ligne remise en attente." : "Ligne marquée réglée.",
                          );
                        }}
                      >
                        {ligne.regle ? (
                          <>
                            <Undo2 className="mr-1.5 h-3.5 w-3.5" /> Rouvrir
                          </>
                        ) : (
                          <>
                            <Check className="mr-1.5 h-3.5 w-3.5" /> Régler
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

export function ReceivablesTable({ creances }: { creances: Creance[] }) {
  return (
    <TableauEcheances
      titre="Créances clients"
      description="Sommes que vos clients vous doivent"
      entete="Nom"
      lignes={creances}
      onBasculer={basculerReglementCreance}
    />
  );
}

export function PayablesTable({ dettes }: { dettes: Dette[] }) {
  return (
    <TableauEcheances
      titre="Dettes fournisseurs"
      description="Sommes que vous devez à vos fournisseurs"
      entete="Fournisseur"
      lignes={dettes.map((d) => ({ ...d, nom: d.fournisseur }))}
      onBasculer={basculerReglementDette}
    />
  );
}
