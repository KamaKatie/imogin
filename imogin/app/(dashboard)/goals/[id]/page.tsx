import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageBreadcrumbs } from "@/lib/page-info"
import { GoalContributionForm } from "@/components/goal-contribution-form"
import { GoalEditDialog } from "@/components/goal-edit-dialog"
import { getAppContext } from "@/lib/app-context"
import { getGoalById } from "@/lib/queries/goals"
import { getPersonalAccounts, getSharedAccounts } from "@/lib/queries/accounts"
import { getCategoryIcon } from "@/lib/icons"

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const ctx = await getAppContext(supabase)
  if (!ctx) redirect("/auth/login")

  const goal = await getGoalById(supabase, id)

  if (!goal) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Goal not found</h1>
      </div>
    )
  }

  let currentAmount = goal.current_amount || 0

  if (goal.account_id) {
    const { data: goalAccount } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", goal.account_id)
      .single()
    if (goalAccount) {
      currentAmount = goalAccount.balance || 0
      await supabase
        .from("goals")
        .update({ current_amount: currentAmount })
        .eq("id", goal.id)
    }
  }

  const progress = goal.target_amount > 0 ? Math.min((currentAmount / goal.target_amount) * 100, 100) : 0
  const daysLeft = goal.target_date ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

  let transfers: Array<{
    id: string; amount: number; description: string | null;
    created_at: string; user_id: string;
  }> = []

  if (goal.account_id) {
    const { data } = await supabase
      .from("transactions")
      .select("id, amount, description, created_at, user_id")
      .eq("to_account_id", goal.account_id)
      .eq("type", "transfer")
      .order("created_at", { ascending: false })
    transfers = data || []
  }

  const contributorIds = [...new Set(transfers.map(t => t.user_id).filter(Boolean))]
  let profileMap = new Map<string, { name: string | null; email: string }>()
  if (contributorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", contributorIds)
    for (const p of profiles || []) {
      profileMap.set(p.id, { name: p.name, email: p.email })
    }
  }

  const [personalAccounts, sharedAccounts] = await Promise.all([
    getPersonalAccounts(supabase, ctx.userId),
    ctx.partnershipId ? getSharedAccounts(supabase, ctx.partnershipId) : Promise.resolve([]),
  ])
  const allAccounts = [...personalAccounts, ...sharedAccounts].filter(a => a.id !== goal.account_id)

  return (
    <div className="space-y-6 max-w-2xl">
      <PageBreadcrumbs items={[{ label: "Goals", href: "/goals" }, { label: goal.name }]} />

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 flex items-center justify-center rounded-lg bg-muted/50 text-primary shrink-0">
              {getCategoryIcon(goal.icon, 28) || getCategoryIcon("target", 28)}
            </span>
            <div>
              <h1 className="text-2xl font-bold">{goal.name}</h1>
              {goal.description && <p className="text-muted-foreground">{goal.description}</p>}
            </div>
          </div>
          <GoalEditDialog goal={goal} />
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-lg mb-2">
            <span className="font-bold">¥{currentAmount.toLocaleString()}</span>
            <span className="text-muted-foreground">of ¥{goal.target_amount.toLocaleString()}</span>
          </div>
          <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: goal.color || "#10B981" }}
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>{progress.toFixed(1)}% complete</span>
            {daysLeft !== null && daysLeft > 0 && <span>{daysLeft} days remaining</span>}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
            goal.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
            goal.status === "active" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          }`}>
            {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
          </span>
          {goal.target_date && (
            <p className="text-xs text-muted-foreground">Target date: {goal.target_date}</p>
          )}
        </div>
      </div>

      {goal.status === "active" && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-3">Add Contribution</h2>
          <GoalContributionForm goalId={goal.id} accounts={allAccounts} />
        </div>
      )}

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-3">Contributions</h2>
        {transfers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contributions yet</p>
        ) : (
          <div className="space-y-3">
            {transfers.map((t) => {
              const profile = profileMap.get(t.user_id)
              return (
                <Link key={t.id} href={`/transactions/${t.id}`} className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-accent/50 rounded px-2 -mx-2 transition-colors">
                  <div>
                    <p className="text-sm font-medium">
                      {profile?.name || profile?.email || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString()}
                      {t.description && ` - ${t.description}`}
                    </p>
                  </div>
                  <p className="text-sm font-medium">+¥{t.amount.toLocaleString()}</p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
