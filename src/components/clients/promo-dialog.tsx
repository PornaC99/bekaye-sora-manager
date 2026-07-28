import { useState } from "react";
import { Mail, MessageCircle, Send, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/clients/types";

export type CanalPromotion = "whatsapp" | "sms" | "email";

const CANAUX: { value: CanalPromotion; label: string; icon: typeof Mail; note: string }[] = [
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle, note: "Ouvre WhatsApp" },
  { value: "sms", label: "SMS", icon: Smartphone, note: "Intégration à venir" },
  { value: "email", label: "Email", icon: Mail, note: "Intégration à venir" },
];

const nettoyerNumero = (numero: string) => numero.replace(/[^\d]/g, "");

/** Envoi d'une promotion ou d'un message de vœux à un ou plusieurs clients. */
export function PromoDialog({
  open,
  onOpenChange,
  destinataires,
  messageInitial,
  titre = "Envoyer une promotion",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destinataires: Client[];
  messageInitial?: string;
  titre?: string;
}) {
  const [canal, setCanal] = useState<CanalPromotion>("whatsapp");
  const [message, setMessage] = useState(
    messageInitial ??
      "Bonjour ! Profitez de -10 % sur toute la gamme 501 cette semaine chez Bekaye Sora. À très vite !",
  );

  function envoyer() {
    const texte = message.trim().slice(0, 700);
    if (!texte) return;

    if (canal === "whatsapp") {
      const premier = destinataires[0];
      const numero = premier ? nettoyerNumero(premier.whatsapp || premier.telephone) : "";
      const url = numero
        ? `https://wa.me/${numero}?text=${encodeURIComponent(texte)}`
        : `https://wa.me/?text=${encodeURIComponent(texte)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{titre}</DialogTitle>
          <DialogDescription>
            {destinataires.length === 1
              ? `Destinataire : ${destinataires[0].nom}`
              : `${destinataires.length} destinataires sélectionnés`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Canal d'envoi</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {CANAUX.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCanal(c.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border p-3 text-xs transition",
                    canal === c.value
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  <c.icon className="h-4 w-4" />
                  <span className="font-medium">{c.label}</span>
                  <span className="text-[10px] opacity-80">{c.note}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="promo-message">Message</Label>
            <Textarea
              id="promo-message"
              rows={5}
              maxLength={700}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">{message.length}/700 caractères</p>
          </div>

          {canal !== "whatsapp" && (
            <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
              L'envoi par {canal === "sms" ? "SMS" : "email"} sera disponible lors de la prochaine
              intégration. Le message est enregistré comme brouillon.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={envoyer}>
            <Send className="mr-2 h-4 w-4" /> Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
