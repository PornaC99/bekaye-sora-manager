import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  BarreProgression,
  NexusHeader,
  Pastille,
  SectionCard,
  StatTile,
} from "@/components/nexusia/pieces";
import { useNexusia } from "@/lib/nexusia/insight";
import { ajouterObjectif, supprimerObjectif } from "@/lib/nexusia/store";
import { INDICATEURS_OBJECTIF, formatNombre, type IndicateurObjectif } from "@/lib/nexusia/types";
import { formatFCFA } from "@/lib/products/types";

export const Route = createFileRoute("/_authenticated/nexusia/objectifs")({
  head: () => ({
    meta: [
      { title: "Objectifs & suivi — NEXUSIA Insight | Bekaye Sora" },
      {
        name: "description",
        content:
          "Définissez vos objectifs de chiffre d'affaires, de bénéfice ou de clients et suivez automatiquement leur progression.",
      },
      { property: "og:title", content: "Objectifs & suivi — NEXUSIA Insight" },
      {
        property: "og:description",
        content: "Le suivi automatique des objectifs du Directeur.",
      },
    ],
  }),
  component: ObjectifsPage,
});

const dateParDefaut = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
};

function ObjectifsPage() {
  const donnees = useNexusia();
  const [intitule, setIntitule] = useState("");
  const [indicateur, setIndicateur] = useState<IndicateurObjectif>("chiffreAffaires");
  const [cible, setCible] = useState("");
  const [echeance, setEcheance] = useState(dateParDefaut());

  const suivis = donnees.suivis;
  const atteints = suivis.filter((s) => s.progression >= 100).length;
  const moyenne = suivis.length
    ? Math.round(suivis.reduce((t, s) => t + s.progression, 0) / suivis.length)
    : 0;

  const valeurFormatee = (valeur: number, unite: "FCFA" | "unite") =>
    unite === "FCFA" ? formatFCFA(valeur) : formatNombre(valeur);

  const soumettre = (event: React.FormEvent) => {
    event.preventDefault();
    const montant = Number(cible);
    if (!intitule.trim() || !Number.isFinite(montant) || montant <= 0) {
      toast.error("Objectif incomplet", {
        description: "Renseignez un intitulé et une cible supérieure à zéro.",
      });
      return;
    }
    ajouterObjectif({ intitule: intitule.trim(), indicateur, cible: montant, echeance });
    setIntitule("");
    setCible("");
    toast.success("Objectif enregistré", { description: "Le suivi démarre immédiatement." });
  };

  return (
    <div className="flex flex-col gap-5">
      <NexusHeader
        eyebrow="Pilotage"
        titre="Objectifs & suivi automatique"
        sous="Fixez vos ambitions, NEXUSIA mesure la progression en temps réel."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Objectifs suivis" valeur={formatNombre(suivis.length)} detail="En cours" />
        <StatTile
          label="Objectifs atteints"
          valeur={`${atteints}/${suivis.length}`}
          detail="Sur la période"
          ton={atteints > 0 ? "succes" : "alerte"}
        />
        <StatTile
          label="Progression moyenne"
          valeur={`${moyenne} %`}
          detail="Tous objectifs confondus"
          ton={moyenne >= 80 ? "succes" : moyenne >= 50 ? "info" : "alerte"}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <SectionCard
          title="Suivi des objectifs"
          description="Progression calculée sur vos données réelles."
        >
          <ul className="flex flex-col gap-4">
            {suivis.map((s) => (
              <li
                key={s.objectif.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                      <Target className="h-4 w-4 shrink-0 text-primary" />
                      {s.objectif.intitule}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s.label} · échéance le{" "}
                      {new Date(s.objectif.echeance).toLocaleDateString("fr-FR")} ({s.joursRestants}{" "}
                      jour(s) restants)
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Pastille
                      ton={
                        s.progression >= 100 ? "succes" : s.progression >= 60 ? "info" : "alerte"
                      }
                    >
                      {s.progression} %
                    </Pastille>
                    <button
                      type="button"
                      onClick={() => {
                        supprimerObjectif(s.objectif.id);
                        toast.success("Objectif supprimé");
                      }}
                      className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-primary"
                      aria-label={`Supprimer l'objectif ${s.objectif.intitule}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <BarreProgression
                  valeur={s.progression}
                  ton={s.progression >= 100 ? "succes" : s.progression >= 60 ? "info" : "alerte"}
                />
                <p className="text-xs text-muted-foreground">
                  {valeurFormatee(s.realise, s.unite)} réalisés sur{" "}
                  {valeurFormatee(s.objectif.cible, s.unite)} visés.
                </p>
              </li>
            ))}
            {suivis.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucun objectif défini. Créez votre premier objectif à droite.
              </p>
            )}
          </ul>
        </SectionCard>

        <SectionCard title="Nouvel objectif" description="Le suivi est automatique.">
          <form onSubmit={soumettre} className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Intitulé</span>
              <input
                value={intitule}
                onChange={(e) => setIntitule(e.target.value)}
                placeholder="Ex. Atteindre 5 000 000 FCFA ce mois"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Indicateur suivi</span>
              <select
                value={indicateur}
                onChange={(e) => setIndicateur(e.target.value as IndicateurObjectif)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
              >
                {INDICATEURS_OBJECTIF.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Cible</span>
              <input
                value={cible}
                onChange={(e) => setCible(e.target.value)}
                inputMode="numeric"
                placeholder="5000000"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Échéance</span>
              <input
                type="date"
                value={echeance}
                onChange={(e) => setEcheance(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Ajouter l'objectif
            </button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
