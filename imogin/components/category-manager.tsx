"use client"

import { useActionState } from "react"
import { createCategory, deleteCategory } from "@/lib/actions/categories"
import { useRouter } from "next/navigation"

interface CategoryManagerProps {
  categories: Array<{ id: string; name: string; icon: string | null; color: string | null; type: string }>
  hasPartner: boolean
}

export function CategoryManager({ categories, hasPartner }: CategoryManagerProps) {
  const router = useRouter()
  const [, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      try {
        await createCategory(formData)
        router.refresh()
        return { success: true }
      } catch (e) {
        return { message: (e as Error).message }
      }
    },
    undefined
  )

  const handleDelete = async (id: string) => {
    if (confirm("Delete this category?")) {
      try {
        await deleteCategory(id)
        router.refresh()
      } catch (e) {
        console.error(e)
      }
    }
  }

  if (!hasPartner) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>Create a partnership to manage categories</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-3">Add New Category</h2>
        <form action={formAction} className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <input id="name" name="name" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="e.g. Pets" />
          </div>
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">Type</label>
            <select id="type" name="type" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="color" className="text-sm font-medium">Color</label>
            <input id="color" name="color" type="color" defaultValue="#6B7280" className="w-10 h-10 rounded-lg border bg-background px-1 py-1" />
          </div>
          <div className="space-y-2">
            <label htmlFor="icon" className="text-sm font-medium">Icon</label>
            <select id="icon" name="icon" className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
              <option value="tag">Tag</option>
              <option value="home">Home</option>
              <option value="zap">Zap</option>
              <option value="shopping-cart">Cart</option>
              <option value="utensils">Food</option>
              <option value="car">Car</option>
              <option value="film">Entertainment</option>
              <option value="heart-pulse">Health</option>
              <option value="plane">Travel</option>
              <option value="shopping-bag">Shopping</option>
              <option value="briefcase">Work</option>
              <option value="laptop">Tech</option>
              <option value="gift">Gift</option>
              <option value="more-horizontal">Other</option>
            </select>
          </div>
          <button type="submit" disabled={pending} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">Add</button>
        </form>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Categories</h2>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet — they are created when a partnership is formed</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color || "#6B7280" }} />
                  <span className="text-sm">{c.name}</span>
                  <span className="text-xs text-muted-foreground">({c.type})</span>
                </div>
                <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
