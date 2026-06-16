-- 1. Auto-create User on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, "fullName", "avatarUrl", role)
  VALUES (
    NEW.id::TEXT,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'USER'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Embed Role in JWT via Custom Claim
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims      JSONB;
  user_role   TEXT;
BEGIN
  -- We query the users table instead of profiles
  SELECT role::TEXT INTO user_role
  FROM public.users
  WHERE id = (event->>'user_id')::TEXT;

  claims := event->'claims';

  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{app_role}', to_jsonb(user_role));
  ELSE
    claims := jsonb_set(claims, '{app_role}', '"USER"');
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- 3. Backfill existing auth.users who don't have a record yet
INSERT INTO public.users (id, email, role, "updatedAt")
SELECT id::TEXT, email, 'USER', now()
FROM auth.users
WHERE id::TEXT NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;
