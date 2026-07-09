"use client"

import { deleteTransaction } from "@/lib/actions/transactions"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function TransactionDeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Delete this transaction?")) return
    setPending(true)
    try {
      await deleteTransaction(id)
      router.refresh()
    } catch {
      alert("Failed to delete transaction")
    }
    setPending(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="text-xs text-muted-foreground hover:text-red-500 ml-2"
    >
      {pending ? "..." : "Delete"}
    </button>
  )
}
