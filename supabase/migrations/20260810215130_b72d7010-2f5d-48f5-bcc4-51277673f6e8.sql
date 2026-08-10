-- 1. Enrichissement des mouvements de stock
alter table public.mouvements_stock
  add column if not exists numero text,
  add column if not exists motif text,
  add column if not exists commentaire text,
  add column if not exists lot text,
  add column if not exists unite text,
  add column if not exists valeur_unitaire numeric not null default 0,
  add column if not exists statut text not null default 'validee';

create index if not exists idx_mouvements_stock_numero on public.mouvements_stock (entreprise_id, numero);
create index if not exists idx_mouvements_stock_date on public.mouvements_stock (entreprise_id, date_mouvement desc);

-- 2. CUMP
alter table public.produits add column if not exists cump numeric not null default 0;
update public.produits set cump = prix_achat where cump = 0;

-- 3. Lots de stock (FEFO)
create table if not exists public.lots_stock (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  produit_id uuid not null references public.produits(id) on delete cascade,
  magasin_id uuid references public.magasins(id) on delete set null,
  lot text not null,
  date_expiration date,
  quantite_initiale integer not null default 0,
  quantite_restante integer not null default 0,
  prix_achat numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.lots_stock to authenticated;
grant all on public.lots_stock to service_role;
alter table public.lots_stock enable row level security;

drop policy if exists "lots_stock_lecture" on public.lots_stock;
create policy "lots_stock_lecture" on public.lots_stock
  for select to authenticated
  using (entreprise_id = public.current_entreprise_id() and public.a_permission('stock.read'));

drop policy if exists "lots_stock_ecriture" on public.lots_stock;
create policy "lots_stock_ecriture" on public.lots_stock
  for all to authenticated
  using (entreprise_id = public.current_entreprise_id() and public.a_permission('stock.entry'))
  with check (entreprise_id = public.current_entreprise_id() and public.a_permission('stock.entry'));

drop trigger if exists trg_lots_stock_updated_at on public.lots_stock;
create trigger trg_lots_stock_updated_at before update on public.lots_stock
  for each row execute function public.set_updated_at();

create index if not exists idx_lots_stock_fefo
  on public.lots_stock (entreprise_id, produit_id, date_expiration nulls last)
  where quantite_restante > 0;

-- 4. Les entrées alimentent les lots et le CUMP
create or replace function public.appliquer_ligne_entree()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_ent uuid; v_mag uuid; v_stock integer; v_cump numeric;
begin
  select e.entreprise_id, e.magasin_id into v_ent, v_mag
  from public.entrees_stock e where e.id = new.entree_id;
  if v_ent is null or new.produit_id is null then return new; end if;

  select stock, cump into v_stock, v_cump from public.produits where id = new.produit_id for update;
  if v_stock is not null then
    update public.produits
      set cump = case when (v_stock + new.quantite) > 0
                      then ((coalesce(v_cump,0) * greatest(v_stock,0)) + (new.prix_achat * new.quantite))
                           / (greatest(v_stock,0) + new.quantite)
                      else new.prix_achat end,
          updated_at = now()
      where id = new.produit_id;
  end if;

  if coalesce(new.lot, '') <> '' then
    insert into public.lots_stock (entreprise_id, produit_id, magasin_id, lot, date_expiration,
                                   quantite_initiale, quantite_restante, prix_achat)
    values (v_ent, new.produit_id, v_mag, new.lot, new.date_expiration,
            new.quantite, new.quantite, new.prix_achat);
  end if;
  return new;
end $$;

drop trigger if exists trg_lignes_entree_lots on public.lignes_entree_stock;
create trigger trg_lignes_entree_lots after insert on public.lignes_entree_stock
  for each row execute function public.appliquer_ligne_entree();

-- 5. Numérotation des sorties
create or replace function public.generer_numero_sortie(_entreprise uuid)
returns text
language sql
stable
set search_path = public
as $$
  select 'SOR-' || to_char(now(),'YYYYMMDD') || '-' ||
    lpad((
      select count(*) + 1 from public.mouvements_stock
      where entreprise_id = _entreprise and type = 'sortie'
    )::text, 4, '0');
$$;

-- 6. Opération transactionnelle de sortie de stock
create or replace function public.creer_sortie_stock(
  _produit_id uuid,
  _quantite integer,
  _motif text,
  _magasin_id uuid default null,
  _commentaire text default null,
  _reference text default null,
  _lot text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ent uuid := public.current_entreprise_id();
  v_stock integer;
  v_cump numeric;
  v_unite text;
  v_nom text;
  v_id uuid;
  v_numero text;
  v_restant integer;
  v_pris integer;
  r record;
begin
  if v_ent is null then
    raise exception 'Aucune entreprise associée à votre compte' using errcode = '42501';
  end if;
  if not public.a_permission('stock.exit') then
    raise exception 'Permission refusée : stock.exit' using errcode = '42501';
  end if;
  if _quantite is null or _quantite <= 0 then
    raise exception 'La quantité doit être supérieure à zéro' using errcode = '22023';
  end if;
  if coalesce(_motif,'') = '' then
    raise exception 'Le motif est obligatoire' using errcode = '22023';
  end if;

  -- Verrou transactionnel sur le produit
  select stock, cump, unite, nom into v_stock, v_cump, v_unite, v_nom
  from public.produits
  where id = _produit_id and entreprise_id = v_ent
  for update;

  if v_stock is null then
    raise exception 'Produit introuvable dans votre entreprise' using errcode = 'P0002';
  end if;
  if _quantite > v_stock then
    raise exception 'Stock insuffisant : % disponible(s), % demandé(s)', v_stock, _quantite
      using errcode = '23514';
  end if;

  -- Consommation FEFO des lots disponibles
  v_restant := _quantite;
  for r in
    select id, quantite_restante from public.lots_stock
    where entreprise_id = v_ent and produit_id = _produit_id and quantite_restante > 0
      and (_lot is null or lot = _lot)
      and (_magasin_id is null or magasin_id is null or magasin_id = _magasin_id)
    order by date_expiration nulls last, created_at
    for update
  loop
    exit when v_restant <= 0;
    v_pris := least(r.quantite_restante, v_restant);
    update public.lots_stock set quantite_restante = quantite_restante - v_pris where id = r.id;
    v_restant := v_restant - v_pris;
  end loop;

  v_numero := public.generer_numero_sortie(v_ent);

  insert into public.mouvements_stock (
    entreprise_id, magasin_id, produit_id, type, quantite,
    employe_id, reference, observation, date_mouvement,
    numero, motif, commentaire, lot, unite, valeur_unitaire, statut
  ) values (
    v_ent, _magasin_id, _produit_id, 'sortie', _quantite,
    (select id from public.employes where entreprise_id = v_ent and user_id = auth.uid() limit 1),
    _reference, _commentaire, now(),
    v_numero, _motif, _commentaire, _lot, v_unite, coalesce(v_cump, 0), 'validee'
  ) returning id into v_id;

  insert into public.journal_audit (entreprise_id, user_id, acteur, action, entite, entite_id, details)
  values (
    v_ent, auth.uid(),
    coalesce((select nom_complet from public.profiles where user_id = auth.uid()), 'Utilisateur'),
    'stock.exit', 'mouvements_stock', v_id,
    jsonb_build_object('numero', v_numero, 'produit', v_nom, 'quantite', _quantite,
                       'motif', _motif, 'magasin_id', _magasin_id, 'lot', _lot,
                       'reference', _reference, 'valeur_unitaire', coalesce(v_cump,0))
  );

  return v_id;
end $$;

revoke all on function public.creer_sortie_stock(uuid, integer, text, uuid, text, text, text) from public, anon;
grant execute on function public.creer_sortie_stock(uuid, integer, text, uuid, text, text, text) to authenticated;

-- 7. RLS des mouvements de stock alignée sur les permissions
drop policy if exists "mouvements_stock_tenant" on public.mouvements_stock;
drop policy if exists "mouvements_stock_lecture" on public.mouvements_stock;
create policy "mouvements_stock_lecture" on public.mouvements_stock
  for select to authenticated
  using (entreprise_id = public.current_entreprise_id() and public.a_permission('stock.read'));

drop policy if exists "mouvements_stock_insertion" on public.mouvements_stock;
create policy "mouvements_stock_insertion" on public.mouvements_stock
  for insert to authenticated
  with check (
    entreprise_id = public.current_entreprise_id()
    and (
      (type in ('entree','retour') and public.a_permission('stock.entry'))
      or (type = 'sortie' and public.a_permission('stock.exit'))
      or (type in ('ajustement','perte') and public.a_permission('stock.inventory'))
    )
  );