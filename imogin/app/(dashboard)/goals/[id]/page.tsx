import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageBreadcrumbs } from "@/lib/page-info"
import { GoalContributionForm } from "@/components/goal-contribution-form"
import { getAppContext } from "@/lib/app-context"
import { getGoalById } from "@/lib/queries/goals"
import { getPersonalAccounts, getSharedAccounts } from "@/lib/queries/accounts"

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

  const progress = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0
  const daysLeft = goal.target_date ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

  const contributions = (goal.goal_contributions as Array<{
    id: string; amount: number; note: string | null;
    created_at: string; user_id: string; account_id: string | null;
  }>) || []

  const contributorIds = [...new Set(contributions.map(c => c.user_id).filter(Boolean))]
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

  const sortedContributions = [...contributions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const [personalAccounts, sharedAccounts] = await Promise.all([
    getPersonalAccounts(supabase, ctx.userId),
    ctx.partnershipId ? getSharedAccounts(supabase, ctx.partnershipId) : Promise.resolve([]),
  ])
  const allAccounts = [...personalAccounts, ...sharedAccounts]

  return (
    <div className="space-y-6 max-w-2xl">
      <PageBreadcrumbs items={[{ label: "Goals", href: "/goals" }, { label: goal.name }]} />

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{goal.icon || "🎯"}</span>
            <div>
              <h1 className="text-2xl font-bold">{goal.name}</h1>
              {goal.description && <p className="text-muted-foreground">{goal.description}</p>}
            </div>
          </div>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            goal.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
            goal.status === "active" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          }`}>
            {goal.status}
          </span>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-lg mb-2">
            <span className="font-bold">¥{goal.current_amount.toLocaleString()}</span>
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

        {goal.target_date && (
          <p className="text-sm text-muted-foreground">Target date: {goal.target_date}</p>
        )}
      </div>

      {goal.status === "active" && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-3">Add Contribution</h2>
          <GoalContributionForm goalId={goal.id} accounts={allAccounts} />
        </div>
      )}

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-3">Contributions</h2>
        {sortedContributions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contributions yet</p>
        ) : (
          <div className="space-y-3">
            {sortedContributions.map((c) => {
              const profile = profileMap.get(c.user_id)
              return (
                <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      {profile?.name || profile?.email || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                      {c.note && ` - ${c.note}`}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-green-600">+¥{c.amount.toLocaleString()}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
