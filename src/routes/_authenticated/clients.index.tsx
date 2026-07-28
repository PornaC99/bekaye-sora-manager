import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Gift,
  Search,
  Settings2,
  Sparkles,
  TrendingUp,
  UserPlus,
  UserRound,
  UserRoundX,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { BirthdayPanel } from "@/components/clients/birthday-panel";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ClientsTable } from "@/components/clients/clients-table";
import { ClientsKpiCards } from "@/components/clients/kpi-cards";
import { LoyaltyRulesDialog } from "@/components/clients/loyalty-rules-dialog";
import { PromoDialog } from "@/components/clients/promo-dialog";
import { PageHeader } from "@/components/layout/page";
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
import { Input } from "@/components/ui/input";
import { kpisClients } from "@/lib/clients/analytics";
import {
  ajouterClient,
  enregistrerReglesFidelite,
  modifierClient,
  supprimerClient,
  useClientsStore,
} from "@/lib/clients/store";
import {
  anniversaireAujourdhui,
  estFidele,
  estInactif,
  estVip,
  type Client,
} from "@/lib/clients/types";
import { formatFCFA } from "@/lib/products/types";
import { cn } from "@/lib/utils";

const TITLE = "Clients";
const DESCRIPTION = "Gérez vos clients et développez leur fidélité.";

export const Route = createFileRoute("/_authenticated/clients/")({
  head: () => ({
    meta: [
      { title: `${TITLE} & fidélité — Bekaye Sora Business Manager` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} & fidélité — Bekaye Sora Business Manager` },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: ClientsPage,
});

const FILTRES = [
  { value: "tous", label: "Tous" },
  { value: "vip", label: "Clients VIP" },
  { value: "fideles", label: "Clients fidèles" },
  { value: "inactifs", label: "Clients inactifs" },
  { value: "dettes", label: "Clients avec dettes" },
] as const;

type Filtre = (typeof FILTRES)[number]["value"];

function ClientsPage() {
  const { clients, regles, notifications } = useClientsStore();
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [formulaire, setFormulaire] = useState(false);
  const [enEdition, setEnEdition] = useState<Client | null>(null);
  const [aSupprimer, setASupprimer] = useState<Client | null>(null);
  const [reglesOuvertes, setReglesOuvertes] = useState(false);
  const [promo, setPromo] = useState<{ clients: Client[]; message?: string; titre?: string } | null>(
    null,
  );

  const kpis = useMemo(() => kpisClients(clients), [clients]);
  const anniversaires = useMemo(() => clients.filter(anniversaireAujourdhui), [clients]);

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return clients
      .filter((c) => {
        if (filtre === "vip") return estVip(c);
        if (filtre === "fideles") return estFidele(c);
        if (filtre === "inactifs") return estInactif(c);
        if (filtre === "dettes") return c.dette > 0;
        return true;
      })
      .filter((c) =>
        q
          ? [c.nom, c.telephone, c.numero, c.email, c.ville].some((v) =>
              v?.toLowerCase().includes(q),
            )
          : true,
      )
      .sort((a, b) => b.totalDepense - a.totalDepense);
  }, [clients, filtre, recherche]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Commerce"
        title={TITLE}
        description={DESCRIPTION}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setReglesOuvertes(true)}>
              <Settings2 className="mr-2 h-4 w-4" /> Fidélité
            </Button>
            <Button
              variant="outline"
              onClick={() => setPromo({ clients: liste, titre: "Envoyer une promotion" })}
            >
              <Sparkles className="mr-2 h-4 w-4" /> Promotion
            </Button>
            <Button
              onClick={() => {
                setEnEdition(null);
                setFormulaire(true);
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" /> Nouveau client
            </Button>
          </div>
        }
      />

      <ClientsKpiCards
        cartes={[
          {
            label: "Total clients",
            value: String(kpis.total),
            hint: `${kpis.vip} clients VIP`,
            icon: Users,
            tone: "primary",
          },
          {
            label: "Nouveaux ce mois",
            value: String(kpis.nouveaux),
            hint: "Inscriptions du mois en cours",
            icon: UserPlus,
            tone: "success",
          },
          {
            label: "Clients actifs",
            value: String(kpis.actifs),
            hint: "Achat il y a moins de 90 jours",
            icon: UserRound,
            tone: "success",
          },
          {
            label: "Clients inactifs",
            value: String(kpis.inactifs),
            hint: "Aucun achat depuis 90 jours",
            icon: UserRoundX,
            tone: "warning",
          },
          {
            label: "Chiffre d'affaires clients",
            value: formatFCFA(kpis.chiffreAffaires),
            hint: "Cumul de tous les achats",
            icon: TrendingUp,
            tone: "primary",
          },
          {
            label: "Panier moyen",
            value: formatFCFA(kpis.panierMoyen),
            hint: `${kpis.dettes} client(s) avec dette`,
            icon: Wallet,
            tone: "muted",
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher par nom, téléphone, numéro client ou email…"
                className="pl-9"
                maxLength={80}
              />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {FILTRES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFiltre(f.value)}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition",
                    filtre === f.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <ClientsTable
            clients={liste}
            onModifier={(client) => {
              setEnEdition(client);
              setFormulaire(true);
            }}
            onSupprimer={setASupprimer}
          />
        </div>

        <div className="flex flex-col gap-4">
          <BirthdayPanel
            clients={anniversaires}
            onEnvoyer={(client) =>
              setPromo({
                clients: [client],
                titre: "Message de vœux",
                message: `Joyeux anniversaire ${client.nom} ! Toute l'équipe Bekaye Sora vous souhaite une belle journée. Profitez de -10 % sur la gamme 501 aujourd'hui.`,
              })
            }
          />

          <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
                <Gift className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Programme de fidélité</h2>
                <p className="text-xs text-muted-foreground">
                  {regles.pointsActifs
                    ? `${regles.pointsParTranche} point par ${formatFCFA(regles.trancheFCFA)}`
                    : "Attribution de points désactivée"}
                </p>
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              <li>
                Remise VIP :{" "}
                {regles.remiseActive ? `${regles.remisePourcent} %` : "désactivée"}
              </li>
              <li>
                Cadeau :{" "}
                {regles.cadeauActif
                  ? `${regles.cadeau} après ${regles.achatsAvantCadeau} achats`
                  : "désactivé"}
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-foreground">Notifications clients</h2>
            <ul className="mt-3 space-y-3">
              {notifications.slice(0, 5).map((n) => (
                <li key={n.id} className="rounded-xl border border-border/70 px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{n.titre}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                </li>
              ))}
              {notifications.length === 0 && (
                <li className="text-sm text-muted-foreground">Aucune notification pour l'instant.</li>
              )}
            </ul>
          </section>
        </div>
      </div>

      <ClientFormDialog
        open={formulaire}
        onOpenChange={setFormulaire}
        client={enEdition}
        onSubmit={(values) => {
          if (enEdition) {
            modifierClient(enEdition.id, values);
            toast.success("Client mis à jour", { description: values.nom });
          } else {
            const client = ajouterClient(values);
            toast.success("Nouveau client ajouté", {
              description: `${client.nom} · ${client.numero}`,
            });
          }
        }}
      />

      <LoyaltyRulesDialog
        open={reglesOuvertes}
        onOpenChange={setReglesOuvertes}
        regles={regles}
        onSubmit={(valeurs) => {
          enregistrerReglesFidelite(valeurs);
          toast.success("Programme de fidélité enregistré");
        }}
      />

      {promo && (
        <PromoDialog
          open
          onOpenChange={(o) => !o && setPromo(null)}
          destinataires={promo.clients}
          messageInitial={promo.message}
          titre={promo.titre}
        />
      )}

      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              {aSupprimer?.nom} et son historique d'achats seront définitivement retirés du fichier
              client. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!aSupprimer) return;
                supprimerClient(aSupprimer.id);
                toast.success("Client supprimé", { description: aSupprimer.nom });
                setASupprimer(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
