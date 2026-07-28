import { useMemo, useState } from "react";
import { Download, FileText, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatFCFA } from "@/lib/products/types";
import { enregistrerBulletin, genererBulletinsDuMois, payerBulletin } from "@/lib/hr/store";
import { exporterCsv, imprimerBulletin } from "@/lib/hr/print";
import {
  MODES_PAIEMENT_SALAIRE,
  MODE_PAIEMENT_SALAIRE_LABEL,
  STATUT_PAIE_CLASSE,
  STATUT_PAIE_LABEL,
  formatMois,
  salaireNet,
  type BulletinPaie,
  type Employe,
  type ModePaiementSalaire,
} from "@/lib/hr/types";
import { cn } from "@/lib/utils";
import { EmployeeAvatar } from "./employee-avatar";

export function PayrollTable({
  employes,
  bulletins,
  mois,
  onMoisChange,
  moisDisponibles,
}: {
  employes: Employe[];
  bulletins: BulletinPaie[];
  mois: string;
  onMoisChange: (mois: string) => void;
  moisDisponibles: string[];
}) {
  const [edite, setEdite] = useState<BulletinPaie | null>(null);

  const lignes = useMemo(
    () =>
      bulletins
        .filter((b) => b.mois === mois)
        .map((b) => ({ bulletin: b, employe: employes.find((e) => e.id === b.employeId) ?? null }))
        .filter((l): l is { bulletin: BulletinPaie; employe: Employe } => Boolean(l.employe)),
    [bulletins, employes, mois],
  );

  const total = lignes.reduce((acc, l) => acc + salaireNet(l.bulletin), 0);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select value={mois} onValueChange={onMoisChange}>
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {moisDisponibles.map((m) => (
                <SelectItem key={m} value={m}>
                  {formatMois(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            Total net : <strong className="text-foreground">{formatFCFA(total)}</strong>
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const nb = genererBulletinsDuMois(mois);
              toast.success(
                nb ? `${nb} bulletin(s) généré(s).` : "Tous les bulletins existent déjà.",
              );
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Générer les bulletins
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              exporterCsv(
                `salaires-${mois}.csv`,
                ["Matricule", "Employé", "Base", "Primes", "Avances", "Retenues", "Net", "Statut"],
                lignes.map((l) => [
                  l.employe.matricule,
                  l.employe.nom,
                  l.bulletin.salaireBase,
                  l.bulletin.primes,
                  l.bulletin.avances,
                  l.bulletin.retenues,
                  salaireNet(l.bulletin),
                  STATUT_PAIE_LABEL[l.bulletin.statut],
                ]),
              );
              toast.success("Export Excel (CSV) téléchargé.");
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Exporter
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Employé</th>
                <th className="px-4 py-3 text-right font-medium">Base</th>
                <th className="px-4 py-3 text-right font-medium">Primes</th>
                <th className="px-4 py-3 text-right font-medium">Heures sup.</th>
                <th className="px-4 py-3 text-right font-medium">Avances</th>
                <th className="px-4 py-3 text-right font-medium">Retenues</th>
                <th className="px-4 py-3 text-right font-medium">Net à payer</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lignes.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    Aucun bulletin pour {formatMois(mois)}.
                  </td>
                </tr>
              )}
              {lignes.map(({ bulletin, employe }) => (
                <tr key={bulletin.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar employe={employe} taille="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{employe.nom}</p>
                        <p className="text-xs text-muted-foreground">{employe.fonction}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">{formatFCFA(bulletin.salaireBase)}</td>
                  <td className="px-4 py-3 text-right">{formatFCFA(bulletin.primes)}</td>
                  <td className="px-4 py-3 text-right">
                    {bulletin.heuresSupplementaires} h
                  </td>
                  <td className="px-4 py-3 text-right">− {formatFCFA(bulletin.avances)}</td>
                  <td className="px-4 py-3 text-right">− {formatFCFA(bulletin.retenues)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    {formatFCFA(salaireNet(bulletin))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        STATUT_PAIE_CLASSE[bulletin.statut],
                      )}
                    >
                      {STATUT_PAIE_LABEL[bulletin.statut]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEdite(bulletin)}>
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => imprimerBulletin(bulletin, employe)}
                      >
                        <FileText className="mr-1.5 h-4 w-4" /> Bulletin
                      </Button>
                      {bulletin.statut !== "paye" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            payerBulletin(bulletin.id, bulletin.modePaiement);
                            toast.success(
                              `Salaire de ${employe.nom} payé (${MODE_PAIEMENT_SALAIRE_LABEL[bulletin.modePaiement]}).`,
                            );
                          }}
                        >
                          <Wallet className="mr-1.5 h-4 w-4" /> Payer
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PayslipDialog bulletin={edite} onClose={() => setEdite(null)} />
    </section>
  );
}

function PayslipDialog({
  bulletin,
  onClose,
}: {
  bulletin: BulletinPaie | null;
  onClose: () => void;
}) {
  const [brouillon, setBrouillon] = useState<BulletinPaie | null>(bulletin);

  if (bulletin && brouillon?.id !== bulletin.id) setBrouillon(bulletin);
  const courant = brouillon;

  return (
    <Dialog open={Boolean(bulletin)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier le bulletin</DialogTitle>
          <DialogDescription>
            Ajustez les primes, heures supplémentaires, avances et retenues.
          </DialogDescription>
        </DialogHeader>

        {courant && (
          <div className="grid gap-4 sm:grid-cols-2">
            <ChampNombre
              label="Salaire de base"
              value={courant.salaireBase}
              onChange={(v) => setBrouillon({ ...courant, salaireBase: v })}
            />
            <ChampNombre
              label="Primes / commissions"
              value={courant.primes}
              onChange={(v) => setBrouillon({ ...courant, primes: v })}
            />
            <ChampNombre
              label="Heures supplémentaires"
              value={courant.heuresSupplementaires}
              onChange={(v) => setBrouillon({ ...courant, heuresSupplementaires: v })}
            />
            <ChampNombre
              label="Taux horaire sup."
              value={courant.tauxHeureSupplementaire}
              onChange={(v) => setBrouillon({ ...courant, tauxHeureSupplementaire: v })}
            />
            <ChampNombre
              label="Avances"
              value={courant.avances}
              onChange={(v) => setBrouillon({ ...courant, avances: v })}
            />
            <ChampNombre
              label="Retenues"
              value={courant.retenues}
              onChange={(v) => setBrouillon({ ...courant, retenues: v })}
            />
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Mode de paiement</Label>
              <Select
                value={courant.modePaiement}
                onValueChange={(v) =>
                  setBrouillon({ ...courant, modePaiement: v as ModePaiementSalaire })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODES_PAIEMENT_SALAIRE.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Observation</Label>
              <Textarea
                rows={2}
                value={courant.observation}
                onChange={(e) => setBrouillon({ ...courant, observation: e.target.value })}
              />
            </div>
            <p className="sm:col-span-2 rounded-xl bg-primary-soft px-4 py-3 text-sm font-semibold text-primary">
              Net à payer : {formatFCFA(salaireNet(courant))}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              if (courant) {
                enregistrerBulletin(courant);
                toast.success("Bulletin mis à jour.");
              }
              onClose();
            }}
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChampNombre({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
