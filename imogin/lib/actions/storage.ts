"use server"

import { createClient } from "@/lib/supabase/server"

const BUCKET = "bill_icons"

export async function uploadBillIcon(billId: string, formData: FormData) {
  const supabase = await createClient()

  const file = formData.get("icon") as File
  if (!file || file.size === 0) return null

  const ext = file.name.split(".").pop() || "png"
  const filePath = `${billId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    contentType: file.type,
    upsert: true,
  })

  if (error) throw new Error(error.message)

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(filePath)

  return publicUrl.publicUrl
}

export async function deleteBillIcon(iconUrl: string) {
  const supabase = await createClient()

  const path = iconUrl.split("/").pop()
  if (!path) return

  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new Error(error.message)
}
