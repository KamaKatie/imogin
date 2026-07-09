-- Fix infinite recursion in partnership_members RLS policy
-- by using a SECURITY DEFINER function that bypasses RLS

CREATE OR REPLACE FUNCTION public.is_partnership_member(check_partnership_id UUID, check_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.partnership_members
        WHERE partnership_id = check_partnership_id
        AND user_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Fix the partnership_members SELECT policy
DROP POLICY IF EXISTS "Users can view partnership members" ON public.partnership_members;
CREATE POLICY "Users can view partnership members"
    ON public.partnership_members FOR SELECT
    USING (is_partnership_member(partnership_id, auth.uid()));

-- Fix the partnership_members INSERT policy
DROP POLICY IF EXISTS "Users can join partnerships" ON public.partnership_members;
CREATE POLICY "Users can join partnerships"
    ON public.partnership_members FOR INSERT
    WITH CHECK (true);

-- Also fix partnerships policies for consistency (using the helper)
DROP POLICY IF EXISTS "Members can view their partnerships" ON public.partnerships;
CREATE POLICY "Members can view their partnerships"
    ON public.partnerships FOR SELECT
    USING (is_partnership_member(id, auth.uid()));

DROP POLICY IF EXISTS "Members can update their partnerships" ON public.partnerships;
CREATE POLICY "Members can update their partnerships"
    ON public.partnerships FOR UPDATE
    USING (is_partnership_member(id, auth.uid()));
