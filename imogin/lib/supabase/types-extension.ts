export type AccountType = 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'other'
export type SplitMethod = 'equal' | 'custom' | 'covered'
export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type GoalStatus = 'active' | 'completed' | 'cancelled'
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly'
export type TransactionType = 'income' | 'expense' | 'transfer'
export type CategoryType = 'income' | 'expense'

export interface Account {
  id: string
  user_id: string | null
  partnership_id: string | null
  name: string
  type: AccountType
  balance: number
  currency: string
  is_shared: boolean
  color: string | null
  icon: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  partnership_id: string
  name: string
  icon: string | null
  color: string | null
  type: CategoryType
  created_at: string
}

export interface Transaction {
  id: string
  account_id: string
  user_id: string
  amount: number
  description: string | null
  category_id: string | null
  date: string
  type: TransactionType
  is_split: boolean
  is_recurring: boolean
  split_method: SplitMethod | null
  notes: string | null
  receipt_url: string | null
  bill_id: string | null
  created_at: string
  updated_at: string
}

export interface TransactionSplit {
  id: string
  transaction_id: string
  user_id: string
  amount: number
  percentage: number | null
  settled: boolean
  settled_at: string | null
  created_at: string
}

export interface Bill {
  id: string
  partnership_id: string
  name: string
  amount: number
  currency: string
  billing_cycle: BillingCycle
  next_billing_date: string
  due_day: number | null
  category_id: string | null
  payment_account_id: string | null
  split_method: SplitMethod
  split_payer_user_id: string | null
  icon_url: string | null
  url: string | null
  created_by: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface BillSplit {
  id: string
  bill_id: string
  user_id: string
  percentage: number
}

export interface Goal {
  id: string
  partnership_id: string | null
  user_id: string | null
  name: string
  description: string | null
  target_amount: number
  current_amount: number
  target_date: string | null
  category_id: string | null
  account_id: string | null
  currency: string
  icon: string | null
  color: string | null
  status: GoalStatus
  created_at: string
  updated_at: string
}

export interface GoalContribution {
  id: string
  goal_id: string
  user_id: string
  amount: number
  note: string | null
  created_at: string
}

export interface Budget {
  id: string
  partnership_id: string | null
  user_id: string | null
  category_id: string
  amount: number
  currency: string
  period: BudgetPeriod
  start_date: string
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface Partnership {
  id: string
  user1_id: string
  user2_id: string | null
  share_code: string | null
  share_code_expires_at: string | null
  created_at: string
  updated_at: string
}
