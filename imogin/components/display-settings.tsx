"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/components/app-context-provider"
import { updateProfile } from "@/lib/actions/profile"
import { cn } from "@/lib/utils"

export function DisplaySettings() {
  const { preferences } = useAppContext()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const currentView = (preferences.transactionView as string) || "table"

  const handleViewChange = async (view: string) => {
    setSaving(true)
    setSaved(false)
    try {
      await updateProfile({
        preferences: { ...preferences, transactionView: view },
      })
      setSaved(true)
      router.refresh()
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  const options = [
    { value: "table", label: "Table" },
    { value: "cards", label: "Cards" },
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Transaction View</label>
        <p className="text-xs text-muted-foreground">Choose how transactions are displayed on the Transactions page.</p>
        <div className="flex gap-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={saving}
              onClick={() => handleViewChange(opt.value)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg border transition-colors",
                currentView === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-accent",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {saved && <p className="text-sm text-green-600">Preference saved!</p>}
    </div>
  )
}
