"use client"

import { useState } from "react"
import { createTransaction } from "@/lib/actions/transactions"
import { useRouter } from "next/navigation"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

export function TransactionForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError("")
    try {
      const fd = new FormData(e.currentTarget)
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
              <select id="type" name="type" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <input id="description" name="description" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="e.g. Groceries" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">Date</label>
              <input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <label htmlFor="category_id" className="text-sm font-medium">Category</label>
              <select id="category_id" name="category_id" className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="">None</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="account_id" className="text-sm font-medium">Account</label>
            <select id="account_id" name="account_id" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
              <option value="">Select account</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={pending} className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {pending ? "Creating..." : "Create Transaction"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
