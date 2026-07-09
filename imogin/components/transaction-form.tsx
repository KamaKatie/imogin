"use client"

import { useState } from "react"
import { createTransaction } from "@/lib/actions/transactions"
import { useRouter } from "next/navigation"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

interface AccountOption {
  id: string
  name: string
  is_shared: boolean
  partnership_id: string | null
  user_id: string | null
}

interface CategoryOption {
  id: string
  name: string
  type: string
}

interface TransactionFormProps {
  accounts: AccountOption[]
  categories: CategoryOption[]
  partnershipId: string | null
  partnerUserId: string | null
}

export function TransactionForm({ accounts, categories, partnershipId, partnerUserId }: TransactionFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [type, setType] = useState("expense")
  const [selectedAccount, setSelectedAccount] = useState("")
  const [toAccountId, setToAccountId] = useState("")
  const [splitEnabled, setSplitEnabled] = useState(false)
  const [splitMethod, setSplitMethod] = useState<"equal" | "custom" | "covered">("equal")

  const isTransfer = type === "transfer"
  const selectedAccountObj = accounts.find(a => a.id === selectedAccount)
  const isSharedAccount = selectedAccountObj?.is_shared ?? false
  const canSplit = Boolean(partnershipId && isSharedAccount && !isTransfer)

  const filteredCategories = categories.filter(c => c.type === type)
  const availableToAccounts = accounts.filter(a => a.id !== selectedAccount)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError("")
    try {
      const fd = new FormData(e.currentTarget)
      if (partnerUserId) fd.set("partner_user_id", partnerUserId)
      await createTransaction(fd)
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    }
    setPending(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
          Add Transaction
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">Amount (¥)</label>
              <input id="amount" name="amount" type="number" step="0.01" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">Type</label>
              <select id="type" name="type" required value={type} onChange={e => { setType(e.target.value); setToAccountId(""); setSplitEnabled(false) }} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
          </div>

          {isTransfer ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="account_id" className="text-sm font-medium">From Account</label>
                <select id="account_id" name="account_id" required value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                  <option value="">Select source</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}{a.is_shared ? " (Shared)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="to_account_id" className="text-sm font-medium">To Account</label>
                <select id="to_account_id" name="to_account_id" required value={toAccountId} onChange={e => setToAccountId(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                  <option value="">Select destination</option>
                  {availableToAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}{a.is_shared ? " (Shared)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label htmlFor="account_id" className="text-sm font-medium">Account</label>
                <select id="account_id" name="account_id" required value={selectedAccount} onChange={e => { setSelectedAccount(e.target.value); setSplitEnabled(false) }} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                  <option value="">Select account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}{a.is_shared ? " (Shared)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="category_id" className="text-sm font-medium">Category</label>
                <select id="category_id" name="category_id" className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                  <option value="">None</option>
                  {filteredCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <input id="description" name="description" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder={isTransfer ? "e.g. Transfer to Savings" : "e.g. Groceries"} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">Date</label>
              <input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          {canSplit && (
            <div className="space-y-3 rounded-lg border p-4">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={splitEnabled} onChange={e => setSplitEnabled(e.target.checked)} className="rounded border-gray-300" />
                Split with partner
              </label>
              {splitEnabled && (
                <div className="space-y-3 ml-6">
                  <input type="hidden" name="partner_user_id" value={partnerUserId ?? ""} />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Split method</label>
                    <select name="split_method" value={splitMethod} onChange={e => setSplitMethod(e.target.value as "equal" | "custom" | "covered")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                      <option value="equal">Equal (50/50)</option>
                      <option value="custom">Custom percentage</option>
                      <option value="covered">One person covers</option>
                    </select>
                  </div>
                  {splitMethod === "custom" && (
                    <div className="space-y-2">
                      <label htmlFor="your_percent" className="text-sm font-medium">Your share (%)</label>
                      <input id="your_percent" name="your_percent" type="number" min="0" max="100" defaultValue={50} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                    </div>
                  )}
                  {splitMethod === "covered" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Who pays?</label>
                      <select name="payer_user_id" defaultValue={partnerUserId ?? ""} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                        <option value="">You</option>
                        <option value={partnerUserId ?? ""}>Partner</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={pending} className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {pending ? "Creating..." : "Create Transaction"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
