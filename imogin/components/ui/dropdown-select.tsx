"use client"

import { useState, useRef, useEffect } from "react"

export function DropdownSelect<T extends { id: string; name: string }>({
  items,
  value,
  onChange,
  label,
  placeholder,
  renderItem,
}: {
  items: T[]
  value: string
  onChange: (v: string) => void
  label: string
  placeholder: string
  renderItem: (item: T) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = items.find(i => i.id === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="space-y-2" ref={ref}>
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-left"
        >
          {selected ? renderItem(selected) : <span className="text-muted-foreground">{placeholder}</span>}
          <span className="ml-auto text-muted-foreground">{open ? "▲" : "▼"}</span>
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-md max-h-60 overflow-auto">
            {items.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No options</div>
            ) : (
              items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onChange(item.id); setOpen(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent ${item.id === value ? "bg-accent font-medium" : ""}`}
                >
                  {renderItem(item)}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
