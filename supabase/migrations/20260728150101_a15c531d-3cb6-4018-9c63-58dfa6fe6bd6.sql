-- =========================================================
-- BEKAYE SORA BUSINESS MANAGER — Architecture multi-entreprise
-- =========================================================

-- ---------- ENUMS ----------
create type public.app_role as enum ('administrateur','directeur','manager','caissier','vendeur','magasinier','comptable');
create type public.statut_produit as enum ('disponible','faible','rupture','desactive');
create type public.type_mouvement as enum ('entree','sortie','ajustement','retour','perte');
create type public.mode_paiement as enum ('especes','orange_money','moov_money','wave','carte','virement','cheque','credit');
create type public.statut_vente as enum ('payee','annulee','retour','en_attente');
create type public.statut_commande as enum ('brouillon','envoyee','confirmee','preparation','expediee','recue','annulee');
create type public.statut_inventaire as enum ('en_cours','termine','annule');
create type public.statut_conge as enum ('en_attente','approuve','refuse');
create type public.statut_salaire as enum ('en_attente','paye');
create type public.statut_presence as enum ('present','absent','retard','conge');
create type public.sexe_type as enum ('F','H','non_precise');
create type public.niveau_fidelite as enum ('bronze','argent','or','platine');
create type public.type_transaction as enum ('encaissement','decaissement');

-- ---------- FONCTIONS UTILITAIRES ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- ---------- ENTREPRISES ----------
create table public.entreprises (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  slug text not null unique,
  secteur text not null default 'Cosmétiques',
  devise text not null default 'FCFA',
  telephone text,
  email text,
  adresse text,
  ville text,
  pays text default 'Burkina Faso',
  logo_url text,
  couleur_primaire text default '#e11d48',
  numero_fiscal text,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.entreprises to authenticated;
grant all on public.entreprises to service_role;
alter table public.entreprises enable row level security;

-- ---------- PROFILES ----------
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  entreprise_id uuid references public.entreprises(id) on delete set null,
  magasin_id uuid,
  nom_complet text not null default '',
  email text,
  telephone text,
  avatar_url text,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_entreprise on public.profiles(entreprise_id);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- helpers (security definer, évitent la récursion RLS)
create or replace function public.current_entreprise_id()
returns uuid language sql stable security definer set search_path = public as $$
  select entreprise_id from public.profiles where user_id = auth.uid();
$$;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  entreprise_id uuid references public.entreprises(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
create index idx_user_roles_user on public.user_roles(user_id);
grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles
    where user_id = auth.uid() and role in ('administrateur','directeur'));
$$;

-- création automatique du profil
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, nom_complet, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'nom_complet', ''), new.email)
  on conflict (user_id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- MAGASINS ----------
create table public.magasins (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  nom text not null,
  code text not null,
  adresse text,
  ville text,
  telephone text,
  responsable text,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entreprise_id, code)
);
create index idx_magasins_entreprise on public.magasins(entreprise_id);
grant select, insert, update, delete on public.magasins to authenticated;
grant all on public.magasins to service_role;
alter table public.magasins enable row level security;

alter table public.profiles
  add constraint profiles_magasin_fk foreign key (magasin_id) references public.magasins(id) on delete set null;

-- ---------- CATEGORIES ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  nom text not null,
  description text,
  couleur text,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entreprise_id, nom)
);
create index idx_categories_entreprise on public.categories(entreprise_id);
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;

-- ---------- FOURNISSEURS ----------
create table public.fournisseurs (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  nom text not null,
  entreprise text,
  telephone text,
  whatsapp text,
  email text,
  adresse text,
  ville text,
  pays text,
  contact_principal text,
  conditions_paiement text,
  delai_livraison_jours integer not null default 7 check (delai_livraison_jours >= 0),
  notes text,
  logo_url text,
  favori boolean not null default false,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entreprise_id, nom)
);
create index idx_fournisseurs_entreprise on public.fournisseurs(entreprise_id);
grant select, insert, update, delete on public.fournisseurs to authenticated;
grant all on public.fournisseurs to service_role;
alter table public.fournisseurs enable row level security;

-- ---------- PRODUITS ----------
create table public.produits (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  magasin_id uuid references public.magasins(id) on delete set null,
  categorie_id uuid references public.categories(id) on delete set null,
  fournisseur_id uuid references public.fournisseurs(id) on delete set null,
  nom text not null,
  description text,
  marque text default '501',
  code_barres text,
  reference text,
  unite text not null default 'Pièce',
  prix_achat numeric(14,2) not null default 0 check (prix_achat >= 0),
  prix_vente numeric(14,2) not null default 0 check (prix_vente >= 0),
  stock integer not null default 0,
  stock_minimum integer not null default 0 check (stock_minimum >= 0),
  date_expiration date,
  image_url text,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entreprise_id, code_barres)
);
create index idx_produits_entreprise on public.produits(entreprise_id);
create index idx_produits_categorie on public.produits(categorie_id);
create index idx_produits_fournisseur on public.produits(fournisseur_id);
create index idx_produits_nom on public.produits(entreprise_id, nom);
grant select, insert, update, delete on public.produits to authenticated;
grant all on public.produits to service_role;
alter table public.produits enable row level security;

-- ---------- CLIENTS ----------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  nom text not null,
  telephone text,
  whatsapp text,
  email text,
  adresse text,
  ville text,
  sexe public.sexe_type not null default 'non_precise',
  date_naissance date,
  points_fidelite integer not null default 0 check (points_fidelite >= 0),
  niveau public.niveau_fidelite not null default 'bronze',
  notes text,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entreprise_id, telephone)
);
create index idx_clients_entreprise on public.clients(entreprise_id);
grant select, insert, update, delete on public.clients to authenticated;
grant all on public.clients to service_role;
alter table public.clients enable row level security;

-- ---------- EMPLOYES ----------
create table public.employes (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  magasin_id uuid references public.magasins(id) on delete set null,
  user_id uuid,
  matricule text not null,
  nom_complet text not null,
  telephone text,
  email text,
  adresse text,
  poste text,
  role public.app_role not null default 'vendeur',
  date_embauche date not null default current_date,
  salaire_base numeric(14,2) not null default 0 check (salaire_base >= 0),
  photo_url text,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entreprise_id, matricule)
);
create index idx_employes_entreprise on public.employes(entreprise_id);
grant select, insert, update, delete on public.employes to authenticated;
grant all on public.employes to service_role;
alter table public.employes enable row level security;

-- ---------- ROLE PERMISSIONS ----------
create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  role public.app_role not null,
  permission text not null,
  autorise boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entreprise_id, role, permission)
);
create index idx_role_permissions_entreprise on public.role_permissions(entreprise_id);
grant select, insert, update, delete on public.role_permissions to authenticated;
grant all on public.role_permissions to service_role;
alter table public.role_permissions enable row level security;

-- ---------- SESSIONS DE CAISSE ----------
create table public.sessions_caisse (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  magasin_id uuid references public.magasins(id) on delete set null,
  employe_id uuid references public.employes(id) on delete set null,
  ouverte_le timestamptz not null default now(),
  fermee_le timestamptz,
  fond_initial numeric(14,2) not null default 0,
  total_ventes numeric(14,2) not null default 0,
  total_especes numeric(14,2) not null default 0,
  montant_final numeric(14,2),
  ecart numeric(14,2),
  observation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_sessions_caisse_entreprise on public.sessions_caisse(entreprise_id);
grant select, insert, update, delete on public.sessions_caisse to authenticated;
grant all on public.sessions_caisse to service_role;
alter table public.sessions_caisse enable row level security;

-- ---------- VENTES ----------
create table public.ventes (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  magasin_id uuid references public.magasins(id) on delete set null,
  session_caisse_id uuid references public.sessions_caisse(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  vendeur_id uuid references public.employes(id) on delete set null,
  numero text not null,
  date_vente timestamptz not null default now(),
  client_nom text,
  client_telephone text,
  sous_total numeric(14,2) not null default 0 check (sous_total >= 0),
  remise numeric(14,2) not null default 0 check (remise >= 0),
  taux_tva numeric(5,2) not null default 0 check (taux_tva >= 0),
  montant_tva numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0 check (total >= 0),
  montant_recu numeric(14,2) not null default 0,
  monnaie numeric(14,2) not null default 0,
  statut public.statut_vente not null default 'payee',
  observation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entreprise_id, numero)
);
create index idx_ventes_entreprise_date on public.ventes(entreprise_id, date_vente desc);
create index idx_ventes_client on public.ventes(client_id);
grant select, insert, update, delete on public.ventes to authenticated;
grant all on public.ventes to service_role;
alter table public.ventes enable row level security;

create table public.lignes_vente (
  id uuid primary key default gen_random_uuid(),
  vente_id uuid not null references public.ventes(id) on delete cascade,
  produit_id uuid references public.produits(id) on delete set null,
  nom_produit text not null,
  code_barres text,
  prix_unitaire numeric(14,2) not null default 0 check (prix_unitaire >= 0),
  prix_achat_unitaire numeric(14,2) not null default 0,
  quantite integer not null check (quantite > 0),
  total_ligne numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);
create index idx_lignes_vente_vente on public.lignes_vente(vente_id);
create index idx_lignes_vente_produit on public.lignes_vente(produit_id);
grant select, insert, update, delete on public.lignes_vente to authenticated;
grant all on public.lignes_vente to service_role;
alter table public.lignes_vente enable row level security;

create table public.paiements_vente (
  id uuid primary key default gen_random_uuid(),
  vente_id uuid not null references public.ventes(id) on delete cascade,
  mode public.mode_paiement not null,
  montant numeric(14,2) not null check (montant >= 0),
  reference text,
  created_at timestamptz not null default now()
);
create index idx_paiements_vente_vente on public.paiements_vente(vente_id);
grant select, insert, update, delete on public.paiements_vente to authenticated;
grant all on public.paiements_vente to service_role;
alter table public.paiements_vente enable row level security;

-- ---------- RETOURS ----------
create table public.retours (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  vente_id uuid references public.ventes(id) on delete set null,
  numero text not null,
  date_retour timestamptz not null default now(),
  employe_id uuid references public.employes(id) on delete set null,
  motif text,
  montant numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entreprise_id, numero)
);
create index idx_retours_entreprise on public.retours(entreprise_id);
grant select, insert, update, delete on public.retours to authenticated;
grant all on public.retours to service_role;
alter table public.retours enable row level security;

create table public.lignes_retour (
  id uuid primary key default gen_random_uuid(),
  retour_id uuid not null references public.retours(id) on delete cascade,
  produit_id uuid references public.produits(id) on delete set null,
  quantite integer not null check (quantite > 0),
  montant numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);
create index idx_lignes_retour_retour on public.lignes_retour(retour_id);
grant select, insert, update, delete on public.lignes_retour to authenticated;
grant all on public.lignes_retour to service_role;
alter table public.lignes_retour enable row level security;

-- ---------- ENTREES DE STOCK ----------
create table public.entrees_stock (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  magasin_id uuid references public.magasins(id) on delete set null,
  fournisseur_id uuid references public.fournisseurs(id) on delete set null,
  numero text not null,
  date_entree timestamptz not null default now(),
  reference_facture text,
  employe_id uuid references public.employes(id) on delete set null,
  montant_total numeric(14,2) not null default 0,
  observation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entreprise_id, numero)
);
create index idx_entrees_stock_entreprise on public.entrees_stock(entreprise_id);
grant select, insert, update, delete on public.entrees_stock to authenticated;
grant all on public.entrees_stock to service_role;
alter table public.entrees_stock enable row level security;

create table public.lignes_entree_stock (
  id uuid primary key default gen_random_uuid(),
  entree_id uuid not null references public.entrees_stock(id) on delete cascade,
  produit_id uuid references public.produits(id) on delete set null,
  quantite integer not null check (quantite > 0),
  prix_achat numeric(14,2) not null default 0,
  date_expiration date,
  lot text,
  created_at timestamptz not null default now()
);
create index idx_lignes_entree_entree on public.lignes_entree_stock(entree_id);
grant select, insert, update, delete on public.lignes_entree_stock to authenticated;
grant all on public.lignes_entree_stock to service_role;
alter table public.lignes_entree_stock enable row level security;

-- ---------- MOUVEMENTS DE STOCK ----------
create table public.mouvements_stock (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  magasin_id uuid references public.magasins(id) on delete set null,
  produit_id uuid not null references public.produits(id) on delete cascade,
  type public.type_mouvement not null,
  quantite integer not null check (quantite > 0),
  stock_avant integer,
  stock_apres integer,
  employe_id uuid references public.employes(id) on delete set null,
  reference text,
  observation text,
  date_mouvement timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_mouvements_produit on public.mouvements_stock(produit_id, date_mouvement desc);
create index idx_mouvements_entreprise on public.mouvements_stock(entreprise_id);
grant select, insert, update, delete on public.mouvements_stock to authenticated;
grant all on public.mouvements_stock to service_role;
alter table public.mouvements_stock enable row level security;

-- application automatique du mouvement sur le stock produit
create or replace function public.appliquer_mouvement_stock()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_stock integer; v_delta integer;
begin
  select stock into v_stock from public.produits where id = new.produit_id for update;
  if v_stock is null then return new; end if;
  v_delta := case when new.type in ('entree','retour') then new.quantite else -new.quantite end;
  new.stock_avant := v_stock;
  new.stock_apres := v_stock + v_delta;
  update public.produits set stock = v_stock + v_delta, updated_at = now() where id = new.produit_id;
  return new;
end; $$;
create trigger trg_mouvement_stock before insert on public.mouvements_stock
for each row execute function public.appliquer_mouvement_stock();

-- ---------- COMMANDES D'ACHAT ----------
create table public.commandes_achat (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  fournisseur_id uuid references public.fournisseurs(id) on delete set null,
  numero text not null,
  date_commande timestamptz not null default now(),
  date_livraison_prevue date,
  date_reception timestamptz,
  statut public.statut_commande not null default 'brouillon',
  mode_paiement text,
  montant_total numeric(14,2) not null default 0,
  montant_paye numeric(14,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entreprise_id, numero)
);
create index idx_commandes_entreprise on public.commandes_achat(entreprise_id);
create index idx_commandes_fournisseur on public.commandes_achat(fournisseur_id);
grant select, insert, update, delete on public.commandes_achat to authenticated;
grant all on public.commandes_achat to service_role;
alter table public.commandes_achat enable row level security;

create table public.lignes_commande_achat (
  id uuid primary key default gen_random_uuid(),
  commande_id uuid not null references public.commandes_achat(id) on delete cascade,
  produit_id uuid references public.produits(id) on delete set null,
  nom_produit text not null,
  quantite integer not null check (quantite > 0),
  quantite_recue integer not null default 0 check (quantite_recue >= 0),
  prix_achat numeric(14,2) not null default 0,
  remise numeric(5,2) not null default 0,
  created_at timestamptz not null default now()
);
create index idx_lignes_commande_commande on public.lignes_commande_achat(commande_id);
grant select, insert, update, delete on public.lignes_commande_achat to authenticated;
grant all on public.lignes_commande_achat to service_role;
alter table public.lignes_commande_achat enable row level security;

-- ---------- INVENTAIRES ----------
create table public.inventaires (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  magasin_id uuid references public.magasins(id) on delete set null,
  numero text not null,
  date_inventaire timestamptz not null default now(),
  statut public.statut_inventaire not null default 'en_cours',
  employe_id uuid references public.employes(id) on delete set null,
  ecart_valeur numeric(14,2) not null default 0,
  observation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entreprise_id, numero)
);
create index idx_inventaires_entreprise on public.inventaires(entreprise_id);
grant select, insert, update, delete on public.inventaires to authenticated;
grant all on public.inventaires to service_role;
alter table public.inventaires enable row level security;

create table public.lignes_inventaire (
  id uuid primary key default gen_random_uuid(),
  inventaire_id uuid not null references public.inventaires(id) on delete cascade,
  produit_id uuid references public.produits(id) on delete set null,
  stock_theorique integer not null default 0,
  stock_physique integer not null default 0,
  ecart integer generated always as (stock_physique - stock_theorique) stored,
  observation text,
  created_at timestamptz not null default now()
);
create index idx_lignes_inventaire_inv on public.lignes_inventaire(inventaire_id);
grant select, insert, update, delete on public.lignes_inventaire to authenticated;
grant all on public.lignes_inventaire to service_role;
alter table public.lignes_inventaire enable row level security;

-- ---------- RH : PRESENCES / CONGES / SALAIRES ----------
create table public.presences (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  employe_id uuid not null references public.employes(id) on delete cascade,
  date_jour date not null default current_date,
  heure_arrivee time,
  heure_depart time,
  statut public.statut_presence not null default 'present',
  observation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employe_id, date_jour)
);
create index idx_presences_entreprise on public.presences(entreprise_id, date_jour desc);
grant select, insert, update, delete on public.presences to authenticated;
grant all on public.presences to service_role;
alter table public.presences enable row level security;

create table public.conges (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  employe_id uuid not null references public.employes(id) on delete cascade,
  type_conge text not null default 'Congé annuel',
  date_debut date not null,
  date_fin date not null,
  statut public.statut_conge not null default 'en_attente',
  motif text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_conges_employe on public.conges(employe_id);
grant select, insert, update, delete on public.conges to authenticated;
grant all on public.conges to service_role;
alter table public.conges enable row level security;

create or replace function public.valider_periode_conge()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.date_fin < new.date_debut then
    raise exception 'La date de fin doit être postérieure à la date de début';
  end if;
  return new;
end; $$;
create trigger trg_conges_periode before insert or update on public.conges
for each row execute function public.valider_periode_conge();

create table public.salaires (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  employe_id uuid not null references public.employes(id) on delete cascade,
  periode text not null, -- AAAA-MM
  salaire_base numeric(14,2) not null default 0,
  primes numeric(14,2) not null default 0,
  retenues numeric(14,2) not null default 0,
  net_a_payer numeric(14,2) not null default 0,
  statut public.statut_salaire not null default 'en_attente',
  date_paiement timestamptz,
  mode_paiement text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employe_id, periode)
);
create index idx_salaires_entreprise on public.salaires(entreprise_id, periode);
grant select, insert, update, delete on public.salaires to authenticated;
grant all on public.salaires to service_role;
alter table public.salaires enable row level security;

-- ---------- FINANCES ----------
create table public.categories_depense (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  nom text not null,
  couleur text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entreprise_id, nom)
);
grant select, insert, update, delete on public.categories_depense to authenticated;
grant all on public.categories_depense to service_role;
alter table public.categories_depense enable row level security;

create table public.depenses (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  magasin_id uuid references public.magasins(id) on delete set null,
  categorie_depense_id uuid references public.categories_depense(id) on delete set null,
  libelle text not null,
  montant numeric(14,2) not null check (montant >= 0),
  date_depense date not null default current_date,
  mode_paiement public.mode_paiement not null default 'especes',
  beneficiaire text,
  justificatif_url text,
  employe_id uuid references public.employes(id) on delete set null,
  observation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_depenses_entreprise on public.depenses(entreprise_id, date_depense desc);
grant select, insert, update, delete on public.depenses to authenticated;
grant all on public.depenses to service_role;
alter table public.depenses enable row level security;

create table public.transactions_tresorerie (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  type public.type_transaction not null,
  libelle text not null,
  montant numeric(14,2) not null check (montant >= 0),
  mode_paiement public.mode_paiement not null default 'especes',
  date_transaction timestamptz not null default now(),
  vente_id uuid references public.ventes(id) on delete set null,
  depense_id uuid references public.depenses(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_tresorerie_entreprise on public.transactions_tresorerie(entreprise_id, date_transaction desc);
grant select, insert, update, delete on public.transactions_tresorerie to authenticated;
grant all on public.transactions_tresorerie to service_role;
alter table public.transactions_tresorerie enable row level security;

-- ---------- NOTIFICATIONS / PARAMETRES / AUDIT / OBJECTIFS ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  user_id uuid,
  titre text not null,
  message text,
  type text not null default 'info',
  priorite text not null default 'normale',
  lien text,
  lue boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_notifications_entreprise on public.notifications(entreprise_id, created_at desc);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;

create table public.parametres (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  cle text not null,
  valeur jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entreprise_id, cle)
);
grant select, insert, update, delete on public.parametres to authenticated;
grant all on public.parametres to service_role;
alter table public.parametres enable row level security;

create table public.journal_audit (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  user_id uuid,
  acteur text,
  action text not null,
  entite text,
  entite_id uuid,
  details jsonb not null default '{}'::jsonb,
  adresse_ip text,
  created_at timestamptz not null default now()
);
create index idx_audit_entreprise on public.journal_audit(entreprise_id, created_at desc);
grant select, insert on public.journal_audit to authenticated;
grant all on public.journal_audit to service_role;
alter table public.journal_audit enable row level security;

create table public.objectifs (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  titre text not null,
  categorie text not null default 'ventes',
  cible numeric(14,2) not null default 0,
  valeur_actuelle numeric(14,2) not null default 0,
  unite text default 'FCFA',
  date_debut date not null default current_date,
  date_fin date not null default (current_date + 30),
  employe_id uuid references public.employes(id) on delete set null,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_objectifs_entreprise on public.objectifs(entreprise_id);
grant select, insert, update, delete on public.objectifs to authenticated;
grant all on public.objectifs to service_role;
alter table public.objectifs enable row level security;

-- ---------- NUMEROTATION AUTOMATIQUE DES VENTES ----------
create or replace function public.generer_numero_vente()
returns trigger language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if new.numero is null or new.numero = '' then
    select count(*) + 1 into n from public.ventes where entreprise_id = new.entreprise_id;
    new.numero := 'V-' || to_char(now(),'YYYYMMDD') || '-' || lpad(n::text, 4, '0');
  end if;
  return new;
end; $$;
create trigger trg_numero_vente before insert on public.ventes
for each row execute function public.generer_numero_vente();

-- ---------- TRIGGERS updated_at ----------
do $$
declare t text;
begin
  foreach t in array array[
    'entreprises','profiles','magasins','categories','fournisseurs','produits','clients','employes',
    'role_permissions','sessions_caisse','ventes','retours','entrees_stock','commandes_achat',
    'inventaires','presences','conges','salaires','categories_depense','depenses',
    'transactions_tresorerie','notifications','parametres','objectifs'
  ] loop
    execute format('create trigger trg_%s_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ---------- POLITIQUES RLS ----------
-- Entreprises : visibles par leurs membres, modifiables par les admins/directeurs
create policy "Membres voient leur entreprise" on public.entreprises for select to authenticated
  using (id = public.current_entreprise_id());
create policy "Admins modifient leur entreprise" on public.entreprises for update to authenticated
  using (id = public.current_entreprise_id() and public.is_admin())
  with check (id = public.current_entreprise_id() and public.is_admin());
create policy "Utilisateur cree une entreprise" on public.entreprises for insert to authenticated
  with check (true);
create policy "Admins suppriment leur entreprise" on public.entreprises for delete to authenticated
  using (id = public.current_entreprise_id() and public.is_admin());

-- Profils
create policy "Voir son profil ou ceux de son entreprise" on public.profiles for select to authenticated
  using (user_id = auth.uid() or entreprise_id = public.current_entreprise_id());
create policy "Creer son profil" on public.profiles for insert to authenticated
  with check (user_id = auth.uid());
create policy "Modifier son profil" on public.profiles for update to authenticated
  using (user_id = auth.uid() or (entreprise_id = public.current_entreprise_id() and public.is_admin()))
  with check (user_id = auth.uid() or (entreprise_id = public.current_entreprise_id() and public.is_admin()));
create policy "Admins suppriment un profil" on public.profiles for delete to authenticated
  using (entreprise_id = public.current_entreprise_id() and public.is_admin());

-- Rôles
create policy "Voir les roles de son entreprise" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or entreprise_id = public.current_entreprise_id());
create policy "Admins gerent les roles" on public.user_roles for insert to authenticated
  with check (entreprise_id = public.current_entreprise_id() and public.is_admin());
create policy "Admins modifient les roles" on public.user_roles for update to authenticated
  using (entreprise_id = public.current_entreprise_id() and public.is_admin())
  with check (entreprise_id = public.current_entreprise_id() and public.is_admin());
create policy "Admins suppriment les roles" on public.user_roles for delete to authenticated
  using (entreprise_id = public.current_entreprise_id() and public.is_admin());

-- Tables directement scopées par entreprise_id : accès complet aux membres
do $$
declare t text;
begin
  foreach t in array array[
    'magasins','categories','fournisseurs','produits','clients','employes','sessions_caisse',
    'ventes','retours','entrees_stock','mouvements_stock','commandes_achat','inventaires',
    'presences','conges','categories_depense','depenses','transactions_tresorerie',
    'notifications','objectifs'
  ] loop
    execute format($p$
      create policy "Membres gerent %1$s" on public.%1$I for all to authenticated
      using (entreprise_id = public.current_entreprise_id())
      with check (entreprise_id = public.current_entreprise_id())
    $p$, t);
  end loop;
end $$;

-- Tables sensibles : lecture membres, écriture admins
create policy "Membres voient les salaires" on public.salaires for select to authenticated
  using (entreprise_id = public.current_entreprise_id() and public.is_admin());
create policy "Admins gerent les salaires" on public.salaires for all to authenticated
  using (entreprise_id = public.current_entreprise_id() and public.is_admin())
  with check (entreprise_id = public.current_entreprise_id() and public.is_admin());

create policy "Membres voient les permissions" on public.role_permissions for select to authenticated
  using (entreprise_id = public.current_entreprise_id());
create policy "Admins gerent les permissions" on public.role_permissions for all to authenticated
  using (entreprise_id = public.current_entreprise_id() and public.is_admin())
  with check (entreprise_id = public.current_entreprise_id() and public.is_admin());

create policy "Membres voient les parametres" on public.parametres for select to authenticated
  using (entreprise_id = public.current_entreprise_id());
create policy "Admins gerent les parametres" on public.parametres for all to authenticated
  using (entreprise_id = public.current_entreprise_id() and public.is_admin())
  with check (entreprise_id = public.current_entreprise_id() and public.is_admin());

create policy "Admins consultent l'audit" on public.journal_audit for select to authenticated
  using (entreprise_id = public.current_entreprise_id() and public.is_admin());
create policy "Membres alimentent l'audit" on public.journal_audit for insert to authenticated
  with check (entreprise_id = public.current_entreprise_id());

-- Tables enfants : héritent de l'accès du parent
create policy "Membres gerent les lignes de vente" on public.lignes_vente for all to authenticated
  using (exists (select 1 from public.ventes v where v.id = vente_id and v.entreprise_id = public.current_entreprise_id()))
  with check (exists (select 1 from public.ventes v where v.id = vente_id and v.entreprise_id = public.current_entreprise_id()));

create policy "Membres gerent les paiements" on public.paiements_vente for all to authenticated
  using (exists (select 1 from public.ventes v where v.id = vente_id and v.entreprise_id = public.current_entreprise_id()))
  with check (exists (select 1 from public.ventes v where v.id = vente_id and v.entreprise_id = public.current_entreprise_id()));

create policy "Membres gerent les lignes de retour" on public.lignes_retour for all to authenticated
  using (exists (select 1 from public.retours r where r.id = retour_id and r.entreprise_id = public.current_entreprise_id()))
  with check (exists (select 1 from public.retours r where r.id = retour_id and r.entreprise_id = public.current_entreprise_id()));

create policy "Membres gerent les lignes d'entree" on public.lignes_entree_stock for all to authenticated
  using (exists (select 1 from public.entrees_stock e where e.id = entree_id and e.entreprise_id = public.current_entreprise_id()))
  with check (exists (select 1 from public.entrees_stock e where e.id = entree_id and e.entreprise_id = public.current_entreprise_id()));

create policy "Membres gerent les lignes de commande" on public.lignes_commande_achat for all to authenticated
  using (exists (select 1 from public.commandes_achat c where c.id = commande_id and c.entreprise_id = public.current_entreprise_id()))
  with check (exists (select 1 from public.commandes_achat c where c.id = commande_id and c.entreprise_id = public.current_entreprise_id()));

create policy "Membres gerent les lignes d'inventaire" on public.lignes_inventaire for all to authenticated
  using (exists (select 1 from public.inventaires i where i.id = inventaire_id and i.entreprise_id = public.current_entreprise_id()))
  with check (exists (select 1 from public.inventaires i where i.id = inventaire_id and i.entreprise_id = public.current_entreprise_id()));