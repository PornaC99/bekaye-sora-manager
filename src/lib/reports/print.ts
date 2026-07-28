import { formatFCFA } from "@/lib/products/types";

import type {
  AlerteRapport,
  ClassementVendeur,
  KpisRapport,
  LigneProduitVendu,
  PrevisionRapport,
  Regroupement,
  ResumeExecutif,
  ScorePerformance,
} from "./analytics";
import { formatPeriode, type Periode } from "./types";

/* ------------------------------------------------------------------ */
/* Exports fichiers                                                     */
/* ------------------------------------------------------------------ */

function telecharger(contenu: string, nom: string, type: string) {
  const blob = new Blob([contenu], { type });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nom;
  lien.click();
  URL.revokeObjectURL(url);
}

const echapper = (valeur: string | number) => `"${String(valeur).replace(/"/g, '""')}"`;

export type TableauExport = { entetes: string[]; lignes: (string | number)[][] };

export function exporterCsvRapport(tableau: TableauExport, nom = "rapport") {
  const lignes = [tableau.entetes, ...tableau.lignes];
  const contenu = `\uFEFF${lignes.map((l) => l.map(echapper).join(";")).join("\n")}`;
  telecharger(
    contenu,
    `${nom}-${new Date().toISOString().slice(0, 10)}.csv`,
    "text/csv;charset=utf-8",
  );
}

export function exporterExcelRapport(tableau: TableauExport, nom = "rapport") {
  const lignes = [tableau.entetes, ...tableau.lignes];
  const corps = lignes
    .map(
      (ligne, index) =>
        `<tr>${ligne
          .map((cellule) =>
            index === 0
              ? `<th style="background:#f7f7f8;border:1px solid #ddd;padding:6px">${cellule}</th>`
              : `<td style="border:1px solid #eee;padding:6px">${cellule}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" /></head><body><table>${corps}</table></body></html>`;
  telecharger(
    html,
    `${nom}-${new Date().toISOString().slice(0, 10)}.xls`,
    "application/vnd.ms-excel;charset=utf-8",
  );
}

/* ------------------------------------------------------------------ */
/* Rapport imprimable (PDF via impression navigateur)                   */
/* ------------------------------------------------------------------ */

export type ContenuRapportBi = {
  periode: Periode;
  kpis: KpisRapport;
  resume: ResumeExecutif;
  scores: ScorePerformance[];
  meilleursProduits: LigneProduitVendu[];
  categories: Regroupement[];
  vendeurs: ClassementVendeur[];
  previsions: PrevisionRapport;
  alertes: AlerteRapport[];
};

function tableau(entetes: string[], lignes: (string | number)[][]) {
  if (lignes.length === 0) return `<p class="vide">Aucune donnée sur la période.</p>`;
  return `<table>
    <thead><tr>${entetes.map((e, i) => `<th class="${i > 1 ? "num" : ""}">${e}</th>`).join("")}</tr></thead>
    <tbody>${lignes
      .map((l) => `<tr>${l.map((c, i) => `<td class="${i > 1 ? "num" : ""}">${c}</td>`).join("")}</tr>`)
      .join("")}</tbody>
  </table>`;
}

export function imprimerRapportBi(contenu: ContenuRapportBi) {
  const { periode, kpis, resume, scores, meilleursProduits, categories, vendeurs, previsions } =
    contenu;
  const aujourdhui = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<title>Rapport & analyses — Bekaye Sora</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Inter", system-ui, sans-serif; color: #1c1c1e; margin: 0; padding: 32px; }
  .entete { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #d92332; padding-bottom: 16px; }
  .marque { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  .marque span { color: #d92332; }
  .sous { color: #6b7280; font-size: 12px; margin-top: 4px; }
  h1 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; margin: 26px 0 10px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .kpi { border: 1px solid #ececee; border-radius: 10px; padding: 10px 12px; }
  .kpi span { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; }
  .kpi strong { font-size: 15px; }
  .resume { border: 1px solid #ececee; border-left: 3px solid #d92332; border-radius: 10px; padding: 12px 14px; font-size: 12px; line-height: 1.7; }
  ul { margin: 6px 0 0; padding-left: 18px; font-size: 12px; line-height: 1.7; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
  th, td { text-align: left; padding: 7px 9px; border-bottom: 1px solid #ececee; }
  th { background: #f7f7f8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
  td.num, th.num { text-align: right; }
  .vide { font-size: 12px; color: #9ca3af; }
  footer { margin-top: 36px; font-size: 11px; color: #9ca3af; text-align: center; }
  @media print { body { padding: 12px; } }
</style></head>
<body>
  <div class="entete">
    <div>
      <div class="marque">Bekaye Sora <span>501</span></div>
      <div class="sous">Rapport & analyses · ${periode.label} (${formatPeriode(periode)})</div>
    </div>
    <div class="sous">Édité le ${aujourdhui}</div>
  </div>

  <h1>Indicateurs clés</h1>
  <div class="kpis">
    <div class="kpi"><span>Chiffre d'affaires</span><strong>${formatFCFA(kpis.chiffreAffaires)}</strong></div>
    <div class="kpi"><span>Bénéfice</span><strong>${formatFCFA(kpis.benefice)}</strong></div>
    <div class="kpi"><span>Dépenses</span><strong>${formatFCFA(kpis.depenses)}</strong></div>
    <div class="kpi"><span>Ventes</span><strong>${kpis.nombreVentes}</strong></div>
    <div class="kpi"><span>Produits vendus</span><strong>${kpis.produitsVendus}</strong></div>
    <div class="kpi"><span>Valeur du stock</span><strong>${formatFCFA(kpis.valeurStock)}</strong></div>
    <div class="kpi"><span>Marge nette</span><strong>${kpis.margeNette} %</strong></div>
    <div class="kpi"><span>Ruptures</span><strong>${kpis.ruptures}</strong></div>
  </div>

  <h1>Résumé de la direction</h1>
  <div class="resume">
    ${resume.phrases.map((p) => `<div>• ${p}</div>`).join("")}
    <ul>${resume.recommandations.map((r) => `<li>${r}</li>`).join("")}</ul>
  </div>

  <h1>Centre de performance</h1>
  ${tableau(
    ["Indicateur", "Détail", "Note / 100"],
    scores.map((s) => [s.label, s.detail, s.note]),
  )}

  <h1>Produits les plus vendus</h1>
  ${tableau(
    ["Produit", "Catégorie", "Quantité", "Chiffre d'affaires", "Marge"],
    meilleursProduits.map((p) => [
      p.nom,
      p.categorie,
      p.quantite,
      formatFCFA(p.chiffreAffaires),
      `${p.marge} %`,
    ]),
  )}

  <h1>Meilleures catégories</h1>
  ${tableau(
    ["Catégorie", "Quantité", "Chiffre d'affaires", "Part"],
    categories.map((c) => [c.nom, c.quantite, formatFCFA(c.chiffreAffaires), `${c.part} %`]),
  )}

  <h1>Classement des vendeurs</h1>
  ${tableau(
    ["Employé", "Fonction", "Ventes", "Chiffre d'affaires", "Objectif"],
    vendeurs.map((v) => [
      v.employe.nom,
      v.employe.fonction,
      v.nombreVentes,
      formatFCFA(v.chiffreAffaires),
      `${v.progression} %`,
    ]),
  )}

  <h1>Prévisions du mois</h1>
  ${tableau(
    ["Indicateur", "Détail", "Montant"],
    [
      ["Chiffre d'affaires prévu", `${previsions.joursEcoules}/${previsions.joursDuMois} jours écoulés`, formatFCFA(previsions.caPrevu)],
      ["Bénéfice attendu", "Projection au rythme actuel", formatFCFA(previsions.beneficePrevu)],
      ["Dépenses prévues", "Projection au rythme actuel", formatFCFA(previsions.depensesPrevues)],
      ["Produits à risque de rupture", "Sous 10 jours", previsions.risquesRupture.length],
    ],
  )}

  <footer>Bekaye Sora Business Manager · Rapport généré automatiquement</footer>
  <script>window.onload = () => window.print();</script>
</body></html>`;

  const fenetre = window.open("", "_blank", "width=1000,height=700");
  if (!fenetre) return;
  fenetre.document.write(html);
  fenetre.document.close();
}
