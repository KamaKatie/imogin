"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/categories";
import { ColorSwatch } from "@/components/color-swatch";
import { getCategoryIcon, CATEGORY_ICONS, searchIcons } from "@/lib/icons";
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

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [selectedColor, setSelectedColor] = useState("#4F46E5");
  const [selectedIcon, setSelectedIcon] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editColor, setEditColor] = useState("#4F46E5");
  const [editIcon, setEditIcon] = useState("");
  const [moreIconsOpen, setMoreIconsOpen] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<"create" | "edit">(
    "create",
  );

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const transferCategories = categories.filter((c) => c.type === "transfer");

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

  const handleEditClick = (c: Category) => {
    setEditingCategory(c);
    setEditColor(c.color || "#4F46E5");
    setEditIcon(c.icon || "");
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCategory) return;
    setPending(true);
    setError("");
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("id", editingCategory.id);
      fd.set("icon", editIcon);
      await updateCategory(fd);
      setEditOpen(false);
      setEditingCategory(null);
      setEditIcon("");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
    setPending(false);
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Delete this category? Transactions using it will be uncategorized.",
      )
    )
      return;
    try {
      await deleteCategory(id);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
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
                <button
                  type="button"
                  onClick={() => {
                    setIconPickerTarget("create");
                    setMoreIconsOpen(true);
                  }}
                  className="text-xs text-muted-foreground hover:underline mt-1"
                >
                  More icons...
                </button>
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

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No categories yet. Add one above.
        </p>
      ) : (
        <div className="space-y-4">
          {incomeCategories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 text-green-600">
                Income
              </h3>
              <div className="space-y-2">
                {incomeCategories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-accent/50 transition-colors"
                  >
                    <Link
                      href={`/categories/${c.id}`}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: c.color || "#6B7280" }}
                      />
                      <span className="text-sm flex items-center gap-1.5 font-medium truncate">
                        {getCategoryIcon(c.icon, 18)}
                        {c.name}
                      </span>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleEditClick(c);
                      }}
                      className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {expenseCategories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 text-red-600">
                Expense
              </h3>
              <div className="space-y-2">
                {expenseCategories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-accent/50 transition-colors"
                  >
                    <Link
                      href={`/categories/${c.id}`}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: c.color || "#6B7280" }}
                      />
                      <span className="text-sm flex items-center gap-1.5 font-medium truncate">
                        {getCategoryIcon(c.icon, 18)}
                        {c.name}
                      </span>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleEditClick(c);
                      }}
                      className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {transferCategories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 text-blue-600">
                Transfer
              </h3>
              <div className="space-y-2">
                {transferCategories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-accent/50 transition-colors"
                  >
                    <Link
                      href={`/categories/${c.id}`}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: c.color || "#6B7280" }}
                      />
                      <span className="text-sm flex items-center gap-1.5 font-medium truncate">
                        {getCategoryIcon(c.icon, 18)}
                        {c.name}
                      </span>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleEditClick(c);
                      }}
                      className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium">
                Name
              </label>
              <input
                id="edit-name"
                name="name"
                required
                defaultValue={editingCategory?.name || ""}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-type" className="text-sm font-medium">
                Type
              </label>
              <select
                id="edit-type"
                name="type"
                required
                defaultValue={editingCategory?.type || "expense"}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Icon</label>
              <IconPicker selected={editIcon} onSelect={setEditIcon} />
              <button
                type="button"
                onClick={() => {
                  setIconPickerTarget("edit");
                  setMoreIconsOpen(true);
                }}
                className="text-xs text-muted-foreground hover:underline mt-1"
              >
                More icons...
              </button>
              <input type="hidden" name="icon" value={editIcon} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <ColorSwatch value={editColor} onChange={setEditColor} />
              <input type="hidden" name="color" value={editColor} />
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
                onClick={() => {
                  setEditOpen(false);
                   if (editingCategory) handleDelete(editingCategory.id);
                }}
                className="rounded-lg border border-red-300 text-red-600 px-4 py-2.5 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={moreIconsOpen} onOpenChange={setMoreIconsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Icon</DialogTitle>
          </DialogHeader>
          <IconPicker
            selected={iconPickerTarget === "create" ? selectedIcon : editIcon}
            onSelect={(name) => {
              if (iconPickerTarget === "create") setSelectedIcon(name);
              else setEditIcon(name);
              setMoreIconsOpen(false);
            }}
            className="max-h-80"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
