import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageBreadcrumbs } from "@/lib/page-info";
import { TransactionEditDialog } from "@/components/transaction-edit-dialog";
import { TransactionDeleteButton } from "@/components/transaction-delete-button";
import { formatRelativeDate } from "@/lib/dates";
import { getCategoryIcon } from "@/lib/icons";
import { getAppContext } from "@/lib/app-context";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [ctx, txResult] = await Promise.all([
    getAppContext(supabase),
    supabase
      .from("transactions")
      .select(
        "*, accounts!account_id(name, is_shared), categories(name, color, icon)",
      )
      .eq("id", id)
      .single(),
  ]);
  if (!ctx) redirect("/auth/login");

  const { userId, partnershipId, partnerUserId, profile: userProfile } = ctx;
  const { data: tx, error: txError } = txResult;

  if (txError || !tx) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Transaction not found</h1>
      </div>
    );
  }

  const [accountsResult, categoriesResult, partnerProfileResult, splitsResult] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, icon, is_shared")
      .or(
        partnershipId
          ? `user_id.eq.${userId},and(is_shared.eq.true,partnership_id.eq.${partnershipId})`
          : `user_id.eq.${userId}`,
      )
      .order("name"),
    partnershipId
      ? supabase
          .from("categories")
          .select("id, name, type, icon, color")
          .eq("partnership_id", partnershipId)
      : { data: null },
    partnerUserId
      ? supabase
          .from("profiles")
          .select("name, email, avatar_url")
          .eq("id", partnerUserId)
          .single()
      : { data: null },
    tx.is_split && partnerUserId
      ? supabase
          .from("transaction_splits")
          .select("id, user_id, amount, percentage, settled, settled_at")
          .eq("transaction_id", id)
      : { data: null },
  ]);

  const allAccounts = accountsResult.data || [];
  const categories = categoriesResult.data || [];
  const partnerProfile = partnerProfileResult.data;
  let splits: Array<{
    id: string;
    user_id: string;
    amount: number;
    percentage: number;
    settled: boolean;
    settled_at: string | null;
    profiles: {
      name: string | null;
      email: string;
      avatar_url: string | null;
    } | null;
  }> = [];
  let forType: "me" | "partner" | "both" = "me";

  if (tx.is_split && splitsResult.data) {
    const rawSplits = splitsResult.data;

    const partnerSplit = rawSplits.find((s) => s.user_id === partnerUserId);
    const mySplit = rawSplits.find((s) => s.user_id === userId);

    if (partnerSplit && partnerSplit.percentage === 100) {
      forType = "partner";
    } else if (partnerSplit && mySplit && partnerSplit.percentage === 50) {
      forType = "both";
    }

    splits = rawSplits.map((s) => ({
      ...s,
      profiles: s.user_id === partnerUserId ? partnerProfile : userProfile,
    })) as typeof splits;
  }

  const txLabel =
    tx.description || (tx.type === "transfer" ? "Transfer" : "Transaction");

  return (
    <div className="space-y-6">
      <PageBreadcrumbs
        items={[
          { label: "Transactions", href: "/transactions" },
          { label: txLabel },
        ]}
      />

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl capitalize">{tx.type}</h1>
          </div>
          <div className="flex items-center gap-2">
            <TransactionEditDialog
              transaction={tx}
              accounts={allAccounts || []}
              categories={categories || []}
              splits={splits}
              partnerUserId={partnerUserId}
              partnershipId={partnershipId}
              forType={forType}
              userProfile={userProfile}
              partnerProfile={partnerProfile}
            />
            <TransactionDeleteButton id={tx.id} />
          </div>
        </div>

        <p className="text-4xl font-bold mb-6">
          {tx.type === "income" ? "+" : tx.type === "transfer" ? "↔" : "-"}¥
          {Math.abs(tx.amount).toLocaleString()}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="font-medium">{tx.description || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-medium" title={tx.date}>
              {formatRelativeDate(tx.date)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Account</p>
            <p className="font-medium">
              {tx.accounts?.name || "Unknown"}
              {tx.accounts?.is_shared ? (
                <span className="text-xs text-primary ml-1">(shared)</span>
              ) : null}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Category</p>
            {tx.categories ? (
              <span
                className="inline-flex items-center gap-1 text-sm px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: (tx.categories.color || "#6B7280") + "18",
                  color: tx.categories.color || undefined,
                }}
              >
                {tx.categories.icon && getCategoryIcon(tx.categories.icon, 12)}
                {tx.categories.name}
              </span>
            ) : (
              <p className="font-medium">—</p>
            )}
          </div>
          {tx.notes && (
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="font-medium">{tx.notes}</p>
            </div>
          )}
        </div>
      </div>

      {partnershipId && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold mb-4">For</h2>
          <div className="flex items-center gap-4">
            {(forType === "me" || forType === "both") && (
              <div
                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${forType === "both" ? "bg-accent" : "bg-accent/50"}`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted text-xs font-medium text-muted-foreground">
                      {(userProfile?.name || userProfile?.email || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">
                  {userProfile?.name || userProfile?.email || "Me"}
                </span>
              </div>
            )}
            {(forType === "partner" || forType === "both") && (
              <div
                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${forType === "both" ? "bg-accent" : "bg-accent/50"}`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  {partnerProfile?.avatar_url ? (
                    <img
                      src={partnerProfile.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted text-xs font-medium text-muted-foreground">
                      {(partnerProfile?.name || partnerProfile?.email || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">
                  {partnerProfile?.name || partnerProfile?.email || "Partner"}
                </span>
              </div>
            )}
          </div>

          {splits.length > 0 && (
            <div className="mt-4 space-y-2">
              {splits.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 text-sm"
                >
                  <span className="text-muted-foreground">{s.percentage}%</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium tabular-nums">
                      ¥{s.amount.toLocaleString()}
                    </span>
                    {s.settled ? (
                      <span className="text-xs text-green-600 font-medium">
                        Settled
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 font-medium">
                        Unsettled
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
