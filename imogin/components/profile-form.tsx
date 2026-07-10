"use client"

import { useActionState, useRef, useState } from "react"
import { updateProfile, uploadProfileIcon, deleteProfileIcon } from "@/lib/actions/profile"
import type { Tables } from "@/lib/supabase/types"

interface ProfileFormProps {
  profile: Tables<"profiles"> | null
}

const initials = (name: string | null | undefined) =>
  (name || "?").charAt(0).toUpperCase()

export function ProfileForm({ profile }: ProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "")
  const [uploading, setUploading] = useState(false)

  const [state, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      try {
        await updateProfile({
          name: formData.get("name") as string || null,
          avatar_url: formData.get("avatar_url") as string || null,
        })
        return { success: true }
      } catch (e) {
        return { message: (e as Error).message }
      }
    },
    undefined
  )

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      if (avatarUrl) {
        await deleteProfileIcon(avatarUrl)
      }
      const formData = new FormData()
      formData.set("file", file)
      const url = await uploadProfileIcon(formData)
      setAvatarUrl(url)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (avatarUrl) {
      await deleteProfileIcon(avatarUrl)
    }
    setAvatarUrl("")
  }

  return (
    <form action={formAction} className="space-y-6 max-w-lg">
      <div className="space-y-4">
        <label className="text-sm font-medium">Profile Photo</label>
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-20 h-20 rounded-full object-cover border"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-medium shrink-0">
              {initials(profile?.name || profile?.email)}
            </div>
          )}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Photo"}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemove}
                className="block text-sm text-red-500 hover:underline"
              >
                Remove
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">PNG, JPG or WebP. Max 2MB.</p>
          </div>
        </div>
      </div>

      <input type="hidden" name="avatar_url" value={avatarUrl} />

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
