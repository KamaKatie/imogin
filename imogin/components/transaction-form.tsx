"use client"

import { useState } from "react"
import { createTransaction } from "@/lib/actions/transactions"
import { useRouter } from "next/navigation"
import { getCategoryIcon } from "@/lib/icons"
import { DropdownSelect } from "@/components/ui/dropdown-select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

interface AccountOption {
  id: string
  name: string
  icon: string | null
  is_shared: boolean
  partnership_id: string | null
  user_id: string | null
}

interface CategoryOption {
  id: string
  name: string
  type: string
  icon: string | null
  color: string | null
}

interface ProfileInfo {
  name: string | null
  email: string
  avatar_url: string | null
}

interface TransactionFormProps {
  accounts: AccountOption[]
  categories: CategoryOption[]
  partnershipId: string | null
  partnerUserId: string | null
  userId: string
  userProfile: ProfileInfo | null
  partnerProfile: ProfileInfo | null
}

function getAvatarUrl(profile: ProfileInfo | null): string | null {
  if (profile?.avatar_url) return profile.avatar_url
  return null
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

export function TransactionForm({ accounts, categories, partnershipId, partnerUserId, userId, userProfile, partnerProfile }: TransactionFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [type, setType] = useState("expense")
  const [selectedAccount, setSelectedAccount] = useState("")
  const [toAccountId, setToAccountId] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [forSelection, setForSelection] = useState<"me" | "partner" | "both">("me")

  const isTransfer = type === "transfer"

  const filteredCategories = categories.filter(c => c.type === type)
  const availableToAccounts = accounts.filter(a => a.id !== selectedAccount)
  const partnerName = partnerProfile?.name || partnerProfile?.email || "Partner"
  const userName = userProfile?.name || userProfile?.email || "Me"
  const userAvatarUrl = getAvatarUrl(userProfile)
  const partnerAvatarUrl = partnerUserId ? getAvatarUrl(partnerProfile) : null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError("")
    try {
      const fd = new FormData(e.currentTarget)
      fd.set("for_selection", forSelection)
      if (partnerUserId) fd.set("partner_user_id", partnerUserId)
      await createTransaction(fd)
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    }
    setPending(false)
  }

  const toggleFor = (target: "me" | "partner") => {
    if (forSelection === "both") {
      setForSelection(target === "me" ? "partner" : "me")
    } else if (forSelection === target) {
      return
    } else {
      setForSelection("both")
    }
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
              <label htmlFor="amount" className="text-sm font-medium">Amount</label>
              <input id="amount" name="amount" type="number" step="0.01" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">Type</label>
              <select id="type" name="type" required value={type} onChange={e => { setType(e.target.value); setToAccountId("") }} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
          </div>

          {isTransfer ? (
            <div className="grid grid-cols-2 gap-4">
              <DropdownSelect
                items={accounts}
                value={selectedAccount}
                onChange={v => setSelectedAccount(v)}
                label="From Account"
                placeholder="Select source"
                renderItem={a => (
                  <>
                    {a.icon && <img src={a.icon} alt="" className="w-5 h-5 rounded object-contain shrink-0" />}
                    <span>{a.name}{a.is_shared ? " (Shared)" : ""}</span>
                  </>
                )}
              />
              <DropdownSelect
                items={availableToAccounts}
                value={toAccountId}
                onChange={v => setToAccountId(v)}
                label="To Account"
                placeholder="Select destination"
                renderItem={a => (
                  <>
                    {a.icon && <img src={a.icon} alt="" className="w-5 h-5 rounded object-contain shrink-0" />}
                    <span>{a.name}{a.is_shared ? " (Shared)" : ""}</span>
                  </>
                )}
              />
              <input type="hidden" name="account_id" value={selectedAccount} />
              <input type="hidden" name="to_account_id" value={toAccountId} />
            </div>
          ) : (
            <>
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
              <input type="hidden" name="account_id" value={selectedAccount} />
              <input type="hidden" name="category_id" value={selectedCategory} />
            </>
          )}

          {partnershipId && !isTransfer && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Paid for</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleFor("me")}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${forSelection === "me" || forSelection === "both" ? "bg-accent ring-2 ring-primary" : "hover:bg-accent/50"}`}
                >
                  <AvatarCircle url={userAvatarUrl} name={userName} email={userProfile?.email} size={24} />
                  <span className="text-sm font-medium">{userName}</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleFor("partner")}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${forSelection === "partner" || forSelection === "both" ? "bg-accent ring-2 ring-primary" : "hover:bg-accent/50"}`}
                >
                  <AvatarCircle url={partnerAvatarUrl} name={partnerName} email={partnerProfile?.email} size={24} />
                  <span className="text-sm font-medium">{partnerName}</span>
                </button>

              </div>
            </div>
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

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={pending} className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {pending ? "Creating..." : "Create Transaction"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
