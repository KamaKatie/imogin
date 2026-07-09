"use server";

import { createClient } from "@/lib/supabase/server";
import type { Profile, ProfileUpdate } from "@/lib/supabase/types";
import { redirect } from "next/navigation";

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function updateProfile(values: ProfileUpdate) {
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
