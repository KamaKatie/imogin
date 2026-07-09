"use client"

import { useActionState } from "react"
import { updateProfile } from "@/lib/actions/profile"
import type { Tables } from "@/lib/supabase/types"

interface ProfileFormProps {
  profile: Tables<"profiles"> | null
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      try {
        await updateProfile({
          name: formData.get("name") as string || null,
        })
        return { success: true }
      } catch (e) {
        return { message: (e as Error).message }
      }
    },
    undefined
  )

  return (
    <form action={formAction} className="space-y-6 max-w-lg">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">Name</label>
        <input
          id="name"
          name="name"
          defaultValue={profile?.name || ""}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input
          id="email"
          value={profile?.email || ""}
          disabled
          className="w-full rounded-lg border bg-muted px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
      </div>

      {state && typeof state === "object" && "success" in state && (state as { success: boolean }).success && (
        <p className="text-sm text-green-600">Profile updated!</p>
      )}
      {state && typeof state === "object" && "message" in state && (
        <p className="text-sm text-red-500">{(state as { message: string }).message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save Changes"}
      </button>
    </form>
  )
}
