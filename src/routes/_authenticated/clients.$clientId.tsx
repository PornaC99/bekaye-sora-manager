import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  ShoppingBag,
  Sparkles,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { ClientAvatar, StatutClientBadge } from "@/components/clients/clients-table";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ClientsKpiCards } from "@/components/clients/kpi-cards";
import { LoyaltyCard } from "@/components/clients/loyalty-card";
import { PromoDialog } from "@/components/clients/promo-dialog";
import { PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { analyseClient } from "@/lib/clients/analytics";
import { modifierClient, useAchatsClient, useClient } from "@/lib/clients/store";
import { SEXE_LABEL } from "@/lib/clients/types";
import { formatDate, formatDateCourt, formatFCFA } from "@/lib/products/types";

export const Route = createFileRoute("/_authenticated/clients/$clientId")({
  head: () => ({
    meta: [
      { title: "Fiche client — Bekaye Sora Business Manager" },
      {
        name: "description",
        content: "Profil complet du client : coordonnées, achats, fidélité et analyse.",
      },
      { property: "og:title", content: "Fiche client — Bekaye Sora Business Manager" },
      {
        property: "og:description",
        content: "Profil complet du client : coordonnées, achats, fidélité et analyse.",
      },
    ],
  }),
  component: FicheClient,
});

function FicheClient() {
  const { clientId } = useParams({ from: "/_authenticated/clients/$clientId" });
  const client = useClient(clientId);
  const achats = useAchatsClient(client?.id ?? "");
  const [edition, setEdition] = useState(false);
  const [promo, setPromo] = useState(false);

  const analyse = useMemo(() => (client ? analyseClient(client, achats) : null), [client, achats]);

  if (!client || !analyse) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <p className="text-sm font-medium text-foreground">Client introuvable</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/clients">Retour au fichier client</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/clients">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux clients
        </Link>
      </Button>

      <PageHeader
        eyebrow={client.numero}
        title={client.nom}
        description={`Client depuis le ${formatDate(client.dateInscription)}.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setPromo(true)}>
              <MessageCircle className="mr-2 h-4 w-4" /> Message
            </Button>
            <Button onClick={() => setEdition(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Modifier
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-4">
            <ClientAvatar client={client} taille={64} />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold text-foreground">
                {client.nom}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatutClientBadge client={client} />
                <span className="text-xs text-muted-foreground">{SEXE_LABEL[client.sexe]}</span>
              </div>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <Info icon={Phone} label="Téléphone" valeur={client.telephone} />
            <Info icon={MessageCircle} label="WhatsApp" valeur={client.whatsapp || "—"} />
            <Info icon={Mail} label="Email" valeur={client.email || "—"} />
            <Info icon={MapPin} label="Ville" valeur={client.ville} />
            <Info icon={MapPin} label="Adresse" valeur={client.adresse || "—"} />
            <Info
              icon={CalendarDays}
              label="Date de naissance"
              valeur={formatDate(client.dateNaissance)}
            />
            <Info
              icon={CalendarDays}
              label="Date d'inscription"
              valeur={formatDate(client.dateInscription)}
            />
            <Info icon={Wallet} label="Dette en cours" valeur={formatFCFA(client.dette)} />
          </dl>

          {client.notes && (
            <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
              {client.notes}
            </p>
          )}
        </section>

        <div className="flex flex-col gap-4">
          <LoyaltyCard client={client} />
          <ClientsKpiCards
            cartes={[
              {
                label: "Total dépensé",
                value: formatFCFA(client.totalDepense),
                icon: ShoppingBag,
                tone: "primary",
              },
              {
                label: "Panier moyen",
                value: formatFCFA(analyse.panierMoyen),
                hint: `${client.nombreAchats} achats`,
                icon: Wallet,
                tone: "muted",
              },
            ]}
          />
        </div>
      </div>

      <section className="rounded-2xl border border-primary/25 bg-primary-soft/40 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Recommandation intelligente</h2>
        </div>
        <p className="mt-2 text-sm text-foreground">{analyse.recommandation}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Fréquence d'achat :{" "}
          {analyse.frequence
            ? `un achat tous les ${Math.round(analyse.frequence)} jours`
            : "pas encore mesurable"}{" "}
          · Dernier achat :{" "}
          {analyse.joursDepuisDernierAchat === null
            ? "aucun"
            : `il y a ${analyse.joursDepuisDernierAchat} jours`}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link to="/clients/analyse" search={{ client: client.id }}>
            Voir l'analyse complète
          </Link>
        </Button>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section
          id="historique"
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]"
        >
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Historique des achats</h2>
            <p className="text-xs text-muted-foreground">
              {achats.length} achat(s) enregistré(s) pour ce client.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Produits</th>
                  <th className="px-4 py-3 text-right font-medium">Montant</th>
                  <th className="px-4 py-3 font-medium">Paiement</th>
                  <th className="px-4 py-3 font-medium">Vendeur</th>
                </tr>
              </thead>
              <tbody>
                {achats.map((achat) => (
                  <tr key={achat.id} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateCourt(achat.date)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {achat.produits.map((p) => `${p.nom} ×${p.quantite}`).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {formatFCFA(achat.montant)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{achat.modePaiement}</td>
                    <td className="px-4 py-3 text-muted-foreground">{achat.vendeur}</td>
                  </tr>
                ))}
                {achats.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                      Aucun achat enregistré pour l'instant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Produits préférés</h2>
          </div>
          <ul className="mt-3 space-y-2">
            {analyse.preferes.map((p) => (
              <li
                key={p.produitId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm text-foreground">{p.nom}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {p.quantite} unités · {formatFCFA(p.montant)}
                </span>
              </li>
            ))}
            {analyse.preferes.length === 0 && (
              <li className="text-sm text-muted-foreground">Pas encore d'historique d'achat.</li>
            )}
          </ul>
        </section>
      </div>

      <ClientFormDialog
        open={edition}
        onOpenChange={setEdition}
        client={client}
        onSubmit={(values) => {
          modifierClient(client.id, values);
          toast.success("Fiche client mise à jour", { description: client.nom });
        }}
      />

      <PromoDialog
        open={promo}
        onOpenChange={setPromo}
        destinataires={[client]}
        titre="Envoyer un message"
      />
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  valeur,
}: {
  icon: typeof Phone;
  label: string;
  valeur: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm text-foreground">{valeur}</dd>
      </div>
    </div>
  );
}
