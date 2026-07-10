import type { BillingCycle } from "@/lib/supabase/types-extension"

export function getOrdinal(n: number) {
  if (n > 3 && n < 21) return "th"
  switch (n % 10) { case 1: return "st"; case 2: return "nd"; case 3: return "rd"; default: return "th" }
}

export function calculatePreviewDate(
  dueDay: number,
  billingCycle: BillingCycle,
): string | null {
  if (!dueDay || dueDay < 1 || dueDay > 31) return null;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const clamp = (d: number, y: number, m: number) =>
    Math.min(d, daysInMonth(y, m));

  switch (billingCycle) {
    case "monthly": {
      const clamped = clamp(dueDay, year, month);
      let candidate = new Date(year, month - 1, clamped);
      if (candidate <= now) {
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        candidate = new Date(
          nextYear,
          nextMonth - 1,
          clamp(dueDay, nextYear, nextMonth),
        );
      }
      return candidate.toISOString().split("T")[0];
    }
    case "weekly": {
      const clamped = clamp(dueDay, year, month);
      let candidate = new Date(year, month - 1, clamped);
      if (candidate <= now) {
        candidate = new Date(candidate.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      return candidate.toISOString().split("T")[0];
    }
    case "quarterly": {
      const clamped = clamp(dueDay, year, month);
      let candidate = new Date(year, month - 1, clamped);
      while (candidate <= now) {
        const m = candidate.getMonth() + 1 + 3;
        const y = candidate.getFullYear() + (m > 12 ? 1 : 0);
        const monthIdx = m > 12 ? m - 13 : m - 1;
        candidate = new Date(y, monthIdx, clamp(dueDay, y, monthIdx + 1));
      }
      return candidate.toISOString().split("T")[0];
    }
    case "yearly": {
      const clamped = clamp(dueDay, year, month);
      let candidate = new Date(year, month - 1, clamped);
      if (candidate <= now) {
        candidate = new Date(
          year + 1,
          month - 1,
          clamp(dueDay, year + 1, month),
        );
      }
      return candidate.toISOString().split("T")[0];
    }
  }
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((today.getTime() - date.getTime()) / 86400000)

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays > 0 && diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" })
  }

  const sameYear = date.getFullYear() === today.getFullYear()
  if (sameYear) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
