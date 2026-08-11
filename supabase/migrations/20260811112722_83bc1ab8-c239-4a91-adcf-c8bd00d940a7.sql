-- 1. Colonnes de supervision
alter table public.notifications
  add column if not exists audience text not null default 'tous',
  add column if not exists acteur text,
  add column if not exists entite text,
  add column if not exists entite_id uuid,
  add column if not exists montant numeric,
  add column if not exists quantite numeric;

create index if not exists idx_notifications_audience
  on public.notifications (entreprise_id, audience, created_at desc);

-- 2. Permission dédiée
insert into public.permissions (code, module, libelle, ordre)
values ('notifications.direction', 'systeme', 'Consulter les notifications de direction', 900)
on conflict (code) do nothing;

insert into public.role_permissions (entreprise_id, role, permission, autorise)
select e.id, r.role, 'notifications.direction', r.role in ('administrateur','directeur')
from public.entreprises e
cross join (select unnest(enum_range(null::public.app_role)) as role) r
on conflict (entreprise_id, role, permission) do nothing;

-- 3. RLS : confidentialité des notifications de direction
drop policy if exists "Membres gerent notifications" on public.notifications;

create policy "notifications_lecture" on public.notifications
for select to authenticated
using (
  entreprise_id = public.current_entreprise_id()
  and (
    audience <> 'direction'
    or user_id = auth.uid()
    or public.a_permission('notifications.direction')
  )
);

create policy "notifications_insertion" on public.notifications
for insert to authenticated
with check (entreprise_id = public.current_entreprise_id() and audience <> 'direction');

create policy "notifications_maj" on public.notifications
for update to authenticated
using (
  entreprise_id = public.current_entreprise_id()
  and (
    audience <> 'direction'
    or user_id = auth.uid()
    or public.a_permission('notifications.direction')
  )
)
with check (entreprise_id = public.current_entreprise_id());

create policy "notifications_suppression" on public.notifications
for delete to authenticated
using (
  entreprise_id = public.current_entreprise_id()
  and (
    audience <> 'direction'
    or user_id = auth.uid()
    or public.a_permission('notifications.direction')
  )
);

-- 4. Fonction de supervision : notification direction + trace d'audit
create or replace function public.notifier_direction(
  _entreprise uuid,
  _module text,
  _ton text,
  _titre text,
  _message text,
  _lien text,
  _entite text,
  _entite_id uuid,
  _montant numeric default null,
  _quantite numeric default null,
  _action text default null,
  _details jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_acteur text;
begin
  if _entreprise is null then return; end if;

  select coalesce(nom_complet, email) into v_acteur
  from public.profiles where user_id = auth.uid();
  v_acteur := coalesce(v_acteur, 'Système');

  insert into public.notifications (
    entreprise_id, user_id, titre, message, type, priorite, lien, lue,
    audience, acteur, entite, entite_id, montant, quantite
  ) values (
    _entreprise, auth.uid(), _titre,
    v_acteur || ' · ' || _message, _module, _ton, _lien, false,
    'direction', v_acteur, _entite, _entite_id, _montant, _quantite
  );

  insert into public.journal_audit (entreprise_id, user_id, acteur, action, entite, entite_id, details)
  values (
    _entreprise, auth.uid(), v_acteur,
    coalesce(_action, _module || '.' || coalesce(_entite,'operation')),
    _entite, _entite_id,
    _details || jsonb_build_object('titre', _titre, 'message', _message,
                                   'montant', _montant, 'quantite', _quantite, 'lien', _lien)
  );
end $$;

-- 5. Déclencheurs métier
create or replace function public.trg_supervision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ent uuid;
  v_produit text;
  v_num text;
begin
  case tg_table_name

  when 'ventes' then
    v_ent := new.entreprise_id;
    if tg_op = 'INSERT' then
      perform public.notifier_direction(v_ent, 'ventes', 'succes',
        'Vente ' || new.numero,
        'a encaissé la vente ' || new.numero || ' pour ' || round(new.total)::text,
        '/ventes/historique?vente=' || new.numero, 'ventes', new.id,
        new.total, null, 'vente.creation',
        jsonb_build_object('numero', new.numero, 'client', coalesce(new.client_nom,'')));
    elsif new.statut is distinct from old.statut and new.statut in ('annulee','retour') then
      perform public.notifier_direction(v_ent, 'ventes', 'danger',
        case when new.statut = 'annulee' then 'Vente annulée ' else 'Retour sur vente ' end || new.numero,
        'a modifié le statut de la vente ' || new.numero || ' (' || new.statut || ')',
        '/ventes/historique?vente=' || new.numero, 'ventes', new.id,
        new.total, null, 'vente.' || new.statut,
        jsonb_build_object('numero', new.numero, 'statut', new.statut));
    end if;

  when 'retours' then
    perform public.notifier_direction(new.entreprise_id, 'ventes', 'alerte',
      'Remboursement ' || new.numero,
      'a enregistré un remboursement de ' || round(new.montant)::text,
      '/ventes/retours', 'retours', new.id, new.montant, null, 'vente.retour',
      jsonb_build_object('numero', new.numero, 'motif', coalesce(new.motif,'')));

  when 'entrees_stock' then
    perform public.notifier_direction(new.entreprise_id, 'stock', 'info',
      'Entrée de stock ' || new.numero,
      'a enregistré une entrée de stock de ' || round(new.montant_total)::text,
      '/entrees-stock/' || new.id::text, 'entrees_stock', new.id,
      new.montant_total, null, 'stock.entree',
      jsonb_build_object('numero', new.numero));

  when 'mouvements_stock' then
    select nom into v_produit from public.produits where id = new.produit_id;
    if new.type = 'sortie' and coalesce(new.motif,'') = 'transfert' then
      perform public.notifier_direction(new.entreprise_id, 'stock', 'alerte',
        'Transfert de stock ' || coalesce(new.numero,''),
        'a transféré ' || new.quantite::text || ' × ' || coalesce(v_produit,'produit'),
        '/sorties-stock', 'mouvements_stock', new.id,
        new.quantite * coalesce(new.valeur_unitaire,0), new.quantite, 'stock.transfert',
        jsonb_build_object('produit', coalesce(v_produit,''), 'numero', coalesce(new.numero,'')));
    elsif new.type = 'sortie' then
      perform public.notifier_direction(new.entreprise_id, 'stock', 'alerte',
        'Sortie de stock ' || coalesce(new.numero,''),
        'a sorti ' || new.quantite::text || ' × ' || coalesce(v_produit,'produit')
          || ' (' || coalesce(new.motif,'non précisé') || ')',
        '/sorties-stock', 'mouvements_stock', new.id,
        new.quantite * coalesce(new.valeur_unitaire,0), new.quantite, 'stock.sortie',
        jsonb_build_object('produit', coalesce(v_produit,''), 'motif', coalesce(new.motif,''),
                           'numero', coalesce(new.numero,'')));
    elsif new.type in ('ajustement','perte') then
      perform public.notifier_direction(new.entreprise_id, 'inventaire', 'alerte',
        'Ajustement d''inventaire',
        'a ajusté ' || new.quantite::text || ' × ' || coalesce(v_produit,'produit'),
        '/inventaire', 'mouvements_stock', new.id,
        new.quantite * coalesce(new.valeur_unitaire,0), new.quantite, 'stock.ajustement',
        jsonb_build_object('produit', coalesce(v_produit,''), 'type', new.type::text));
    end if;

  when 'inventaires' then
    if tg_op = 'INSERT' or new.statut is distinct from old.statut then
      perform public.notifier_direction(new.entreprise_id, 'inventaire', 'info',
        'Inventaire ' || new.numero || ' — ' || new.statut::text,
        'a mis à jour l''inventaire ' || new.numero,
        '/inventaire/' || new.id::text, 'inventaires', new.id,
        new.ecart_valeur, null, 'inventaire.' || new.statut::text,
        jsonb_build_object('numero', new.numero, 'statut', new.statut::text));
    end if;

  when 'depenses' then
    perform public.notifier_direction(new.entreprise_id, 'finances', 'alerte',
      'Dépense enregistrée',
      'a enregistré la dépense « ' || new.libelle || ' » de ' || round(new.montant)::text,
      '/depenses', 'depenses', new.id, new.montant, null, 'finance.depense',
      jsonb_build_object('libelle', new.libelle, 'mode', new.mode_paiement::text));

  when 'transactions_tresorerie' then
    perform public.notifier_direction(new.entreprise_id, 'finances', 'info',
      'Opération financière — ' || new.type::text,
      'a enregistré « ' || new.libelle || ' » de ' || round(new.montant)::text,
      '/depenses/tresorerie', 'transactions_tresorerie', new.id,
      new.montant, null, 'finance.' || new.type::text,
      jsonb_build_object('libelle', new.libelle, 'type', new.type::text));

  when 'commandes_achat' then
    if tg_op = 'INSERT' then
      perform public.notifier_direction(new.entreprise_id, 'fournisseurs', 'info',
        'Commande fournisseur ' || new.numero,
        'a créé la commande d''achat ' || new.numero || ' de ' || round(new.montant_total)::text,
        '/fournisseurs/commandes/' || new.id::text, 'commandes_achat', new.id,
        new.montant_total, null, 'achat.creation',
        jsonb_build_object('numero', new.numero));
    elsif new.statut is distinct from old.statut then
      perform public.notifier_direction(new.entreprise_id, 'fournisseurs', 'info',
        'Commande ' || new.numero || ' — ' || new.statut::text,
        'a fait passer la commande ' || new.numero || ' au statut ' || new.statut::text,
        '/fournisseurs/commandes/' || new.id::text, 'commandes_achat', new.id,
        new.montant_total, null, 'achat.' || new.statut::text,
        jsonb_build_object('numero', new.numero, 'statut', new.statut::text));
    end if;

  when 'produits' then
    if tg_op = 'INSERT' then
      perform public.notifier_direction(new.entreprise_id, 'produits', 'info',
        'Nouveau produit : ' || new.nom,
        'a créé le produit ' || new.nom,
        '/produits/' || new.id::text, 'produits', new.id,
        new.prix_vente, new.stock, 'produit.creation',
        jsonb_build_object('nom', new.nom));
    elsif new.prix_vente is distinct from old.prix_vente
       or new.prix_achat is distinct from old.prix_achat
       or new.actif is distinct from old.actif then
      perform public.notifier_direction(new.entreprise_id, 'produits', 'alerte',
        'Produit modifié : ' || new.nom,
        'a modifié le produit ' || new.nom ||
        case when new.prix_vente is distinct from old.prix_vente
             then ' (prix ' || round(old.prix_vente)::text || ' → ' || round(new.prix_vente)::text || ')'
             else '' end ||
        case when new.actif is distinct from old.actif
             then case when new.actif then ' (réactivé)' else ' (désactivé)' end else '' end,
        '/produits/' || new.id::text, 'produits', new.id,
        new.prix_vente, new.stock, 'produit.modification',
        jsonb_build_object('nom', new.nom, 'actif', new.actif));
    end if;

  when 'employes' then
    if tg_op = 'INSERT' then
      perform public.notifier_direction(new.entreprise_id, 'rh', 'info',
        'Nouvel employé : ' || new.nom_complet,
        'a créé le compte employé ' || new.nom_complet || ' (' || new.role::text || ')',
        '/employes/' || new.id::text, 'employes', new.id,
        new.salaire_base, null, 'employe.creation',
        jsonb_build_object('nom', new.nom_complet, 'role', new.role::text));
    elsif new.actif is distinct from old.actif
       or new.role is distinct from old.role
       or new.salaire_base is distinct from old.salaire_base then
      perform public.notifier_direction(new.entreprise_id, 'rh', 'alerte',
        'Employé modifié : ' || new.nom_complet,
        'a modifié ' || new.nom_complet ||
        case when new.actif is distinct from old.actif
             then case when new.actif then ' (réactivé)' else ' (désactivé)' end else '' end ||
        case when new.role is distinct from old.role
             then ' (rôle → ' || new.role::text || ')' else '' end,
        '/employes/' || new.id::text, 'employes', new.id,
        new.salaire_base, null, 'employe.modification',
        jsonb_build_object('nom', new.nom_complet, 'actif', new.actif, 'role', new.role::text));
    end if;

  else
    null;
  end case;

  return new;
end $$;

drop trigger if exists trg_supervision_ventes on public.ventes;
create trigger trg_supervision_ventes after insert or update on public.ventes
for each row execute function public.trg_supervision();

drop trigger if exists trg_supervision_retours on public.retours;
create trigger trg_supervision_retours after insert on public.retours
for each row execute function public.trg_supervision();

drop trigger if exists trg_supervision_entrees on public.entrees_stock;
create trigger trg_supervision_entrees after insert on public.entrees_stock
for each row execute function public.trg_supervision();

drop trigger if exists trg_supervision_mouvements on public.mouvements_stock;
create trigger trg_supervision_mouvements after insert on public.mouvements_stock
for each row execute function public.trg_supervision();

drop trigger if exists trg_supervision_inventaires on public.inventaires;
create trigger trg_supervision_inventaires after insert or update on public.inventaires
for each row execute function public.trg_supervision();

drop trigger if exists trg_supervision_depenses on public.depenses;
create trigger trg_supervision_depenses after insert on public.depenses
for each row execute function public.trg_supervision();

drop trigger if exists trg_supervision_tresorerie on public.transactions_tresorerie;
create trigger trg_supervision_tresorerie after insert on public.transactions_tresorerie
for each row execute function public.trg_supervision();

drop trigger if exists trg_supervision_commandes on public.commandes_achat;
create trigger trg_supervision_commandes after insert or update on public.commandes_achat
for each row execute function public.trg_supervision();

drop trigger if exists trg_supervision_produits on public.produits;
create trigger trg_supervision_produits after insert or update on public.produits
for each row execute function public.trg_supervision();

drop trigger if exists trg_supervision_employes on public.employes;
create trigger trg_supervision_employes after insert or update on public.employes
for each row execute function public.trg_supervision();