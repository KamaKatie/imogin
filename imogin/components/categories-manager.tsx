"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCategory } from "@/lib/actions/categories";
import { ColorSwatch } from "@/components/color-swatch";
import { getCategoryIcon, CATEGORY_ICONS, searchIcons } from "@/lib/icons";
import { PieChartDonut } from "@/components/pie-chart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogFooter } from "@/components/ui/dialog-footer";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: string;
}

interface CategoriesManagerProps {
  categories: Category[];
  spendingByCategory?: { name: string; color: string | null; icon: string | null; total: number }[];
}

function IconPicker({
  selected,
  onSelect,
  className = "",
}: {
  selected: string;
  onSelect: (name: string) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => (query ? searchIcons(query) : CATEGORY_ICONS),
    [query],
  );

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Search icons..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
      />
      <div
        className={`flex flex-wrap gap-1.5 max-h-40 overflow-y-auto scrollbar-thin ${className}`}
      >
        {filtered.map((iconName) => (
          <button
            key={iconName}
            type="button"
            onClick={() => onSelect(iconName === selected ? "" : iconName)}
            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
              iconName === selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-accent text-muted-foreground"
            }`}
            title={iconName}
          >
            {getCategoryIcon(iconName, 18)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CategoriesManager({ categories, spendingByCategory = [] }: CategoriesManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [selectedColor, setSelectedColor] = useState("#4F46E5");
  const [selectedIcon, setSelectedIcon] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "expense" | "income" | "transfer">("all");

  const filteredCategories = activeTab === "all" ? categories : categories.filter((c) => c.type === activeTab);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("icon", selectedIcon);
      await createCategory(fd);
      setOpen(false);
      setSelectedIcon("");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
    setPending(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage transaction categories
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
              Add Category
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  placeholder="e.g. Dining Out"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">
                  Type
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Icon</label>
                <IconPicker
                  selected={selectedIcon}
                  onSelect={setSelectedIcon}
                />
                <input type="hidden" name="icon" value={selectedIcon} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <ColorSwatch
                  value={selectedColor}
                  onChange={setSelectedColor}
                />
                <input type="hidden" name="color" value={selectedColor} />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <DialogFooter>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {pending ? "Creating..." : "Create Category"}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {spendingByCategory.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Spending This Month</h2>
            <span className="text-xs text-muted-foreground">¥{spendingByCategory.reduce((sum, c) => sum + c.total, 0).toLocaleString()} total</span>
          </div>
          <PieChartDonut data={spendingByCategory.map(c => ({ name: c.name, value: c.total, color: c.color, icon: c.icon }))} />
        </div>
      )}

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No categories yet. Add one above.
        </p>
      ) : (
        <div>
          <div className="flex gap-1 text-sm mb-4 border-b border-border">
            {(["all", "expense", "income", "transfer"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
            {filteredCategories.map((c) => {
              const spent = spendingByCategory.find(s => s.name === c.name)
              return (
                <Link
                  key={c.id}
                  href={`/categories/${c.id}`}
                  className="flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 hover:bg-accent/50 transition-colors text-center"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: (c.color || "#6B7280") + "18" }}
                  >
                    <span style={{ color: c.color || "#6B7280" }}>
                      {getCategoryIcon(c.icon, 20)}
                    </span>
                  </div>
                  <span className="text-sm font-medium truncate w-full">{c.name}</span>
                  {c.type === "expense" && (
                    spent ? (
                      <span className="text-sm text-muted-foreground tabular-nums font-medium">
                        ¥{spent.total.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground tabular-nums font-medium">
                        ¥0
                      </span>
                    )
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
}
