import { formatFCFA, formatDate, formatHeure } from "@/lib/products/types";
import type { Produit } from "@/lib/products/types";
import { montantEntree, sousTotalLigne } from "@/lib/stock/types";
import type { EntreeStock } from "@/lib/stock/types";

const echapper = (valeur: string) =>
  valeur.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );

/** Génère et ouvre un « Bon d'entrée de stock » prêt à imprimer. */
export function imprimerEntree(entree: EntreeStock, produits: Produit[]) {
  const nom = (id: string) => produits.find((p) => p.id === id)?.nom ?? id;

  const lignes = entree.lignes
    .map(
      (l, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${echapper(nom(l.produitId))}</strong><br /><span class="muted">${echapper(l.codeBarres)}${
          l.numeroLot ? ` · Lot ${echapper(l.numeroLot)}` : ""
        }</span></td>
        <td class="right">${l.quantite}</td>
        <td class="right">${formatFCFA(l.prixAchat)}</td>
        <td class="right">${formatFCFA(l.prixVente)}</td>
        <td class="right"><strong>${formatFCFA(sousTotalLigne(l))}</strong></td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<title>${echapper(entree.numero)} — Bon d'entrée de stock</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #1c1c1e; margin: 32px; }
  header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #d92037; padding-bottom: 16px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo { width: 46px; height: 46px; border-radius: 12px; background: #d92037; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; }
  h1 { font-size: 20px; margin: 24px 0 4px; }
  .muted { color: #6b7280; font-size: 11px; }
  .infos { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; margin: 18px 0 24px; font-size: 13px; }
  .infos div span { color: #6b7280; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; background: #f5f5f7; padding: 8px; border-bottom: 1px solid #e5e5ea; text-transform: uppercase; font-size: 10px; letter-spacing: .06em; color: #6b7280; }
  td { padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  .right { text-align: right; }
  tfoot td { font-size: 14px; font-weight: 700; border-top: 2px solid #1c1c1e; border-bottom: none; }
  .signatures { display: flex; justify-content: space-between; margin-top: 64px; font-size: 12px; }
  .signatures div { width: 40%; border-top: 1px solid #9ca3af; padding-top: 6px; text-align: center; color: #6b7280; }
  @media print { body { margin: 12mm; } }
</style></head>
<body>
  <header>
    <div class="brand">
      <div class="logo">501</div>
      <div><strong>Bekaye Sora</strong><div class="muted">Business Manager</div></div>
    </div>
    <div class="muted" style="text-align:right">
      Réception <strong>${echapper(entree.numero)}</strong><br />
      Imprimé le ${formatDate(new Date().toISOString())}
    </div>
  </header>

  <h1>Bon d'entrée de stock</h1>
  <div class="infos">
    <div><span>Date :</span> ${formatDate(entree.date)} à ${formatHeure(entree.date)}</div>
    <div><span>Fournisseur :</span> ${echapper(entree.fournisseur)}</div>
    <div><span>Facture :</span> ${echapper(entree.referenceFacture || "—")}</div>
    <div><span>Bon de livraison :</span> ${echapper(entree.bonLivraison || "—")}</div>
    <div><span>Enregistré par :</span> ${echapper(entree.utilisateur)}</div>
    <div><span>Observation :</span> ${echapper(entree.observation || "—")}</div>
  </div>

  <table>
    <thead><tr>
      <th>#</th><th>Produit</th><th class="right">Qté</th>
      <th class="right">Prix d'achat</th><th class="right">Prix de vente</th><th class="right">Sous-total</th>
    </tr></thead>
    <tbody>${lignes}</tbody>
    <tfoot><tr>
      <td colspan="5" class="right">Montant total</td>
      <td class="right">${formatFCFA(montantEntree(entree))}</td>
    </tr></tfoot>
  </table>

  <div class="signatures">
    <div>Signature du livreur</div>
    <div>Signature du responsable</div>
  </div>
  <script>window.onload = () => { window.print(); };</script>
</body></html>`;

  const fenetre = window.open("", "_blank", "width=900,height=1000");
  if (!fenetre) return false;
  fenetre.document.write(html);
  fenetre.document.close();
  return true;
}
