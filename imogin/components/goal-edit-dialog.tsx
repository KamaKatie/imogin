"use client";

import { useState } from "react";
import { updateGoal } from "@/lib/actions/goals";
import { useRouter } from "next/navigation";
import { ColorSwatch } from "@/components/color-swatch";
import { IconPicker } from "@/components/icon-picker";
import { GOAL_ICON_OPTIONS } from "@/lib/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogFooter } from "@/components/ui/dialog-footer";

interface GoalEditDialogProps {
  goal: {
    id: string;
    name: string;
    description: string | null;
    target_amount: number;
    target_date: string | null;
    icon: string | null;
    color: string | null;
  };
}

export function GoalEditDialog({ goal }: GoalEditDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [selectedColor, setSelectedColor] = useState(goal.color || "#10B981");
  const [selectedIcon, setSelectedIcon] = useState(goal.icon || "target");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const fd = new FormData(e.currentTarget);
      await updateGoal(goal.id, fd);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
    setPending(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-muted-foreground hover:text-foreground">
          Edit
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Goal Name
            </label>
            <input
              id="name"
              name="name"
              defaultValue={goal.name}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <input
              id="description"
              name="description"
              defaultValue={goal.description || ""}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="target_amount" className="text-sm font-medium">
                Target (\)
              </label>
              <input
                id="target_amount"
                name="target_amount"
                type="number"
                step="0.01"
                defaultValue={goal.target_amount}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="target_date" className="text-sm font-medium">
                Target Date
              </label>
              <input
                id="target_date"
                name="target_date"
                type="date"
                defaultValue={goal.target_date || ""}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <ColorSwatch value={selectedColor} onChange={setSelectedColor} />
              <input type="hidden" name="color" value={selectedColor} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Icon</label>
              <IconPicker icons={GOAL_ICON_OPTIONS} value={selectedIcon} onChange={setSelectedIcon} />
              <input type="hidden" name="icon" value={selectedIcon} />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
