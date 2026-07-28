import { useEffect, useMemo, useState } from "react";
import { Banknote, CreditCard, Smartphone, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatFCFA } from "@/lib/products/types";
import { MODES_PAIEMENT, type ModePaiement, type Paiement } from "@/lib/sales/types";
import { cn } from "@/lib/utils";

const ICONES: Record<ModePaiement, typeof Banknote> = {
  especes: Banknote,
  orange_money: Smartphone,
  moov_money: Smartphone,
  wave: Wallet,
  carte: CreditCard,
};

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  total: number;
  onConfirm: (paiements: Paiement[], montantRecu: number) => void;
}) {
  const [mixte, setMixte] = useState(false);
  const [mode, setMode] = useState<ModePaiement>("especes");
  const [montantRecu, setMontantRecu] = useState<number>(total);
  const [repartition, setRepartition] = useState<Record<ModePaiement, number>>({
    especes: 0,
    orange_money: 0,
    moov_money: 0,
    wave: 0,
    carte: 0,
  });

  useEffect(() => {
    if (!open) return;
    setMixte(false);
    setMode("especes");
    setMontantRecu(total);
    setRepartition({ especes: 0, orange_money: 0, moov_money: 0, wave: 0, carte: 0 });
  }, [open, total]);

  const totalMixte = useMemo(
    () => Object.values(repartition).reduce((t, v) => t + (v || 0), 0),
    [repartition],
  );

  const recu = mixte ? totalMixte : montantRecu;
  const monnaie = Math.max(0, recu - total);
  const manque = Math.max(0, total - recu);
  const valide = mixte ? totalMixte >= total : montantRecu >= total || mode !== "especes";

  const confirmer = () => {
    if (mixte) {
      const paiements = (Object.entries(repartition) as [ModePaiement, number][])
        .filter(([, montant]) => montant > 0)
        .map(([m, montant]) => ({ mode: m, montant }));
      onConfirm(paiements, totalMixte);
    } else {
      onConfirm([{ mode, montant: total }], mode === "especes" ? montantRecu : total);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Encaissement</DialogTitle>
          <DialogDescription>
            Choisissez le mode de paiement puis validez pour générer la facture.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-center">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Montant à payer
          </p>
          <p className="font-display text-3xl font-semibold text-primary">{formatFCFA(total)}</p>
        </div>

        {!mixte ? (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MODES_PAIEMENT.map((m) => {
                const Icone = ICONES[m.value];
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition",
                      mode === m.value
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    <Icone className="h-5 w-5" />
                    {m.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setMixte(true)}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-3 text-xs font-medium text-muted-foreground transition hover:border-primary/40"
              >
                <Wallet className="h-5 w-5" />
                Paiement mixte
              </button>
            </div>

            {mode === "especes" && (
              <div className="grid gap-2">
                <Label>Montant reçu</Label>
                <Input
                  value={montantRecu || ""}
                  onChange={(e) => setMontantRecu(Number(e.target.value) || 0)}
                  inputMode="numeric"
                  className="h-11 text-lg"
                  autoFocus
                />
                <div className="flex flex-wrap gap-2">
                  {[total, 5000, 10000, 20000, 50000].map((v, i) => (
                    <Button
                      key={`${v}-${i}`}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMontantRecu(v)}
                    >
                      {formatFCFA(v)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Répartition du paiement</Label>
              <Button variant="ghost" size="sm" onClick={() => setMixte(false)}>
                Paiement simple
              </Button>
            </div>
            {MODES_PAIEMENT.map((m) => (
              <div key={m.value} className="grid grid-cols-[1fr_140px] items-center gap-2">
                <span className="text-sm text-muted-foreground">{m.label}</span>
                <Input
                  value={repartition[m.value] || ""}
                  onChange={(e) =>
                    setRepartition((r) => ({ ...r, [m.value]: Number(e.target.value) || 0 }))
                  }
                  inputMode="numeric"
                  placeholder="0"
                  className="h-9 text-right"
                />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border px-4 py-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Monnaie à rendre</p>
            <p className="font-display text-lg font-semibold text-success">{formatFCFA(monnaie)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Reste à payer</p>
            <p className="font-display text-lg font-semibold text-foreground">
              {formatFCFA(manque)}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button disabled={!valide} onClick={confirmer}>
            Valider l'encaissement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
