-- Simplify partnerships, drop partnership_members, JPY defaults, personal budgets/goals

-- ============ PHASE 1: Drop old artifacts ============

DROP FUNCTION IF EXISTS public.is_partnership_member(UUID, UUID) CASCADE;

DROP POLICY IF EXISTS "Partners can view each other's profiles" ON public.profiles;

DROP POLICY IF EXISTS "Members can view their partnerships" ON public.partnerships;
DROP POLICY IF EXISTS "Members can update their partnerships" ON public.partnerships;
DROP POLICY IF EXISTS "Users can create partnerships" ON public.partnerships;

DROP POLICY IF EXISTS "Users can view partnership members" ON public.partnership_members;
DROP POLICY IF EXISTS "Users can join partnerships" ON public.partnership_members;

DROP POLICY IF EXISTS "Users can view accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;

DROP POLICY IF EXISTS "Users can view categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

DROP POLICY IF EXISTS "Users can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

DROP POLICY IF EXISTS "Users can view transaction splits" ON public.transaction_splits;
DROP POLICY IF EXISTS "Users can insert transaction splits" ON public.transaction_splits;
DROP POLICY IF EXISTS "Users can update transaction splits" ON public.transaction_splits;

DROP POLICY IF EXISTS "Users can view subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete subscriptions" ON public.subscriptions;

DROP POLICY IF EXISTS "Users can view subscription splits" ON public.subscription_splits;
DROP POLICY IF EXISTS "Users can manage subscription splits" ON public.subscription_splits;
DROP POLICY IF EXISTS "Users can update subscription splits" ON public.subscription_splits;
DROP POLICY IF EXISTS "Users can delete subscription splits" ON public.subscription_splits;

DROP POLICY IF EXISTS "Users can view goals" ON public.goals;
DROP POLICY IF EXISTS "Users can insert goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete goals" ON public.goals;

DROP POLICY IF EXISTS "Users can view goal contributions" ON public.goal_contributions;
DROP POLICY IF EXISTS "Users can insert goal contributions" ON public.goal_contributions;
DROP POLICY IF EXISTS "Users can delete own contributions" ON public.goal_contributions;

DROP POLICY IF EXISTS "Users can view budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete budgets" ON public.budgets;

-- ============ PHASE 2: Alter tables before partnerships drop ============

-- budgets: make partnership_id nullable, add user_id, add currency
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_partnership_id_fkey;
ALTER TABLE public.budgets ALTER COLUMN partnership_id DROP NOT NULL;
ALTER TABLE public.budgets ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.budgets ADD COLUMN currency TEXT NOT NULL DEFAULT 'JPY';
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_created_by_fkey;
ALTER TABLE public.budgets DROP COLUMN IF EXISTS created_by;

-- goals: make partnership_id nullable, add user_id, add currency, drop created_by
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_partnership_id_fkey;
ALTER TABLE public.goals ALTER COLUMN partnership_id DROP NOT NULL;
ALTER TABLE public.goals ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.goals ADD COLUMN currency TEXT NOT NULL DEFAULT 'JPY';
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_created_by_fkey;
ALTER TABLE public.goals DROP COLUMN IF EXISTS created_by;

-- subscriptions: change currency default
ALTER TABLE public.subscriptions ALTER COLUMN currency SET DEFAULT 'JPY';

-- accounts: change currency default
ALTER TABLE public.accounts ALTER COLUMN currency SET DEFAULT 'JPY';

-- categories: drop user_id, is_shared; make partnership_id NOT NULL
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_partnership_id_fkey;
DELETE FROM public.categories WHERE user_id IS NOT NULL AND partnership_id IS NULL;
ALTER TABLE public.categories DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.categories DROP COLUMN IF EXISTS is_shared;
ALTER TABLE public.categories ALTER COLUMN partnership_id SET NOT NULL;

-- Drop FK constraints on tables that will reference the new partnerships table
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_partnership_id_fkey;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_partnership_id_fkey;
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_partnership_id_fkey;

-- ============ PHASE 3: Recreate partnerships ============

DROP TABLE IF EXISTS public.partnership_members CASCADE;
DROP TABLE IF EXISTS public.partnerships CASCADE;

CREATE TABLE public.partnerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    share_code TEXT UNIQUE,
    share_code_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;

-- ============ PHASE 4: Re-add FKs and constraints ============

ALTER TABLE public.accounts ADD FOREIGN KEY (partnership_id) REFERENCES public.partnerships(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD FOREIGN KEY (partnership_id) REFERENCES public.partnerships(id) ON DELETE CASCADE;
ALTER TABLE public.subscriptions ADD FOREIGN KEY (partnership_id) REFERENCES public.partnerships(id) ON DELETE CASCADE;
ALTER TABLE public.budgets ADD FOREIGN KEY (partnership_id) REFERENCES public.partnerships(id) ON DELETE CASCADE;
ALTER TABLE public.goals ADD FOREIGN KEY (partnership_id) REFERENCES public.partnerships(id) ON DELETE CASCADE;

-- personal-or-shared constraints on budgets and goals
ALTER TABLE public.budgets ADD CONSTRAINT personal_or_shared_budget CHECK (
    (partnership_id IS NOT NULL AND user_id IS NULL) OR
    (partnership_id IS NULL AND user_id IS NOT NULL)
);

ALTER TABLE public.goals ADD CONSTRAINT personal_or_shared_goal CHECK (
    (partnership_id IS NOT NULL AND user_id IS NULL) OR
    (partnership_id IS NULL AND user_id IS NOT NULL)
);

-- ============ PHASE 5: New RLS policies ============

-- Helper: check if user is in a partnership
CREATE OR REPLACE FUNCTION public.is_partnership_member(partnership_id UUID, user_id UUID)
RETURNS BOOLEAN
STABLE
LANGUAGE sql
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.partnerships
        WHERE id = is_partnership_member.partnership_id
        AND (user1_id = is_partnership_member.user_id OR user2_id = is_partnership_member.user_id)
    );
$$;

-- PARTNERSHIPS
CREATE POLICY "Users can view their partnerships"
    ON public.partnerships FOR SELECT
    USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create partnerships"
    ON public.partnerships FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their partnerships"
    ON public.partnerships FOR UPDATE
    USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can delete their partnerships"
    ON public.partnerships FOR DELETE
    USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- ACCOUNTS
CREATE POLICY "Users can view accounts"
    ON public.accounts FOR SELECT
    USING (
        (user_id = auth.uid()) OR
        (is_shared = TRUE AND is_partnership_member(partnership_id, auth.uid()))
    );

CREATE POLICY "Users can insert accounts"
    ON public.accounts FOR INSERT
    WITH CHECK (
        (user_id = auth.uid() AND is_shared = FALSE) OR
        (is_shared = TRUE AND is_partnership_member(partnership_id, auth.uid()))
    );

CREATE POLICY "Users can update accounts"
    ON public.accounts FOR UPDATE
    USING (
        (user_id = auth.uid() AND is_shared = FALSE) OR
        (is_shared = TRUE AND is_partnership_member(partnership_id, auth.uid()))
    );

CREATE POLICY "Users can delete accounts"
    ON public.accounts FOR DELETE
    USING (
        (user_id = auth.uid() AND is_shared = FALSE) OR
        (is_shared = TRUE AND is_partnership_member(partnership_id, auth.uid()))
    );

-- CATEGORIES (always shared within a partnership)
CREATE POLICY "Users can view categories"
    ON public.categories FOR SELECT
    USING (is_partnership_member(partnership_id, auth.uid()));

CREATE POLICY "Users can insert categories"
    ON public.categories FOR INSERT
    WITH CHECK (is_partnership_member(partnership_id, auth.uid()));

CREATE POLICY "Users can update categories"
    ON public.categories FOR UPDATE
    USING (is_partnership_member(partnership_id, auth.uid()));

CREATE POLICY "Users can delete categories"
    ON public.categories FOR DELETE
    USING (is_partnership_member(partnership_id, auth.uid()));

-- TRANSACTIONS
CREATE POLICY "Users can view transactions"
    ON public.transactions FOR SELECT
    USING (
        (user_id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.accounts a
            WHERE a.id = transactions.account_id
            AND a.is_shared = TRUE
            AND is_partnership_member(a.partnership_id, auth.uid())
        )
    );

CREATE POLICY "Users can insert transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (
        (user_id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.accounts a
            WHERE a.id = transactions.account_id
            AND a.is_shared = TRUE
            AND is_partnership_member(a.partnership_id, auth.uid())
        )
    );

CREATE POLICY "Users can update their own transactions"
    ON public.transactions FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own transactions"
    ON public.transactions FOR DELETE
    USING (user_id = auth.uid());

-- TRANSACTION SPLITS
CREATE POLICY "Users can view transaction splits"
    ON public.transaction_splits FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.transactions t
            JOIN public.accounts a ON t.account_id = a.id
            WHERE t.id = transaction_splits.transaction_id
            AND (
                t.user_id = auth.uid() OR
                (a.is_shared = TRUE AND is_partnership_member(a.partnership_id, auth.uid()))
            )
        )
    );

CREATE POLICY "Users can insert transaction splits"
    ON public.transaction_splits FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.transactions
            WHERE id = transaction_splits.transaction_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update transaction splits"
    ON public.transaction_splits FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.transactions
            WHERE id = transaction_splits.transaction_id AND user_id = auth.uid()
        )
    );

-- SUBSCRIPTIONS
CREATE POLICY "Users can view subscriptions"
    ON public.subscriptions FOR SELECT
    USING (is_partnership_member(partnership_id, auth.uid()));

CREATE POLICY "Users can insert subscriptions"
    ON public.subscriptions FOR INSERT
    WITH CHECK (is_partnership_member(partnership_id, auth.uid()));

CREATE POLICY "Users can update subscriptions"
    ON public.subscriptions FOR UPDATE
    USING (is_partnership_member(partnership_id, auth.uid()));

CREATE POLICY "Users can delete subscriptions"
    ON public.subscriptions FOR DELETE
    USING (is_partnership_member(partnership_id, auth.uid()));

-- SUBSCRIPTION SPLITS
CREATE POLICY "Users can view subscription splits"
    ON public.subscription_splits FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.subscriptions s
            WHERE s.id = subscription_splits.subscription_id
            AND is_partnership_member(s.partnership_id, auth.uid())
        )
    );

CREATE POLICY "Users can manage subscription splits"
    ON public.subscription_splits FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.subscriptions s
            WHERE s.id = subscription_splits.subscription_id
            AND is_partnership_member(s.partnership_id, auth.uid())
        )
    );

CREATE POLICY "Users can update subscription splits"
    ON public.subscription_splits FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.subscriptions s
            WHERE s.id = subscription_splits.subscription_id
            AND is_partnership_member(s.partnership_id, auth.uid())
        )
    );

CREATE POLICY "Users can delete subscription splits"
    ON public.subscription_splits FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.subscriptions s
            WHERE s.id = subscription_splits.subscription_id
            AND is_partnership_member(s.partnership_id, auth.uid())
        )
    );

-- GOALS
CREATE POLICY "Users can view goals"
    ON public.goals FOR SELECT
    USING (
        (user_id = auth.uid()) OR
        is_partnership_member(partnership_id, auth.uid())
    );

CREATE POLICY "Users can insert goals"
    ON public.goals FOR INSERT
    WITH CHECK (
        (user_id = auth.uid()) OR
        is_partnership_member(partnership_id, auth.uid())
    );

CREATE POLICY "Users can update goals"
    ON public.goals FOR UPDATE
    USING (
        (user_id = auth.uid()) OR
        is_partnership_member(partnership_id, auth.uid())
    );

CREATE POLICY "Users can delete goals"
    ON public.goals FOR DELETE
    USING (
        (user_id = auth.uid()) OR
        is_partnership_member(partnership_id, auth.uid())
    );

-- GOAL CONTRIBUTIONS
CREATE POLICY "Users can view goal contributions"
    ON public.goal_contributions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.goals g
            WHERE g.id = goal_contributions.goal_id
            AND (g.user_id = auth.uid() OR is_partnership_member(g.partnership_id, auth.uid()))
        )
    );

CREATE POLICY "Users can insert goal contributions"
    ON public.goal_contributions FOR INSERT
    WITH CHECK (
        (user_id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.goals g
            WHERE g.id = goal_contributions.goal_id
            AND is_partnership_member(g.partnership_id, auth.uid())
        )
    );

CREATE POLICY "Users can delete own contributions"
    ON public.goal_contributions FOR DELETE
    USING (user_id = auth.uid());

-- BUDGETS
CREATE POLICY "Users can view budgets"
    ON public.budgets FOR SELECT
    USING (
        (user_id = auth.uid()) OR
        is_partnership_member(partnership_id, auth.uid())
    );

CREATE POLICY "Users can insert budgets"
    ON public.budgets FOR INSERT
    WITH CHECK (
        (user_id = auth.uid()) OR
        is_partnership_member(partnership_id, auth.uid())
    );

CREATE POLICY "Users can update budgets"
    ON public.budgets FOR UPDATE
    USING (
        (user_id = auth.uid()) OR
        is_partnership_member(partnership_id, auth.uid())
    );

CREATE POLICY "Users can delete budgets"
    ON public.budgets FOR DELETE
    USING (
        (user_id = auth.uid()) OR
        is_partnership_member(partnership_id, auth.uid())
    );

-- Update seed function: drop is_shared column reference
CREATE OR REPLACE FUNCTION public.seed_default_categories(target_partnership_id UUID)
RETURNS void
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.categories (partnership_id, name, icon, color, type)
    VALUES
        (target_partnership_id, 'Housing', 'home', '#4F46E5', 'expense'),
        (target_partnership_id, 'Utilities', 'zap', '#F59E0B', 'expense'),
        (target_partnership_id, 'Groceries', 'shopping-cart', '#10B981', 'expense'),
        (target_partnership_id, 'Dining Out', 'utensils', '#EF4444', 'expense'),
        (target_partnership_id, 'Transportation', 'car', '#8B5CF6', 'expense'),
        (target_partnership_id, 'Entertainment', 'film', '#EC4899', 'expense'),
        (target_partnership_id, 'Subscriptions', 'repeat', '#06B6D4', 'expense'),
        (target_partnership_id, 'Shopping', 'shopping-bag', '#F97316', 'expense'),
        (target_partnership_id, 'Healthcare', 'heart-pulse', '#BE185D', 'expense'),
        (target_partnership_id, 'Travel', 'plane', '#0EA5E9', 'expense'),
        (target_partnership_id, 'Salary', 'briefcase', '#10B981', 'income'),
        (target_partnership_id, 'Freelance', 'laptop', '#3B82F6', 'income'),
        (target_partnership_id, 'Other Income', 'plus-circle', '#6B7280', 'income'),
        (target_partnership_id, 'Other Expense', 'more-horizontal', '#6B7280', 'expense')
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;
