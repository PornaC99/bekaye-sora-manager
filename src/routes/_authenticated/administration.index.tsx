import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { AdminCard, AssistantConfiguration, Champ, SanteCards } from "@/components/admin/pieces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { progressionConfiguration, santeSysteme } from "@/lib/admin/health";
import { basculerEtape, enregistrerInfos, useAdminStore } from "@/lib/admin/store";
import type { Devise, FormatDate, InfosEntreprise, Langue } from "@/lib/admin/types";

export const Route = createFileRoute("/_authenticated/administration/")({
  component: EntreprisePage,
});

const DEVISES: Devise[] = ["XOF", "EUR", "USD"];
const FORMATS: FormatDate[] = ["jj/mm/aaaa", "aaaa-mm-jj", "mm/jj/aaaa"];
const LANGUES: { valeur: Langue; label: string }[] = [
  { valeur: "fr", label: "Français" },
  { valeur: "en", label: "Anglais" },
];

function EntreprisePage() {
  const { infos, utilisateurs, sauvegardes, audit, etapesFaites } = useAdminStore();
  const [form, setForm] = useState<InfosEntreprise>(infos);

  const maj = <K extends keyof InfosEntreprise>(cle: K, valeur: InfosEntreprise[K]) =>
    setForm((f) => ({ ...f, [cle]: valeur }));

  const indicateurs = santeSysteme({ utilisateurs, sauvegardes, audit });
  const config = progressionConfiguration(etapesFaites);

  return (
    <div className="flex flex-col gap-5">
      <AdminCard
        titre="Centre de santé du système"
        description="Surveillance automatique de la plateforme et de vos données."
        className="bg-card"
      >
        <SanteCards indicateurs={indicateurs} />
      </AdminCard>

      <AssistantConfiguration {...config} onBasculer={basculerEtape} />

      <AdminCard
        titre="Informations de l'entreprise"
        description="Ces informations apparaissent sur vos factures, rapports et documents imprimés."
        actions={
          <Button
            onClick={() => {
              enregistrerInfos(form);
              toast.success("Informations enregistrées");
            }}
          >
            Enregistrer
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Champ label="Nom de l'entreprise">
            <Input value={form.nom} onChange={(e) => maj("nom", e.target.value)} />
          </Champ>
          <Champ label="Nom commercial">
            <Input
              value={form.nomCommercial}
              onChange={(e) => maj("nomCommercial", e.target.value)}
            />
          </Champ>
          <Champ label="Slogan">
            <Input value={form.slogan} onChange={(e) => maj("slogan", e.target.value)} />
          </Champ>
          <Champ label="Téléphone">
            <Input value={form.telephone} onChange={(e) => maj("telephone", e.target.value)} />
          </Champ>
          <Champ label="WhatsApp">
            <Input value={form.whatsapp} onChange={(e) => maj("whatsapp", e.target.value)} />
          </Champ>
          <Champ label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => maj("email", e.target.value)}
            />
          </Champ>
          <Champ label="Site web">
            <Input value={form.siteWeb} onChange={(e) => maj("siteWeb", e.target.value)} />
          </Champ>
          <Champ label="Numéro d'identification">
            <Input value={form.identifiant} onChange={(e) => maj("identifiant", e.target.value)} />
          </Champ>
          <Champ label="Fuseau horaire">
            <Input
              value={form.fuseauHoraire}
              onChange={(e) => maj("fuseauHoraire", e.target.value)}
            />
          </Champ>
          <Champ label="Devise">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.devise}
              onChange={(e) => maj("devise", e.target.value as Devise)}
            >
              {DEVISES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Champ>
          <Champ label="Langue">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.langue}
              onChange={(e) => maj("langue", e.target.value as Langue)}
            >
              {LANGUES.map((l) => (
                <option key={l.valeur} value={l.valeur}>
                  {l.label}
                </option>
              ))}
            </select>
          </Champ>
          <Champ label="Format de date">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.formatDate}
              onChange={(e) => maj("formatDate", e.target.value as FormatDate)}
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Champ>
          <Champ label="Adresse">
            <Textarea
              rows={2}
              value={form.adresse}
              onChange={(e) => maj("adresse", e.target.value)}
            />
          </Champ>
          <Champ label="Logo (URL)" hint="Le téléversement sera branché sur le stockage sécurisé.">
            <Input
              value={form.logo}
              placeholder="https://…"
              onChange={(e) => maj("logo", e.target.value)}
            />
          </Champ>
        </div>
      </AdminCard>
    </div>
  );
}
