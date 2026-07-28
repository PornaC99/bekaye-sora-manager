import { LOGO_URL } from "@/lib/brand";
import { formatFCFA } from "@/lib/products/types";

import type { KpisFinanciers, PartDepense, Previsions, ProgressionObjectif } from "./analytics";
import {
  CATEGORIE_DEPENSE_LABEL,
  MODE_PAIEMENT_DEPENSE_LABEL,
  SOURCE_DEPENSE_LABEL,
  STATUT_DEPENSE_LABEL,
  STATUT_ECHEANCE_LABEL,
  formatDateCourte,
  statutEcheance,
  type Creance,
  type Depense,
  type Dette,
} from "./types";

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

export function lignesDepenses(depenses: Depense[]) {
  return depenses.map((d) => [
    formatDateCourte(d.date),
    CATEGORIE_DEPENSE_LABEL[d.categorie],
    d.montant,
    MODE_PAIEMENT_DEPENSE_LABEL[d.modePaiement],
    d.responsable,
    STATUT_DEPENSE_LABEL[d.statut],
    SOURCE_DEPENSE_LABEL[d.source],
    d.description,
  ]);
}

const ENTETES_DEPENSES = [
  "Date",
  "Catégorie",
  "Montant (FCFA)",
  "Mode de paiement",
  "Responsable",
  "Statut",
  "Origine",
  "Description",
];

/** Export CSV (compatible Excel francophone : séparateur point-virgule). */
export function exporterCsv(depenses: Depense[], nom = "depenses") {
  const lignes = [ENTETES_DEPENSES, ...lignesDepenses(depenses)];
  const contenu = `\uFEFF${lignes.map((l) => l.map(echapper).join(";")).join("\n")}`;
  telecharger(
    contenu,
    `${nom}-${new Date().toISOString().slice(0, 10)}.csv`,
    "text/csv;charset=utf-8",
  );
}

/** Export Excel (feuille de calcul XML lisible par Excel et LibreOffice). */
export function exporterExcel(depenses: Depense[], nom = "depenses") {
  const lignes = [ENTETES_DEPENSES, ...lignesDepenses(depenses)];
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
/* Rapport financier imprimable (PDF via impression navigateur)         */
/* ------------------------------------------------------------------ */

export type ContenuRapport = {
  kpis: KpisFinanciers;
  repartition: PartDepense[];
  depenses: Depense[];
  creances: Creance[];
  dettes: Dette[];
  progression: ProgressionObjectif[];
  previsions: Previsions;
};

function tableau(entetes: string[], lignes: (string | number)[][]) {
  if (lignes.length === 0) return `<p class="vide">Aucune donnée sur la période.</p>`;
  return `<table>
    <thead><tr>${entetes.map((e, i) => `<th class="${i > 1 ? "num" : ""}">${e}</th>`).join("")}</tr></thead>
    <tbody>${lignes
      .map(
        (l) =>
          `<tr>${l.map((c, i) => `<td class="${i > 1 ? "num" : ""}">${c}</td>`).join("")}</tr>`,
      )
      .join("")}</tbody>
  </table>`;
}

export function imprimerRapportFinancier(contenu: ContenuRapport) {
  const { kpis, repartition, depenses, creances, dettes, progression, previsions } = contenu;
  const aujourdhui = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<title>Rapport financier — Bekaye Sora</title>
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
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
  th, td { text-align: left; padding: 7px 9px; border-bottom: 1px solid #ececee; }
  th { background: #f7f7f8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
  td.num, th.num { text-align: right; }
  .vide { font-size: 12px; color: #9ca3af; }
  footer { margin-top: 36px; font-size: 11px; color: #9ca3af; text-align: center; }

  .marque-bloc { display: flex; align-items: center; gap: 12px; }
  .logo-marque { width: 56px; height: 56px; object-fit: contain; border-radius: 10px; }
  .entete { border-bottom: 3px solid #A31018 !important; }
  .marque span { color: #C9A227 !important; }
  h1 { color: #A31018; }
  @media print { body { padding: 12px; } }
</style></head>
<body>
  <div class="entete">
    <div>
      <div class="marque-bloc"><img class="logo-marque" src="${LOGO_URL}" alt="Bekaye Sora Collection" /><div><div class="marque">Bekaye Sora <span>Collection</span></div>
      <div class="sous">Cosmétiques 501 — Bamako, Mali · +223 76 12 34 56</div>
    </div></div>
    <div style="text-align:right">
      <div style="font-weight:700">Rapport financier</div>
      <div class="sous">Édité le ${aujourdhui}</div>
    </div>
  </div>

  <h1>Indicateurs clés</h1>
  <div class="kpis">
    <div class="kpi"><span>CA du jour</span><strong>${formatFCFA(kpis.caJour)}</strong></div>
    <div class="kpi"><span>CA du mois</span><strong>${formatFCFA(kpis.caMois)}</strong></div>
    <div class="kpi"><span>Bénéfice du mois</span><strong>${formatFCFA(kpis.beneficeMois)}</strong></div>
    <div class="kpi"><span>Dépenses du mois</span><strong>${formatFCFA(kpis.depensesMois)}</strong></div>
    <div class="kpi"><span>Trésorerie</span><strong>${formatFCFA(kpis.tresorerie)}</strong></div>
    <div class="kpi"><span>Caisse</span><strong>${formatFCFA(kpis.montantCaisse)}</strong></div>
    <div class="kpi"><span>Valeur du stock</span><strong>${formatFCFA(kpis.valeurStock)}</strong></div>
    <div class="kpi"><span>Marge nette</span><strong>${kpis.margeNette} %</strong></div>
  </div>

  <h1>Objectifs du mois</h1>
  ${tableau(
    ["Objectif", "Réalisé", "Cible", "Progression"],
    progression.map((o) => [
      o.label,
      formatFCFA(o.realise),
      formatFCFA(o.cible),
      `${o.progression} %`,
    ]),
  )}

  <h1>Répartition des dépenses du mois</h1>
  ${tableau(
    ["Catégorie", "Montant", "Part"],
    repartition.map((r) => [r.label, formatFCFA(r.montant), `${r.part} %`]),
  )}

  <h1>Dernières dépenses</h1>
  ${tableau(
    ["Date", "Catégorie", "Montant", "Statut"],
    depenses
      .slice(0, 15)
      .map((d) => [
        formatDateCourte(d.date),
        CATEGORIE_DEPENSE_LABEL[d.categorie],
        formatFCFA(d.montant),
        STATUT_DEPENSE_LABEL[d.statut],
      ]),
  )}

  <h1>Créances clients</h1>
  ${tableau(
    ["Client", "Échéance", "Montant", "Statut"],
    creances.map((c) => [
      c.nom,
      formatDateCourte(c.echeance),
      formatFCFA(c.montant),
      STATUT_ECHEANCE_LABEL[statutEcheance(c)],
    ]),
  )}

  <h1>Dettes fournisseurs</h1>
  ${tableau(
    ["Fournisseur", "Échéance", "Montant", "Statut"],
    dettes.map((d) => [
      d.fournisseur,
      formatDateCourte(d.echeance),
      formatFCFA(d.montant),
      STATUT_ECHEANCE_LABEL[statutEcheance(d)],
    ]),
  )}

  <h1>Prévisions du mois</h1>
  ${tableau(
    ["Indicateur", "Valeur", "Détail"],
    [
      [
        "Chiffre d'affaires prévu",
        formatFCFA(previsions.caPrevu),
        `${previsions.joursEcoules}/${previsions.joursDuMois} jours écoulés`,
      ],
      [
        "Bénéfice prévisionnel",
        formatFCFA(previsions.beneficePrevu),
        `Réalisé : ${formatFCFA(previsions.beneficeRealise)}`,
      ],
      [
        "Rupture de trésorerie",
        previsions.dateRuptureTresorerie
          ? formatDateCourte(previsions.dateRuptureTresorerie)
          : "Aucun risque détecté",
        previsions.joursAvantRupture
          ? `Dans ${previsions.joursAvantRupture} jours`
          : "Flux net positif",
      ],
    ],
  )}

  <footer>Document généré automatiquement par Bekaye Sora Business Manager — 501, Révélez votre éclat.</footer>
  <script>window.onload = () => { window.print(); };</script>
</body></html>`;

  const fenetre = window.open("", "_blank", "width=980,height=1200");
  if (!fenetre) return false;
  fenetre.document.write(html);
  fenetre.document.close();
  return true;
}
