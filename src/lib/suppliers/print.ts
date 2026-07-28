import { LOGO_URL } from "@/lib/brand";
import { formatDate, formatFCFA } from "@/lib/products/types";

import {
  montantCommande,
  remiseCommande,
  sousTotalCommande,
  STATUT_COMMANDE_LABEL,
  totalLigneCommande,
  type CommandeAchat,
  type Fournisseur,
} from "./types";

const echapper = (valeur: string) =>
  valeur.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );

/** Génère et ouvre un « Bon de commande » professionnel prêt à imprimer. */
export function imprimerCommande(commande: CommandeAchat, fournisseur: Fournisseur | null) {
  const lignes = commande.lignes
    .map(
      (l, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${echapper(l.nom)}</strong><br /><span class="muted">${echapper(l.produitId)}</span></td>
        <td class="right">${l.quantite}</td>
        <td class="right">${formatFCFA(l.prixAchat)}</td>
        <td class="right">${l.remise ? `${l.remise} %` : "—"}</td>
        <td class="right"><strong>${formatFCFA(totalLigneCommande(l))}</strong></td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<title>${echapper(commande.numero)} — Bon de commande</title>
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
  .totaux { margin-top: 16px; margin-left: auto; width: 280px; font-size: 13px; }
  .totaux div { display: flex; justify-content: space-between; padding: 4px 0; }
  .totaux .grand { border-top: 2px solid #1c1c1e; margin-top: 6px; padding-top: 8px; font-size: 15px; font-weight: 700; }
  .signatures { display: flex; justify-content: space-between; margin-top: 72px; font-size: 12px; }
  .signatures div { width: 40%; border-top: 1px solid #9ca3af; padding-top: 6px; text-align: center; color: #6b7280; }
  @media print { body { margin: 12mm; } }
</style></head>
<body>
  <header>
    <div class="brand">
      <img class="logo" src="${LOGO_URL}" alt="Bekaye Sora Collection" />
      <div><strong>Bekaye Sora Collection</strong><div class="muted">Business Manager</div></div>
    </div>
    <div class="muted" style="text-align:right">
      Commande <strong>${echapper(commande.numero)}</strong><br />
      Imprimé le ${formatDate(new Date().toISOString())}
    </div>
  </header>

  <h1>Bon de commande</h1>
  <div class="infos">
    <div><span>Date :</span> ${formatDate(commande.date)}</div>
    <div><span>Fournisseur :</span> ${echapper(fournisseur?.nom ?? "—")}</div>
    <div><span>Livraison prévue :</span> ${formatDate(commande.dateLivraisonPrevue)}</div>
    <div><span>Contact :</span> ${echapper(fournisseur?.contactPrincipal ?? "—")} · ${echapper(fournisseur?.telephone ?? "—")}</div>
    <div><span>Mode de paiement :</span> ${echapper(commande.modePaiement)}</div>
    <div><span>Adresse :</span> ${echapper(fournisseur ? `${fournisseur.adresse}, ${fournisseur.ville}` : "—")}</div>
    <div><span>Responsable :</span> ${echapper(commande.responsable)}</div>
    <div><span>Statut :</span> ${STATUT_COMMANDE_LABEL[commande.statut]}</div>
    <div style="grid-column: 1 / -1"><span>Observation :</span> ${echapper(commande.observation || "—")}</div>
  </div>

  <table>
    <thead><tr>
      <th>#</th><th>Produit</th><th class="right">Qté</th>
      <th class="right">Prix d'achat</th><th class="right">Remise</th><th class="right">Total</th>
    </tr></thead>
    <tbody>${lignes}</tbody>
  </table>

  <div class="totaux">
    <div><span>Sous-total</span><span>${formatFCFA(sousTotalCommande(commande))}</span></div>
    <div><span>Remise</span><span>− ${formatFCFA(remiseCommande(commande))}</span></div>
    <div class="grand"><span>Montant total</span><span>${formatFCFA(montantCommande(commande))}</span></div>
  </div>

  <div class="signatures">
    <div>Signature Bekaye Sora</div>
    <div>Signature du fournisseur</div>
  </div>
</body></html>`;

  const fenetre = window.open("", "_blank", "width=900,height=1000");
  if (!fenetre) return false;
  fenetre.document.write(html);
  fenetre.document.close();
  fenetre.focus();
  setTimeout(() => fenetre.print(), 400);
  return true;
}

/** Export CSV (ouvrable dans Excel) des commandes d'achat. */
export function exporterCommandesCSV(
  commandes: CommandeAchat[],
  nomFournisseur: (id: string) => string,
) {
  const entetes = [
    "Numéro",
    "Date",
    "Fournisseur",
    "Livraison prévue",
    "Date réception",
    "Statut",
    "Responsable",
    "Nb produits",
    "Montant",
  ];
  const lignes = commandes.map((c) => [
    c.numero,
    formatDate(c.date),
    nomFournisseur(c.fournisseurId),
    formatDate(c.dateLivraisonPrevue),
    c.dateReception ? formatDate(c.dateReception) : "—",
    STATUT_COMMANDE_LABEL[c.statut],
    c.responsable,
    String(c.lignes.length),
    String(Math.round(montantCommande(c))),
  ]);
  telechargerCSV(`commandes-achat-${Date.now()}.csv`, [entetes, ...lignes]);
}

/** Export CSV du répertoire fournisseurs. */
export function exporterFournisseursCSV(
  fournisseurs: Fournisseur[],
  totalAchats: (id: string) => number,
) {
  const entetes = [
    "Nom",
    "Entreprise",
    "Téléphone",
    "Email",
    "Ville",
    "Pays",
    "Contact",
    "Conditions de paiement",
    "Statut",
    "Total achats",
  ];
  const lignes = fournisseurs.map((f) => [
    f.nom,
    f.entreprise,
    f.telephone,
    f.email,
    f.ville,
    f.pays,
    f.contactPrincipal,
    f.conditionsPaiement,
    f.actif ? "Actif" : "Inactif",
    String(Math.round(totalAchats(f.id))),
  ]);
  telechargerCSV(`fournisseurs-${Date.now()}.csv`, [entetes, ...lignes]);
}

function telechargerCSV(nomFichier: string, lignes: string[][]) {
  const contenu = lignes
    .map((ligne) => ligne.map((cel) => `"${String(cel).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob([`\uFEFF${contenu}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  lien.click();
  URL.revokeObjectURL(url);
}
