"use client"

import { useState, useRef } from "react"
import { createAccount, updateAccount, uploadAccountIcon, deleteAccountIcon } from "@/lib/actions/accounts"
import { useRouter } from "next/navigation"
import { getAccountIcon } from "@/lib/icons"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { DialogFooter } from "@/components/ui/dialog-footer"
import type { Account } from "@/lib/supabase/types-extension"

const STORAGE_BASE = "https://jjojwvdtwtodapqszizc.supabase.co/storage/v1/object/public/account_icons/"

function isStorageUrl(url: string): boolean {
  return url.startsWith(STORAGE_BASE)
}

interface AccountFormProps {
  hasPartner: boolean
  account?: Account
  trigger?: React.ReactNode
}

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit_card", label: "Credit Card" },
  { value: "cash", label: "Cash" },
  { value: "investment", label: "Investment" },
  { value: "other", label: "Other" },
]

export function AccountForm({ hasPartner, account, trigger }: AccountFormProps) {
  const router = useRouter()
  const isEdit = !!account
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [iconUrl, setIconUrl] = useState(account?.icon || "")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const url = await uploadAccountIcon(fd)

      if (isStorageUrl(iconUrl)) {
        deleteAccountIcon(iconUrl).catch(() => {})
      }

      setIconUrl(url)
    } catch (err) {
      setError((err as Error).message)
    }
    setUploading(false)
  }

  const handleRemove = () => {
    if (isStorageUrl(iconUrl)) {
      deleteAccountIcon(iconUrl).catch(() => {})
    }
    setIconUrl("")
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError("")
    try {
      const fd = new FormData(e.currentTarget)
      fd.set("icon", iconUrl)

      if (isEdit) {
        await updateAccount(account.id, fd)
      } else {
        await createAccount(fd)
      }
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
        {trigger || (
          <button className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
            Add Account
          </button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Account" : "New Account"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Account Name</label>
            <input
              id="name" name="name" required
              defaultValue={account?.name || ""}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="e.g. Joint Checking"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">Type</label>
              <select
                id="type" name="type" required
                defaultValue={account?.type || "checking"}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="balance" className="text-sm font-medium">{isEdit ? "Current Balance" : "Balance"}</label>
              <input
                id="balance" name="balance" type="number" step="0.01"
                defaultValue={account?.balance ?? 0}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Account Icon</label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border bg-background flex items-center justify-center shrink-0">
                {getAccountIcon(iconUrl || null, account?.type || "checking", 22)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {uploading ? "Uploading..." : (iconUrl ? "Change" : "Upload logo")}
                </button>
                {iconUrl && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="text-sm text-red-500 hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            <input type="hidden" name="icon" value={iconUrl} />
          </div>

          {hasPartner && !isEdit && (
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="is_shared" value="true" className="rounded" />
              Shared account (visible to partner)
            </label>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <DialogFooter>
            <button
              type="submit"
              disabled={pending || uploading}
              className="flex-1 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save Changes" : "Create Account")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
