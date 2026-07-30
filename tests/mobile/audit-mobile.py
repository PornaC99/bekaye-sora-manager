#!/usr/bin/env python3
"""
Suite de tests automatisés — affichage mobile de Bekaye Sora Business Manager.

Vérifie chaque route aux largeurs 320 / 360 / 375 / 390 / 412 / 430 / 768 px et
signale tout débordement horizontal (scroll global, éléments plus larges que le
viewport, texte tronqué hors cadre).

Usage:
  python3 tests/mobile/audit-mobile.py                # toutes les routes
  python3 tests/mobile/audit-mobile.py --routes / /mobile
  python3 tests/mobile/audit-mobile.py --base-url http://localhost:8080
  python3 tests/mobile/audit-mobile.py --screenshots  # capture les échecs

Sortie : rapport console + tests/mobile/rapport-mobile.json
Code de sortie 1 si au moins un débordement est détecté.
"""

import argparse
import asyncio
import json
import os
import re
import sys
from pathlib import Path

from playwright.async_api import async_playwright

RACINE = Path(__file__).resolve().parents[2]
DOSSIER_ROUTES = RACINE / "src" / "routes"
SORTIE = Path(__file__).parent
CAPTURES = SORTIE / "captures"

LARGEURS = [320, 360, 375, 390, 412, 430, 768]
HAUTEUR = 900
# Tolérance en px : évite les faux positifs liés aux arrondis sub-pixel.
TOLERANCE = 1.0


def decouvrir_routes() -> list[str]:
    """Déduit les chemins URL testables à partir des fichiers de routes."""
    chemins: set[str] = set()
    for fichier in DOSSIER_ROUTES.rglob("*.tsx"):
        rel = fichier.relative_to(DOSSIER_ROUTES).with_suffix("")
        parties = str(rel).replace(os.sep, ".")
        if parties.startswith("__") or parties.endswith("route"):
            continue
        segments = [s for s in parties.split(".") if s]
        # Routes dynamiques ($id) non testables sans données : ignorées.
        if any(s.startswith("$") for s in segments):
            continue
        # Retire les segments de layout sans chemin (_authenticated) et « index ».
        segments = [s for s in segments if not s.startswith("_") and s != "index"]
        chemins.add("/" + "/".join(segments))
    return sorted(chemins)


SCRIPT_DEBORDEMENT = """
() => {
  const vw = document.documentElement.clientWidth;
  const scrollW = Math.max(
    document.documentElement.scrollWidth,
    document.body ? document.body.scrollWidth : 0
  );
  const coupables = [];
  for (const el of document.querySelectorAll('body *')) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    if (style.position === 'fixed') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const depassement = Math.max(r.right - vw, -r.left);
    if (depassement > __TOL__) {
      // Ignore les conteneurs volontairement défilables horizontalement.
      let parent = el.parentElement, gere = false;
      while (parent) {
        const ps = getComputedStyle(parent);
        if (ps.overflowX === 'auto' || ps.overflowX === 'scroll' || ps.overflowX === 'hidden') { gere = true; break; }
        parent = parent.parentElement;
      }
      if (gere) continue;
      coupables.push({
        selecteur: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string'
          ? '.' + el.className.trim().split(/\\s+/).slice(0, 4).join('.') : ''),
        depassement: Math.round(depassement),
        largeur: Math.round(r.width),
        texte: (el.textContent || '').trim().slice(0, 60),
      });
    }
  }
  // Dédoublonne et garde les pires coupables.
  const uniques = [];
  const vus = new Set();
  for (const c of coupables.sort((a, b) => b.depassement - a.depassement)) {
    if (vus.has(c.selecteur)) continue;
    vus.add(c.selecteur);
    uniques.push(c);
    if (uniques.length >= 8) break;
  }
  return { vw, scrollW, scrollHorizontal: scrollW - vw > __TOL__, coupables: uniques };
}
""".replace("__TOL__", str(TOLERANCE))


async def restaurer_session(context, page, base_url: str) -> bool:
    """Injecte la session Lovable/Supabase si elle est disponible."""
    session = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
    cle = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
    cookies = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
    if not session and not cookies:
        return False
    if cookies:
        liste = json.loads(cookies)
        for c in liste:
            c["url"] = base_url
        await context.add_cookies(liste)
    await page.goto(base_url, wait_until="domcontentloaded")
    if session and cle:
        await page.evaluate(
            f"window.localStorage.setItem({json.dumps(cle)}, {json.dumps(session)})"
        )
    return True


async def main() -> int:
    parseur = argparse.ArgumentParser()
    parseur.add_argument("--base-url", default="http://localhost:8080")
    parseur.add_argument("--routes", nargs="*", default=None)
    parseur.add_argument("--widths", nargs="*", type=int, default=LARGEURS)
    parseur.add_argument("--screenshots", action="store_true")
    args = parseur.parse_args()

    routes = args.routes or decouvrir_routes()
    if args.screenshots:
        CAPTURES.mkdir(parents=True, exist_ok=True)

    resultats = []
    echecs = 0

    async with async_playwright() as pw:
        navigateur = await pw.chromium.launch(headless=True)
        context = await navigateur.new_context(
            viewport={"width": args.widths[0], "height": HAUTEUR},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page = await context.new_page()
        connecte = await restaurer_session(context, page, args.base_url)

        for route in routes:
            for largeur in args.widths:
                await page.set_viewport_size({"width": largeur, "height": HAUTEUR})
                url = args.base_url.rstrip("/") + route
                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    await page.wait_for_timeout(700)
                    rapport = await page.evaluate(SCRIPT_DEBORDEMENT)
                except Exception as err:  # noqa: BLE001
                    resultats.append(
                        {"route": route, "largeur": largeur, "erreur": str(err)[:200]}
                    )
                    echecs += 1
                    print(f"ERREUR  {route} @ {largeur}px : {str(err)[:120]}")
                    continue

                ko = rapport["scrollHorizontal"] or rapport["coupables"]
                resultats.append(
                    {
                        "route": route,
                        "largeur": largeur,
                        "urlFinale": page.url,
                        "scrollHorizontal": rapport["scrollHorizontal"],
                        "scrollWidth": rapport["scrollW"],
                        "coupables": rapport["coupables"],
                        "statut": "ECHEC" if ko else "OK",
                    }
                )
                if ko:
                    echecs += 1
                    print(f"ECHEC   {route} @ {largeur}px "
                          f"(scrollWidth={rapport['scrollW']})")
                    for c in rapport["coupables"]:
                        print(f"        +{c['depassement']}px  {c['selecteur']}  « {c['texte']} »")
                    if args.screenshots:
                        nom = re.sub(r"[^a-z0-9]+", "-", route.lower()).strip("-") or "accueil"
                        await page.screenshot(path=str(CAPTURES / f"{nom}-{largeur}.png"))
                else:
                    print(f"OK      {route} @ {largeur}px")

        await navigateur.close()

    (SORTIE / "rapport-mobile.json").write_text(
        json.dumps(
            {"connecte": connecte, "largeurs": args.widths, "resultats": resultats},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    total = len(resultats)
    print("\n" + "=" * 60)
    print(f"Routes testées : {len(routes)} — contrôles : {total} — débordements : {echecs}")
    print(f"Rapport : {SORTIE / 'rapport-mobile.json'}")
    if not connecte:
        print("Note : aucune session injectée, les pages protégées redirigent vers /auth.")
    return 1 if echecs else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
