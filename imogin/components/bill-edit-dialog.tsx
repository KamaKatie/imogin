"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { updateBill, deleteBill } from "@/lib/actions/bills";
import { uploadBillIcon } from "@/lib/actions/storage";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { calculatePreviewDate } from "@/lib/dates";
import { DialogFooter } from "@/components/ui/dialog-footer";
import type { BillingCycle } from "@/lib/supabase/types-extension";

interface BillEditDialogProps {
  bill: {
    id: string;
    name: string;
    amount: number;
    billing_cycle: string;
    next_billing_date: string;
    due_day: number | null;
    category_id: string | null;
    payment_account_id: string | null;
    split_method: string;
    split_payer_user_id: string | null;
    icon_url: string | null;
    url: string | null;
  };
  categories?: Array<{ id: string; name: string; type: string }>;
  accounts?: Array<{ id: string; name: string; is_shared: boolean }>;
  userId?: string;
  partnerUserId?: string;
  partnerName?: string;
}

export function BillEditDialog({
  bill,
  categories = [],
  accounts = [],
  userId,
  partnerUserId,
  partnerName,
}: BillEditDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [splitMethod, setSplitMethod] = useState(bill.split_method);
  const [iconPreview, setIconPreview] = useState<string | null>(bill.icon_url);
  const [dueDay, setDueDay] = useState(bill.due_day?.toString() || "");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    bill.billing_cycle as BillingCycle,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewDate = useMemo(() => {
    const day = parseInt(dueDay, 10);
    if (isNaN(day)) return null;
    return calculatePreviewDate(day, billingCycle);
  }, [dueDay, billingCycle]);

  useEffect(() => {
    if (!open) {
      setDueDay(bill.due_day?.toString() || "");
      setBillingCycle(bill.billing_cycle as BillingCycle);
      setSplitMethod(bill.split_method);
      setIconPreview(bill.icon_url);
      setError("");
    }
  }, [
    open,
    bill.due_day,
    bill.billing_cycle,
    bill.split_method,
    bill.icon_url,
  ]);

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError("");
    const form = e.currentTarget;
    try {
      const fd = new FormData(form);
      await updateBill(bill.id, fd);

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const iconFd = new FormData();
        iconFd.set("icon", file);
        const iconUrl = await uploadBillIcon(bill.id, iconFd);
        if (iconUrl) {
          const updateFd = new FormData();
          for (const [key, val] of new FormData(form).entries()) {
            if (key !== "icon") updateFd.set(key, val);
          }
          updateFd.set("icon_url", iconUrl);
          await updateBill(bill.id, updateFd);
        }
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
    setPending(false);
  };

  const expCategories = categories.filter((c) => c.type === "expense");
  const isCovered = bill.split_method === "covered";
  const payerIsYou = isCovered && bill.split_payer_user_id === userId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-muted-foreground hover:text-foreground">
          Edit
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Bill</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={bill.name}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount (¥)
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                required
                defaultValue={Math.abs(bill.amount)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="billing_cycle" className="text-sm font-medium">
                Billing Cycle
              </label>
              <select
                id="billing_cycle"
                name="billing_cycle"
                required
                value={billingCycle}
                onChange={(e) =>
                  setBillingCycle(e.target.value as BillingCycle)
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="due_day" className="text-sm font-medium">
                Due Day
              </label>
              <input
                id="due_day"
                name="due_day"
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="e.g. 15"
              />
              {previewDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Next:{" "}
                  {new Date(previewDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="category_id" className="text-sm font-medium">
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                defaultValue={bill.category_id || ""}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="">No category</option>
                {expCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              Website URL
            </label>
            <input
              id="url"
              name="url"
              type="url"
              defaultValue={bill.url || ""}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="e.g. https://netflix.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="payment_account_id" className="text-sm font-medium">
              Payment Account
            </label>
            <select
              id="payment_account_id"
              name="payment_account_id"
              defaultValue={bill.payment_account_id || ""}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="">No account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.is_shared ? " (Shared)" : " (Personal)"}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="split_method" className="text-sm font-medium">
              Split Method
            </label>
            <select
              id="split_method"
              name="split_method"
              value={splitMethod}
              onChange={(e) => setSplitMethod(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="equal">Equal (50/50)</option>
              <option value="covered">Covered (one pays)</option>
              <option value="custom">Custom %</option>
            </select>
          </div>

          {splitMethod === "covered" && partnerName && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Who pays?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="split_payer_user_id"
                    value={userId || ""}
                    defaultChecked={payerIsYou}
                    className="rounded-full"
                  />
                  Me
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="split_payer_user_id"
                    value={partnerUserId || ""}
                    defaultChecked={!payerIsYou}
                    className="rounded-full"
                  />
                  {partnerName}
                </label>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Logo / Icon</label>
            <div className="flex items-center gap-3">
              {iconPreview && (
                <img
                  src={iconPreview}
                  alt="Icon"
                  className="w-10 h-10 rounded-lg object-contain border"
                />
              )}
              <input
                ref={fileInputRef}
                name="icon"
                type="file"
                accept="image/*"
                onChange={handleIconChange}
                className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent/80"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <DialogFooter>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                if (!confirm("Are you sure you want to delete this bill?"))
                  return;
                setPending(true);
                try {
                  await deleteBill(bill.id);
                  setOpen(false);
                  router.refresh();
                } catch (err) {
                  setError((err as Error).message);
                }
                setPending(false);
              }}
              className="rounded-lg border border-red-300 text-red-600 px-4 py-2.5 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
