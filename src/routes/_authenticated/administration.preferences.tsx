import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { AdminCard, Bascule, Champ } from "@/components/admin/pieces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  enregistrerParametresFinanciers,
  enregistrerParametresStocks,
  enregistrerParametresVentes,
  useAdminStore,
} from "@/lib/admin/store";
import type {
  Devise,
  ParametresFinanciers,
  ParametresStocks,
  ParametresVentes,
} from "@/lib/admin/types";

export const Route = createFileRoute("/_authenticated/administration/preferences")({
  component: PreferencesPage,
});

function PreferencesPage() {
  const { ventes, stocks, finances } = useAdminStore();
  const [v, setV] = useState<ParametresVentes>(ventes);
  const [s, setS] = useState<ParametresStocks>(stocks);
  const [f, setF] = useState<ParametresFinanciers>(finances);
  const [categorie, setCategorie] = useState("");

  return (
    <div className="flex flex-col gap-5">
      <AdminCard
        titre="Paramètres des ventes"
        description="TVA, remises, numérotation des factures et conditions de paiement."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              enregistrerParametresVentes(v);
              toast.success("Paramètres de vente enregistrés");
            }}
          >
            Enregistrer
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="md:col-span-2 xl:col-span-1">
            <Bascule
              label="Appliquer la TVA"
              active={v.tvaActive}
              onChange={(val) => setV((p) => ({ ...p, tvaActive: val }))}
            />
          </div>
          <Champ label="Taux de TVA (%)">
            <Input
              type="number"
              min={0}
              value={v.tauxTva}
              onChange={(e) => setV((p) => ({ ...p, tauxTva: Number(e.target.value) }))}
            />
          </Champ>
          <Champ label="Remise maximale autorisée (%)">
            <Input
              type="number"
              min={0}
              value={v.remiseMaxPourcent}
              onChange={(e) => setV((p) => ({ ...p, remiseMaxPourcent: Number(e.target.value) }))}
            />
          </Champ>
          <Champ label="Préfixe de facture">
            <Input
              value={v.prefixeFacture}
              onChange={(e) => setV((p) => ({ ...p, prefixeFacture: e.target.value }))}
            />
          </Champ>
          <Champ label="Prochain numéro">
            <Input
              type="number"
              min={1}
              value={v.prochainNumero}
              onChange={(e) => setV((p) => ({ ...p, prochainNumero: Number(e.target.value) }))}
            />
          </Champ>
          <div className="md:col-span-2 xl:col-span-3">
            <Champ label="Conditions de paiement">
              <Textarea
                rows={2}
                value={v.conditionsPaiement}
                onChange={(e) => setV((p) => ({ ...p, conditionsPaiement: e.target.value }))}
              />
            </Champ>
          </div>
        </div>
      </AdminCard>

      <AdminCard
        titre="Paramètres des stocks"
        description="Seuils, lots, dates de péremption et inventaires automatiques."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              enregistrerParametresStocks(s);
              toast.success("Paramètres de stock enregistrés");
            }}
          >
            Enregistrer
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Champ label="Stock minimum par défaut">
            <Input
              type="number"
              min={0}
              value={s.stockMinimumDefaut}
              onChange={(e) => setS((p) => ({ ...p, stockMinimumDefaut: Number(e.target.value) }))}
            />
          </Champ>
          <Champ label="Alerte avant expiration (jours)">
            <Input
              type="number"
              min={0}
              value={s.alerteExpirationJours}
              onChange={(e) =>
                setS((p) => ({ ...p, alerteExpirationJours: Number(e.target.value) }))
              }
            />
          </Champ>
          <Champ label="Inventaire automatique">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={s.inventaireAutomatique}
              onChange={(e) =>
                setS((p) => ({
                  ...p,
                  inventaireAutomatique: e.target
                    .value as ParametresStocks["inventaireAutomatique"],
                }))
              }
            >
              <option value="aucun">Aucun</option>
              <option value="mensuel">Mensuel</option>
              <option value="trimestriel">Trimestriel</option>
            </select>
          </Champ>
          <Bascule
            label="Gestion des lots"
            active={s.gestionLots}
            onChange={(val) => setS((p) => ({ ...p, gestionLots: val }))}
          />
          <Bascule
            label="Suivi des dates de péremption"
            active={s.datesPeremption}
            onChange={(val) => setS((p) => ({ ...p, datesPeremption: val }))}
          />
        </div>
      </AdminCard>

      <AdminCard
        titre="Paramètres financiers"
        description="Devise, catégories de dépenses, objectifs et budgets."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              enregistrerParametresFinanciers(f);
              toast.success("Paramètres financiers enregistrés");
            }}
          >
            Enregistrer
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Champ label="Devise">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={f.devise}
              onChange={(e) => setF((p) => ({ ...p, devise: e.target.value as Devise }))}
            >
              <option value="XOF">XOF (FCFA)</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </Champ>
          <Champ label="Objectif de chiffre d'affaires mensuel">
            <Input
              type="number"
              min={0}
              value={f.objectifCaMensuel}
              onChange={(e) => setF((p) => ({ ...p, objectifCaMensuel: Number(e.target.value) }))}
            />
          </Champ>
          <Champ label="Budget de dépenses mensuel">
            <Input
              type="number"
              min={0}
              value={f.budgetDepensesMensuel}
              onChange={(e) =>
                setF((p) => ({ ...p, budgetDepensesMensuel: Number(e.target.value) }))
              }
            />
          </Champ>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Catégories de dépenses
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {f.categoriesDepenses.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-foreground"
              >
                {c}
                <button
                  type="button"
                  aria-label={`Retirer ${c}`}
                  onClick={() =>
                    setF((p) => ({
                      ...p,
                      categoriesDepenses: p.categoriesDepenses.filter((x) => x !== c),
                    }))
                  }
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex max-w-md gap-2">
            <Input
              className="h-9"
              placeholder="Nouvelle catégorie"
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const valeur = categorie.trim();
                if (!valeur) return;
                setF((p) => ({
                  ...p,
                  categoriesDepenses: Array.from(new Set([...p.categoriesDepenses, valeur])),
                }));
                setCategorie("");
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Ajouter
            </Button>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
