import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BillCalendar } from "@/components/bill-calendar"

export default async function BillCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: membership } = await supabase
    .from("partnership_members")
    .select("partnership_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!membership) redirect("/bills")

  const partnershipId = membership.partnership_id

  const { data: bills } = await supabase
    .from("bills")
    .select(`
      *,
      categories(name, color)
    `)
    .eq("partnership_id", partnershipId)
    .eq("active", true)
    .order("next_billing_date")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">View upcoming bills on a calendar</p>
        <Link
          href="/bills"
          className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          List View
        </Link>
      </div>

      <BillCalendar bills={bills || []} />
    </div>
  )
}
