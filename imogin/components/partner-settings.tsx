"use client"

import { useState } from "react"
import { createPartnership, leavePartnership, joinPartnership } from "@/lib/actions/partner"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface PartnerSettingsProps {
  partnership: {
    id: string
    shareCode: string | null
    shareCodeExpiresAt: string | null
    user2Id: string | null
  } | null
  partner: { name: string | null; email: string } | null
}

export function PartnerSettings({ partnership, partner }: PartnerSettingsProps) {
  const router = useRouter()
  const [code, setCode] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    try {
      const newCode = await createPartnership()
      setCode(newCode)
      router.refresh()
    } catch (e) {
      console.error(e)
    }
    setCreating(false)
  }

  const handleLeave = async () => {
    if (confirm("Are you sure you want to leave this partnership?")) {
      await leavePartnership()
      router.refresh()
    }
  }

  if (!partnership) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center space-y-4">
        <p className="text-muted-foreground">
          Create a partnership and share the code with your partner, or join an existing one.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="rounded-lg bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Partnership"}
          </button>
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <button className="rounded-lg border px-6 py-2 text-sm font-medium hover:bg-accent">
                Join Partnership
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Partnership</DialogTitle>
              </DialogHeader>
              <JoinForm onSuccess={() => { setJoinOpen(false); router.refresh() }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  }

  const displayCode = code || partnership.shareCode

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      {partner ? (
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Your Partner</p>
          <p className="text-lg font-semibold">{partner.name || partner.email}</p>
          <p className="text-xs text-muted-foreground">{partner.email}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Partner not yet joined.</p>
          {displayCode ? (
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Share this code with your partner</p>
              <p className="text-3xl font-bold tracking-widest">{displayCode}</p>
              {partnership.shareCodeExpiresAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expires {new Date(partnership.shareCodeExpiresAt).toLocaleString()}
                </p>
              )}
              <button
                onClick={() => navigator.clipboard.writeText(displayCode!)}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Copy to clipboard
              </button>
            </div>
          ) : (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="rounded-lg bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              Generate Share Code
            </button>
          )}
        </div>
      )}
      <button onClick={handleLeave} className="text-sm text-red-500 hover:underline">
        Leave partnership
      </button>
    </div>
  )
}

function JoinForm({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    setError("")
    try {
      const fd = new FormData()
      fd.set("code", code)
      await joinPartnership(fd)
      onSuccess()
    } catch (err) {
      setError((err as Error).message)
    }
    setPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="code" className="text-sm font-medium">Share Code</label>
        <input
          id="code"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          required
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-center text-2xl tracking-[0.5em] font-bold"
          placeholder="XXXXXX"
          maxLength={6}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? "Joining..." : "Join Partnership"}
      </button>
    </form>
  )
}
