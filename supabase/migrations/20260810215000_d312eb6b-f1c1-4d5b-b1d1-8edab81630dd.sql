-- 1. Catalogue global des permissions
create table if not exists public.permissions (
  code text primary key,
  module text not null,
  libelle text not null,
  ordre integer not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.permissions to authenticated;
grant all on public.permissions to service_role;
alter table public.permissions enable row level security;
drop policy if exists "permissions_lecture" on public.permissions;
create policy "permissions_lecture" on public.permissions
  for select to authenticated using (true);

insert into public.permissions (code, module, libelle, ordre) values
  ('products.read','Produits','Consulter les produits',10),
  ('products.create','Produits','Créer un produit',11),
  ('products.update','Produits','Modifier un produit',12),
  ('products.delete','Produits','Supprimer un produit',13),
  ('stock.read','Stock','Consulter le stock',20),
  ('stock.entry','Stock','Enregistrer une entrée de stock',21),
  ('stock.exit','Stock','Enregistrer une sortie de stock',22),
  ('stock.transfer','Stock','Effectuer un transfert',23),
  ('stock.inventory','Stock','Gérer les inventaires',24),
  ('suppliers.read','Fournisseurs','Consulter les fournisseurs',30),
  ('suppliers.manage','Fournisseurs','Gérer les fournisseurs et commandes',31),
  ('sales.read','Ventes','Consulter les ventes',40),
  ('sales.create','Ventes','Créer une vente',41),
  ('sales.update','Ventes','Modifier une vente',42),
  ('sales.cancel','Ventes','Annuler une vente',43),
  ('cash.read','Caisse','Consulter la caisse',50),
  ('cash.open','Caisse','Ouvrir une caisse',51),
  ('cash.close','Caisse','Fermer une caisse',52),
  ('cash.transaction','Caisse','Enregistrer une transaction',53),
  ('clients.read','Clients','Consulter les clients',60),
  ('clients.create','Clients','Créer un client',61),
  ('clients.update','Clients','Modifier un client',62),
  ('employees.read','Employés','Consulter les employés',70),
  ('employees.create','Employés','Créer un employé',71),
  ('employees.update','Employés','Modifier un employé',72),
  ('employees.disable','Employés','Désactiver un employé',73),
  ('payroll.read','Employés','Consulter les salaires',74),
  ('finance.read','Finance','Consulter les dépenses et la trésorerie',80),
  ('finance.manage','Finance','Gérer les dépenses et la trésorerie',81),
  ('reports.read','Rapports','Consulter les rapports et statistiques',90),
  ('settings.manage','Administration','Gérer les paramètres de l''entreprise',100),
  ('users.manage','Administration','Gérer les comptes utilisateurs',101),
  ('roles.manage','Administration','Gérer les rôles et permissions',102),
  ('audit.read','Administration','Consulter le journal d''audit',103)
on conflict (code) do update
  set module = excluded.module, libelle = excluded.libelle, ordre = excluded.ordre;

-- 2. Jeu de permissions par défaut pour chaque rôle
create or replace function public.permissions_par_defaut(_role public.app_role)
returns text[]
language sql
immutable
set search_path = public
as $$
  select case _role
    when 'administrateur' then array(select code from public.permissions)
    when 'directeur' then array(select code from public.permissions)
    when 'manager' then array[
      'products.read','products.create','products.update',
      'stock.read','stock.entry','stock.exit','stock.transfer','stock.inventory',
      'suppliers.read','suppliers.manage',
      'sales.read','clients.read','employees.read','reports.read']
    when 'magasinier' then array[
      'products.read','products.create','products.update',
      'stock.read','stock.entry','stock.exit','stock.transfer','stock.inventory',
      'suppliers.read']
    when 'vendeur' then array[
      'products.read','stock.read',
      'sales.read','sales.create',
      'clients.read','clients.create','clients.update']
    when 'caissier' then array[
      'products.read','sales.read','sales.create',
      'cash.read','cash.open','cash.close','cash.transaction',
      'clients.read']
    when 'comptable' then array[
      'sales.read','finance.read','finance.manage','payroll.read','reports.read','clients.read']
    else array[]::text[]
  end;
$$;

-- 3. Initialisation (idempotente) de la matrice pour une entreprise
create or replace function public.initialiser_permissions(_entreprise uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare r public.app_role;
begin
  foreach r in array enum_range(null::public.app_role) loop
    insert into public.role_permissions (entreprise_id, role, permission, autorise)
    select _entreprise, r, p.code, p.code = any(public.permissions_par_defaut(r))
    from public.permissions p
    where not exists (
      select 1 from public.role_permissions rp
      where rp.entreprise_id = _entreprise and rp.role = r and rp.permission = p.code
    );
  end loop;
end $$;

create or replace function public.trg_initialiser_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.initialiser_permissions(new.id);
  return new;
end $$;

drop trigger if exists trg_entreprises_permissions on public.entreprises;
create trigger trg_entreprises_permissions
  after insert on public.entreprises
  for each row execute function public.trg_initialiser_permissions();

-- Entreprises déjà existantes
do $$
declare e uuid;
begin
  for e in select id from public.entreprises loop
    perform public.initialiser_permissions(e);
  end loop;
end $$;

-- 4. Vérification serveur des permissions
create or replace function public.a_permission(_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.profiles pr on pr.user_id = ur.user_id
    join public.role_permissions rp
      on rp.entreprise_id = pr.entreprise_id and rp.role = ur.role
    where ur.user_id = auth.uid()
      and pr.actif
      and rp.permission = _permission
      and rp.autorise
  );
$$;

create or replace function public.mes_permissions()
returns table(permission text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct rp.permission
  from public.user_roles ur
  join public.profiles pr on pr.user_id = ur.user_id
  join public.role_permissions rp
    on rp.entreprise_id = pr.entreprise_id and rp.role = ur.role
  where ur.user_id = auth.uid() and pr.actif and rp.autorise;
$$;

grant execute on function public.a_permission(text) to authenticated;
grant execute on function public.mes_permissions() to authenticated;
grant execute on function public.initialiser_permissions(uuid) to authenticated;

-- 5. RLS de la matrice : lecture pour tous les membres, écriture réservée
drop policy if exists "role_permissions_lecture" on public.role_permissions;
create policy "role_permissions_lecture" on public.role_permissions
  for select to authenticated
  using (entreprise_id = public.current_entreprise_id());

drop policy if exists "role_permissions_ecriture" on public.role_permissions;
create policy "role_permissions_ecriture" on public.role_permissions
  for all to authenticated
  using (entreprise_id = public.current_entreprise_id() and public.a_permission('roles.manage'))
  with check (entreprise_id = public.current_entreprise_id() and public.a_permission('roles.manage'));