-- Add transfer_group_id to support linked transfer transaction pairs

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transfer_group_id UUID;

CREATE INDEX IF NOT EXISTS idx_transactions_transfer_group ON public.transactions(transfer_group_id);
