import QRCode from "qrcode";

import { formatDate, formatFCFA, formatHeure } from "@/lib/products/types";
import {
  libellePaiements,
  monnaieARendre,
  montantTva,
  sousTotalVente,
  totalVente,
  type Vente,
} from "@/lib/sales/types";
import { soldeCaisse, totalParType, type SessionCaisse } from "@/lib/sales/types";

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
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; background: #f5f5f7; padding: 8px; border-bottom: 1px solid #e5e5ea; text-transform: uppercase; font-size: 10px; letter-spacing: .06em; color: #6b7280; }
  td { padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  .right { text-align: right; }
  .totaux { margin-top: 18px; margin-left: auto; width: 300px; font-size: 13px; }
  .totaux div { display: flex; justify-content: space-between; padding: 5px 0; }
  .totaux .grand { border-top: 2px solid #1c1c1e; margin-top: 6px; padding-top: 8px; font-size: 16px; font-weight: 700; }
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

/** Génère la facture professionnelle d'une vente (impression ou téléchargement). */
export async function genererFacture(vente: Vente, options: { imprimer?: boolean } = {}) {
  const qr = await QRCode.toDataURL(
    `BEKAYE-SORA|${vente.numero}|${vente.date}|${totalVente(vente)}`,
    { margin: 1, width: 160 },
  ).catch(() => "");

  const lignes = vente.lignes
    .map(
      (l, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${echapper(l.nom)}</strong><br /><span class="muted">${echapper(l.codeBarres)}</span></td>
        <td class="right">${l.quantite}</td>
        <td class="right">${formatFCFA(l.prixUnitaire)}</td>
        <td class="right"><strong>${formatFCFA(l.prixUnitaire * l.quantite)}</strong></td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<title>${echapper(vente.numero)} — Facture Bekaye Sora</title>
<style>${STYLES}</style></head>
<body>
  <header>
    <div class="brand">
      <div class="logo">501</div>
      <div><strong>Bekaye Sora</strong><div class="muted">Business Manager · 501 — Révélez votre éclat.</div></div>
    </div>
    <div class="muted" style="text-align:right">
      Facture <strong>${echapper(vente.numero)}</strong><br />
      ${formatDate(vente.date)} à ${formatHeure(vente.date)}
    </div>
  </header>

  <h1>Facture de vente</h1>
  <div class="infos">
    <div><span>Client :</span> ${echapper(vente.client || "Client comptoir")}</div>
    <div><span>Téléphone :</span> ${echapper(vente.telephoneClient || "—")}</div>
    <div><span>Vendeur :</span> ${echapper(vente.vendeur)}</div>
    <div><span>Mode de paiement :</span> ${echapper(libellePaiements(vente.paiements))}</div>
  </div>

  <table>
    <thead><tr>
      <th>#</th><th>Produit</th><th class="right">Qté</th>
      <th class="right">Prix unitaire</th><th class="right">Montant</th>
    </tr></thead>
    <tbody>${lignes}</tbody>
  </table>

  <div class="totaux">
    <div><span>Sous-total</span><span>${formatFCFA(sousTotalVente(vente))}</span></div>
    <div><span>Remise</span><span>- ${formatFCFA(vente.remise)}</span></div>
    <div><span>TVA (${vente.tauxTva}%)</span><span>${formatFCFA(montantTva(vente))}</span></div>
    <div class="grand"><span>Total à payer</span><span>${formatFCFA(totalVente(vente))}</span></div>
    <div><span>Montant reçu</span><span>${formatFCFA(vente.montantRecu)}</span></div>
    <div><span>Monnaie rendue</span><span>${formatFCFA(monnaieARendre(vente))}</span></div>
  </div>

  <div class="pied">
    <div>
      ${qr ? `<img src="${qr}" width="96" height="96" alt="QR Code facture" />` : ""}
      <div class="muted">Scannez pour vérifier cette facture</div>
    </div>
    <div class="signature">Signature du vendeur — ${echapper(vente.vendeur)}</div>
  </div>
  <p class="muted" style="margin-top:32px;text-align:center">Merci de votre confiance — Bekaye Sora, cosmétiques 501.</p>
</body></html>`;

  return { html, ouvrir: () => ouvrir(html, options.imprimer ?? true) };
}

export async function imprimerFacture(vente: Vente) {
  const { ouvrir: afficher } = await genererFacture(vente, { imprimer: true });
  return afficher();
}

/** « Téléchargement PDF » : ouvre la facture dans l'aperçu d'impression du navigateur. */
export async function telechargerFacture(vente: Vente) {
  const { html } = await genererFacture(vente, { imprimer: false });
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `${vente.numero}.html`;
  lien.click();
  URL.revokeObjectURL(url);
  return true;
}

/** Rapport de fermeture de caisse imprimable. */
export function imprimerRapportCaisse(session: SessionCaisse) {
  const ventes = totalParType(session, "vente");
  const retours = totalParType(session, "retour");
  const depenses = totalParType(session, "depense");
  const theorique = soldeCaisse(session);
  const reel = session.montantReel ?? theorique;
  const ecart = reel - theorique;

  const operations = session.operations
    .map(
      (o) => `
      <tr>
        <td>${formatDate(o.date)}</td>
        <td>${formatHeure(o.date)}</td>
        <td>${echapper(o.libelle)}</td>
        <td>${echapper(o.utilisateur)}</td>
        <td class="right">${formatFCFA(o.montant)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<title>${echapper(session.numero)} — Rapport de caisse</title>
<style>${STYLES}</style></head>
<body>
  <header>
    <div class="brand">
      <div class="logo">501</div>
      <div><strong>Bekaye Sora</strong><div class="muted">Business Manager</div></div>
    </div>
    <div class="muted" style="text-align:right">
      Caisse <strong>${echapper(session.numero)}</strong><br />Imprimé le ${formatDate(new Date().toISOString())}
    </div>
  </header>

  <h1>Rapport de fermeture de caisse</h1>
  <div class="infos">
    <div><span>Ouverture :</span> ${formatDate(session.dateOuverture)} à ${formatHeure(session.dateOuverture)}</div>
    <div><span>Fermeture :</span> ${session.dateFermeture ? `${formatDate(session.dateFermeture)} à ${formatHeure(session.dateFermeture)}` : "Caisse encore ouverte"}</div>
    <div><span>Caissier :</span> ${echapper(session.utilisateur)}</div>
    <div><span>Observation :</span> ${echapper(session.observation || "—")}</div>
  </div>

  <div class="totaux" style="margin-left:0">
    <div><span>Montant d'ouverture</span><span>${formatFCFA(session.montantOuverture)}</span></div>
    <div><span>Ventes encaissées (espèces)</span><span>${formatFCFA(ventes)}</span></div>
    <div><span>Retours</span><span>${formatFCFA(retours)}</span></div>
    <div><span>Dépenses</span><span>${formatFCFA(depenses)}</span></div>
    <div class="grand"><span>Montant théorique</span><span>${formatFCFA(theorique)}</span></div>
    <div><span>Montant réel compté</span><span>${formatFCFA(reel)}</span></div>
    <div><strong>Écart</strong><strong>${formatFCFA(ecart)}</strong></div>
  </div>

  <h1 style="font-size:15px">Détail des opérations</h1>
  <table>
    <thead><tr><th>Date</th><th>Heure</th><th>Opération</th><th>Utilisateur</th><th class="right">Montant</th></tr></thead>
    <tbody>${operations}</tbody>
  </table>

  <div class="pied">
    <div class="signature">Signature du caissier</div>
    <div class="signature">Signature du responsable</div>
  </div>
</body></html>`;

  return ouvrir(html, true);
}
