"use client"

import { useState } from "react"
import { ColorSwatch } from "@/components/color-swatch"
import { createAccount } from "@/lib/actions/accounts"
import { useRouter } from "next/navigation"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

interface AccountFormProps {
  hasPartner: boolean
}

export function AccountForm({ hasPartner }: AccountFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [selectedColor, setSelectedColor] = useState("#4F46E5")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError("")
    try {
      const fd = new FormData(e.currentTarget)
      await createAccount(fd)
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
          Add Account
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Account Name</label>
            <input id="name" name="name" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="e.g. Joint Checking" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">Type</label>
              <select id="type" name="type" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit_card">Credit Card</option>
                <option value="cash">Cash</option>
                <option value="investment">Investment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="balance" className="text-sm font-medium">Balance</label>
              <input id="balance" name="balance" type="number" step="0.01" defaultValue={0} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <ColorSwatch value={selectedColor} onChange={setSelectedColor} />
              <input type="hidden" name="color" value={selectedColor} />
            </div>
            <div className="space-y-2">
              <label htmlFor="icon" className="text-sm font-medium">Icon</label>
              <select id="icon" name="icon" className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="wallet">Wallet</option>
                <option value="banknote">Bank</option>
                <option value="credit-card">Credit Card</option>
                <option value="landmark">Piggy Bank</option>
                <option value="coins">Coins</option>
              </select>
            </div>
          </div>
          {hasPartner && (
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="is_shared" value="true" className="rounded" />
              Shared account (visible to partner)
            </label>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={pending} className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {pending ? "Creating..." : "Create Account"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
