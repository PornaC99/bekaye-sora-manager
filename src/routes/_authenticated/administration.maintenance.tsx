import { createFileRoute } from "@tanstack/react-router";

import { AdminCard, Pastille, SanteCards } from "@/components/admin/pieces";
import {
  DATE_MISE_A_JOUR,
  EDITEUR,
  VERSION_LOGICIEL,
  santeSysteme,
} from "@/lib/admin/health";
import { useAdminStore } from "@/lib/admin/store";
import { formatDateHeure } from "@/lib/admin/types";

export const Route = createFileRoute("/_authenticated/administration/maintenance")({
  component: MaintenancePage,
});

function MaintenancePage() {
  const { utilisateurs, sauvegardes, audit, entreprises, magasins } = useAdminStore();
  const indicateurs = santeSysteme({ utilisateurs, sauvegardes, audit });
  const derniere = sauvegardes.find((s) => s.statut === "reussie");

  const infos = [
    { label: "Version du logiciel", valeur: VERSION_LOGICIEL },
    { label: "Éditeur", valeur: EDITEUR },
    { label: "Dernière mise à jour", valeur: DATE_MISE_A_JOUR },
    { label: "État de la base de données", valeur: "Opérationnelle" },
    { label: "Utilisation du stockage", valeur: "6,4 Go / 10 Go (64 %)" },
    {
      label: "Dernière sauvegarde",
      valeur: derniere ? `${derniere.id} — ${formatDateHeure(derniere.date)}` : "Aucune",
    },
    { label: "Entreprises gérées", valeur: `${entreprises.length}` },
    { label: "Magasins", valeur: `${magasins.length}` },
  ];

  return (
    <div className="flex flex-col gap-5">
      <AdminCard
        titre="Centre de maintenance"
        description="Informations système et état de la plateforme."
      >
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {infos.map((i) => (
            <div key={i.label} className="rounded-xl border border-border bg-background p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{i.label}</dt>
              <dd className="mt-1 text-sm font-semibold text-foreground">{i.valeur}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pastille ton="succes">Serveur opérationnel</Pastille>
          <Pastille ton="succes">Base de données connectée</Pastille>
          <Pastille ton="attention">Stockage à surveiller</Pastille>
        </div>
      </AdminCard>

      <AdminCard titre="Santé du système en temps réel" description="Indicateurs surveillés en continu.">
        <SanteCards indicateurs={indicateurs} />
      </AdminCard>
    </div>
  );
}
