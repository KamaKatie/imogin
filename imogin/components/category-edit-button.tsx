"use client"

import { useState } from "react"
import { CategoryEditDialog } from "@/components/category-edit-dialog"

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  type: string
}

export function CategoryEditButton({ category }: { category: Category }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
      >
        Edit
      </button>
      <CategoryEditDialog category={category} open={open} onOpenChange={setOpen} />
    </>
  )
}
