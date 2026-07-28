import { formatDate, formatFCFA } from "@/lib/products/types";
import {
  ecartLigne,
  lignesEnEcart,
  lignesVerifiees,
  statutLigne,
  STATUT_ECART_LABEL,
  tauxConformite,
  valeurEcartLigne,
  valeurPertes,
  valeurStockTheorique,
  valeurSurplus,
  type Inventaire,
} from "./types";

const echapper = (valeur: string) =>
  valeur.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );

const STYLES = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #1c1c1e; margin: 32px; }
  header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #d92037; padding-bottom: 16px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo { width: 46px; height: 46px; border-radius: 12px; background: #d92037; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; }
  h1 { font-size: 20px; margin: 24px 0 4px; }
  .muted { color: #6b7280; font-size: 11px; }
  .infos { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; margin: 18px 0 24px; font-size: 13px; }
  .infos div span { color: #6b7280; }
  .cartes { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 22px; }
  .carte { border: 1px solid #e5e5ea; border-radius: 10px; padding: 10px; }
  .carte b { display: block; font-size: 15px; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; background: #f5f5f7; padding: 8px; border-bottom: 1px solid #e5e5ea; text-transform: uppercase; font-size: 10px; letter-spacing: .06em; color: #6b7280; }
  td { padding: 8px; border-bottom: 1px solid #eee; }
  .right { text-align: right; }
  .pied { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 48px; font-size: 12px; }
  .signature { width: 45%; border-top: 1px solid #9ca3af; padding-top: 6px; text-align: center; color: #6b7280; }
  @media print { body { margin: 12mm; } }
`;

function ouvrir(html: string, imprimer: boolean) {
  const fenetre = window.open("", "_blank", "width=900,height=1000");
  if (!fenetre) return false;
  fenetre.document.write(
    imprimer
      ? html.replace("</body>", "<script>window.onload=()=>window.print()<\/script></body>")
      : html,
  );
  fenetre.document.close();
  return true;
}

function rapportHtml(inventaire: Inventaire) {
  const lignes = inventaire.lignes
    .map(
      (l) => `
      <tr>
        <td><strong>${echapper(l.nom)}</strong><br /><span class="muted">${echapper(l.codeBarres)}</span></td>
        <td class="right">${l.stockTheorique}</td>
        <td class="right">${l.stockPhysique ?? "—"}</td>
        <td class="right">${l.stockPhysique === null ? "—" : ecartLigne(l)}</td>
        <td class="right">${l.stockPhysique === null ? "—" : formatFCFA(valeurEcartLigne(l))}</td>
        <td>${STATUT_ECART_LABEL[statutLigne(l)]}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<title>${echapper(inventaire.numero)} — Rapport d'inventaire</title>
<style>${STYLES}</style></head>
<body>
  <header>
    <div class="brand">
      <div class="logo">BS</div>
      <div>
        <strong>Bekaye Sora Business Manager</strong><br />
        <span class="muted">Marque 501 — Cosmétiques</span>
      </div>
    </div>
    <div class="right muted">
      <strong>${echapper(inventaire.numero)}</strong><br />
      ${formatDate(inventaire.date)}
    </div>
  </header>

  <h1>Rapport d'inventaire — ${echapper(inventaire.nom)}</h1>
  <div class="infos">
    <div><span>Responsable :</span> ${echapper(inventaire.responsable)}</div>
    <div><span>Magasin :</span> ${echapper(inventaire.magasin)}</div>
    <div><span>Produits contrôlés :</span> ${lignesVerifiees(inventaire).length} / ${inventaire.lignes.length}</div>
    <div><span>Observation :</span> ${echapper(inventaire.observation || "—")}</div>
  </div>

  <div class="cartes">
    <div class="carte"><span class="muted">Produits en écart</span><b>${lignesEnEcart(inventaire).length}</b></div>
    <div class="carte"><span class="muted">Conformité</span><b>${tauxConformite(inventaire)} %</b></div>
    <div class="carte"><span class="muted">Valeur du stock</span><b>${formatFCFA(valeurStockTheorique(inventaire))}</b></div>
    <div class="carte"><span class="muted">Pertes</span><b>${formatFCFA(Math.abs(valeurPertes(inventaire)))}</b></div>
    <div class="carte"><span class="muted">Surplus</span><b>${formatFCFA(valeurSurplus(inventaire))}</b></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Produit</th><th class="right">Stock théorique</th><th class="right">Stock physique</th>
        <th class="right">Écart</th><th class="right">Valeur écart</th><th>Statut</th>
      </tr>
    </thead>
    <tbody>${lignes}</tbody>
  </table>

  <div class="pied">
    <div class="muted">Document généré automatiquement par Bekaye Sora Business Manager.</div>
    <div class="signature">Signature du responsable<br /><strong>${echapper(inventaire.signature || inventaire.responsable)}</strong></div>
  </div>
</body></html>`;
}

/** Ouvre le rapport d'inventaire prêt à imprimer. */
export const imprimerInventaire = (inventaire: Inventaire) =>
  ouvrir(rapportHtml(inventaire), true);

/** Export PDF : ouvre le rapport dans une fenêtre « Enregistrer au format PDF ». */
export const exporterInventairePdf = (inventaire: Inventaire) =>
  ouvrir(rapportHtml(inventaire), true);

/** Export Excel : fichier .csv (compatible Excel) des lignes d'inventaire. */
export function exporterInventaireExcel(inventaire: Inventaire) {
  const entetes = [
    "Produit",
    "Code-barres",
    "Stock théorique",
    "Stock physique",
    "Écart",
    "Valeur écart (FCFA)",
    "Statut",
  ];
  const lignes = inventaire.lignes.map((l) => [
    l.nom,
    l.codeBarres,
    l.stockTheorique,
    l.stockPhysique ?? "",
    l.stockPhysique === null ? "" : ecartLigne(l),
    l.stockPhysique === null ? "" : valeurEcartLigne(l),
    STATUT_ECART_LABEL[statutLigne(l)],
  ]);

  const csv = [entetes, ...lignes]
    .map((ligne) => ligne.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `${inventaire.numero}.csv`;
  lien.click();
  URL.revokeObjectURL(url);
}
