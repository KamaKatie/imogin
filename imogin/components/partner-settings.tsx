"use client"

import { useState } from "react"
import { createPartnership, leavePartnership, joinPartnership, updatePartnershipName, regenerateShareCode } from "@/lib/actions/partner"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface PartnerSettingsProps {
  partnership: {
    id: string
    name: string | null
    shareCode: string | null
    shareCodeExpiresAt: string | null
  } | null
  members: Array<{ id: string; name: string | null; email: string }>
}

export function PartnerSettings({ partnership, members }: PartnerSettingsProps) {
  const router = useRouter()
  const [code, setCode] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [nameInput, setNameInput] = useState(partnership?.name || "")
  const [savingName, setSavingName] = useState(false)

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

  const handleSaveName = async () => {
    setSavingName(true)
    try {
      const fd = new FormData()
      fd.set("name", nameInput)
      await updatePartnershipName(fd)
      router.refresh()
    } catch (e) {
      console.error(e)
    }
    setSavingName(false)
  }

  const handleRegenerateCode = async () => {
    try {
      const newCode = await regenerateShareCode()
      setCode(newCode)
      router.refresh()
    } catch (e) {
      console.error(e)
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
    <div className="space-y-6">
      {/* Group Name */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-3">Group Name</h2>
        <div className="flex items-center gap-3">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="Enter group name"
          />
          <button
            onClick={handleSaveName}
            disabled={savingName || nameInput === (partnership.name || "")}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {savingName ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-3">Members</h2>
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {(m.name || m.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{m.name || "Unnamed"}</p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share Code */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-3">Invite</h2>
        <p className="text-sm text-muted-foreground mb-3">Share this code with others to join your partnership</p>
        {displayCode ? (
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-3xl font-bold tracking-widest">{displayCode}</p>
            {partnership.shareCodeExpiresAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Expires {new Date(partnership.shareCodeExpiresAt).toLocaleString()}
              </p>
            )}
            <div className="flex justify-center gap-3 mt-3">
              <button
                onClick={() => navigator.clipboard.writeText(displayCode!)}
                className="text-sm text-primary hover:underline"
              >
                Copy to clipboard
              </button>
              <button
                onClick={handleRegenerateCode}
                className="text-sm text-primary hover:underline"
              >
                Generate new code
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleRegenerateCode}
            className="rounded-lg bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90"
          >
            Generate Share Code
          </button>
        )}
      </div>

      {/* Leave */}
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
