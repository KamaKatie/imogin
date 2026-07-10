import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BillCalendar } from "@/components/bill-calendar"

export default async function BillCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: partnership } = await supabase
    .from("partnerships")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single()

  if (!partnership) redirect("/bills")

  const { data: bills } = await supabase
    .from("bills")
    .select(`
      *,
      categories(name, color)
    `)
    .eq("partnership_id", partnership.id)
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
