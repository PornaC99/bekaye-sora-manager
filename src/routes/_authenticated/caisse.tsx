import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Banknote, LockKeyhole, Printer, Unlock, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { SectionCard } from "@/components/dashboard/section-card";
import { NotificationsFeed } from "@/components/sales/notifications-feed";
import { SummaryCards } from "@/components/stock-entries/summary-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateCourt, formatFCFA, formatHeure } from "@/lib/products/types";
import { VENDEURS } from "@/lib/sales/demo-data";
import { imprimerRapportCaisse } from "@/lib/sales/print";
import { fermerCaisse, ouvrirCaisse, useSalesStore } from "@/lib/sales/store";
import { soldeCaisse, totalParType, TYPE_OPERATION_LABEL } from "@/lib/sales/types";

const TITLE = "Caisse";
const DESCRIPTION = "Ouvrez, suivez et clôturez la caisse en toute simplicité.";

export const Route = createFileRoute("/_authenticated/caisse")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: CaissePage,
});

function CaissePage() {
  const { sessions, notifications } = useSalesStore();
  const session = sessions.find((s) => !s.dateFermeture) ?? null;
  const [fondsOuverture, setFondsOuverture] = useState(50000);
  const [caissier, setCaissier] = useState<string>(VENDEURS[0]);
  const [montantReel, setMontantReel] = useState(0);
  const [observation, setObservation] = useState("");

  const theorique = session ? soldeCaisse(session) : 0;
  const ecart = montantReel - theorique;

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
      <PageHeader
        eyebrow="Commerce"
        title={TITLE}
        description={DESCRIPTION}
        actions={
          session && (
            <Button variant="outline" className="gap-2" onClick={() => imprimerRapportCaisse(session)}>
              <Printer className="h-4 w-4" />
              Rapport de caisse
            </Button>
          )
        }
      />

      {session ? (
        <>
          <SummaryCards
            cartes={[
              {
                label: "Solde théorique",
                value: formatFCFA(theorique),
                icon: Wallet,
                tone: "primary",
              },
              {
                label: "Montant d'ouverture",
                value: formatFCFA(session.montantOuverture),
                icon: Unlock,
              },
              {
                label: "Ventes espèces",
                value: formatFCFA(totalParType(session, "vente")),
                icon: Banknote,
              },
              {
                label: "Dépenses",
                value: formatFCFA(totalParType(session, "depense")),
                icon: Banknote,
              },
              {
                label: "Retours",
                value: formatFCFA(totalParType(session, "retour")),
                icon: Banknote,
              },
            ]}
          />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <SectionCard
              title="Opérations de la caisse"
              description={`${session.numero} · ouverte le ${formatDateCourt(session.dateOuverture)} à ${formatHeure(session.dateOuverture)} par ${session.utilisateur}`}
              bodyClassName="px-0 py-0"
            >
              <div className="overflow-x-auto scrollbar-slim">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Heure</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Opération</th>
                      <th className="px-4 py-3 font-semibold">Utilisateur</th>
                      <th className="px-4 py-3 text-right font-semibold">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...session.operations]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((operation) => (
                        <tr key={operation.id} className="border-b border-border/70 last:border-0">
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDateCourt(operation.date)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatHeure(operation.date)}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {TYPE_OPERATION_LABEL[operation.type]}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{operation.libelle}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {operation.utilisateur}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">
                            {formatFCFA(operation.montant)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <div className="flex flex-col gap-5">
              <SectionCard title="Fermeture de caisse" description="Comptez le tiroir puis clôturez">
                <div className="grid gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Montant réel compté</Label>
                    <Input
                      value={montantReel || ""}
                      onChange={(e) => setMontantReel(Number(e.target.value) || 0)}
                      inputMode="numeric"
                      placeholder="0"
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Observation</Label>
                    <Input
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      placeholder="Facultatif"
                      className="h-10"
                    />
                  </div>
                  <dl className="space-y-1 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <dt>Montant théorique</dt>
                      <dd>{formatFCFA(theorique)}</dd>
                    </div>
                    <div className="flex justify-between font-semibold text-foreground">
                      <dt>Écart</dt>
                      <dd>{formatFCFA(ecart)}</dd>
                    </div>
                  </dl>
                  <Button
                    className="gap-2"
                    onClick={() => {
                      fermerCaisse({
                        sessionId: session.id,
                        montantReel,
                        observation,
                        utilisateur: session.utilisateur,
                      });
                      toast.success("Caisse fermée", {
                        description: `Écart constaté : ${formatFCFA(ecart)}`,
                      });
                      setObservation("");
                      setMontantReel(0);
                    }}
                  >
                    <LockKeyhole className="h-4 w-4" />
                    Fermer la caisse
                  </Button>
                </div>
              </SectionCard>

              <SectionCard title="Notifications" description="Activité récente">
                <NotificationsFeed notifications={notifications} limite={5} />
              </SectionCard>
            </div>
          </div>
        </>
      ) : (
        <SectionCard title="Ouvrir la caisse" description="Aucune caisse n'est ouverte actuellement">
          <div className="grid gap-3 sm:max-w-md">
            <div>
              <Label className="text-xs text-muted-foreground">Fonds de caisse (FCFA)</Label>
              <Input
                value={fondsOuverture || ""}
                onChange={(e) => setFondsOuverture(Number(e.target.value) || 0)}
                inputMode="numeric"
                className="h-10"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Caissier</Label>
              <select
                value={caissier}
                onChange={(e) => setCaissier(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {VENDEURS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <Button
              className="gap-2"
              onClick={() => {
                ouvrirCaisse({ montantOuverture: fondsOuverture, utilisateur: caissier });
                toast.success("Caisse ouverte", {
                  description: `Fonds de caisse : ${formatFCFA(fondsOuverture)}`,
                });
              }}
            >
              <Unlock className="h-4 w-4" />
              Ouvrir la caisse
            </Button>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Sessions précédentes" description="Historique des clôtures">
        <ul className="flex flex-col gap-2">
          {sessions
            .filter((s) => s.dateFermeture)
            .map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{s.numero}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateCourt(s.dateOuverture)} · {s.utilisateur} · Réel{" "}
                    {formatFCFA(s.montantReel ?? 0)} · Écart{" "}
                    {formatFCFA((s.montantReel ?? 0) - soldeCaisse(s))}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => imprimerRapportCaisse(s)}>
                  <Printer className="mr-2 h-4 w-4" /> Rapport
                </Button>
              </li>
            ))}
        </ul>
      </SectionCard>
    </div>
  );
}
