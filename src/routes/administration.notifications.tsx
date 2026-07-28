import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { AdminCard, Bascule, Champ } from "@/components/admin/pieces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { enregistrerNotifications, useAdminStore } from "@/lib/admin/store";
import type { PreferencesNotifications } from "@/lib/admin/types";

export const Route = createFileRoute("/administration/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { notifications } = useAdminStore();
  const [form, setForm] = useState<PreferencesNotifications>(notifications);

  const maj = <K extends keyof PreferencesNotifications>(
    cle: K,
    valeur: PreferencesNotifications[K],
  ) => setForm((f) => ({ ...f, [cle]: valeur }));

  return (
    <AdminCard
      titre="Notifications"
      description="Choisissez les canaux par lesquels vous souhaitez être alerté."
      actions={
        <Button
          onClick={() => {
            enregistrerNotifications(form);
            toast.success("Préférences enregistrées");
          }}
        >
          Enregistrer
        </Button>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Bascule
          label="Notifications internes"
          description="Alertes affichées dans l'application (stock, ventes, caisse)."
          active={form.internes}
          onChange={(v) => maj("internes", v)}
        />
        <Bascule
          label="Notifications par email"
          description="Résumés quotidiens et alertes critiques."
          active={form.email}
          onChange={(v) => maj("email", v)}
        />
        <Bascule
          label="WhatsApp"
          description="Intégration future : rappels clients et alertes direction."
          active={form.whatsapp}
          onChange={(v) => maj("whatsapp", v)}
        />
        <Bascule
          label="Push mobile"
          description="Alertes en direct sur l'application mobile du Directeur."
          active={form.push}
          onChange={(v) => maj("push", v)}
        />
      </div>

      <div className="mt-4 max-w-md">
        <Champ label="Email destinataire des alertes">
          <Input
            type="email"
            value={form.emailDestinataire}
            onChange={(e) => maj("emailDestinataire", e.target.value)}
          />
        </Champ>
      </div>
    </AdminCard>
  );
}
