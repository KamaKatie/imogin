-- Recover orphaned partnership data lost in simplify_schema migration
-- The previous migration dropped partnerships CASCADE, destroying all partnership rows.
-- Existing accounts/goals/budgets/subscriptions/categories still have old partnership_id
-- values that don't match any row in the new (empty) partnerships table.
--
-- This migration:
--   1. Collects all orphaned partnership_ids from all referencing tables
--   2. Drops FK constraints temporarily so we can update references
--   3. For each orphaned ID, reconstructs the partnership from account user_id data
--   4. Creates new partnership rows and updates all FK references
--   5. Re-adds FK constraints
--   6. Seeds default categories for each recovered partnership

-- ============ Step 1: Collect orphaned partnership IDs ============

CREATE TEMP TABLE orphaned_partnership_ids AS
SELECT DISTINCT partnership_id FROM public.accounts WHERE partnership_id IS NOT NULL
EXCEPT SELECT id FROM public.partnerships;

INSERT INTO orphaned_partnership_ids
SELECT DISTINCT partnership_id FROM public.goals WHERE partnership_id IS NOT NULL
EXCEPT SELECT id FROM public.partnerships
EXCEPT SELECT partnership_id FROM orphaned_partnership_ids;

INSERT INTO orphaned_partnership_ids
SELECT DISTINCT partnership_id FROM public.budgets WHERE partnership_id IS NOT NULL
EXCEPT SELECT id FROM public.partnerships
EXCEPT SELECT partnership_id FROM orphaned_partnership_ids;

INSERT INTO orphaned_partnership_ids
SELECT DISTINCT partnership_id FROM public.subscriptions WHERE partnership_id IS NOT NULL
EXCEPT SELECT id FROM public.partnerships
EXCEPT SELECT partnership_id FROM orphaned_partnership_ids;

INSERT INTO orphaned_partnership_ids
SELECT DISTINCT partnership_id FROM public.categories WHERE partnership_id IS NOT NULL
EXCEPT SELECT id FROM public.partnerships
EXCEPT SELECT partnership_id FROM orphaned_partnership_ids;

-- ============ Step 2: Drop FK constraints if they exist ============

ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_partnership_id_fkey;
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_partnership_id_fkey;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_partnership_id_fkey;
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_partnership_id_fkey;
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_partnership_id_fkey;

-- Drop CHECK constraints that might interfere
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS personal_or_shared_budget;
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS personal_or_shared_goal;

-- ============ Step 3: Reconstruct partnerships from orphaned data ============

DO $$
DECLARE
    old_id UUID;
    new_id UUID;
    user_ids UUID[];
    u1 UUID;
    u2 UUID;
    cnt INT;
BEGIN
    cnt := 0;

    FOR old_id IN SELECT partnership_id FROM orphaned_partnership_ids LOOP
        -- Find distinct user_ids that used this partnership in accounts
        SELECT array_agg(DISTINCT a.user_id) INTO user_ids
        FROM public.accounts a
        WHERE a.partnership_id = old_id AND a.user_id IS NOT NULL;

        -- If no accounts found, try goals
        IF user_ids IS NULL OR array_length(user_ids, 1) IS NULL THEN
            SELECT array_agg(DISTINCT g.user_id) INTO user_ids
            FROM public.goals g
            WHERE g.partnership_id = old_id AND g.user_id IS NOT NULL;
        END IF;

        -- Fallback: try budgets
        IF user_ids IS NULL OR array_length(user_ids, 1) IS NULL THEN
            SELECT array_agg(DISTINCT b.user_id) INTO user_ids
            FROM public.budgets b
            WHERE b.partnership_id = old_id AND b.user_id IS NOT NULL;
        END IF;

        new_id := gen_random_uuid();

        IF user_ids IS NOT NULL AND array_length(user_ids, 1) > 0 THEN
            u1 := user_ids[1];
            u2 := CASE WHEN array_length(user_ids, 1) > 1 THEN user_ids[2] ELSE NULL END;
        ELSE
            u1 := (SELECT id FROM auth.users WHERE id IN (
                SELECT user_id FROM public.accounts WHERE partnership_id = old_id
                UNION
                SELECT user_id FROM public.goals WHERE partnership_id = old_id
            ) LIMIT 1);
            IF u1 IS NULL THEN
                u1 := '00000000-0000-0000-0000-000000000000'::UUID;
            END IF;
            u2 := NULL;
        END IF;

        INSERT INTO public.partnerships (id, user1_id, user2_id)
        VALUES (new_id, u1, u2);

        -- Update all FK references
        UPDATE public.accounts SET partnership_id = new_id WHERE partnership_id = old_id;
        UPDATE public.goals SET partnership_id = new_id WHERE partnership_id = old_id;
        UPDATE public.budgets SET partnership_id = new_id WHERE partnership_id = old_id;
        UPDATE public.subscriptions SET partnership_id = new_id WHERE partnership_id = old_id;
        UPDATE public.categories SET partnership_id = new_id WHERE partnership_id = old_id;

        cnt := cnt + 1;
    END LOOP;

    RAISE NOTICE 'Recovered % orphaned partnerships', cnt;
END;
$$;

-- ============ Step 4: Re-add FK constraints ============

ALTER TABLE public.accounts ADD FOREIGN KEY (partnership_id) REFERENCES public.partnerships(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD FOREIGN KEY (partnership_id) REFERENCES public.partnerships(id) ON DELETE CASCADE;
ALTER TABLE public.subscriptions ADD FOREIGN KEY (partnership_id) REFERENCES public.partnerships(id) ON DELETE CASCADE;
ALTER TABLE public.budgets ADD FOREIGN KEY (partnership_id) REFERENCES public.partnerships(id) ON DELETE CASCADE;
ALTER TABLE public.goals ADD FOREIGN KEY (partnership_id) REFERENCES public.partnerships(id) ON DELETE CASCADE;

-- Re-add CHECK constraints
ALTER TABLE public.budgets ADD CONSTRAINT personal_or_shared_budget CHECK (
    (partnership_id IS NOT NULL AND user_id IS NULL) OR
    (partnership_id IS NULL AND user_id IS NOT NULL)
);

ALTER TABLE public.goals ADD CONSTRAINT personal_or_shared_goal CHECK (
    (partnership_id IS NOT NULL AND user_id IS NULL) OR
    (partnership_id IS NULL AND user_id IS NOT NULL)
);

-- ============ Step 5: Seed default categories for each recovered partnership ============

DO $$
DECLARE
    pid UUID;
BEGIN
    FOR pid IN SELECT id FROM public.partnerships WHERE share_code IS NULL AND share_code_expires_at IS NULL LOOP
        PERFORM public.seed_default_categories(pid);
    END LOOP;
END;
$$;

-- ============ Step 6: Clean up ============

DROP TABLE IF EXISTS orphaned_partnership_ids;
