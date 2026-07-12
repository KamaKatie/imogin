import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BillCalendar, type BillWithCategory } from "@/components/bill-calendar"
import { getAppContext } from "@/lib/app-context"
import { getActiveBills } from "@/lib/queries/bills"

export default async function BillCalendarPage() {
  const supabase = await createClient()
  const ctx = await getAppContext(supabase)
  if (!ctx) redirect("/auth/login")

  const { partnershipId } = ctx

  if (!partnershipId) redirect("/bills")

  const bills = await getActiveBills(supabase, partnershipId)

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

      <BillCalendar bills={(bills || []) as BillWithCategory[]} />
    </div>
  )
}
