"use client"

import { useState } from "react"
import { updateTransaction } from "@/lib/actions/transactions"
import { useRouter } from "next/navigation"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

interface TransactionEditDialogProps {
  transaction: {
    id: string
    description: string | null
    amount: number
    category_id: string | null
    date: string
    notes: string | null
  }
  categories: Array<{ id: string; name: string; type: string }>
}

export function TransactionEditDialog({ transaction, categories }: TransactionEditDialogProps) {
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
      await updateTransaction(transaction.id, fd)
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
        <button className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <input id="description" name="description" defaultValue={transaction.description || ""} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">Amount (\)</label>
              <input id="amount" name="amount" type="number" step="0.01" defaultValue={Math.abs(transaction.amount)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">Date</label>
              <input id="date" name="date" type="date" defaultValue={transaction.date} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="category_id" className="text-sm font-medium">Category</label>
            <select id="category_id" name="category_id" defaultValue={transaction.category_id || ""} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
              <option value="">None</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">Notes</label>
            <textarea id="notes" name="notes" defaultValue={transaction.notes || ""} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" rows={2} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={pending} className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {pending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
