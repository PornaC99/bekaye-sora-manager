## Objectif

Remplacer les 11 stores locaux (~3 100 lignes de données de démo) par de vraies lectures/écritures Supabase, avec CRUD, recherche, filtres et compteurs calculés, sans casser les interfaces existantes.

## Point de départ

- La base est déjà complète : 41 tables, RLS par `entreprise_id`, triggers (stock auto, numérotation des ventes, `updated_at`), fonction `creer_entreprise()`.
- L'authentification e-mail/mot de passe fonctionne, toutes les pages métier sont sous `_authenticated`.
- Aujourd'hui chaque module lit un store en mémoire (`src/lib/<module>/store.ts`) alimenté par `demo-data.ts`.

## Blocage à lever en premier

Un compte fraîchement créé n'a **aucune entreprise** : `current_entreprise_id()` renvoie `null`, donc le RLS masque tout et l'application afficherait des pages vides. Il faut un écran d'accueil « Créer mon entreprise » avant toute connexion aux données.

## Phase 0 — Fondations (prérequis de toutes les autres)

1. Écran d'onboarding : si le profil connecté n'a pas d'entreprise, afficher un formulaire (nom, secteur, devise) appelant `creer_entreprise()`.
2. Hook `useEntreprise()` : entreprise courante, rôle, abonnement — mis en cache par TanStack Query.
3. Couche d'accès commune `src/lib/db/` :
   - helpers de requête typés (pagination, recherche `ilike`, filtres),
   - conversion base ↔ types front (`snake_case` → champs français déjà utilisés par l'UI),
   - gestion d'erreurs unifiée (toast en français + message clair, jamais d'erreur brute).
4. Clés de cache et invalidations croisées (une vente invalide produits, stock, trésorerie, dashboard).

## Phase 1 — Catalogue

Catégories, Produits, Fournisseurs : CRUD complet, recherche serveur, filtres (statut, catégorie, stock faible), pagination, activation/désactivation, duplication, export.

## Phase 2 — Stock

Entrées de stock, Sorties de stock, Mouvements, Inventaire : écritures dans `entrees_stock` / `lignes_entree_stock`, `mouvements_stock`, `inventaires` / `lignes_inventaire`. Le stock produit est mis à jour par le trigger existant — pas de double comptage.

## Phase 3 — Commerce

Clients & fidélité, Ventes, Caisse (POS) : panier écrit en transaction (`ventes` + `lignes_vente` + `paiements_vente` + mouvements), sessions de caisse, retours, points de fidélité.

## Phase 4 — Interne

Employés, Présences, Congés, Salaires, Dépenses & trésorerie : CRUD complet, transactions de trésorerie liées aux ventes et dépenses.

## Phase 5 — Agrégations

Tableau de bord, Rapports/BI, NEXUSIA, Notifications, Paramètres : compteurs et graphiques calculés à partir de requêtes agrégées Supabase (aucune valeur codée en dur), notifications persistées, paramètres stockés dans `parametres`.

## Phase 6 — Finition

Suppression des fichiers `demo-data.ts`, états de chargement/vides/erreur sur chaque tableau, vérification des permissions par rôle, contrôle de sécurité final.

## Détails techniques

- Lectures via le client navigateur Supabase (RLS appliqué) + TanStack Query (`useQuery` / `useMutation`, invalidation ciblée).
- Écritures multi-tables (vente, entrée de stock, inventaire) via `createServerFn` avec `requireSupabaseAuth` pour garantir l'atomicité et la cohérence.
- Les signatures des stores actuels sont conservées autant que possible pour limiter les modifications de composants.
- Ajout d'états `chargement` / `erreur` / `vide` dans les tableaux existants.

## Question de démarrage

Deux options pour la première connexion :
- **A** — entreprise vide : vous saisissez vos vrais produits, clients, etc.
- **B** — entreprise pré-remplie avec un jeu de données de démonstration réaliste (produits 501, clients, ventes) inséré en base, supprimable ensuite.

## Livraison

Je propose d'exécuter Phase 0 + Phase 1 dans un premier temps (fondations + catalogue entièrement fonctionnel et vérifiable), puis d'enchaîner les phases suivantes. Tout faire d'un seul bloc rendrait la vérification impossible et multiplierait les risques de régression.
