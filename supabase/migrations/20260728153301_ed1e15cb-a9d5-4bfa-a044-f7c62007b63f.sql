revoke all on function public.appliquer_mouvement_stock() from public, anon, authenticated;
revoke all on function public.generer_numero_vente() from public, anon, authenticated;
revoke all on function public.valider_periode_conge() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

revoke all on function public.current_entreprise_id() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.current_entreprise_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;