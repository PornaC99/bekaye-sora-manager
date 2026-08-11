drop policy if exists "notifications_lecture" on public.notifications;
drop policy if exists "notifications_maj" on public.notifications;
drop policy if exists "notifications_suppression" on public.notifications;

create policy "notifications_lecture" on public.notifications
for select to authenticated
using (
  entreprise_id = public.current_entreprise_id()
  and (audience <> 'direction' or public.a_permission('notifications.direction'))
);

create policy "notifications_maj" on public.notifications
for update to authenticated
using (
  entreprise_id = public.current_entreprise_id()
  and (audience <> 'direction' or public.a_permission('notifications.direction'))
)
with check (entreprise_id = public.current_entreprise_id());

create policy "notifications_suppression" on public.notifications
for delete to authenticated
using (
  entreprise_id = public.current_entreprise_id()
  and (audience <> 'direction' or public.a_permission('notifications.direction'))
);

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
    _entreprise, null, _titre,
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

revoke all on function public.notifier_direction(uuid,text,text,text,text,text,text,uuid,numeric,numeric,text,jsonb) from public, anon, authenticated;