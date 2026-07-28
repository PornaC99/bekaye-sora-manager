-- Politique d'insertion d'entreprise restreinte
drop policy "Utilisateur cree une entreprise" on public.entreprises;
create policy "Utilisateur sans entreprise en cree une" on public.entreprises for insert to authenticated
  with check (public.current_entreprise_id() is null);

-- Les fonctions de trigger ne doivent pas être appelables via l'API
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.appliquer_mouvement_stock() from anon, authenticated;
revoke execute on function public.generer_numero_vente() from anon, authenticated;
revoke execute on function public.valider_periode_conge() from anon, authenticated;

-- Helpers RLS : réservés aux utilisateurs authentifiés
revoke execute on function public.current_entreprise_id() from anon;
revoke execute on function public.is_admin() from anon;
revoke execute on function public.has_role(uuid, public.app_role) from anon;