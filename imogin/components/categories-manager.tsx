"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createCategory, deleteCategory } from "@/lib/actions/categories"
import { ColorSwatch } from "@/components/color-swatch"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  type: string
}

interface CategoriesManagerProps {
  categories: Category[]
}

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [selectedColor, setSelectedColor] = useState("#4F46E5")

  const incomeCategories = categories.filter((c) => c.type === "income")
  const expenseCategories = categories.filter((c) => c.type === "expense")

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError("")
    try {
      const fd = new FormData(e.currentTarget)
      await createCategory(fd)
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    }
    setPending(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Transactions using it will be uncategorized.")) return
    try {
      await deleteCategory(id)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage transaction categories</p>
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
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <input id="name" name="name" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="e.g. Dining Out" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium">Type</label>
                  <select id="type" name="type" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="icon" className="text-sm font-medium">Icon</label>
                  <select id="icon" name="icon" className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                    <option value="home">Home</option>
                    <option value="zap">Utilities</option>
                    <option value="shopping-cart">Groceries</option>
                    <option value="utensils">Dining</option>
                    <option value="car">Transport</option>
                    <option value="film">Entertainment</option>
                    <option value="shopping-bag">Shopping</option>
                    <option value="heart-pulse">Health</option>
                    <option value="plane">Travel</option>
                    <option value="briefcase">Salary</option>
                    <option value="laptop">Freelance</option>
                    <option value="plus-circle">Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <ColorSwatch value={selectedColor} onChange={setSelectedColor} />
                <input type="hidden" name="color" value={selectedColor} />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button type="submit" disabled={pending} className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {pending ? "Creating..." : "Create Category"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No custom categories yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold mb-2 text-green-600">Income</h3>
            <div className="space-y-1">
              {incomeCategories.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color || "#6B7280" }} />
                    <span className="text-sm">{c.icon && <span className="mr-1">{c.icon}</span>}{c.name}</span>
                  </div>
                  <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2 text-red-600">Expense</h3>
            <div className="space-y-1">
              {expenseCategories.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color || "#6B7280" }} />
                    <span className="text-sm">{c.icon && <span className="mr-1">{c.icon}</span>}{c.name}</span>
                  </div>
                  <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
