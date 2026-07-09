"use client"

import { useState } from "react"
import { createBudget } from "@/lib/actions/budgets"
import { useRouter } from "next/navigation"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

interface CategoryOption {
  id: string
  name: string
  type: string
}

interface BudgetFormProps {
  hasPartner: boolean
  categories?: CategoryOption[]
}

export function BudgetForm({ hasPartner, categories = [] }: BudgetFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [isShared, setIsShared] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError("")
    try {
      const fd = new FormData(e.currentTarget)
      if (isShared) fd.set("is_shared", "true")
      await createBudget(fd)
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
          Create Budget
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Budget</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="category_id" className="text-sm font-medium">Category</label>
            <select id="category_id" name="category_id" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
              <option value="">Select category</option>
          {categories.filter(c => c.type === "expense").map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">Amount (¥)</label>
              <input id="amount" name="amount" type="number" step="0.01" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <label htmlFor="period" className="text-sm font-medium">Period</label>
              <select id="period" name="period" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="start_date" className="text-sm font-medium">Start Date</label>
            <input id="start_date" name="start_date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          </div>
          {hasPartner && (
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={isShared} onChange={e => setIsShared(e.target.checked)} className="rounded" />
              Shared budget (visible to partner)
            </label>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={pending} className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {pending ? "Creating..." : "Create Budget"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}


