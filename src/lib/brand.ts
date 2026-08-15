import logoUrl from "@/assets/logo-bekaye-sora.png";
import bouteilleUrl from "@/assets/lotion-501.png";

/**
 * Identité visuelle officielle Bekaye Sora Collection.
 * Rouge profond, blanc, doré, noir doux.
 */
/** URL absolue : nécessaire pour les fenêtres d'impression (PDF) ouvertes en blank. */
export const LOGO_URL =
  typeof window !== "undefined" ? new URL(logoUrl, window.location.origin).href : logoUrl;
export const BOUTEILLE_501_URL = bouteilleUrl;


export const MARQUE = {
  nom: "Bekaye Sora Collection",
  app: "Business Manager",
  slogan: "La performance au service de votre entreprise.",
  signature: "501 — L'excellence au quotidien.",
  telephone: "72 75 59 25",
} as const;

/** Couleurs de marque en hexadécimal, pour les documents imprimés (PDF). */
export const COULEURS_PDF = {
  rouge: "#A31018",
  rougeClair: "#D62828",
  dore: "#C9A227",
  doreClair: "#E8C766",
  noir: "#1A1013",
  gris: "#6B7280",
} as const;

/** En-tête HTML commun aux factures, bons et rapports PDF. */
export function enTetePdf(titre: string, sousTitre?: string) {
  return `
  <header class="bs-header">
    <div class="bs-brand">
      <img src="${LOGO_URL}" alt="Bekaye Sora Collection" class="bs-logo" />
      <div>
        <strong>${MARQUE.nom}</strong>
        <div class="muted">${MARQUE.app} · ${MARQUE.signature}</div>
        <div class="muted">Tél. ${MARQUE.telephone}</div>
      </div>
    </div>
    <div class="bs-titre">
      <div class="bs-titre-principal">${titre}</div>
      ${sousTitre ? `<div class="muted">${sousTitre}</div>` : ""}
    </div>
  </header>`;
}

/** Styles communs de la charte imprimée. */
export const STYLES_PDF_MARQUE = `
  .bs-header { display:flex; align-items:flex-start; justify-content:space-between; gap:24px;
    border-bottom:3px solid ${COULEURS_PDF.rouge}; padding-bottom:14px; }
  .bs-header::after { content:""; }
  .bs-brand { display:flex; align-items:center; gap:12px; }
  .bs-logo { width:64px; height:64px; object-fit:contain; border-radius:10px; }
  .bs-titre { text-align:right; }
  .bs-titre-principal { font-size:18px; font-weight:700; color:${COULEURS_PDF.rouge};
    letter-spacing:.02em; text-transform:uppercase; }
  .bs-filet { height:3px; background:linear-gradient(90deg, ${COULEURS_PDF.rouge}, ${COULEURS_PDF.dore}); margin-top:2px; }
  .bs-pied { margin-top:36px; border-top:1px solid #e5e5ea; padding-top:10px;
    display:flex; justify-content:space-between; font-size:10px; color:${COULEURS_PDF.gris}; }
`;

/** Pied de page HTML commun. */
export function piedPdf() {
  return `<div class="bs-pied"><span>${MARQUE.nom} · ${MARQUE.app}</span><span>${MARQUE.signature}</span></div>`;
}
