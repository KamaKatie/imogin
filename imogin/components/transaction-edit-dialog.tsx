"use client"

import { useState } from "react"
import { updateTransaction, settleSplit } from "@/lib/actions/transactions"
import { useRouter } from "next/navigation"
import { getCategoryIcon } from "@/lib/icons"
import { DropdownSelect } from "@/components/ui/dropdown-select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { DialogFooter } from "@/components/ui/dialog-footer"

interface TransactionSplit {
  id: string
  user_id: string
  amount: number
  percentage: number
  settled: boolean
  settled_at: string | null
  profiles?: { name: string | null; email: string; avatar_url: string | null } | null
}

interface TransactionEditDialogProps {
  transaction: {
    id: string
    description: string | null
    amount: number
    category_id: string | null
    date: string
    type?: string
    account_id: string
    is_split?: boolean
  }
  accounts: Array<{ id: string; name: string; icon: string | null; is_shared: boolean }>
  categories: Array<{ id: string; name: string; type: string; icon?: string | null; color?: string | null }>
  splits?: TransactionSplit[]
  partnerUserId?: string | null
  partnershipId?: string | null
  forType?: "me" | "partner" | "both"
  // userId is not used in the component body
  userProfile?: { name: string | null; email: string; avatar_url: string | null } | null
  partnerProfile?: { name: string | null; email: string; avatar_url: string | null } | null
}

function AvatarCircle({ url, name, email, size = 32 }: { url?: string | null; name?: string | null; email?: string; size?: number }) {
  const initials = (name || email || "?").charAt(0).toUpperCase()
  return (
    <div className="rounded-full overflow-hidden shrink-0" style={{ width: size, height: size }}>
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted text-xs font-medium text-muted-foreground">
          {initials}
        </div>
      )}
    </div>
  )
}

export function TransactionEditDialog({
  transaction,
  accounts,
  categories,
  splits,
  partnerUserId,
  partnershipId,
  forType: initialForType,
  userProfile,
  partnerProfile,
}: TransactionEditDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [selectedAccount, setSelectedAccount] = useState(transaction.account_id)
  const [selectedCategory, setSelectedCategory] = useState(transaction.category_id || "")
  const [forSelection, setForSelection] = useState<"me" | "partner" | "both">(initialForType || "me")
  const isSplit = splits && splits.length > 0
  const userName = userProfile?.name || userProfile?.email || "Me"
  const partnerName = partnerProfile?.name || partnerProfile?.email || "Partner"

  const toggleFor = (target: "me" | "partner") => {
    if (forSelection === "both") {
      setForSelection(target === "me" ? "partner" : "me")
    } else if (forSelection === target) {
      return
    } else {
      setForSelection("both")
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError("")
    try {
      const fd = new FormData(e.currentTarget)
      fd.set("account_id", selectedAccount)
      fd.set("category_id", selectedCategory)
      fd.set("for_selection", forSelection)
      if (partnerUserId) fd.set("partner_user_id", partnerUserId)
      await updateTransaction(transaction.id, fd)
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    }
    setPending(false)
  }

  const handleSettle = async (splitId: string) => {
    try {
      await settleSplit(splitId)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const filteredCategories = categories.filter(c => c.type === transaction.type || !c.type)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">Amount</label>
              <input id="amount" name="amount" type="number" step="0.01" defaultValue={Math.abs(transaction.amount)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <div className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground capitalize">{transaction.type}</div>
            </div>
          </div>

          <DropdownSelect
            items={accounts}
            value={selectedAccount}
            onChange={v => setSelectedAccount(v)}
            label="Account"
            placeholder="Select account"
            renderItem={a => (
              <>
                {a.icon && <img src={a.icon} alt="" className="w-5 h-5 rounded object-contain shrink-0" />}
                <span>{a.name}{a.is_shared ? " (Shared)" : ""}</span>
              </>
            )}
          />

          <DropdownSelect
            items={filteredCategories}
            value={selectedCategory}
            onChange={v => setSelectedCategory(v)}
            label="Category"
            placeholder="None"
            renderItem={c => (
              <>
                {c.icon && getCategoryIcon(c.icon, 14)}
                <span>{c.name}</span>
              </>
            )}
          />

          {partnershipId && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Paid for</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleFor("me")}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${forSelection === "me" || forSelection === "both" ? "bg-accent ring-2 ring-primary" : "hover:bg-accent/50"}`}
                >
                  <AvatarCircle url={userProfile?.avatar_url} name={userName} email={userProfile?.email} size={24} />
                  <span className="text-sm font-medium">{userName}</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleFor("partner")}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${forSelection === "partner" || forSelection === "both" ? "bg-accent ring-2 ring-primary" : "hover:bg-accent/50"}`}
                >
                  <AvatarCircle url={partnerProfile?.avatar_url} name={partnerName} email={partnerProfile?.email} size={24} />
                  <span className="text-sm font-medium">{partnerName}</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <input id="description" name="description" defaultValue={transaction.description || ""} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">Date</label>
              <input id="date" name="date" type="date" defaultValue={transaction.date} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          {isSplit && (
            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="text-sm font-medium">Split Breakdown</h4>
              {splits.map((s) => {
                const isPartner = s.user_id === partnerUserId
                const sName = isPartner ? partnerName : userName
                return (
                  <div key={s.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm">{sName}</span>
                    <input type="hidden" name="split_id" value={s.id} />
                    <input
                      name="split_amount"
                      type="number"
                      step="0.01"
                      defaultValue={s.amount}
                      disabled={s.settled}
                      className="w-28 rounded-lg border bg-background px-2 py-1 text-sm text-right"
                    />
                    <span className="text-xs text-muted-foreground w-10 text-right">({s.percentage}%)</span>
                    {s.settled ? (
                      <span className="text-xs text-green-600 font-medium w-14 text-right">Settled</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSettle(s.id)}
                        className="text-xs text-primary hover:underline w-14 text-right"
                      >
                        Settle
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {pending ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
