"use client"

import { useState } from "react"
import { createGoal } from "@/lib/actions/goals"
import { useRouter } from "next/navigation"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

interface GoalFormProps {
  hasPartner: boolean
}

export function GoalForm({ hasPartner }: GoalFormProps) {
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
      await createGoal(fd)
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
          Create Goal
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Goal Name</label>
            <input id="name" name="name" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="e.g. Vacation Fund" />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <input id="description" name="description" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="target_amount" className="text-sm font-medium">Target (¥)</label>
              <input id="target_amount" name="target_amount" type="number" step="0.01" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <label htmlFor="target_date" className="text-sm font-medium">Target Date</label>
              <input id="target_date" name="target_date" type="date" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="icon" className="text-sm font-medium">Icon</label>
              <select id="icon" name="icon" className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="🎯">🎯 Target</option>
                <option value="💰">💰 Money</option>
                <option value="🏠">🏠 House</option>
                <option value="✈️">✈️ Travel</option>
                <option value="🚗">🚗 Car</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="color" className="text-sm font-medium">Color</label>
              <input id="color" name="color" type="color" defaultValue="#10B981" className="w-full h-10 rounded-lg border bg-background px-1 py-1" />
            </div>
          </div>
          {hasPartner && (
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={isShared} onChange={e => setIsShared(e.target.checked)} className="rounded" />
              Shared goal (visible to partner)
            </label>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={pending} className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {pending ? "Creating..." : "Create Goal"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
