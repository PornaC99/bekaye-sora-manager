DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t.tablename);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t.tablename);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_mouvement_stock ON public.mouvements_stock;
DROP TRIGGER IF EXISTS trg_numero_vente ON public.ventes;