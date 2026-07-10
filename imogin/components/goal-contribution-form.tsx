"use client";

import { useActionState } from "react";
import { addGoalContribution } from "@/lib/actions/goals";

interface GoalContributionFormProps {
  goalId: string;
}

export function GoalContributionForm({ goalId }: GoalContributionFormProps) {
  const [, formAction, pending] = useActionState(
    (_prev: unknown, formData: FormData) =>
      addGoalContribution(goalId, formData),
    undefined,
  );

  return (
    <form action={formAction} className="flex items-end gap-3">
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
          placeholder="0.00"
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
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add"}
      </button>
    </form>
  );
}
