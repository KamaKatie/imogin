import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TransactionForm } from "@/components/transaction-form";
import { formatRelativeDate } from "@/lib/dates";
import { getCategoryIcon } from "@/lib/icons";
import { getPartnershipId, getPartnerUserId } from "@/lib/queries";
import Link from "next/link";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const partnershipId = await getPartnershipId(supabase, user.id);

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, icon, is_shared, partnership_id, user_id")
    .or(
      partnershipId
        ? `user_id.eq.${user.id},and(is_shared.eq.true,partnership_id.eq.${partnershipId})`
        : `user_id.eq.${user.id}`,
    );

  const allAccounts = accounts || [];

  let allTxns: unknown[] = [];
  let categories: { id: string; name: string; type: string; icon: string | null; color: string | null }[] = [];

  let sharedAccountIds: string[] = [];

  if (partnershipId) {
    const { data: sharedAccounts } = await supabase
      .from("accounts")
      .select("id")
      .eq("partnership_id", partnershipId)
      .eq("is_shared", true);

    sharedAccountIds = sharedAccounts?.map((a) => a.id) || [];

    const catResult = await supabase
      .from("categories")
      .select("id, name, type, icon, color")
      .eq("partnership_id", partnershipId);

    categories = catResult.data || [];
  }

  const { data: myTxns } = await supabase
    .from("transactions")
    .select(`*, accounts!account_id(*), categories(*), transaction_splits(*)`)
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(100);

  allTxns = myTxns || [];

  if (sharedAccountIds.length > 0) {
    const { data: sharedTxns } = await supabase
      .from("transactions")
      .select(`*, accounts!account_id(*), categories(*), transaction_splits(*)`)
      .in("account_id", sharedAccountIds)
      .neq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(100);

    if (sharedTxns) {
      allTxns = [...allTxns, ...sharedTxns]
        .sort((a: { date: string }, b: { date: string }) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 100);
    }
  }

  let partnerUserId: string | null = null;
  let partnerProfile: { name: string | null; email: string; avatar_url: string | null } | null = null;
  let userProfile: { name: string | null; email: string; avatar_url: string | null } | null = null;

  if (partnershipId) {
    partnerUserId = await getPartnerUserId(supabase, partnershipId, user.id)

    const { data: up } = await supabase
      .from("profiles")
      .select("name, email, avatar_url")
      .eq("id", user.id)
      .single()
    userProfile = up

    if (partnerUserId) {
      const { data: pp } = await supabase
        .from("profiles")
        .select("name, email, avatar_url")
        .eq("id", partnerUserId)
        .single()
      partnerProfile = pp
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Personal and shared transactions</p>
        <TransactionForm
          accounts={allAccounts}
          categories={categories}
          partnershipId={partnershipId}
          partnerUserId={partnerUserId}
          userId={user.id}
          userProfile={userProfile}
          partnerProfile={partnerProfile}
        />
      </div>

      <div className="rounded-xl border bg-card">
        {allTxns.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No transactions yet</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid sm:grid-cols-[1fr_2fr_1.5fr_1fr] gap-4 px-4 py-3 text-xs text-muted-foreground font-medium border-b">
              <span>Date</span>
              <span>Description</span>
              <span>Category</span>
              <span className="text-right">Amount</span>
            </div>
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
                  categories: { name: string; color: string | null; icon: string | null } | null;
                  transaction_splits: Array<{
                    user_id: string;
                    amount: number;
                  }> | null;
                }>
              ).map((t) => (
                <Link
                  key={t.id}
                  href={"/transactions/" + t.id}
                  className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[1fr_2fr_1.5fr_1fr] gap-4 px-4 py-3 items-center hover:bg-accent/50 transition-colors"
                >
                  <span className="text-xs text-muted-foreground whitespace-nowrap" title={t.date}>
                    {formatRelativeDate(t.date)}
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {t.description ||
                        (t.type === "transfer" ? "Transfer" : "No description")}
                    </p>
                    <p className="text-xs text-muted-foreground truncate flex flex-wrap gap-x-1">
                      {t.accounts?.name || "Unknown account"}
                      {t.accounts?.is_shared && (
                        <span className="text-primary">(shared)</span>
                      )}
                      {t.is_split && (
                        <span className="text-orange-500">(split)</span>
                      )}
                      {t.type === "transfer" && (
                        <span className="text-blue-500">(transfer)</span>
                      )}
                    </p>
                  </div>

                  <div className="flex justify-end sm:justify-start">
                    {t.categories ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: (t.categories.color || "#6B7280") + "18", color: t.categories.color || undefined }}>
                        {t.categories.icon && getCategoryIcon(t.categories.icon, 10)}
                        {t.categories.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>

                  <p
                    className={`text-sm font-medium text-right tabular-nums ${t.type === "income" ? "text-green-600" : t.type === "transfer" ? "text-blue-600" : "text-red-600"}`}
                  >
                    {t.type === "income"
                      ? "+"
                      : t.type === "transfer"
                        ? "↔"
                        : "-"}
                    ¥{Math.abs(t.amount).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
