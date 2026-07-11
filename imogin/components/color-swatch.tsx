"use client";

import { HexColorPicker } from "react-colorful";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ColorSwatchProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorSwatch({ value, onChange }: ColorSwatchProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm hover:bg-accent transition-colors"
        >
          <span
            className="w-5 h-5 rounded-full border border-border shrink-0"
            style={{ backgroundColor: value || "#6B7280" }}
          />
          <span className="font-mono text-xs text-muted-foreground">
            {value}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <HexColorPicker
          color={value}
          onChange={onChange}
          style={{ width: "100%", height: 160 }}
        />
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-muted-foreground font-mono">#</span>
          <input
            type="text"
            value={value.replace("#", "")}
            onChange={(e) => {
              const raw = e.target.value
                .replace(/[^0-9a-fA-F]/g, "")
                .slice(0, 6);
              onChange(raw ? `#${raw.toUpperCase()}` : value);
            }}
            className="flex-1 rounded border bg-background px-2 py-1 text-xs font-mono"
            placeholder="000000"
            maxLength={6}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
