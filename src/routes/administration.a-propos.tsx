import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, Mail, ShieldCheck, Sparkles } from "lucide-react";

import { AdminCard, Pastille } from "@/components/admin/pieces";
import { DATE_MISE_A_JOUR, EDITEUR, VERSION_LOGICIEL } from "@/lib/admin/health";

export const Route = createFileRoute("/administration/a-propos")({
  component: AProposPage,
});

function AProposPage() {
  return (
    <div className="flex flex-col gap-5">
      <AdminCard titre="À propos du logiciel" description="Informations sur l'édition et la licence.">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft">
              <Sparkles className="h-5 w-5 text-primary" />
            </span>
            <h3 className="mt-3 text-xl font-semibold text-foreground">
              Bekaye Sora Business Manager
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Solution de gestion commerciale pour la marque cosmétique 501.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Développé par <span className="font-semibold text-foreground">{EDITEUR}</span>
            </p>
          </div>

          <dl className="grid w-full max-w-md gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-background p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Version</dt>
              <dd className="mt-1 text-sm font-semibold text-foreground">{VERSION_LOGICIEL}</dd>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Dernière mise à jour
              </dt>
              <dd className="mt-1 text-sm font-semibold text-foreground">{DATE_MISE_A_JOUR}</dd>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Licence</dt>
              <dd className="mt-1 text-sm font-semibold text-foreground">
                Business — 1 entreprise, magasins illimités
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Statut</dt>
              <dd className="mt-1">
                <Pastille ton="succes">Licence active</Pastille>
              </dd>
            </div>
          </dl>
        </div>
      </AdminCard>

      <AdminCard titre="Support & assistance" description="L'équipe NEXUSIA vous accompagne.">
        <div className="grid gap-3 md:grid-cols-3">
          <a
            href="mailto:support@nexusia.app"
            className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 transition hover:bg-muted/60"
          >
            <Mail className="h-5 w-5 text-primary" />
            <span>
              <span className="block text-sm font-medium text-foreground">Support par email</span>
              <span className="block text-xs text-muted-foreground">support@nexusia.app</span>
            </span>
          </a>
          <a
            href="https://wa.me/22670123456"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 transition hover:bg-muted/60"
          >
            <LifeBuoy className="h-5 w-5 text-primary" />
            <span>
              <span className="block text-sm font-medium text-foreground">Assistance WhatsApp</span>
              <span className="block text-xs text-muted-foreground">Réponse sous 24 h ouvrées</span>
            </span>
          </a>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span>
              <span className="block text-sm font-medium text-foreground">Données protégées</span>
              <span className="block text-xs text-muted-foreground">
                Chiffrement, sauvegardes et isolation par entreprise
              </span>
            </span>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
