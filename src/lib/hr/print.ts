import { LOGO_URL } from "@/lib/brand";
import { formatFCFA } from "@/lib/products/types";
import {
  MODE_PAIEMENT_SALAIRE_LABEL,
  ROLE_LABEL,
  STATUT_PAIE_LABEL,
  formatMois,
  salaireNet,
  type BulletinPaie,
  type Employe,
} from "./types";

/** Génère et imprime un bulletin de paie professionnel. */
export function imprimerBulletin(bulletin: BulletinPaie, employe: Employe) {
  const brut =
    bulletin.salaireBase +
    bulletin.primes +
    bulletin.heuresSupplementaires * bulletin.tauxHeureSupplementaire;
  const net = salaireNet(bulletin);

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<title>Bulletin de paie ${formatMois(bulletin.mois)} — ${employe.nom}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Inter", system-ui, sans-serif; color: #1c1c1e; margin: 0; padding: 32px; }
  .entete { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #d92332; padding-bottom: 16px; }
  .marque { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  .marque span { color: #d92332; }
  .sous { color: #6b7280; font-size: 12px; margin-top: 4px; }
  h1 { font-size: 16px; text-transform: uppercase; letter-spacing: 0.08em; margin: 28px 0 12px; }
  .grille { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; font-size: 13px; }
  .grille div span { color: #6b7280; display: block; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
  th, td { text-align: left; padding: 9px 10px; border-bottom: 1px solid #ececee; }
  th { background: #f7f7f8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
  td.num, th.num { text-align: right; }
  .net { display: flex; justify-content: space-between; margin-top: 18px; padding: 14px 16px; background: #fdf2f3; border: 1px solid #f3c9cd; border-radius: 10px; font-weight: 700; font-size: 16px; }
  .signatures { display: flex; justify-content: space-between; margin-top: 56px; font-size: 12px; color: #6b7280; }
  .signatures div { width: 40%; border-top: 1px solid #c9c9cd; padding-top: 6px; }
  footer { margin-top: 40px; font-size: 11px; color: #9ca3af; text-align: center; }

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
      <div style="font-weight:700">Bulletin de paie</div>
      <div class="sous">${formatMois(bulletin.mois)} · ${STATUT_PAIE_LABEL[bulletin.statut]}</div>
      <div class="sous">Réf. ${bulletin.id}</div>
    </div>
  </div>

  <h1>Informations de l'employé</h1>
  <div class="grille">
    <div><span>Nom et prénom</span>${employe.nom}</div>
    <div><span>Matricule</span>${employe.matricule}</div>
    <div><span>Fonction</span>${employe.fonction}</div>
    <div><span>Rôle</span>${ROLE_LABEL[employe.role]}</div>
    <div><span>Département</span>${employe.departement}</div>
    <div><span>Date d'embauche</span>${employe.dateEmbauche}</div>
  </div>

  <h1>Détail de la rémunération</h1>
  <table>
    <thead><tr><th>Libellé</th><th class="num">Base</th><th class="num">Montant</th></tr></thead>
    <tbody>
      <tr><td>Salaire de base</td><td class="num">Mensuel</td><td class="num">${formatFCFA(bulletin.salaireBase)}</td></tr>
      <tr><td>Primes et commissions</td><td class="num">—</td><td class="num">${formatFCFA(bulletin.primes)}</td></tr>
      <tr><td>Heures supplémentaires</td><td class="num">${bulletin.heuresSupplementaires} h × ${formatFCFA(bulletin.tauxHeureSupplementaire)}</td><td class="num">${formatFCFA(bulletin.heuresSupplementaires * bulletin.tauxHeureSupplementaire)}</td></tr>
      <tr><td><strong>Total brut</strong></td><td class="num"></td><td class="num"><strong>${formatFCFA(brut)}</strong></td></tr>
      <tr><td>Avances sur salaire</td><td class="num">—</td><td class="num">− ${formatFCFA(bulletin.avances)}</td></tr>
      <tr><td>Retenues</td><td class="num">—</td><td class="num">− ${formatFCFA(bulletin.retenues)}</td></tr>
    </tbody>
  </table>

  <div class="net"><span>Net à payer</span><span>${formatFCFA(net)}</span></div>
  <div class="sous" style="margin-top:8px">Mode de paiement : ${MODE_PAIEMENT_SALAIRE_LABEL[bulletin.modePaiement]}${
    bulletin.datePaiement ? ` · Payé le ${bulletin.datePaiement}` : ""
  }</div>
  ${bulletin.observation ? `<div class="sous">Observation : ${bulletin.observation}</div>` : ""}

  <div class="signatures">
    <div>Signature de l'employé</div>
    <div style="text-align:right">Signature de la direction</div>
  </div>

  <footer>Document généré par Bekaye Sora Business Manager — ${new Date().toLocaleDateString("fr-FR")}</footer>
</body></html>`;

  const fenetre = window.open("", "_blank", "width=900,height=1000");
  if (!fenetre) return;
  fenetre.document.write(html);
  fenetre.document.close();
  fenetre.focus();
  setTimeout(() => fenetre.print(), 350);
}

/** Export CSV générique (employés, salaires, présence…). */
export function exporterCsv(nomFichier: string, entetes: string[], lignes: (string | number)[][]) {
  const echappe = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const contenu = [entetes, ...lignes].map((l) => l.map(echappe).join(";")).join("\n");
  const blob = new Blob([`\uFEFF${contenu}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  lien.click();
  URL.revokeObjectURL(url);
}
