"use client";

import { getCategoryIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  icons: readonly { key: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function IconPicker({ icons, value, onChange }: IconPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {icons.map((icon) => (
        <button
          key={icon.key}
          type="button"
          onClick={() => onChange(icon.key)}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-lg border transition-colors",
            value === icon.key
              ? "border-primary bg-primary/10 text-primary"
              : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted",
          )}
          title={icon.label}
        >
          {getCategoryIcon(icon.key, 18)}
        </button>
      ))}
    </div>
  );
}
