import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";

import { ActivityLog } from "@/components/hr/activity-log";
import { EmployeeAvatar } from "@/components/hr/employee-avatar";
import { PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { calculerPerformances, ventesDeLEmploye } from "@/lib/hr/analytics";
import { imprimerBulletin } from "@/lib/hr/print";
import { useHrStore } from "@/lib/hr/store";
import {
  PERMISSIONS,
  ROLE_LABEL,
  STATUT_CONGE_LABEL,
  STATUT_EMPLOYE_CLASSE,
  STATUT_EMPLOYE_LABEL,
  TYPE_CONGE_LABEL,
  formatDuree,
  formatMois,
  joursConge,
  minutesEntre,
  permissionsEffectives,
  salaireNet,
} from "@/lib/hr/types";
import { formatDate, formatFCFA } from "@/lib/products/types";
import { useSalesStore } from "@/lib/sales/store";
import { totalVente } from "@/lib/sales/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/employes/$employeId")({
  component: FicheEmploye,
});

function FicheEmploye() {
  const { employeId } = Route.useParams();
  const { employes, presences, conges, bulletins, activites } = useHrStore();
  const { ventes } = useSalesStore();

  const employe = employes.find((e) => e.id === employeId) ?? null;

  const performance = useMemo(
    () => (employe ? calculerPerformances([employe], ventes, presences)[0] : null),
    [employe, ventes, presences],
  );

  if (!employe) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">Cet employé est introuvable.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/employes">Retour à l'équipe</Link>
        </Button>
      </div>
    );
  }

  const sesPresences = presences
    .filter((p) => p.employeId === employe.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);
  const sesConges = conges.filter((c) => c.employeId === employe.id);
  const sesBulletins = bulletins
    .filter((b) => b.employeId === employe.id)
    .sort((a, b) => b.mois.localeCompare(a.mois));
  const sesVentes = ventesDeLEmploye(ventes, employe).slice(0, 8);
  const sesActivites = activites.filter((a) => a.employeId === employe.id);
  const permissions = permissionsEffectives(employe);

  return (
    <div className="flex flex-col gap-5">
      <Button asChild variant="ghost" className="w-fit px-2 text-muted-foreground">
        <Link to="/employes">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à l'équipe
        </Link>
      </Button>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start gap-4">
          <EmployeeAvatar employe={employe} taille="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-foreground">{employe.nom}</h1>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  STATUT_EMPLOYE_CLASSE[employe.statut],
                )}
              >
                {STATUT_EMPLOYE_LABEL[employe.statut]}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {employe.fonction} · {ROLE_LABEL[employe.role]} · {employe.departement} ·{" "}
              {employe.matricule}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <a href={`tel:${employe.telephone}`}>
                  <Phone className="mr-1.5 h-4 w-4" /> Appeler
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a
                  href={`https://wa.me/${employe.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>

        <dl className="mt-5 grid gap-4 border-t border-border pt-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
          <Info label="Téléphone" value={employe.telephone} />
          <Info label="Email" value={employe.email || "—"} />
          <Info label="Adresse" value={employe.adresse || "—"} />
          <Info label="Date de naissance" value={employe.dateNaissance || "—"} />
          <Info label="Date d'embauche" value={employe.dateEmbauche} />
          <Info label="Salaire de base" value={formatFCFA(employe.salaireBase)} />
          <Info
            label="Objectif mensuel"
            value={employe.objectifMensuel ? formatFCFA(employe.objectifMensuel) : "—"}
          />
          <Info
            label="Dernière connexion"
            value={employe.derniereConnexion ? formatDate(employe.derniereConnexion) : "Jamais"}
          />
        </dl>
        {employe.notes && (
          <p className="mt-4 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
            {employe.notes}
          </p>
        )}
      </section>

      {performance && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Ventes du mois" value={String(performance.nombreVentes)} />
          <Stat
            label="Chiffre d'affaires"
            value={formatFCFA(performance.chiffreAffaires)}
            hint={
              performance.objectif
                ? `${performance.progression} % de l'objectif`
                : "Aucun objectif fixé"
            }
          />
          <Stat label="Taux de présence" value={`${performance.tauxPresence} %`} />
          <Stat
            label="Heures travaillées"
            value={formatDuree(performance.heuresTravaillees)}
            hint={`${performance.retards} retard(s)`}
          />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Bloc titre="Dernières ventes réalisées">
          {sesVentes.length === 0 ? (
            <Vide texte="Aucune vente enregistrée pour cet employé." />
          ) : (
            <ul className="flex flex-col gap-2">
              {sesVentes.map((vente) => (
                <li
                  key={vente.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{vente.numero}</p>
                    <p className="text-xs text-muted-foreground">
                      {vente.client} · {formatDate(vente.date)}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold">{formatFCFA(totalVente(vente))}</span>
                </li>
              ))}
            </ul>
          )}
        </Bloc>

        <Bloc titre="Historique de présence">
          {sesPresences.length === 0 ? (
            <Vide texte="Aucun pointage enregistré." />
          ) : (
            <ul className="flex flex-col gap-2">
              {sesPresences.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm"
                >
                  <span className="text-foreground">{p.date}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.arrivee ?? "—"} → {p.depart ?? "—"} ·{" "}
                    {formatDuree(minutesEntre(p.arrivee, p.depart))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Bloc>

        <Bloc titre="Congés">
          {sesConges.length === 0 ? (
            <Vide texte="Aucun congé enregistré." />
          ) : (
            <ul className="flex flex-col gap-2">
              {sesConges.map((c) => (
                <li key={c.id} className="rounded-xl border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{TYPE_CONGE_LABEL[c.type]}</span>
                    <span className="text-xs text-muted-foreground">
                      {STATUT_CONGE_LABEL[c.statut]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {c.dateDebut} → {c.dateFin} · {joursConge(c)} jour(s)
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Bloc>

        <Bloc titre="Bulletins de paie">
          {sesBulletins.length === 0 ? (
            <Vide texte="Aucun bulletin disponible." />
          ) : (
            <ul className="flex flex-col gap-2">
              {sesBulletins.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">{formatMois(b.mois)}</p>
                    <p className="text-xs text-muted-foreground">
                      Net : {formatFCFA(salaireNet(b))}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => imprimerBulletin(b, employe)}>
                    Bulletin
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Bloc>

        <Bloc titre="Permissions actives">
          <div className="flex flex-wrap gap-2">
            {PERMISSIONS.filter((p) => permissions.includes(p.value)).map((p) => (
              <span
                key={p.value}
                className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary"
              >
                {p.label}
              </span>
            ))}
          </div>
        </Bloc>

        <ActivityLog activites={sesActivites} titre="Activité de l'employé" />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-card)]">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <h2 className="text-sm font-semibold text-foreground">{titre}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Vide({ texte }: { texte: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{texte}</p>;
}
