import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageBreadcrumbs } from "@/lib/page-info";
import { getTypeIcon, getAccountIcon } from "@/lib/icons";
import { AccountForm } from "@/components/account-form";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { LazyMonthlyLineChart } from "@/components/lazy-monthly-chart";
import { SimpleTransactionList } from "@/components/simple-transaction-list";
import { getAppContext } from "@/lib/app-context";
import { getAccountById } from "@/lib/queries/accounts";
import { getTransactionsForAccount } from "@/lib/queries/transactions";
import type { Account } from "@/lib/supabase/types-extension";

function getMonthRange() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const start = new Date(now.getFullYear(), now.getMonth() - 23, 1);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const ctx = await getAppContext(supabase);
  if (!ctx) redirect("/auth/login");

  const account = await getAccountById(supabase, id);

  if (!account) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Account not found</h1>
      </div>
    );
  }

  const transactions = await getTransactionsForAccount(supabase, id);

  const { data: linkedGoal } = await supabase
    .from("goals")
    .select("id, name")
    .eq("account_id", account.id)
    .single();

  const { start, end } = getMonthRange();
  const { data: monthlyTxns } = await supabase
    .from("transactions")
    .select("amount, type, date")
    .eq("account_id", id)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true });

  let totalSpent = 0;
  let totalIncome = 0;
  const monthMap = new Map<string, { totalIncome: number; totalSpent: number }>();

  if (monthlyTxns) {
    for (const t of monthlyTxns) {
      const key = t.date.slice(0, 7);
      const entry = monthMap.get(key) || { totalIncome: 0, totalSpent: 0 };
      if (t.type === "income") {
        entry.totalIncome += Math.abs(t.amount);
        totalIncome += Math.abs(t.amount);
      } else if (t.type === "expense") {
        entry.totalSpent += Math.abs(t.amount);
        totalSpent += Math.abs(t.amount);
      }
      monthMap.set(key, entry);
    }
  }

  const now = new Date();
  const monthlyTrend: Array<{ label: string; totalIncome: number; totalSpent: number }> = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    const data = monthMap.get(key) || { totalIncome: 0, totalSpent: 0 };
    monthlyTrend.push({ label, ...data });
  }

  const net = totalIncome - totalSpent;

  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={[{ label: "Accounts", href: "/accounts" }, { label: account.name }]} />

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
              {getAccountIcon(account.icon, account.type, 24)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{account.name}</h1>
              {linkedGoal && (
                <Link href={`/goals/${linkedGoal.id}`} className="text-sm text-primary hover:underline">
                  View Goal
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AccountForm
              hasPartner={false}
              account={account as Account}
              trigger={
                <button className="inline-flex items-center justify-center rounded-lg border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors">
                  Edit
                </button>
              }
            />
            <DeleteAccountButton
              accountId={account.id}
              accountName={account.name}
            />
          </div>
        </div>
        <div className="flex items-start justify-between mb-2">
          <p className="text-3xl font-bold">
            &yen;{Math.abs(account.balance).toLocaleString()}
          </p>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full capitalize mt-1">
            {getTypeIcon(account.type, 12)}
            {account.type.replace("_", " ")}
          </span>
        </div>
        {account.is_shared && (
          <span className="text-xs text-primary mt-1 block">
            Shared account
          </span>
        )}
      </div>

      {!linkedGoal && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Spent</p>
              <p className="text-xl font-bold mt-1 text-red-600">¥{totalSpent.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="text-xl font-bold mt-1 text-green-600">¥{totalIncome.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Net</p>
              <p className={`text-xl font-bold mt-1 ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
                ¥{net.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-xl font-bold mt-1">¥{Math.abs(account.balance).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="rounded-xl border bg-card p-4 md:p-5 lg:col-span-3">
              <h2 className="font-semibold mb-3 text-sm">Monthly Overview</h2>
              <LazyMonthlyLineChart data={monthlyTrend} />
            </div>
            <div className="rounded-xl border bg-card p-4 lg:col-span-2">
              <h2 className="font-semibold mb-3 text-sm">Transactions</h2>
              {!transactions || transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions for this account</p>
              ) : (
                <SimpleTransactionList
                  transactions={(transactions as unknown as Array<Record<string, unknown>>).map((t) => ({
                    id: t.id as string,
                    amount: t.amount as number,
                    date: t.date as string,
                    type: t.type as string,
                    description: t.description as string | null,
                    subtitle: t.date as string,
                  }))}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
