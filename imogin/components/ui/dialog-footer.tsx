import { cn } from "@/lib/utils"

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-3 pt-2", className)}
      {...props}
    />
  )
}
