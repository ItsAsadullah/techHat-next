-- Fix function_search_path_mutable warnings
-- Set search_path to '' to prevent search_path injection attacks

-- Fix set_updated_at function
ALTER FUNCTION public.set_updated_at() SET search_path = '';

-- Fix next_order_number function
ALTER FUNCTION public.next_order_number() SET search_path = '';

-- Fix log_order_status_change function
ALTER FUNCTION public.log_order_status_change() SET search_path = '';
