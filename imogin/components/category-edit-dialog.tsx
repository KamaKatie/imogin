"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateCategory, deleteCategory } from "@/lib/actions/categories"
import { ColorSwatch } from "@/components/color-swatch"
import { getCategoryIcon, CATEGORY_ICONS, searchIcons } from "@/lib/icons"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DialogFooter } from "@/components/ui/dialog-footer"
import { useMemo } from "react"

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  type: string
}

interface CategoryEditDialogProps {
  category: Category
  open: boolean
  onOpenChange: (open: boolean) => void
}

function IconPicker({
  selected,
  onSelect,
  className = "",
}: {
  selected: string
  onSelect: (name: string) => void
  className?: string
}) {
  const [query, setQuery] = useState("")
  const filtered = useMemo(
    () => (query ? searchIcons(query) : CATEGORY_ICONS),
    [query],
  )

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
  )
}

export function CategoryEditDialog({ category, open, onOpenChange }: CategoryEditDialogProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [editColor, setEditColor] = useState(category.color || "#4F46E5")
  const [editIcon, setEditIcon] = useState(category.icon || "")

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError("")
    try {
      const fd = new FormData(e.currentTarget)
      fd.set("id", category.id)
      fd.set("icon", editIcon)
      await updateCategory(fd)
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    }
    setPending(false)
  }

  const handleDelete = async () => {
    if (!confirm("Delete this category? Transactions using it will be uncategorized.")) return
    try {
      await deleteCategory(category.id)
      onOpenChange(false)
      router.push("/categories")
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              defaultValue={category.name}
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
              defaultValue={category.type}
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
              onClick={handleDelete}
              className="rounded-lg border border-red-300 text-red-600 px-4 py-2.5 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
