import { formatFCFA } from "@/lib/products/types";

export type LigneRapport = { label: string; valeur: string };

/** Génère et imprime (ou exporte en PDF) un rapport de direction. */
export function imprimerRapportDirecteur(input: {
  titre: string;
  periode: string;
  lignes: LigneRapport[];
  details: { titre: string; lignes: LigneRapport[] }[];
}) {
  const fenetre = window.open("", "_blank", "width=800,height=1000");
  if (!fenetre) return;

  const bloc = (titre: string, lignes: LigneRapport[]) => `
    <section>
      <h2>${titre}</h2>
      <table>
        ${lignes.map((l) => `<tr><td>${l.label}</td><td class="v">${l.valeur}</td></tr>`).join("")}
      </table>
    </section>`;

  fenetre.document.write(`<!doctype html>
  <html lang="fr"><head><meta charset="utf-8" />
  <title>${input.titre}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color:#1c1917; margin:40px; }
    header { border-bottom:3px solid #d32f2f; padding-bottom:16px; margin-bottom:24px; }
    h1 { font-size:22px; margin:0; }
    p.meta { color:#6b7280; font-size:12px; margin:4px 0 0; }
    section { margin-bottom:22px; }
    h2 { font-size:13px; text-transform:uppercase; letter-spacing:.08em; color:#6b7280; margin:0 0 8px; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    td { padding:8px 0; border-bottom:1px solid #f0f0f0; }
    td.v { text-align:right; font-weight:600; }
    footer { margin-top:32px; font-size:11px; color:#9ca3af; text-align:center; }
  </style></head>
  <body>
    <header>
      <h1>${input.titre}</h1>
      <p class="meta">Bekaye Sora Business Manager · ${input.periode} · Édité le ${new Intl.DateTimeFormat(
        "fr-FR",
        { dateStyle: "long", timeStyle: "short" },
      ).format(new Date())}</p>
    </header>
    ${bloc("Synthèse", input.lignes)}
    ${input.details.map((d) => bloc(d.titre, d.lignes)).join("")}
    <footer>501 — Révélez votre éclat · Document généré automatiquement</footer>
  </body></html>`);
  fenetre.document.close();
  fenetre.focus();
  window.setTimeout(() => fenetre.print(), 350);
}

export const ligne = (label: string, montant: number): LigneRapport => ({
  label,
  valeur: formatFCFA(montant),
});
