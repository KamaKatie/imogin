import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageBreadcrumbs } from "@/lib/page-info";
import { getTypeIcon } from "@/lib/icons";
import { AccountForm } from "@/components/account-form";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { getAppContext } from "@/lib/app-context";
import { getAccountById } from "@/lib/queries/accounts";
import { getTransactionsForAccount } from "@/lib/queries/transactions";
import type { Account } from "@/lib/supabase/types-extension";

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

  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={[{ label: "Accounts", href: "/accounts" }, { label: account.name }]} />

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            {account.icon && (
              <img
                src={account.icon}
                alt=""
                className="w-10 h-10 rounded-lg object-contain"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{account.name}</h1>
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

      <div>
        <h2 className="text-lg font-semibold mb-3">Transactions</h2>
        {!transactions || transactions.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
            <p>No transactions for this account</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card divide-y">
            {transactions.map((t: Record<string, unknown>) => (
              <div
                key={t.id as string}
                className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={
                      "w-2 h-2 rounded-full " +
                      (t.type === "income"
                        ? "bg-green-500"
                        : t.type === "transfer"
                          ? "bg-blue-500"
                          : "bg-red-500")
                    }
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {(t.description as string) ||
                        (t.type === "transfer" ? "Transfer" : "No description")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.date as string}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={
                      "text-sm font-medium " +
                      (t.type === "income"
                        ? "text-green-600"
                        : t.type === "transfer"
                          ? "text-blue-600"
                          : "text-red-600")
                    }
                  >
                    {t.type === "income"
                      ? "+"
                      : t.type === "transfer"
                        ? "\u2194"
                        : "-"}
                    &yen;{Math.abs(t.amount as number).toLocaleString()}
                  </p>
                  {(t.categories as { name: string } | null)?.name && (
                    <p className="text-xs text-muted-foreground">
                      {(t.categories as { name: string }).name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
