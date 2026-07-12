import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionsTable, type TransactionRow, type FilterOption } from "@/components/transactions-table";
import { MobileFab } from "@/components/mobile-fab";
import { getAppContext } from "@/lib/app-context";

export default async function TransactionsPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const [ctx, searchParams] = await Promise.all([
    getAppContext(supabase),
    searchParamsPromise,
  ]);
  if (!ctx) redirect("/auth/login");

  const { userId, partnershipId, partnerUserId, profile: userProfile } = ctx;

  const page = Math.max(1, parseInt(searchParams.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.pageSize as string) || 25));
  const q = (searchParams.q as string) || "";
  const sort = (searchParams.sort as string) || "date";
  const order = (searchParams.order as string) || "desc";
  const accountFilter = (searchParams.account as string) || "";
  const categoryFilter = (searchParams.category as string) || "";
  const payerFilter = (searchParams.payer as string) || "";

  const [accountsResult, categoriesResult, partnerProfileResult] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, icon, is_shared, partnership_id, user_id")
      .or(
        partnershipId
          ? `user_id.eq.${userId},and(is_shared.eq.true,partnership_id.eq.${partnershipId})`
          : `user_id.eq.${userId}`,
      ),
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
  ]);

  const allAccounts = accountsResult.data || [];
  const accessibleAccountIds = allAccounts.map((a) => a.id);
  const categories = categoriesResult.data || [];
  const partnerProfile = partnerProfileResult.data;

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = supabase
    .from("transactions")
    .select(
      `id, amount, description, date, type, is_split, user_id,
       accounts!account_id(id, name, is_shared),
       categories(id, name, type, icon, color)`,
      { count: "exact" },
    )
    .in("account_id", accessibleAccountIds);

  if (q) {
    const safeQ = q.replace(/[%_]/g, "\\$&");
    query = query.or(`description.ilike.%${safeQ}%,notes.ilike.%${safeQ}%`);
  }

  if (accountFilter) {
    query = query.eq("account_id", accountFilter);
  }
  if (categoryFilter) {
    query = query.eq("category_id", categoryFilter);
  }
  if (payerFilter) {
    query = query.eq("user_id", payerFilter);
  }

  const sanitizedSort = ["date", "amount", "description"].includes(sort) ? sort : "date";
  const dir = order === "asc" ? "asc" : "desc";

  const { data: transactions, count: totalCount } = await query
    .order(sanitizedSort, { ascending: dir === "asc" })
    .range(start, end);

  const userIds = [...new Set((transactions || []).map((t) => t.user_id))];
  const profileMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", userIds);
    if (profiles) {
      for (const p of profiles) {
        profileMap.set(p.id, p.name || p.id);
      }
    }
  }

  function pickFirst<T>(val: T | T[]): T {
    return Array.isArray(val) ? val[0] : val;
  }

  const rows: TransactionRow[] = (transactions || []).map((t) => ({
    id: t.id,
    amount: t.amount,
    description: t.description,
    date: t.date,
    type: t.type,
    is_split: t.is_split,
    user_id: t.user_id,
    payer_name: profileMap.get(t.user_id) || "Unknown",
    accounts: pickFirst(t.accounts) as TransactionRow["accounts"],
    categories: pickFirst(t.categories) as TransactionRow["categories"],
  }));

  const filterAccounts: FilterOption[] = allAccounts.map((a) => ({
    id: a.id,
    label: a.name,
  }));

  const filterCategories: FilterOption[] = categories.map((c) => ({
    id: c.id,
    label: c.name,
  }));

  const filterPayers: FilterOption[] = [];
  if (userProfile) {
    filterPayers.push({ id: userId, label: userProfile.name || userProfile.email || "You" });
  }
  if (partnerProfile && partnerUserId) {
    filterPayers.push({ id: partnerUserId, label: partnerProfile.name || partnerProfile.email || "Partner" });
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
          userProfile={userProfile}
          partnerProfile={partnerProfile}
        />
      </div>

      <TransactionsTable
        data={rows}
        totalCount={totalCount || 0}
        page={page}
        pageSize={pageSize}
        search={q}
        sort={sanitizedSort}
        sortDir={dir}
        accounts={filterAccounts}
        categories={filterCategories}
        payers={filterPayers}
      />

      <MobileFab
        accounts={allAccounts}
        categories={categories}
        partnershipId={partnershipId}
        partnerUserId={partnerUserId}
        userProfile={userProfile}
        partnerProfile={partnerProfile}
      />
    </div>
  );
}
