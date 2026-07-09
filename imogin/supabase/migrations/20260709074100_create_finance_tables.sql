-- Create finance tables for imogin couples finance app

-- 1. PARTNERSHIPS
CREATE TABLE IF NOT EXISTS public.partnerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_code TEXT UNIQUE,
    share_code_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;

-- 2. PARTNERSHIP MEMBERS
CREATE TABLE IF NOT EXISTS public.partnership_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partnership_id UUID NOT NULL REFERENCES public.partnerships(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(partnership_id, user_id)
);

ALTER TABLE public.partnership_members ENABLE ROW LEVEL SECURITY;

-- 3. ACCOUNTS
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    partnership_id UUID REFERENCES public.partnerships(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit_card', 'cash', 'investment', 'other')),
    balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT personal_or_shared_check CHECK (
        (is_shared = FALSE AND user_id IS NOT NULL AND partnership_id IS NULL) OR
        (is_shared = TRUE AND user_id IS NULL AND partnership_id IS NOT NULL)
    )
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- 4. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partnership_id UUID REFERENCES public.partnerships(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 5. TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    is_split BOOLEAN NOT NULL DEFAULT FALSE,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    split_method TEXT CHECK (split_method IN ('equal', 'custom', 'covered')),
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 6. TRANSACTION SPLITS
CREATE TABLE IF NOT EXISTS public.transaction_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    percentage DECIMAL(5,2),
    settled BOOLEAN NOT NULL DEFAULT FALSE,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(transaction_id, user_id)
);

ALTER TABLE public.transaction_splits ENABLE ROW LEVEL SECURITY;

-- 7. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partnership_id UUID NOT NULL REFERENCES public.partnerships(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    next_billing_date DATE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    payment_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    split_method TEXT NOT NULL DEFAULT 'equal' CHECK (split_method IN ('equal', 'custom', 'covered')),
    split_payer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 8. SUBSCRIPTION SPLITS (for custom splits)
CREATE TABLE IF NOT EXISTS public.subscription_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    percentage DECIMAL(5,2) NOT NULL,
    UNIQUE(subscription_id, user_id)
);

ALTER TABLE public.subscription_splits ENABLE ROW LEVEL SECURITY;

-- 9. GOALS
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partnership_id UUID NOT NULL REFERENCES public.partnerships(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    target_date DATE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    icon TEXT,
    color TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- 10. GOAL CONTRIBUTIONS
CREATE TABLE IF NOT EXISTS public.goal_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;

-- 11. BUDGETS
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partnership_id UUID NOT NULL REFERENCES public.partnerships(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============

-- PARTNERSHIPS: members can view their own partnerships
CREATE POLICY "Members can view their partnerships"
    ON public.partnerships FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.partnership_members
            WHERE partnership_id = id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Members can update their partnerships"
    ON public.partnerships FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.partnership_members
            WHERE partnership_id = id AND user_id = auth.uid()
        )
    );

-- Allow inserting partnership (creating a new one)
CREATE POLICY "Users can create partnerships"
    ON public.partnerships FOR INSERT
    WITH CHECK (true);

-- PARTNERSHIP MEMBERS
CREATE POLICY "Users can view partnership members"
    ON public.partnership_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.partnership_members pm
            WHERE pm.partnership_id = partnership_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join partnerships"
    ON public.partnership_members FOR INSERT
    WITH CHECK (true);

-- ACCOUNTS: personal accounts visible to owner only, shared visible to partnership members
CREATE POLICY "Users can view accounts"
    ON public.accounts FOR SELECT
    USING (
        (user_id = auth.uid()) OR
        (
            is_shared = TRUE AND
            EXISTS (
                SELECT 1 FROM public.partnership_members
                WHERE partnership_id = accounts.partnership_id AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert their own accounts"
    ON public.accounts FOR INSERT
    WITH CHECK (
        (user_id = auth.uid() AND is_shared = FALSE) OR
        (
            is_shared = TRUE AND
            EXISTS (
                SELECT 1 FROM public.partnership_members
                WHERE partnership_id = accounts.partnership_id AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own accounts"
    ON public.accounts FOR UPDATE
    USING (
        (user_id = auth.uid() AND is_shared = FALSE) OR
        (
            is_shared = TRUE AND
            EXISTS (
                SELECT 1 FROM public.partnership_members
                WHERE partnership_id = accounts.partnership_id AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete their own accounts"
    ON public.accounts FOR DELETE
    USING (
        (user_id = auth.uid() AND is_shared = FALSE) OR
        (
            is_shared = TRUE AND
            EXISTS (
                SELECT 1 FROM public.partnership_members
                WHERE partnership_id = accounts.partnership_id AND user_id = auth.uid()
            )
        )
    );

-- CATEGORIES
CREATE POLICY "Users can view categories"
    ON public.categories FOR SELECT
    USING (
        (user_id = auth.uid()) OR
        (
            is_shared = TRUE AND
            EXISTS (
                SELECT 1 FROM public.partnership_members
                WHERE partnership_id = categories.partnership_id AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert categories"
    ON public.categories FOR INSERT
    WITH CHECK (
        (user_id = auth.uid() AND is_shared = FALSE) OR
        (
            is_shared = TRUE AND
            EXISTS (
                SELECT 1 FROM public.partnership_members
                WHERE partnership_id = categories.partnership_id AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own categories"
    ON public.categories FOR UPDATE
    USING (
        (user_id = auth.uid()) OR
        (
            is_shared = TRUE AND
            EXISTS (
                SELECT 1 FROM public.partnership_members
                WHERE partnership_id = categories.partnership_id AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete their own categories"
    ON public.categories FOR DELETE
    USING (
        (user_id = auth.uid()) OR
        (
            is_shared = TRUE AND
            EXISTS (
                SELECT 1 FROM public.partnership_members
                WHERE partnership_id = categories.partnership_id AND user_id = auth.uid()
            )
        )
    );

-- TRANSACTIONS
CREATE POLICY "Users can view transactions"
    ON public.transactions FOR SELECT
    USING (
        (user_id = auth.uid()) OR
        (
            EXISTS (
                SELECT 1 FROM public.accounts a
                JOIN public.partnership_members pm ON a.partnership_id = pm.partnership_id
                WHERE a.id = transactions.account_id AND pm.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (
        (user_id = auth.uid()) OR
        (
            EXISTS (
                SELECT 1 FROM public.accounts a
                JOIN public.partnership_members pm ON a.partnership_id = pm.partnership_id
                WHERE a.id = transactions.account_id AND pm.user_id = auth.uid()
            )
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
            LEFT JOIN public.partnership_members pm ON a.partnership_id = pm.partnership_id
            WHERE t.id = transaction_splits.transaction_id
            AND (t.user_id = auth.uid() OR pm.user_id = auth.uid())
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
    USING (
        EXISTS (
            SELECT 1 FROM public.partnership_members
            WHERE partnership_id = subscriptions.partnership_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert subscriptions"
    ON public.subscriptions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.partnership_members
            WHERE partnership_id = subscriptions.partnership_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update subscriptions"
    ON public.subscriptions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.partnership_members
            WHERE partnership_id = subscriptions.partnership_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete subscriptions"
    ON public.subscriptions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.partnership_members
            WHERE partnership_id = subscriptions.partnership_id AND user_id = auth.uid()
        )
    );

-- SUBSCRIPTION SPLITS
CREATE POLICY "Users can view subscription splits"
    ON public.subscription_splits FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.subscriptions s
            JOIN public.partnership_members pm ON s.partnership_id = pm.partnership_id
            WHERE s.id = subscription_splits.subscription_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage subscription splits"
    ON public.subscription_splits FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.subscriptions s
            JOIN public.partnership_members pm ON s.partnership_id = pm.partnership_id
            WHERE s.id = subscription_splits.subscription_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update subscription splits"
    ON public.subscription_splits FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.subscriptions s
            JOIN public.partnership_members pm ON s.partnership_id = pm.partnership_id
            WHERE s.id = subscription_splits.subscription_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete subscription splits"
    ON public.subscription_splits FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.subscriptions s
            JOIN public.partnership_members pm ON s.partnership_id = pm.partnership_id
            WHERE s.id = subscription_splits.subscription_id AND pm.user_id = auth.uid()
        )
    );

-- GOALS
CREATE POLICY "Users can view goals"
    ON public.goals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.partnership_members
            WHERE partnership_id = goals.partnership_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert goals"
    ON public.goals FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.partnership_members
            WHERE partnership_id = goals.partnership_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update goals"
    ON public.goals FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.partnership_members
            WHERE partnership_id = goals.partnership_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete goals"
    ON public.goals FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.partnership_members
            WHERE partnership_id = goals.partnership_id AND user_id = auth.uid()
        )
    );

-- GOAL CONTRIBUTIONS
CREATE POLICY "Users can view goal contributions"
    ON public.goal_contributions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.goals g
            JOIN public.partnership_members pm ON g.partnership_id = pm.partnership_id
            WHERE g.id = goal_contributions.goal_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert goal contributions"
    ON public.goal_contributions FOR INSERT
    WITH CHECK (
        (user_id = auth.uid()) OR
        (
            EXISTS (
                SELECT 1 FROM public.goals g
                JOIN public.partnership_members pm ON g.partnership_id = pm.partnership_id
                WHERE g.id = goal_contributions.goal_id AND pm.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete own contributions"
    ON public.goal_contributions FOR DELETE
    USING (user_id = auth.uid());

-- BUDGETS
CREATE POLICY "Users can view budgets"
    ON public.budgets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.partnership_members
            WHERE partnership_id = budgets.partnership_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert budgets"
    ON public.budgets FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.partnership_members
            WHERE partnership_id = budgets.partnership_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update budgets"
    ON public.budgets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.partnership_members
            WHERE partnership_id = budgets.partnership_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete budgets"
    ON public.budgets FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.partnership_members
            WHERE partnership_id = budgets.partnership_id AND user_id = auth.uid()
        )
    );

-- ============ TRIGGERS ============

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_partnership_updated
    BEFORE UPDATE ON public.partnerships
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_account_updated
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_transaction_updated
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_subscription_updated
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_goal_updated
    BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_budget_updated
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ SEED DEFAULT CATEGORIES ============
-- These will be created per-partnership when a partnership is formed,
-- but we provide a function to seed them.

CREATE OR REPLACE FUNCTION public.seed_default_categories(target_partnership_id UUID)
RETURNS void
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.categories (partnership_id, name, icon, color, type, is_shared)
    VALUES
        (target_partnership_id, 'Housing', 'home', '#4F46E5', 'expense', TRUE),
        (target_partnership_id, 'Utilities', 'zap', '#F59E0B', 'expense', TRUE),
        (target_partnership_id, 'Groceries', 'shopping-cart', '#10B981', 'expense', TRUE),
        (target_partnership_id, 'Dining Out', 'utensils', '#EF4444', 'expense', TRUE),
        (target_partnership_id, 'Transportation', 'car', '#8B5CF6', 'expense', TRUE),
        (target_partnership_id, 'Entertainment', 'film', '#EC4899', 'expense', TRUE),
        (target_partnership_id, 'Subscriptions', 'repeat', '#06B6D4', 'expense', TRUE),
        (target_partnership_id, 'Shopping', 'shopping-bag', '#F97316', 'expense', TRUE),
        (target_partnership_id, 'Healthcare', 'heart-pulse', '#BE185D', 'expense', TRUE),
        (target_partnership_id, 'Travel', 'plane', '#0EA5E9', 'expense', TRUE),
        (target_partnership_id, 'Salary', 'briefcase', '#10B981', 'income', TRUE),
        (target_partnership_id, 'Freelance', 'laptop', '#3B82F6', 'income', TRUE),
        (target_partnership_id, 'Other Income', 'plus-circle', '#6B7280', 'income', TRUE),
        (target_partnership_id, 'Other Expense', 'more-horizontal', '#6B7280', 'expense', TRUE)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;
