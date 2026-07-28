import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DatabaseBackup, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { AdminCard, Bascule, Champ, Pastille } from "@/components/admin/pieces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  creerSauvegarde,
  enregistrerPlanification,
  journaliser,
  useAdminStore,
} from "@/lib/admin/store";
import { formatDateHeure, type PlanificationSauvegarde } from "@/lib/admin/types";

export const Route = createFileRoute("/administration/sauvegardes")({
  component: SauvegardesPage,
});

function SauvegardesPage() {
  const { sauvegardes, planification } = useAdminStore();
  const [form, setForm] = useState<PlanificationSauvegarde>(planification);

  return (
    <div className="flex flex-col gap-5">
      <AdminCard
        titre="Sauvegardes"
        description="Créez, restaurez et téléchargez les sauvegardes de vos données."
        actions={
          <Button
            onClick={() => {
              const s = creerSauvegarde();
              toast.success(`Sauvegarde ${s.id} créée`);
            }}
          >
            <DatabaseBackup className="mr-1.5 h-4 w-4" /> Créer une sauvegarde
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Référence</th>
                <th className="pb-2 pr-3 font-medium">Date</th>
                <th className="pb-2 pr-3 font-medium">Type</th>
                <th className="pb-2 pr-3 font-medium">Taille</th>
                <th className="pb-2 pr-3 font-medium">Auteur</th>
                <th className="pb-2 pr-3 font-medium">Statut</th>
                <th className="pb-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sauvegardes.map((s) => (
                <tr key={s.id} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-3 font-medium text-foreground">{s.id}</td>
                  <td className="whitespace-nowrap py-3 pr-3 text-muted-foreground">
                    {formatDateHeure(s.date)}
                  </td>
                  <td className="py-3 pr-3 capitalize text-muted-foreground">{s.type}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{s.taille}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{s.auteur}</td>
                  <td className="py-3 pr-3">
                    <Pastille
                      ton={
                        s.statut === "reussie"
                          ? "succes"
                          : s.statut === "en_cours"
                            ? "attention"
                            : "danger"
                      }
                    >
                      {s.statut === "reussie"
                        ? "Réussie"
                        : s.statut === "en_cours"
                          ? "En cours"
                          : "Échouée"}
                    </Pastille>
                  </td>
                  <td className="py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={s.statut !== "reussie"}
                        onClick={() => {
                          journaliser({
                            action: "export",
                            module: "Sauvegardes",
                            details: `Téléchargement de la sauvegarde ${s.id}.`,
                          });
                          toast.success("Téléchargement démarré");
                        }}
                      >
                        <Download className="mr-1.5 h-4 w-4" /> Télécharger
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={s.statut !== "reussie"}
                        onClick={() => {
                          journaliser({
                            action: "modification",
                            module: "Sauvegardes",
                            details: `Restauration demandée depuis ${s.id}.`,
                          });
                          toast.success("Restauration planifiée");
                        }}
                      >
                        <RotateCcw className="mr-1.5 h-4 w-4" /> Restaurer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <AdminCard
        titre="Planification automatique"
        description="Les sauvegardes seront exécutées côté serveur et stockées de façon sécurisée."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              enregistrerPlanification(form);
              toast.success("Planification enregistrée");
            }}
          >
            Enregistrer
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2">
            <Bascule
              label="Activer les sauvegardes automatiques"
              description="Recommandé pour éviter toute perte de données."
              active={form.active}
              onChange={(v) => setForm((f) => ({ ...f, active: v }))}
            />
          </div>
          <Champ label="Fréquence">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.frequence}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  frequence: e.target.value as PlanificationSauvegarde["frequence"],
                }))
              }
            >
              <option value="quotidienne">Quotidienne</option>
              <option value="hebdomadaire">Hebdomadaire</option>
              <option value="mensuelle">Mensuelle</option>
            </select>
          </Champ>
          <Champ label="Heure d'exécution">
            <Input
              type="time"
              value={form.heure}
              onChange={(e) => setForm((f) => ({ ...f, heure: e.target.value }))}
            />
          </Champ>
          <Champ label="Rétention (jours)">
            <Input
              type="number"
              min={1}
              value={form.retentionJours}
              onChange={(e) => setForm((f) => ({ ...f, retentionJours: Number(e.target.value) }))}
            />
          </Champ>
        </div>
        <p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
          Prêt pour le branchement sur la base de données infonuagique : chaque sauvegarde sera
          associée à l'entreprise courante et protégée par les règles d'accès (RLS).
        </p>
      </AdminCard>
    </div>
  );
}
