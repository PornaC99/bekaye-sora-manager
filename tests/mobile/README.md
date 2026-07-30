# Tests d'affichage mobile

Suite automatisée qui parcourt les routes de l'application aux largeurs
**320, 360, 375, 390, 412, 430 et 768 px** et signale tout débordement
horizontal (scroll global ou élément dépassant le viewport).

## Lancer

Le serveur de développement doit tourner (`bun run dev`, port 8080).

```bash
python3 tests/mobile/audit-mobile.py                 # toutes les routes
python3 tests/mobile/audit-mobile.py --screenshots   # capture les échecs
python3 tests/mobile/audit-mobile.py --routes /mobile /auth
python3 tests/mobile/audit-mobile.py --widths 320 768
```

## Résultats

- Console : une ligne `OK` / `ECHEC` par couple route × largeur, avec le détail
  des éléments fautifs (sélecteur, dépassement en px, extrait de texte).
- `tests/mobile/rapport-mobile.json` : rapport complet exploitable en CI.
- `tests/mobile/captures/` : captures d'écran des échecs (option `--screenshots`).
- Code de sortie **1** si au moins un débordement est détecté (utilisable en CI).

## Notes

- Les routes dynamiques (`$id`) sont ignorées car elles nécessitent des données.
- Les conteneurs volontairement défilables horizontalement (`overflow-x-auto`,
  tableaux, onglets) ne sont pas comptés comme des débordements.
- Les pages protégées nécessitent une session : si la session Supabase de
  prévisualisation est disponible dans l'environnement, elle est injectée
  automatiquement ; sinon les pages redirigent vers `/auth`.
