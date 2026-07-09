-- Harden permissive RLS policies and revoke public function access

-- Restrict partnership_members INSERT: users can only insert themselves
DROP POLICY IF EXISTS "Users can join partnerships" ON public.partnership_members;
CREATE POLICY "Users can join partnerships"
    ON public.partnership_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Restrict partnerships INSERT: only logged-in users can create
DROP POLICY IF EXISTS "Users can create partnerships" ON public.partnerships;
CREATE POLICY "Users can create partnerships"
    ON public.partnerships FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Revoke EXECUTE on is_partnership_member from anon (public) role
-- The function is only used internally by RLS policies, not meant for direct API calls
REVOKE EXECUTE ON FUNCTION public.is_partnership_member(UUID, UUID) FROM anon, public;
