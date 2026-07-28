import { formatFCFA } from "@/lib/products/types";

import type { DonneesNexusia } from "./insight";
import { TYPES_RAPPORT, type TypeRapport } from "./types";

/**
 * Génération automatique des rapports de direction (PDF via impression).
 * Les données proviennent intégralement des modules existants.
 */

type Bloc = { titre: string; entetes: string[]; lignes: (string | number)[][] };

function selectionner(type: TypeRapport, d: DonneesNexusia) {
  switch (type) {
    case "quotidien":
      return d.jour;
    case "hebdomadaire":
      return d.semaine;
    case "annuel":
      return d.annee;
    default:
      return d.mois;
  }
}

export function contenuRapport(type: TypeRapport, d: DonneesNexusia) {
  const source = selectionner(type, d);
  const info = TYPES_RAPPORT.find((t) => t.value === type)!;

  const blocs: Bloc[] = [
    {
      titre: "Indicateurs clés",
      entetes: ["Indicateur", "Valeur"],
      lignes: [
        ["Chiffre d'affaires", formatFCFA(source.kpis.chiffreAffaires)],
        ["Bénéfice", formatFCFA(source.kpis.benefice)],
        ["Dépenses", formatFCFA(source.kpis.depenses)],
        ["Nombre de ventes", source.kpis.nombreVentes],
        ["Panier moyen", formatFCFA(source.kpis.panierMoyen)],
        ["Marge nette", `${source.kpis.margeNette} %`],
        ["Valeur du stock", formatFCFA(source.kpis.valeurStock)],
        ["Ruptures", source.kpis.ruptures],
      ],
    },
    {
      titre: "Meilleurs produits",
      entetes: ["Produit", "Quantité", "Chiffre d'affaires", "Marge"],
      lignes: source.ventesAnalyse.meilleursProduits
        .slice(0, 8)
        .map((p) => [p.nom, p.quantite, formatFCFA(p.chiffreAffaires), `${p.marge} %`]),
    },
    {
      titre: "Performance de l'équipe",
      entetes: ["Employé", "Ventes", "Chiffre d'affaires", "Objectif"],
      lignes: source.vendeurs
        .slice(0, 8)
        .map((v) => [
          v.employe.nom,
          v.nombreVentes,
          formatFCFA(v.chiffreAffaires),
          `${v.progression} %`,
        ]),
    },
    {
      titre: "Prévisions et risques",
      entetes: ["Élément", "Valeur"],
      lignes: [
        ["CA prévu fin de mois", formatFCFA(d.mois.previsions.caPrevu)],
        ["Bénéfice prévu", formatFCFA(d.mois.previsions.beneficePrevu)],
        ["Dépenses prévues", formatFCFA(d.mois.previsions.depensesPrevues)],
        ["Produits à risque de rupture", d.mois.previsions.risquesRupture.length],
        ["Alertes critiques", d.alertes.length],
      ],
    },
  ];

  return { info, source, blocs };
}

export function imprimerRapportNexus(type: TypeRapport, d: DonneesNexusia) {
  const { info, source, blocs } = contenuRapport(type, d);
  const aujourdhui = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const table = (bloc: Bloc) =>
    bloc.lignes.length === 0
      ? `<p class="vide">Aucune donnée sur la période.</p>`
      : `<table><thead><tr>${bloc.entetes
          .map((e, i) => `<th class="${i > 0 ? "num" : ""}">${e}</th>`)
          .join("")}</tr></thead><tbody>${bloc.lignes
          .map(
            (l) =>
              `<tr>${l.map((c, i) => `<td class="${i > 0 ? "num" : ""}">${c}</td>`).join("")}</tr>`,
          )
          .join("")}</tbody></table>`;

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<title>${info.label} — Bekaye Sora</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Inter", system-ui, sans-serif; color: #1c1c1e; margin: 0; padding: 32px; }
  .entete { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #d92332; padding-bottom: 16px; }
  .marque { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  .marque span { color: #d92332; }
  .sous { color: #6b7280; font-size: 12px; margin-top: 4px; }
  h1 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; margin: 26px 0 10px; }
  .resume { background: #fafafa; border: 1px solid #eee; border-radius: 10px; padding: 14px 16px; font-size: 13px; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid #eee; }
  th { background: #f7f7f8; font-weight: 600; }
  .num { text-align: right; }
  .vide { color: #9ca3af; font-size: 12px; }
  footer { margin-top: 28px; border-top: 1px solid #eee; padding-top: 12px; color: #9ca3af; font-size: 11px; }
</style></head>
<body>
  <div class="entete">
    <div>
      <div class="marque">Bekaye Sora <span>Business Manager</span></div>
      <div class="sous">NEXUSIA Insight · ${info.label}</div>
    </div>
    <div class="sous">Édité le ${aujourdhui}<br />Période : ${source.periode.label}</div>
  </div>

  <h1>Résumé du conseiller</h1>
  <div class="resume">${source.resume.phrases.map((p) => `<div>• ${p}</div>`).join("")}</div>

  ${blocs.map((b) => `<h1>${b.titre}</h1>${table(b)}`).join("")}

  <h1>Recommandations</h1>
  <div class="resume">${d.recommandations
    .slice(0, 5)
    .map((r) => `<div>• <strong>${r.titre}</strong> — ${r.message}</div>`)
    .join("")}</div>

  <footer>Rapport généré automatiquement par NEXUSIA Insight — Bekaye Sora Business Manager.</footer>
</body></html>`;

  const fenetre = window.open("", "_blank", "width=1024,height=768");
  if (!fenetre) return false;
  fenetre.document.write(html);
  fenetre.document.close();
  fenetre.focus();
  setTimeout(() => fenetre.print(), 350);
  return true;
}
