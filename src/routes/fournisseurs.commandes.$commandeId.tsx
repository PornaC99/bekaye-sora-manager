import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  MessageSquarePlus,
  Printer,
  Send,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page";
import { StatutCommandeBadge } from "@/components/suppliers/orders-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateCourt, formatFCFA } from "@/lib/products/types";
import { imprimerCommande } from "@/lib/suppliers/print";
import {
  ajouterCommentaireCommande,
  changerStatutCommande,
  nomFournisseur,
  receptionnerCommande,
  useSuppliersStore,
} from "@/lib/suppliers/store";
import {
  montantCommande,
  remiseCommande,
  sousTotalCommande,
  totalLigneCommande,
} from "@/lib/suppliers/types";

export const Route = createFileRoute("/fournisseurs/commandes/$commandeId")({
  head: () => ({
    meta: [
      { title: "Détail de la commande — Bekaye Sora Business Manager" },
      {
        name: "description",
        content: "Lignes, montants, suivi et réception d'une commande d'achat fournisseur.",
      },
      { property: "og:title", content: "Détail de la commande — Bekaye Sora Business Manager" },
      {
        property: "og:description",
        content: "Lignes, montants, suivi et réception d'une commande d'achat fournisseur.",
      },
    ],
  }),
  component: DetailCommande,
});

function DetailCommande() {
  const { commandeId } = useParams({ from: "/fournisseurs/commandes/$commandeId" });
  const { commandes, fournisseurs } = useSuppliersStore();
  const [commentaire, setCommentaire] = useState("");
  const [receptionOuverte, setReceptionOuverte] = useState(false);

  const commande = commandes.find((c) => c.id === commandeId || c.numero === commandeId) ?? null;

  if (!commande) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">Cette commande est introuvable.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/fournisseurs/commandes">Retour aux commandes</Link>
        </Button>
      </div>
    );
  }

  const fournisseur = fournisseurs.find((f) => f.id === commande.fournisseurId) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/fournisseurs/commandes">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour aux commandes
        </Link>
      </Button>

      <PageHeader
        eyebrow="Commande d'achat"
        title={commande.numero}
        description={`${nomFournisseur(commande.fournisseurId)} · ${formatDateCourt(commande.date)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const ok = imprimerCommande(commande, fournisseur);
                if (!ok) toast.error("Autorisez les fenêtres pop-up pour imprimer.");
              }}
            >
              <Printer className="mr-1.5 h-4 w-4" /> Imprimer
            </Button>
            {commande.statut === "brouillon" && (
              <Button
                variant="outline"
                onClick={() => {
                  changerStatutCommande(commande.id, "envoyee");
                  toast.success("Commande envoyée au fournisseur");
                }}
              >
                <Send className="mr-1.5 h-4 w-4" /> Envoyer
              </Button>
            )}
            {!["recue", "annulee"].includes(commande.statut) && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    changerStatutCommande(commande.id, "annulee");
                    toast.success("Commande annulée", { description: commande.numero });
                  }}
                >
                  <XCircle className="mr-1.5 h-4 w-4" /> Annuler
                </Button>
                <Button onClick={() => setReceptionOuverte(true)}>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Réceptionner
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="font-display text-base font-semibold text-foreground">
                  Produits commandés
                </h2>
                <p className="text-xs text-muted-foreground">
                  {commande.lignes.length} ligne(s) · livraison prévue le{" "}
                  {formatDateCourt(commande.dateLivraisonPrevue)}
                </p>
              </div>
              <StatutCommandeBadge commande={commande} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                    <th className="px-5 py-3 text-left font-medium">Produit</th>
                    <th className="px-5 py-3 text-right font-medium">Quantité</th>
                    <th className="px-5 py-3 text-right font-medium">Prix d'achat</th>
                    <th className="px-5 py-3 text-right font-medium">Remise</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {commande.lignes.map((l, i) => (
                    <tr key={`${l.produitId}-${i}`} className="border-b border-border/60 last:border-0">
                      <td className="px-5 py-3 font-medium text-foreground">{l.nom}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{l.quantite}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{formatFCFA(l.prixAchat)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{l.remise} %</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">
                        {formatFCFA(totalLigneCommande(l))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-1 border-t border-border px-5 py-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Sous-total</span>
                <span className="tabular-nums">{formatFCFA(sousTotalCommande(commande))}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Remises</span>
                <span className="tabular-nums">− {formatFCFA(remiseCommande(commande))}</span>
              </div>
              <div className="flex justify-between pt-1 font-display text-base font-semibold text-foreground">
                <span>Total à payer</span>
                <span className="tabular-nums">{formatFCFA(montantCommande(commande))}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-base font-semibold text-foreground">Commentaires</h2>
            <div className="mt-3 flex flex-col gap-2">
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Ajouter une note interne sur cette commande…"
                maxLength={400}
                rows={3}
              />
              <Button
                variant="outline"
                className="w-fit"
                onClick={() => {
                  const texte = commentaire.trim();
                  if (!texte) return;
                  ajouterCommentaireCommande(commande.id, commande.responsable, texte);
                  setCommentaire("");
                  toast.success("Commentaire ajouté");
                }}
              >
                <MessageSquarePlus className="mr-1.5 h-4 w-4" /> Ajouter
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {commande.commentaires.map((c) => (
                <div key={c.id} className="rounded-xl border border-border px-3 py-2.5">
                  <p className="text-sm text-foreground">{c.texte}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.auteur} · {formatDateCourt(c.date)}
                  </p>
                </div>
              ))}
              {!commande.commentaires.length && (
                <p className="text-sm text-muted-foreground">Aucun commentaire pour l'instant.</p>
              )}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-base font-semibold text-foreground">Informations</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Fournisseur</dt>
                <dd>
                  {fournisseur ? (
                    <Link
                      to="/fournisseurs/$fournisseurId"
                      params={{ fournisseurId: fournisseur.id }}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {fournisseur.nom}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Responsable</dt>
                <dd className="text-foreground">{commande.responsable}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Mode de paiement</dt>
                <dd className="text-foreground">{commande.modePaiement}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Date de réception</dt>
                <dd className="text-foreground">{formatDateCourt(commande.dateReception)}</dd>
              </div>
              {commande.notes && (
                <div>
                  <dt className="text-xs text-muted-foreground">Notes</dt>
                  <dd className="text-foreground">{commande.notes}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-base font-semibold text-foreground">Suivi</h2>
            <ol className="mt-3 space-y-3">
              {[...commande.historique].reverse().map((e, i) => (
                <li key={`${e.date}-${i}`} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm text-foreground">{e.libelle}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateCourt(e.date)} · {e.utilisateur}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <AlertDialog open={receptionOuverte} onOpenChange={setReceptionOuverte}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la réception ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le stock des {commande.lignes.length} produit(s) sera automatiquement augmenté et un
              mouvement d'entrée sera enregistré pour la commande {commande.numero}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                receptionnerCommande(commande.id);
                toast.success("Commande reçue", { description: "Stock mis à jour" });
                setReceptionOuverte(false);
              }}
            >
              Réceptionner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
