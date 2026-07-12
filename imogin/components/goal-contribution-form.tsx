"use client";

import { useActionState } from "react";
import { addGoalContribution } from "@/lib/actions/goals";

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface GoalContributionFormProps {
  goalId: string;
  accounts: Account[];
}

export function GoalContributionForm({ goalId, accounts }: GoalContributionFormProps) {
  const [, formAction, pending] = useActionState(
    (_prev: unknown, formData: FormData) =>
      addGoalContribution(goalId, formData),
    undefined,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <label htmlFor="amount" className="text-sm font-medium">
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            required
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="0"
          />
        </div>
        <div className="flex-1 space-y-2">
          <label htmlFor="note" className="text-sm font-medium">
            Note
          </label>
          <input
            id="note"
            name="note"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="Optional"
          />
        </div>
      </div>
      {accounts.length > 0 && (
        <div className="space-y-2">
          <label htmlFor="account_id" className="text-sm font-medium">
            Fund from account
          </label>
          <select
            id="account_id"
            name="account_id"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">None (manual contribution)</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (¥{a.balance.toLocaleString()})
              </option>
            ))}
          </select>
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add Contribution"}
      </button>
    </form>
  );
}
