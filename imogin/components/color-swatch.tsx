"use client"

interface ColorSwatchProps {
  value: string
  onChange: (color: string) => void
}

const COLORS = [
  "#4F46E5", "#7C3AED", "#EC4899", "#EF4444", "#F59E0B",
  "#10B981", "#06B6D4", "#3B82F6", "#8B5CF6", "#F97316",
  "#BE185D", "#0EA5E9", "#84CC16", "#14B8A6", "#6366F1",
  "#A855F7", "#E11D48", "#D97706", "#059669", "#0284C7",
]

export function ColorSwatch({ onChange }: ColorSwatchProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="w-7 h-7 rounded-full border-2 transition-all"
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  )
}
