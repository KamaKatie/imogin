"use server";

import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesUpdate } from "@/lib/supabase/types";
import { redirect } from "next/navigation";
import { getProfileById } from "@/lib/queries/profiles";

export async function getProfile(): Promise<Tables<"profiles"> | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return await getProfileById(supabase, user.id);
}

export async function updateProfile(values: TablesUpdate<"profiles">) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", user.id);

  if (error) throw new Error(error.message);
}

const PROFILE_STORAGE_BASE = "https://jjojwvdtwtodapqszizc.supabase.co/storage/v1/object/public/profile_images/"

export async function uploadProfileIcon(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const file = formData.get("file") as File
  if (!file) throw new Error("No file provided")
  if (!file.type.startsWith("image/")) throw new Error("File must be an image")
  if (file.size > 2 * 1024 * 1024) throw new Error("File must be less than 2MB")

  const ext = file.name.split(".").pop() || "png"
  const fileName = `${user.id}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from("profile_images")
    .upload(fileName, file, { contentType: file.type })

  if (error) throw new Error(error.message)

  return PROFILE_STORAGE_BASE + fileName
}

export async function deleteProfileIcon(avatarUrl: string) {
  const path = avatarUrl.replace(PROFILE_STORAGE_BASE, "")
  if (!path) return { success: true }
  const supabase = await createClient()
  await supabase.storage.from("profile_images").remove([path])
  return { success: true }
}
