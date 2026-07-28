-- 1. TRIGGERS ------------------------------------------------------------
do $$
declare t record;
begin
  for t in
    select c.table_name from information_schema.columns c
    join information_schema.tables tb
      on tb.table_schema=c.table_schema and tb.table_name=c.table_name and tb.table_type='BASE TABLE'
    where c.table_schema='public' and c.column_name='updated_at'
  loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$I', t.table_name);
    execute format('create trigger trg_%1$s_updated_at before update on public.%1$I for each row execute function public.set_updated_at()', t.table_name);
  end loop;
end $$;

drop trigger if exists trg_mouvements_stock_apply on public.mouvements_stock;
create trigger trg_mouvements_stock_apply
  before insert on public.mouvements_stock
  for each row execute function public.appliquer_mouvement_stock();

drop trigger if exists trg_ventes_numero on public.ventes;
create trigger trg_ventes_numero
  before insert on public.ventes
  for each row execute function public.generer_numero_vente();

drop trigger if exists trg_conges_periode on public.conges;
create trigger trg_conges_periode
  before insert or update on public.conges
  for each row execute function public.valider_periode_conge();

-- 2. COUCHE SAAS : PLANS & ABONNEMENTS -------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  nom text not null,
  description text,
  prix_mensuel numeric(12,2) not null default 0,
  devise text not null default 'XOF',
  max_utilisateurs integer not null default 5,
  max_magasins integer not null default 1,
  max_produits integer not null default 500,
  fonctionnalites jsonb not null default '{}'::jsonb,
  ordre integer not null default 0,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.plans to anon, authenticated;
grant all on public.plans to service_role;
alter table public.plans enable row level security;
drop policy if exists "Catalogue des plans public" on public.plans;
create policy "Catalogue des plans public" on public.plans for select using (actif);

create trigger trg_plans_updated_at before update on public.plans
  for each row execute function public.set_updated_at();

create table if not exists public.abonnements (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  plan_id uuid references public.plans(id),
  statut text not null default 'essai',
  debut timestamptz not null default now(),
  fin_essai timestamptz,
  fin timestamptz,
  reference_paiement text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entreprise_id)
);
grant select on public.abonnements to authenticated;
grant all on public.abonnements to service_role;
alter table public.abonnements enable row level security;
drop policy if exists "Membres voient leur abonnement" on public.abonnements;
create policy "Membres voient leur abonnement" on public.abonnements
  for select to authenticated using (entreprise_id = public.current_entreprise_id());

create trigger trg_abonnements_updated_at before update on public.abonnements
  for each row execute function public.set_updated_at();

create index if not exists idx_abonnements_entreprise on public.abonnements(entreprise_id);
create index if not exists idx_abonnements_plan on public.abonnements(plan_id);

insert into public.plans (code, nom, description, prix_mensuel, max_utilisateurs, max_magasins, max_produits, ordre)
values
  ('starter','NEXUSIA Starter','Pour démarrer : 1 magasin, gestion des ventes et du stock.', 15000, 3, 1, 500, 1),
  ('business','NEXUSIA Business','Multi-magasins, RH, comptabilité et rapports avancés.', 45000, 15, 5, 5000, 2),
  ('enterprise','NEXUSIA Enterprise','Multi-entreprises, copilote NEXUSIA Insight, support prioritaire.', 120000, 100, 50, 100000, 3)
on conflict (code) do nothing;

-- 3. DEMARRAGE D'UN TENANT --------------------------------------------------
create or replace function public.creer_entreprise(
  _nom text, _secteur text default 'cosmetiques', _devise text default 'XOF'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_slug text; v_plan uuid;
begin
  if auth.uid() is null then raise exception 'Authentification requise'; end if;
  if public.current_entreprise_id() is not null then
    raise exception 'Cet utilisateur appartient déjà à une entreprise';
  end if;

  v_slug := regexp_replace(lower(_nom), '[^a-z0-9]+', '-', 'g') || '-' || substr(gen_random_uuid()::text, 1, 6);
  insert into public.entreprises (nom, slug, secteur, devise)
  values (_nom, v_slug, _secteur, _devise) returning id into v_id;

  insert into public.profiles (user_id, entreprise_id, nom_complet, email)
  values (auth.uid(), v_id,
          coalesce((select raw_user_meta_data->>'full_name' from auth.users where id = auth.uid()), _nom),
          (select email from auth.users where id = auth.uid()))
  on conflict (user_id) do update set entreprise_id = excluded.entreprise_id;

  insert into public.user_roles (user_id, entreprise_id, role)
  values (auth.uid(), v_id, 'administrateur') on conflict do nothing;

  select id into v_plan from public.plans where code = 'starter';
  insert into public.abonnements (entreprise_id, plan_id, statut, fin_essai)
  values (v_id, v_plan, 'essai', now() + interval '14 days')
  on conflict (entreprise_id) do nothing;

  return v_id;
end $$;

revoke all on function public.creer_entreprise(text, text, text) from public, anon;
grant execute on function public.creer_entreprise(text, text, text) to authenticated;

-- 4. INDEX DE PERFORMANCE ---------------------------------------------------
create index if not exists idx_produits_entreprise on public.produits(entreprise_id);
create index if not exists idx_produits_categorie on public.produits(categorie_id);
create index if not exists idx_produits_fournisseur on public.produits(fournisseur_id);
create index if not exists idx_produits_magasin on public.produits(magasin_id);
create index if not exists idx_produits_code_barres on public.produits(entreprise_id, code_barres);
create index if not exists idx_produits_stock_faible on public.produits(entreprise_id) where stock <= stock_minimum;

create index if not exists idx_ventes_entreprise_date on public.ventes(entreprise_id, date_vente desc);
create index if not exists idx_ventes_client on public.ventes(client_id);
create index if not exists idx_ventes_vendeur on public.ventes(vendeur_id);
create index if not exists idx_ventes_session on public.ventes(session_caisse_id);
create index if not exists idx_lignes_vente_vente on public.lignes_vente(vente_id);
create index if not exists idx_lignes_vente_produit on public.lignes_vente(produit_id);
create index if not exists idx_paiements_vente on public.paiements_vente(vente_id);

create index if not exists idx_mouvements_entreprise_date on public.mouvements_stock(entreprise_id, date_mouvement desc);
create index if not exists idx_mouvements_produit on public.mouvements_stock(produit_id);
create index if not exists idx_lignes_entree_produit on public.lignes_entree_stock(produit_id);
create index if not exists idx_lignes_commande_produit on public.lignes_commande_achat(produit_id);
create index if not exists idx_lignes_inventaire_produit on public.lignes_inventaire(produit_id);
create index if not exists idx_lignes_retour_retour on public.lignes_retour(retour_id);
create index if not exists idx_retours_entreprise on public.retours(entreprise_id, date_retour desc);
create index if not exists idx_retours_vente on public.retours(vente_id);

create index if not exists idx_presences_employe_jour on public.presences(employe_id, date_jour desc);
create index if not exists idx_presences_entreprise on public.presences(entreprise_id, date_jour desc);
create index if not exists idx_salaires_employe on public.salaires(employe_id, periode);
create index if not exists idx_salaires_entreprise on public.salaires(entreprise_id, periode);
create index if not exists idx_conges_entreprise on public.conges(entreprise_id, date_debut desc);
create index if not exists idx_employes_user on public.employes(user_id);
create index if not exists idx_employes_magasin on public.employes(magasin_id);

create index if not exists idx_depenses_categorie on public.depenses(categorie_depense_id);
create index if not exists idx_tresorerie_entreprise on public.transactions_tresorerie(entreprise_id, date_transaction desc);
create index if not exists idx_notifications_user on public.notifications(user_id, lue, created_at desc);
create index if not exists idx_notifications_entreprise on public.notifications(entreprise_id, created_at desc);
create index if not exists idx_objectifs_entreprise on public.objectifs(entreprise_id, date_debut desc);
create index if not exists idx_sessions_caisse_entreprise on public.sessions_caisse(entreprise_id, ouverte_le desc);
create index if not exists idx_magasins_entreprise on public.magasins(entreprise_id);
create index if not exists idx_parametres_entreprise on public.parametres(entreprise_id, cle);
create index if not exists idx_profiles_entreprise on public.profiles(entreprise_id);
create index if not exists idx_user_roles_user on public.user_roles(user_id);
create index if not exists idx_role_permissions_entreprise on public.role_permissions(entreprise_id, role);