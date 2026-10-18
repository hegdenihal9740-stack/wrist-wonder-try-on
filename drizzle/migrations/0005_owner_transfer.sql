CREATE OR REPLACE FUNCTION public.claim_store_owner() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN public.has_role(auth.uid(), 'admin'); END IF;
  IF lower(coalesce(auth.jwt()->>'email','')) <> 'nihalhegde1@gmail.com' THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin');
  RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.transfer_store_owner(_new_email text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN 'not_owner'; END IF;
  SELECT id INTO target FROM auth.users WHERE lower(email) = lower(trim(_new_email)) LIMIT 1;
  IF target IS NULL THEN RETURN 'no_account'; END IF;
  IF target = auth.uid() THEN RETURN 'same'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (target, 'admin') ON CONFLICT DO NOTHING;
  DELETE FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin';
  RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.transfer_store_owner(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_store_owner(text) TO authenticated;