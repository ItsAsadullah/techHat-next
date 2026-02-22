-- Drop existing policies on profiles
DROP POLICY IF EXISTS "profiles: own read" ON public.profiles;
DROP POLICY IF EXISTS "profiles: own update" ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin read all" ON public.profiles;
DROP POLICY IF EXISTS "profiles: super_admin update role" ON public.profiles;
DROP POLICY IF EXISTS "profiles: service insert" ON public.profiles;

-- Create combined SELECT policy for profiles
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
        AND role IN ('admin', 'super_admin')
    )
  );

-- Create combined UPDATE policy for profiles
CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'super_admin'
    )
  )
  WITH CHECK (
    (
      (select auth.uid()) = id
      AND role = (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'super_admin'
    )
  );

-- Create INSERT policy for profiles (service role only)
CREATE POLICY "profiles_insert_policy"
  ON public.profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Drop existing policies on orders
DROP POLICY IF EXISTS "orders_owner_read" ON public.orders;
DROP POLICY IF EXISTS "orders_insert" ON public.orders;

-- Create new SELECT policy for orders
CREATE POLICY "orders_select_policy"
  ON public.orders FOR SELECT
  TO authenticated, anon
  USING (
    ((select auth.uid())::text = user_id) OR (user_id IS NULL)
  );

-- Create new INSERT policy for orders
CREATE POLICY "orders_insert_policy"
  ON public.orders FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Drop existing policies on order_events
DROP POLICY IF EXISTS "events_owner_read" ON public.order_events;

-- Create new SELECT policy for order_events
CREATE POLICY "order_events_select_policy"
  ON public.order_events FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE user_id = (select auth.uid())::text
    )
  );
