import { redirect } from "next/navigation"

export default function OldCategoriesRedirect() {
  redirect("/categories")
}
