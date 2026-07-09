-- Revoke EXECUTE on is_partnership_member from authenticated role
-- The function is only used internally by RLS policies, not meant for direct API calls
REVOKE EXECUTE ON FUNCTION public.is_partnership_member(UUID, UUID) FROM authenticated;
