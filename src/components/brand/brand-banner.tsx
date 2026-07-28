import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkle } from "lucide-react";

import { BOUTEILLE_501_URL, LOGO_URL, MARQUE } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * Bannière premium de la marque Bekaye Sora Collection.
 * Composition : fond rouge profond texturé, filet doré, logo et bouteille 501
 * intégrée avec reflet et profondeur (jamais une simple photo collée).
 */
export function BrandBanner({
  titre = "Bienvenue sur Bekaye Sora Business Manager",
  sousTitre = "Gérez efficacement votre entreprise depuis une seule plateforme.",
  action,
  className,
}: {
  titre?: string;
  sousTitre?: string;
  action?: { label: string; to: string };
  className?: string;
}) {
  return (
    <section
      className={cn(
        "brand-surface-red relative isolate overflow-hidden rounded-2xl border border-[var(--color-gold)]/25 shadow-[var(--shadow-luxe)]",
        className,
      )}
    >
      {/* Filet doré supérieur */}
      <div className="brand-gold-line absolute inset-x-0 top-0 h-px opacity-80" />
      {/* Halo lumineux */}
      <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute right-1/3 bottom-0 h-52 w-52 rounded-full bg-[var(--color-gold)]/15 blur-3xl" />

      <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.35fr_1fr] lg:items-center">
        <div className="animate-fade-in flex min-w-0 flex-col gap-4">
          <div className="flex items-center gap-3">
            <img
              src={LOGO_URL}
              alt="Bekaye Sora Collection"
              className="h-14 w-14 rounded-xl object-cover ring-1 ring-[var(--color-gold)]/50"
              loading="eager"
              decoding="async"
            />
            <div>
              <p className="brand-gold-text font-display text-xs font-semibold uppercase tracking-[0.28em]">
                {MARQUE.nom}
              </p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                {MARQUE.app}
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold leading-tight text-white sm:text-3xl">
              {titre}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/70">{sousTitre}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {action && (
              <Link
                to={action.to}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[oklch(0.3_0.14_25)] shadow-lg transition-transform hover:scale-[1.02]"
              >
                {action.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-gold)]/40 px-3.5 py-2 text-xs font-medium tracking-wide text-[var(--color-gold)]">
              <Sparkle className="h-3.5 w-3.5" />
              {MARQUE.signature}
            </span>
          </div>
        </div>

        {/* Composition bouteille 501 : cadre verre + reflet */}
        <div className="relative hidden min-h-[190px] lg:block">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent" />
          <div className="relative h-full overflow-hidden rounded-2xl ring-1 ring-white/10">
            <img
              src={BOUTEILLE_501_URL}
              alt="Lotion 501 Bekaye Sora Collection"
              className="h-full w-full scale-[1.08] object-cover object-right transition-transform duration-700 hover:scale-[1.14]"
              loading="lazy"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[oklch(0.2_0.08_23)] via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
            <div className="pointer-events-none absolute -left-6 top-0 h-full w-16 rotate-12 bg-white/10 blur-xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
