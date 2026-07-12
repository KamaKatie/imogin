import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { GoalForm } from "@/components/goal-form"
import { GoalEditDialog } from "@/components/goal-edit-dialog"
import { getAppContext } from "@/lib/app-context"

export default async function GoalsPage() {
  const supabase = await createClient()
  const ctx = await getAppContext(supabase)
  if (!ctx) redirect("/auth/login")

  const { userId, partnershipId } = ctx

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .or(
      partnershipId
        ? `user_id.eq.${userId},partnership_id.eq.${partnershipId}`
        : `user_id.eq.${userId}`
    )
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Track your savings goals</p>
        <GoalForm hasPartner={!!partnershipId} />
      </div>

      {!goals || goals.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <p>No goals yet</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => {
            const progress = g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0
            const daysLeft = g.target_date ? Math.ceil((new Date(g.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

            return (
              <Link
                key={g.id}
                href={`/goals/${g.id}`}
                className="rounded-xl border bg-card p-5 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{g.icon || "🎯"}</span>
                    <div>
                      <p className="font-medium">{g.name}</p>
                      {g.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{g.description}</p>}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    g.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                    g.status === "active" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  }`}>
                    {g.status}
                  </span>
                  <GoalEditDialog goal={g} />
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>¥{g.current_amount.toLocaleString()}</span>
                    <span className="text-muted-foreground">¥{g.target_amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progress}%`, backgroundColor: g.color || "#10B981" }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progress.toFixed(0)}% complete</span>
                  {g.user_id && <span className="text-primary">Personal</span>}
                  {daysLeft !== null && daysLeft > 0 && <span>{daysLeft} days left</span>}
                  {daysLeft !== null && daysLeft <= 0 && g.status === "active" && <span className="text-red-500">Overdue</span>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
