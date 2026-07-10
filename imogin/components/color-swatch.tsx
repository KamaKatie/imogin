"use client"

interface ColorSwatchProps {
  value: string
  onChange: (color: string) => void
}

const COLORS = [
  "#EF4444", "#E11D48", "#BE185D", "#F97316", "#D97706", "#F59E0B",
  "#84CC16", "#10B981", "#059669", "#14B8A6", "#06B6D4",
  "#0EA5E9", "#0284C7", "#3B82F6", "#4F46E5", "#6366F1",
  "#7C3AED", "#8B5CF6", "#A855F7", "#EC4899",
  "#FFFFFF", "#F3F4F6", "#E5E7EB", "#D1D5DB", "#9CA3AF",
  "#6B7280", "#4B5563", "#374151", "#1F2937", "#111827",
]

export function ColorSwatch({ value, onChange }: ColorSwatchProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((color) => {
        const selected = color === value
        const isLight = color === "#FFFFFF" || color === "#F3F4F6" || color === "#F9FAFB"
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-7 h-7 rounded-full transition-all ${selected ? "ring-2 ring-offset-1 ring-foreground/30" : "ring-1 ring-inset ring-black/10"}`}
            style={{ backgroundColor: color }}
            title={color}
          />
        )
      })}
    </div>
  )
}
