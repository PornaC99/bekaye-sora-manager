# Sorties de stock + RBAC réel (utilisateurs, rôles, permissions)

## Audit de l'existant

Ce qui existe déjà et sera réutilisé (aucune duplication) :

- **Backend** : il n'y a pas de NestJS/Prisma/controllers dans ce projet. Le backend est
  PostgreSQL (Lovable Cloud) : RLS + fonctions SQL `SECURITY DEFINER`, appelées par le
  client. La sécurité « côté serveur » se fait donc au niveau base : politiques RLS +
  fonctions RPC transactionnelles. C'est l'équivalent des guards/controllers demandés.
- `mouvements_stock` (+ trigger `appliquer_mouvement_stock`) : le système StockMovement
  demandé existe déjà, applique le delta et écrit `stock_avant`/`stock_apres`. Il sera
  utilisé tel quel, sans logique parallèle.
- `journal_audit` : AuditLog existant.
- `user_roles` + enum `app_role` + `has_role()` / `is_admin()` : base RBAC partielle.
- `role_permissions` (entreprise_id, role, permission, autorise) : table présente mais
  jamais alimentée ni utilisée — elle deviendra la source de vérité des permissions.
- `profiles` (user_id, entreprise_id, magasin_id, actif) : rattachement tenant + dépôt.
- Frontend : `src/lib/access/roles.ts` (accès par racine de route), `AccessGuard`,
  `use-role.ts`, sidebar filtrée. À compléter, pas à réécrire.
- `src/routes/_authenticated/sorties-stock.tsx` : placeholder à remplacer.
- `administration/utilisateurs` : UI branchée sur un store local de démo → à brancher réel.

Limites constatées à traiter honnêtement :
- Pas de table `variantes` ni de table `lots` : les lots existent seulement dans
  `lignes_entree_stock` (lot, date_expiration). Je créerai une table `lots_stock`
  alimentée par les entrées pour permettre FEFO et la notion de variante/lot en sortie.
- Pas de colonne CUMP : j'ajoute `cump` sur `produits`, recalculé à l'entrée, inchangé
  à la sortie (règle comptable), et valorisation de la sortie au CUMP courant.

## Tranche 1 — Socle RBAC (base de données)

- Table `permissions` (catalogue global : code, module, libellé) remplie par migration
  avec les codes demandés (`products.*`, `stock.*`, `sales.*`, `cash.*`, `clients.*`,
  `employees.*`, `reports.read`, `settings.manage`, `users.manage`, `roles.manage`…).
- Extension de l'enum `app_role` : `responsable_stock` (les autres existent déjà).
- Seed `role_permissions` par entreprise via une fonction `initialiser_permissions(entreprise)`
  appelée à la création d'entreprise et rejouable (idempotente).
- Fonction `a_permission(_permission text)` `SECURITY DEFINER STABLE` : lit le rôle de
  `auth.uid()` dans `user_roles` + `role_permissions` de son entreprise. Le rôle n'est
  jamais lu depuis le client.
- Réécriture des politiques RLS des tables sensibles pour combiner
  `entreprise_id = current_entreprise_id()` **et** `a_permission('…')`.
  Un appel API direct sans permission → refus Postgres (403 côté client).

## Tranche 2 — Sorties de stock (backend)

- Table `lots_stock` (produit, magasin, lot, date_expiration, quantite_restante) alimentée
  par les entrées existantes ; index FEFO sur `date_expiration`.
- Colonne `cump` sur `produits`, mise à jour à l'entrée uniquement.
- Fonction `creer_sortie_stock(...)` `SECURITY DEFINER`, transactionnelle :
  1. vérifie `a_permission('stock.exit')` sinon `raise exception` (403) ;
  2. `SELECT ... FOR UPDATE` sur le produit (verrou déjà utilisé par le trigger) ;
  3. refuse si quantité > stock disponible du dépôt ;
  4. consomme les lots en FEFO quand ils existent ;
  5. insère dans `mouvements_stock` (type `sortie`) → le trigger décrémente ;
  6. valorise au CUMP, enregistre motif, dépôt, référence, commentaire, utilisateur ;
  7. écrit `journal_audit`.
- Motifs : vente, endommage, perte, consommation_interne, ajustement, transfert, autre.

## Tranche 3 — Sorties de stock (interface)

Remplacement du placeholder par un module complet :
- liste/historique (numéro, date-heure, produit, lot/variante, quantité, unité, dépôt,
  motif, utilisateur, statut), en cartes sur mobile ;
- recherche + filtres date, produit, dépôt, utilisateur, motif ;
- fiche détail d'une sortie ;
- dialogue « + Nouvelle sortie » : dépôt, produit, lot, quantité, unité, motif,
  commentaire, référence ; affichage du stock disponible en direct, blocage et message
  d'erreur clair si quantité > stock ; confirmation avant validation ;
- états loading / vide / erreur, toasts succès et erreur.

## Tranche 4 — Utilisateurs, rôles, permissions (interface + backend)

- Fonctions RPC : `creer_employe(...)` (crée l'invitation/profil, rattache au tenant du
  directeur, attribue rôle + dépôt, audit), `modifier_employe`, `basculer_statut_employe`,
  `attribuer_role`, `demander_reinitialisation_mot_de_passe`. Toutes protégées par
  `a_permission('users.manage')` et cloisonnées au tenant appelant.
- `administration/utilisateurs` branché sur ces fonctions (fin du store de démo).
- Écran rôles/permissions : matrice `role_permissions` réellement éditable
  (`roles.manage`), extensible à de nouveaux rôles sans changement de code.

## Tranche 5 — Frontend dynamique

- `src/lib/access/roles.ts` étendu : mapping module ↔ permission, plus de listes de
  routes codées en dur par rôle.
- Hook `usePermissions()` (permissions réelles de la session) ; sidebar, tabbar et
  boutons d'action masqués sans la permission ; `AccessGuard` basé sur les permissions.
- Le masquage reste cosmétique : la base refuse de toute façon l'opération.

## Tranche 6 — Tests et documentation

- Tests SQL (exécutés sur la base) : directeur autorisé ; responsable stock autorisé à
  sortir ; vendeur et caissier refusés ; sans permission → refus ; autre tenant → aucune
  ligne visible ; sortie > stock → refus ; sortie valide → mouvement créé, stock
  décrémenté, audit créé.
- Tests unitaires (vitest) sur le filtrage des menus par permission.
- Mise à jour README + CHANGELOG + docs.

## Points techniques

- Aucune logique de stock parallèle : tout passe par `mouvements_stock`.
- Le `entreprise_id` n'est jamais accepté depuis le client dans les nouvelles fonctions :
  il est dérivé de `current_entreprise_id()`.
- Migrations séparées par tranche pour éviter toute régression des 41 tables existantes.
