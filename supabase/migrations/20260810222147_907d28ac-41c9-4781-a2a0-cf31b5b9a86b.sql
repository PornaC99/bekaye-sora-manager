-- Employés : lecture/écriture pilotées par les permissions RH
DROP POLICY IF EXISTS "Membres gerent employes" ON public.employes;
CREATE POLICY "employes_lecture" ON public.employes FOR SELECT TO authenticated
  USING (entreprise_id = public.current_entreprise_id()
         AND (public.a_permission('employees.read') OR user_id = auth.uid()));
CREATE POLICY "employes_creation" ON public.employes FOR INSERT TO authenticated
  WITH CHECK (entreprise_id = public.current_entreprise_id() AND public.a_permission('employees.create'));
CREATE POLICY "employes_modification" ON public.employes FOR UPDATE TO authenticated
  USING (entreprise_id = public.current_entreprise_id() AND public.a_permission('employees.update'))
  WITH CHECK (entreprise_id = public.current_entreprise_id() AND public.a_permission('employees.update'));
CREATE POLICY "employes_suppression" ON public.employes FOR DELETE TO authenticated
  USING (entreprise_id = public.current_entreprise_id() AND public.a_permission('employees.disable'));

-- Congés
DROP POLICY IF EXISTS "Membres gerent conges" ON public.conges;
CREATE POLICY "conges_lecture" ON public.conges FOR SELECT TO authenticated
  USING (entreprise_id = public.current_entreprise_id() AND public.a_permission('employees.read'));
CREATE POLICY "conges_ecriture" ON public.conges FOR ALL TO authenticated
  USING (entreprise_id = public.current_entreprise_id() AND public.a_permission('employees.update'))
  WITH CHECK (entreprise_id = public.current_entreprise_id() AND public.a_permission('employees.update'));

-- Présences
DROP POLICY IF EXISTS "Membres gerent presences" ON public.presences;
CREATE POLICY "presences_lecture" ON public.presences FOR SELECT TO authenticated
  USING (entreprise_id = public.current_entreprise_id() AND public.a_permission('employees.read'));
CREATE POLICY "presences_ecriture" ON public.presences FOR ALL TO authenticated
  USING (entreprise_id = public.current_entreprise_id() AND public.a_permission('employees.update'))
  WITH CHECK (entreprise_id = public.current_entreprise_id() AND public.a_permission('employees.update'));

-- Dépenses
DROP POLICY IF EXISTS "Membres gerent depenses" ON public.depenses;
CREATE POLICY "depenses_lecture" ON public.depenses FOR SELECT TO authenticated
  USING (entreprise_id = public.current_entreprise_id() AND public.a_permission('finance.read'));
CREATE POLICY "depenses_ecriture" ON public.depenses FOR ALL TO authenticated
  USING (entreprise_id = public.current_entreprise_id() AND public.a_permission('finance.manage'))
  WITH CHECK (entreprise_id = public.current_entreprise_id() AND public.a_permission('finance.manage'));