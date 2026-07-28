import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bot, HelpCircle, RefreshCcw, Send, Sparkle } from "lucide-react";

import {
  CourbeEvolution,
  ListeInsights,
  NexusHeader,
  Pastille,
  SectionCard,
  StatTile,
} from "@/components/nexusia/pieces";
import { repondre } from "@/lib/nexusia/assistant";
import { useNexusia } from "@/lib/nexusia/insight";
import { poserQuestion, reinitialiserConversation } from "@/lib/nexusia/store";
import {
  QUESTIONS_FREQUENTES,
  SUGGESTIONS_RAPIDES,
  TON_CLASSE,
  formatPourcent,
} from "@/lib/nexusia/types";
import { formatFCFA } from "@/lib/products/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/nexusia/")({
  head: () => ({
    meta: [
      { title: "NEXUSIA Insight — Conseiller intelligent | Bekaye Sora" },
      {
        name: "description",
        content:
          "Posez vos questions et obtenez des réponses immédiates sur vos ventes, stocks, employés, clients et finances.",
      },
      { property: "og:title", content: "NEXUSIA Insight — Conseiller intelligent" },
      {
        property: "og:description",
        content: "Le copilote de gestion du Directeur de Bekaye Sora Business Manager.",
      },
    ],
  }),
  component: ConseillerPage,
});

function ConseillerPage() {
  const donnees = useNexusia();
  const [saisie, setSaisie] = useState("");
  const finRef = useRef<HTMLDivElement>(null);

  const envoyer = (question: string) => {
    const texte = question.trim();
    if (!texte) return;
    poserQuestion(texte, repondre(texte, donnees));
    setSaisie("");
    requestAnimationFrame(() => finRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  const serie = useMemo(
    () => donnees.mois.serie.map((p) => ({ label: p.label, ca: p.ca, benefice: p.benefice })),
    [donnees.mois.serie],
  );

  return (
    <div className="flex flex-col gap-5">
      <NexusHeader
        eyebrow="Copilote de direction"
        titre="NEXUSIA Insight"
        sous="Votre conseiller intelligent pour piloter votre entreprise."
        action={
          <button
            type="button"
            onClick={reinitialiserConversation}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
          >
            <RefreshCcw className="h-4 w-4" /> Nouvelle conversation
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Ventes du jour"
          valeur={formatFCFA(donnees.jour.kpis.chiffreAffaires)}
          detail={`${donnees.jour.kpis.nombreVentes} vente(s)`}
        />
        <StatTile
          label="Bénéfice du mois"
          valeur={formatFCFA(donnees.mois.kpis.benefice)}
          detail={`Marge ${donnees.mois.kpis.margeNette} %`}
          ton="succes"
        />
        <StatTile
          label="Alertes critiques"
          valeur={String(donnees.alertes.length)}
          detail={donnees.alertes.length > 0 ? "À traiter aujourd'hui" : "Tout est sous contrôle"}
          ton={donnees.alertes.length > 0 ? "danger" : "succes"}
        />
        <StatTile
          label="Fin de mois estimée"
          valeur={formatFCFA(donnees.mois.previsions.caPrevu)}
          detail={`Bénéfice ${formatFCFA(donnees.mois.previsions.beneficePrevu)}`}
          ton="info"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <SectionCard
          title="Conversation"
          description="Posez votre question en langage courant, la réponse est calculée sur vos données réelles."
          bodyClassName="flex flex-col gap-4"
        >
          <div className="flex max-h-[520px] min-h-[320px] flex-col gap-4 overflow-y-auto pr-1">
            {donnees.messages.map((message) =>
              message.role === "directeur" ? (
                <div key={message.id} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
                    {message.texte}
                  </p>
                </div>
              ) : (
                <div key={message.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 animate-in fade-in slide-in-from-bottom-1 duration-500">
                    {message.reponse && (
                      <p className="font-display text-sm font-semibold text-foreground">
                        {message.reponse.titre}
                      </p>
                    )}
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      {message.texte}
                    </p>
                    {message.reponse && message.reponse.points.length > 0 && (
                      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {message.reponse.points.map((point, i) => (
                          <li
                            key={`${message.id}-${i}`}
                            className={cn(
                              "rounded-xl border px-3 py-2",
                              point.ton ? TON_CLASSE[point.ton] : "border-border bg-background/60",
                            )}
                          >
                            <p className="text-[11px] uppercase tracking-wider opacity-80">
                              {point.label}
                            </p>
                            <p className="text-sm font-semibold">{point.valeur}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    {message.reponse?.conseil && (
                      <p className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground">
                        <Sparkle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        {message.reponse.conseil}
                      </p>
                    )}
                    {message.reponse?.lien && (
                      <Link
                        to={message.reponse.lien.to}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        {message.reponse.lien.label} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ),
            )}
            <div ref={finRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              envoyer(saisie);
            }}
            className="flex items-center gap-2 rounded-xl border border-border bg-background p-1.5"
          >
            <input
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder="Posez votre question au conseiller…"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
              disabled={!saisie.trim()}
              aria-label="Envoyer la question"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS_RAPIDES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => envoyer(s)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </SectionCard>

        <div className="flex flex-col gap-5">
          <SectionCard
            title="Questions fréquentes"
            description="Cliquez pour obtenir une réponse immédiate."
          >
            <ul className="flex flex-col gap-2">
              {QUESTIONS_FREQUENTES.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => envoyer(q)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-left text-sm transition hover:border-primary/40"
                  >
                    <span className="flex items-center gap-2 text-foreground">
                      <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
                      {q}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Notifications intelligentes" description="Ce que le système a repéré.">
            <ListeInsights
              items={donnees.notifications.map((n) => ({
                id: n.id,
                titre: n.titre,
                message: n.message,
                ton: n.ton,
              }))}
            />
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Tableau de bord intelligent"
        description="Synthèse automatique de votre activité."
        bodyClassName="grid gap-4 lg:grid-cols-2 xl:grid-cols-3"
      >
        {donnees.resumes.map((resume) => (
          <article
            key={resume.cle}
            className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-foreground">{resume.titre}</h3>
              {resume.evolution !== null && (
                <Pastille ton={resume.evolution >= 0 ? "succes" : "danger"}>
                  {formatPourcent(resume.evolution)}
                </Pastille>
              )}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{resume.phrase}</p>
            <dl className="grid grid-cols-2 gap-2">
              {resume.lignes.map((l) => (
                <div key={l.label} className="rounded-lg bg-muted/50 px-2.5 py-2">
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {l.label}
                  </dt>
                  <dd className="truncate text-sm font-semibold text-foreground">{l.valeur}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <SectionCard title="Évolution du mois" description="Chiffre d'affaires et bénéfice.">
          <CourbeEvolution
            data={serie}
            cles={[
              { cle: "ca", nom: "Chiffre d'affaires", couleur: "var(--chart-1)" },
              { cle: "benefice", nom: "Bénéfice", couleur: "var(--chart-2)" },
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Recommandations intelligentes"
          description="Les actions à fort impact identifiées par NEXUSIA."
        >
          <ListeInsights
            items={donnees.recommandations.slice(0, 5).map((r) => ({
              id: r.id,
              titre: r.titre,
              message: r.message,
              ton: r.ton,
              badge: `Impact ${r.impact}`,
            }))}
          />
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Alertes critiques" description="À traiter en priorité.">
          <ListeInsights
            items={donnees.alertes.map((a) => ({
              id: a.id,
              titre: a.titre,
              message: a.message,
              ton: a.gravite === "haute" ? "danger" : "alerte",
              badge: a.gravite === "haute" ? "Urgent" : "À surveiller",
            }))}
          />
        </SectionCard>

        <SectionCard title="Prévisions" description="Projection automatique de fin de mois.">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile
              label="Chiffre d'affaires prévu"
              valeur={formatFCFA(donnees.mois.previsions.caPrevu)}
              detail={`Réalisé ${formatFCFA(donnees.mois.previsions.caRealise)}`}
            />
            <StatTile
              label="Bénéfice probable"
              valeur={formatFCFA(donnees.mois.previsions.beneficePrevu)}
              detail={`${donnees.mois.previsions.joursEcoules}/${donnees.mois.previsions.joursDuMois} jours`}
              ton="succes"
            />
            <StatTile
              label="Besoins de trésorerie"
              valeur={formatFCFA(donnees.mois.previsions.depensesPrevues)}
              detail="Dépenses projetées"
              ton="alerte"
            />
            <StatTile
              label="Ruptures anticipées"
              valeur={String(donnees.mois.previsions.risquesRupture.length)}
              detail="Sur les 10 prochains jours"
              ton="danger"
            />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Commandes à préparer
            </p>
            {donnees.mois.previsions.besoins.slice(0, 4).map((b) => (
              <div
                key={b.produit.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm"
              >
                <span className="truncate text-foreground">{b.produit.nom}</span>
                <span className="shrink-0 font-semibold text-primary">
                  {b.besoinEstime} unités
                </span>
              </div>
            ))}
            {donnees.mois.previsions.besoins.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun réapprovisionnement urgent.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
