import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TransactionForm } from "@/components/transaction-form";
import Link from "next/link";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: partnership } = await supabase
    .from("partnerships")
    .select("id, user2_id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single();

  const partnershipId = partnership?.id || null;

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, is_shared, partnership_id, user_id")
    .or(
      partnershipId
        ? `user_id.eq.${user.id},and(is_shared.eq.true,partnership_id.eq.${partnershipId})`
        : `user_id.eq.${user.id}`,
    );

  const allAccounts = accounts || [];

  let allTxns: unknown[] = [];
  let categories: { id: string; name: string; type: string }[] = [];

  if (partnershipId) {
    const { data: sharedAccounts } = await supabase
      .from("accounts")
      .select("id")
      .eq("partnership_id", partnershipId)
      .eq("is_shared", true);

    const sharedAccountIds = sharedAccounts?.map((a) => a.id) || [];

    let txnQuery = supabase
      .from("transactions")
      .select(
        `
        *,
        accounts!inner(*),
        categories(*),
        transaction_splits(*)
      `,
      )

    if (sharedAccountIds.length > 0) {
      txnQuery = txnQuery.or(
        `user_id.eq.${user.id},account_id.in.(${sharedAccountIds.join(",")})`,
      )
    } else {
      txnQuery = txnQuery.eq("user_id", user.id)
    }

    const { data } = await txnQuery
      .order("date", { ascending: false })
      .limit(100);

    allTxns = data || [];

    const catResult = await supabase
      .from("categories")
      .select("id, name, type")
      .eq("partnership_id", partnershipId);

    categories = catResult.data || [];
  } else {
    const { data } = await supabase
      .from("transactions")
      .select(
        `
        *,
        accounts(*),
        categories(*),
        transaction_splits(*)
      `,
      )
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(100);

    allTxns = data || [];
  }

  const partnerUserId = partnership?.user2_id || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Personal and shared transactions</p>
        <TransactionForm
          accounts={allAccounts}
          categories={categories}
          partnershipId={partnershipId}
          partnerUserId={partnerUserId}
        />
      </div>

      <div className="rounded-xl border bg-card">
        {allTxns.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {(
              allTxns as Array<{
                id: string;
                amount: number;
                description: string | null;
                date: string;
                type: string;
                is_split: boolean;
                transfer_group_id: string | null;
                category_id: string | null;
                notes: string | null;
                accounts: { name: string; is_shared: boolean } | null;
                categories: { name: string; color: string | null } | null;
                transaction_splits: Array<{
                  user_id: string;
                  amount: number;
                }> | null;
              }>
            ).map((t) => (
              <Link
                key={t.id}
                href={"/transactions/" + t.id}
                className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${t.type === "income" ? "bg-green-500" : t.type === "transfer" ? "bg-blue-500" : "bg-red-500"}`}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {t.description ||
                        (t.type === "transfer" ? "Transfer" : "No description")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.date} &middot; {t.accounts?.name || "Unknown account"}
                      {t.accounts?.is_shared && (
                        <span className="ml-1 text-primary">(shared)</span>
                      )}
                      {t.is_split && (
                        <span className="ml-1 text-orange-500">(split)</span>
                      )}
                      {t.type === "transfer" && (
                        <span className="ml-1 text-blue-500">(transfer)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${t.type === "income" ? "text-green-600" : t.type === "transfer" ? "text-blue-600" : "text-red-600"}`}
                  >
                    {t.type === "income"
                      ? "+"
                      : t.type === "transfer"
                        ? "↔"
                        : "-"}
                    ¥{Math.abs(t.amount).toLocaleString()}
                  </p>
                  {t.categories && (
                    <p className="text-xs text-muted-foreground">
                      {t.categories.name}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
