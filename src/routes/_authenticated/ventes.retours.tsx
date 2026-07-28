import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateCourt, formatFCFA, formatHeure } from "@/lib/products/types";
import { VENDEURS } from "@/lib/sales/demo-data";
import { enregistrerRetour, useSalesStore } from "@/lib/sales/store";
import { MOTIFS_RETOUR, totalVente } from "@/lib/sales/types";

const DESCRIPTION = "Enregistrez un retour produit : le stock est réajusté automatiquement.";

export const Route = createFileRoute("/_authenticated/ventes/retours")({
  head: () => ({
    meta: [
      { title: "Retours produits — Bekaye Sora Business Manager" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Retours produits — Bekaye Sora Business Manager" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: RetoursPage,
});

function RetoursPage() {
  const { ventes, retours } = useSalesStore();
  const [venteId, setVenteId] = useState("");
  const [quantites, setQuantites] = useState<Record<string, number>>({});
  const [motif, setMotif] = useState<string>(MOTIFS_RETOUR[0]);
  const [utilisateur, setUtilisateur] = useState<string>(VENDEURS[0]);

  const eligibles = useMemo(
    () => ventes.filter((v) => v.statut !== "annulee").sort((a, b) => b.date.localeCompare(a.date)),
    [ventes],
  );
  const vente = eligibles.find((v) => v.id === venteId) ?? null;

  const montant = vente
    ? vente.lignes.reduce((t, l) => t + (quantites[l.produitId] ?? 0) * l.prixUnitaire, 0)
    : 0;

  const valider = () => {
    if (!vente) return;
    const lignes = vente.lignes
      .filter((l) => (quantites[l.produitId] ?? 0) > 0)
      .map((l) => ({
        produitId: l.produitId,
        quantite: quantites[l.produitId],
        montant: quantites[l.produitId] * l.prixUnitaire,
      }));
    if (lignes.length === 0) {
      toast.warning("Sélectionnez au moins un produit à retourner.");
      return;
    }
    const retour = enregistrerRetour({ venteId: vente.id, lignes, motif, utilisateur });
    if (retour) {
      toast.success(`Retour ${retour.numero} enregistré`, {
        description: `${formatFCFA(retour.montant)} · stock réintégré automatiquement.`,
      });
      setQuantites({});
      setVenteId("");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Commerce" title="Retours produits" description={DESCRIPTION} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard title="Nouveau retour" description="Choisissez la facture concernée">
          <div className="grid gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Facture</Label>
              <select
                value={venteId}
                onChange={(e) => {
                  setVenteId(e.target.value);
                  setQuantites({});
                }}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Sélectionner une facture…</option>
                {eligibles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.numero} — {v.client} — {formatFCFA(totalVente(v))}
                  </option>
                ))}
              </select>
            </div>

            {vente && (
              <ul className="flex flex-col gap-2">
                {vente.lignes.map((ligne) => (
                  <li
                    key={ligne.id}
                    className="grid grid-cols-[minmax(0,1fr)_110px] items-center gap-2 rounded-xl border border-border bg-background px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{ligne.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        Vendu : {ligne.quantite} × {formatFCFA(ligne.prixUnitaire)}
                      </p>
                    </div>
                    <Input
                      value={quantites[ligne.produitId] ?? ""}
                      onChange={(e) =>
                        setQuantites((q) => ({
                          ...q,
                          [ligne.produitId]: Math.min(
                            ligne.quantite,
                            Math.max(0, Number(e.target.value) || 0),
                          ),
                        }))
                      }
                      inputMode="numeric"
                      placeholder="Qté retour"
                      className="h-9 text-right"
                    />
                  </li>
                ))}
              </ul>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Motif</Label>
                <select
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {MOTIFS_RETOUR.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Enregistré par</Label>
                <select
                  value={utilisateur}
                  onChange={(e) => setUtilisateur(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {VENDEURS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
              <span className="text-sm text-muted-foreground">Montant du retour</span>
              <span className="font-display text-lg font-semibold text-primary">
                {formatFCFA(montant)}
              </span>
            </div>

            <Button className="gap-2" disabled={!vente} onClick={valider}>
              <RotateCcw className="h-4 w-4" />
              Valider le retour
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Retours enregistrés" description="Historique des réajustements">
          {retours.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun retour enregistré.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {retours.map((retour) => (
                <li
                  key={retour.id}
                  className="rounded-xl border border-border bg-background px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{retour.numero}</p>
                    <p className="text-sm font-semibold text-primary">
                      {formatFCFA(retour.montant)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {retour.venteNumero} · {retour.motif} · {retour.utilisateur} ·{" "}
                    {formatDateCourt(retour.date)} à {formatHeure(retour.date)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
