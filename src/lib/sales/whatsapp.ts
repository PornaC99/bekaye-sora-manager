import { formatFCFA } from "@/lib/products/types";
import { totalVente, type Vente } from "./types";

/** Normalise un numéro burkinabè/international au format WhatsApp (chiffres uniquement). */
export function normaliserTelephone(numero: string) {
  const chiffres = numero.replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (chiffres.length < 8) return null;
  // Numéro local (8 chiffres) → indicatif Burkina Faso par défaut.
  return chiffres.length === 8 ? `226${chiffres}` : chiffres;
}

export function messageFactureWhatsApp(vente: Vente) {
  const lignes = vente.lignes
    .map((l) => `• ${l.nom} x${l.quantite} — ${formatFCFA(l.prixUnitaire * l.quantite)}`)
    .join("\n");

  return [
    "*Bekaye Sora Business Manager — Marque 501*",
    "",
    `Facture : ${vente.numero}`,
    `Client : ${vente.client || "Client comptoir"}`,
    "",
    lignes,
    "",
    `*Total à payer : ${formatFCFA(totalVente(vente))}*`,
    "",
    "Merci pour votre confiance 🙏",
  ].join("\n");
}

/** Construit le lien de partage WhatsApp de la facture. */
export function lienWhatsAppFacture(vente: Vente) {
  const telephone = normaliserTelephone(vente.telephoneClient ?? "");
  const texte = encodeURIComponent(messageFactureWhatsApp(vente));
  return telephone ? `https://wa.me/${telephone}?text=${texte}` : `https://wa.me/?text=${texte}`;
}

export type ResultatWhatsApp = { ok: boolean; erreur?: string; sansNumero?: boolean };

/** Ouvre WhatsApp avec la facture pré-remplie et gère les erreurs courantes. */
export function envoyerFactureWhatsApp(vente: Vente): ResultatWhatsApp {
  try {
    if (vente.lignes.length === 0) {
      return { ok: false, erreur: "Cette facture ne contient aucun produit." };
    }
    const sansNumero = normaliserTelephone(vente.telephoneClient ?? "") === null;
    const fenetre = window.open(lienWhatsAppFacture(vente), "_blank", "noopener,noreferrer");
    if (!fenetre) {
      return { ok: false, erreur: "Autorisez les fenêtres pop-up pour envoyer via WhatsApp." };
    }
    return { ok: true, sansNumero };
  } catch {
    return { ok: false, erreur: "Impossible d'ouvrir WhatsApp sur cet appareil." };
  }
}
