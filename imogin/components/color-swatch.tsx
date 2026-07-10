"use client";

interface ColorSwatchProps {
  value: string;
  onChange: (color: string) => void;
}

const COLORS = [
  "#E15A5A",
  "#E27D44",
  "#E4A834",
  "#A3B846",
  "#52A46C",
  "#379683",
  "#359BB0",
  "#4581B8",
  "#5561B9",
  "#6A52B5",
  "#8E52B5",
  "#AF53A7",
  "#CC5483",
  "#6B7280",
  "#4B5563",
  "#374151",
];

export function ColorSwatch({ value, onChange }: ColorSwatchProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((color) => {
        const selected = color === value;
        const isLight =
          color === "#FFFFFF" || color === "#F3F4F6" || color === "#F9FAFB";
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-7 h-7 rounded-full transition-all ${selected ? "ring-2 ring-offset-1 ring-foreground/30" : "ring-1 ring-inset ring-black/10"}`}
            style={{ backgroundColor: color }}
            title={color}
          />
        );
      })}
    </div>
  );
}
