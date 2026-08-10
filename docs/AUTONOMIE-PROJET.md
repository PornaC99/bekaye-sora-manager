# NEXUSIA ERP / Bekaye Sora Business Manager — Autonomie & Souveraineté du projet

Document d'audit. Aucun code applicatif n'a été modifié.
Objectif : pouvoir faire tourner, développer, sauvegarder et déployer 100 % du
projet depuis votre PC, sans Lovable ni aucun service de génération de code.

---

## 1. Où se trouve chaque partie du code source

Tout le code vit dans un seul dépôt (le dossier du projet). Rien n'est stocké
« côté Lovable » : la plateforme n'est qu'un éditeur. Structure réelle :

```text
racine/
├─ package.json            Dépendances + scripts (dev, build, lint, format)
├─ vite.config.ts          Configuration du bundler (Vite 8 + TanStack Start)
├─ tsconfig.json           TypeScript + alias "@/" -> src/
├─ eslint.config.js .prettierrc   Qualité de code
├─ components.json         Configuration shadcn/ui
├─ .env                    Variables d'environnement (URL + clé publique API)
├─ index / public/         robots.txt et fichiers statiques
├─ supabase/
│  ├─ config.toml          Référence du projet base de données
│  └─ migrations/*.sql     TOUT le schéma SQL (5 fichiers, 41 tables, RLS,
│                          triggers, fonctions, index)
├─ tests/mobile/           Suite d'audit responsive (Python + Playwright)
├─ docs/                   Cette documentation
└─ src/
   ├─ routes/              Pages (routage par fichiers)
   │   ├─ __root.tsx       Coquille HTML globale
   │   ├─ auth.tsx, reset-password.tsx   Pages publiques
   │   ├─ _authenticated/  Toutes les pages protégées (17 modules)
   │   └─ mobile.*.tsx     Application mobile Directeur
   ├─ components/          Composants UI par domaine (layout, dashboard,
   │                       products, sales, clients, hr, finance, admin,
   │                       inventory, suppliers, mobile, ui/ = shadcn)
   ├─ lib/                 Logique métier : products, sales, stock, clients,
   │                       suppliers, hr, finance, reports, inventory, admin,
   │                       access (rôles), db (tenant, catalogue), core, demo,
   │                       brand.ts, navigation.ts, utils.ts
   ├─ hooks/               use-session, use-entreprise, use-role, use-theme…
   ├─ integrations/supabase/  Clients base de données (auto-générés)
   ├─ styles.css           Design system (couleurs, ombres, jetons OKLCH)
   ├─ router.tsx start.ts server.ts main entry
   └─ routeTree.gen.ts     Généré automatiquement — ne pas éditer
```

Ce qui n'est PAS dans le dépôt : les données de la base (elles vivent dans
PostgreSQL), les secrets serveur (clé de service), et `node_modules`.

## 2. Fichiers indispensables au fonctionnement

Indispensables (sans eux, l'application ne démarre pas) :

- `package.json` + `bun.lock` / `package-lock.json`
- `vite.config.ts`, `tsconfig.json`
- `src/` en entier (dont `src/routes/__root.tsx`, `src/router.tsx`,
  `src/start.ts`, `src/server.ts`, `src/styles.css`)
- `supabase/migrations/*.sql` (le schéma complet de la base)
- `.env` (ou ses équivalents sur la machine cible)

Utiles mais non bloquants : `eslint.config.js`, `.prettierrc`,
`components.json`, `tests/`, `docs/`, `README.md`.

Régénérables : `src/routeTree.gen.ts` (recréé au démarrage de Vite),
`src/integrations/supabase/types.ts` (regénérable depuis le schéma),
`node_modules/`, `dist/`, `.output/`.

## 3. Dépendances externes

**Outils machine** : Node.js 22+ (ou Bun), un gestionnaire de paquets
(bun/npm/pnpm), Git. Optionnel : Docker (base locale), Python 3 + Playwright
(tests mobiles).

**Bibliothèques applicatives** (toutes open source, installées localement) :

| Domaine | Paquets |
| --- | --- |
| Framework | react, react-dom, @tanstack/react-start, @tanstack/react-router, vite |
| Données | @tanstack/react-query, @supabase/supabase-js, zod |
| UI | tailwindcss v4, @radix-ui/*, lucide-react, recharts, sonner, vaul, cmdk, embla-carousel |
| Formulaires | react-hook-form, @hookform/resolvers |
| Divers | date-fns, qrcode, clsx, tailwind-merge, class-variance-authority |
| Dev | typescript, eslint, prettier, nitro, @lovable.dev/vite-tanstack-config |

**Services externes réellement utilisés à l'exécution** : uniquement
PostgreSQL + l'API Supabase (base, authentification, stockage). Aucune API
Lovable n'est appelée par l'application en production.

**Point de dépendance à retirer si vous voulez zéro trace plateforme** :
`@lovable.dev/vite-tanstack-config` (paquet de configuration Vite en
devDependency). Il est remplaçable par un `vite.config.ts` classique
déclarant : plugin TanStack Start, plugin React, plugin Tailwind,
vite-tsconfig-paths et l'alias `@`. C'est une opération de 30 lignes, à faire
seulement quand vous le décidez (hors du périmètre de cet audit).

## 4. Lancer le projet en local

```bash
git clone <votre-dépôt> nexusia-erp
cd nexusia-erp
bun install            # ou: npm install
cp .env.example .env   # à défaut, recopier le .env existant
bun run dev            # http://localhost:8080
```

Autres commandes : `bun run build` (production), `bun run preview`
(prévisualiser le build), `bun run lint`, `bun run format`.

Variables d'environnement attendues :

```ini
VITE_SUPABASE_URL=...            # visibles côté navigateur
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
SUPABASE_URL=...                 # côté serveur uniquement
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...    # jamais dans le navigateur, jamais commité
```

## 5. Faire fonctionner la base de données localement

Le schéma complet est dans `supabase/migrations/`. Deux voies :

**A. Supabase CLI + Docker (recommandé, reproduit l'environnement exact)**

```bash
npm i -g supabase
supabase init          # si le dossier n'est pas déjà initialisé
supabase start         # démarre Postgres + Auth + API en local (Docker)
supabase db reset      # applique toutes les migrations dans l'ordre
```

`supabase start` affiche une URL locale (souvent `http://127.0.0.1:54321`) et
une clé anon : reportez-les dans `.env` pour travailler 100 % hors ligne.

**B. PostgreSQL seul** (sans authentification Supabase) :

```bash
createdb nexusia
for f in supabase/migrations/*.sql; do psql -d nexusia -f "$f"; done
```

Cette voie convient à l'analyse du schéma ; l'authentification et le RLS par
utilisateur nécessitent la pile Supabase (voie A) ou une réimplémentation.

**Nouvelle évolution du schéma** : créer un fichier
`supabase/migrations/<horodatage>_description.sql`, jamais modifier un fichier
déjà appliqué. Toujours inclure `CREATE TABLE`, puis les `GRANT`, puis
`ENABLE ROW LEVEL SECURITY`, puis les `CREATE POLICY`.

## 6. Développer et tester hors connexion

Une fois `bun install` fait et `supabase start` lancé, tout fonctionne sans
Internet :

- Vite sert l'application depuis le cache local, le rechargement à chaud
  fonctionne hors ligne ;
- la base tourne dans Docker sur votre machine ;
- ESLint, Prettier, TypeScript sont locaux.

À préparer avant de couper le réseau : `node_modules` installé, images Docker
Supabase déjà téléchargées (`supabase start` une première fois en ligne),
navigateurs Playwright installés si vous utilisez `tests/mobile/`.

Seuls éléments qui échouent hors ligne : les polices/CDN distants éventuels et
toute base distante. En pointant `.env` sur la base locale, l'application est
totalement autonome.

## 7. Sauvegarder / restaurer le projet

Le projet = **code** + **base** + **secrets**. Sauvegardez les trois.

```bash
# 1. Code : dépôt Git dupliqué (GitHub privé, disque externe, NAS)
git bundle create nexusia-$(date +%F).bundle --all

# 2. Base : export SQL complet
supabase db dump --file backup-$(date +%F).sql          # local
pg_dump "$DATABASE_URL" > backup-$(date +%F).sql        # distant

# 3. Secrets : le fichier .env, stocké dans un gestionnaire de mots de passe
#    (jamais dans Git)
```

Restauration : `git clone` (ou `git clone backup.bundle`), `bun install`,
recréer `.env`, puis `psql -d nexusia -f backup.sql`. Règle 3-2-1 :
3 copies, 2 supports, 1 hors site. Testez une restauration une fois par
trimestre.

## 8. Versionner avec Git

```bash
git init
git add .
git commit -m "Initialisation NEXUSIA ERP"
git remote add origin git@github.com:<compte>/nexusia-erp.git
git push -u origin main
```

`.gitignore` exclut déjà `node_modules`, `dist`, `.output`, `.wrangler`,
`*.local`. **Ajoutez `.env`** à cette liste avant tout envoi public.

Convention de messages recommandée : `feat:`, `fix:`, `docs:`, `refactor:`,
`chore:`. Une ligne = une intention.

## 9. Créer une branche pour une fonctionnalité

```bash
git checkout main && git pull
git checkout -b feat/module-livraisons
# ... développement, commits ...
git push -u origin feat/module-livraisons
# Pull Request, relecture, puis fusion
git checkout main && git pull && git branch -d feat/module-livraisons
```

Modèle simple et efficace : `main` toujours déployable, une branche par
fonctionnalité, fusion après relecture.

## 10. Créer une version de démonstration client

Éléments déjà présents dans l'application : la carte « Réinitialiser les
données de démonstration » (Administration) et les jeux de données de
démonstration dans `src/lib/*/demo-data.ts`.

Procédure recommandée :

1. Branche dédiée `demo/client-x` ou simple variable d'environnement
   `VITE_MODE_DEMO=true`.
2. Base de données séparée (projet/base distincte de la production) afin
   qu'aucune donnée réelle ne soit exposée.
3. Un compte de démonstration par rôle (directeur, caissier, comptable…)
   pour montrer les tableaux de bord contextuels.
4. Réinitialisation des données avant chaque rendez-vous via le bouton
   d'administration.
5. Rappel avant mise en production : réactiver la confirmation d'e-mail
   (l'auto-confirmation est temporaire, signalée en commentaire dans
   `src/routes/auth.tsx`).

## 11. Adapter le logiciel à une entreprise sans toucher au cœur

Trois niveaux, du plus léger au plus lourd — restez au niveau 1 autant que
possible :

1. **Configuration en base** : table `entreprises` (nom, secteur, devise,
   ville, logo) et table `parametres`. C'est la voie normale : aucun code
   modifié, chaque client a ses valeurs.
2. **Thème** : les couleurs et ombres sont des jetons CSS dans
   `src/styles.css` et `src/lib/brand.ts`. Une charte client se traduit par un
   jeu de jetons, pas par des couleurs écrites dans les composants.
3. **Modules activables** : masquer/afficher des entrées via
   `src/lib/navigation.ts` et les rôles de `src/lib/access/roles.ts`.

Un besoin vraiment spécifique se code comme un module additionnel séparé, pas
comme une condition « si client X » dans le noyau.

## 12. Gérer les entreprises comme tenants séparés

L'architecture multi-tenant est déjà en place et repose sur trois piliers :

- chaque table métier porte une colonne `entreprise_id` ;
- les politiques RLS filtrent systématiquement sur
  `current_entreprise_id()`, une fonction SQL qui lit l'entreprise du profil
  de l'utilisateur connecté ;
- côté application, `src/lib/db/tenant.ts` (`exigerEntreprise()`) garantit que
  toute écriture renseigne `entreprise_id`, et `TenantGate` force la création
  d'une entreprise à la première connexion.

Conséquence : une seule base, une seule application, isolation garantie par la
base de données elle-même. Trois stratégies possibles selon le client :

| Stratégie | Quand | Coût |
| --- | --- | --- |
| Tenant partagé (actuel) | SaaS multi-clients | Faible |
| Base par client | Exigence de souveraineté des données | Moyen |
| Instance complète par client | Client grand compte, déploiement dédié | Élevé |

Règle de sécurité : ne jamais filtrer le tenant uniquement côté interface —
le RLS reste la seule barrière fiable.

## 13. Personnalisations propres à une entreprise

À stocker en base, jamais en dur : logo et couleurs, devise et format des
montants, taux de taxe, préfixes de numérotation (factures, commandes),
mentions légales des documents PDF, seuils d'alerte de stock, règles de
fidélité, jours ouvrés et fuseau horaire, modèles de messages WhatsApp/e-mail,
modules actifs, rôles et permissions.

Modèle recommandé : une ligne `parametres` par entreprise avec une colonne
JSON pour les réglages libres, lue au démarrage et exposée par un hook unique
(le projet dispose déjà de `use-entreprise`). Les composants consomment cette
configuration au lieu de constantes.

## 14. Ce qui doit être configurable plutôt que codé en dur

- URLs et clés d'API → variables d'environnement
- Devise, langue, fuseau, format de date → paramètres entreprise
- Taux de TVA, remises, seuils, objectifs → base de données
- Logo, couleurs, nom commercial → base + jetons CSS
- Numérotation des documents → base (déjà géré par le déclencheur SQL de
  numérotation des ventes)
- Rôles et permissions → tables `user_roles` / `role_permissions`
- Menus et modules disponibles → configuration de navigation
- Coordonnées, mentions légales, pied de page des PDF → paramètres
- Adresses e-mail d'expédition, numéros WhatsApp → paramètres/secrets

Signal d'alerte : toute valeur littérale (« 501 », « XOF », « 18 % », un
numéro de téléphone) écrite dans un composant est une future dette.

## 15. Préparer un déploiement serveur

L'application est déjà construite pour être déployée : `bun run build`
produit un serveur Node/edge autonome dans `.output/`.

Étapes types :

1. **Base** : instance PostgreSQL/Supabase de production, migrations
   appliquées, sauvegardes automatiques activées.
2. **Variables d'environnement** définies sur le serveur (jamais dans le
   dépôt), clé de service côté serveur uniquement.
3. **Build et exécution** : `bun install --production=false && bun run build`,
   puis lancer le serveur généré derrière un reverse proxy (Nginx/Caddy) avec
   HTTPS et un gestionnaire de processus (systemd, PM2, Docker).
4. **Cibles possibles** : VPS (Docker + Caddy), Cloudflare Workers (cible par
   défaut de la configuration actuelle), Vercel/Netlify, ou serveur interne
   de l'entreprise.
5. **Exploitation** : journaux centralisés, supervision des erreurs,
   sauvegarde quotidienne de la base, procédure de restauration testée,
   confirmation d'e-mail réactivée, politique de mots de passe stricte.
6. **Intégration continue** (optionnel) : une action GitHub qui exécute
   `lint` + `build` sur chaque PR, et déploie `main` automatiquement.

---

## Procédure « PC neuf → NEXUSIA ERP fonctionnel »

Durée estimée : 45 à 60 minutes.

1. **Installer les outils**
   - Node.js 22 LTS (nodejs.org) — vérifier : `node -v`
   - Git (git-scm.com) — `git --version`
   - Bun (optionnel, plus rapide) : `curl -fsSL https://bun.sh/install | bash`
   - Docker Desktop (pour la base locale)
   - VS Code + extensions ESLint, Prettier, Tailwind CSS IntelliSense
2. **Configurer Git**
   ```bash
   git config --global user.name "Votre Nom"
   git config --global user.email "vous@exemple.com"
   ```
3. **Récupérer le code**
   ```bash
   git clone <url-du-dépôt> nexusia-erp
   cd nexusia-erp
   ```
4. **Installer les dépendances** : `bun install` (ou `npm install`)
5. **Créer le fichier `.env`** avec les variables de la section 4
   (base locale ou distante).
6. **Démarrer la base** : `supabase start` puis `supabase db reset`
   (applique les 5 migrations : 41 tables, RLS, déclencheurs).
7. **Lancer l'application** : `bun run dev` → `http://localhost:8080`
8. **Créer le premier compte** sur `/auth`, puis renseigner l'entreprise :
   l'utilisateur devient automatiquement administrateur du tenant.
9. **Vérifier** : navigation dans les 17 modules, mode sombre, vue mobile.
10. **Sauvegarder** : créer un dépôt distant privé et pousser
    (`git push -u origin main`), puis programmer l'export de la base.

À l'issue de cette procédure, le projet fonctionne intégralement sur votre
machine, sans dépendance à Lovable ni à aucune plateforme de génération de
code.
