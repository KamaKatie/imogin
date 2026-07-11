"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const BottomSheet = DialogPrimitive.Root
const BottomSheetTrigger = DialogPrimitive.Trigger
const BottomSheetPortal = DialogPrimitive.Portal
const BottomSheetClose = DialogPrimitive.Close

const BottomSheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=open]:duration-300 data-[state=closed]:duration-200",
      className
    )}
    {...props}
  />
))
BottomSheetOverlay.displayName = DialogPrimitive.Overlay.displayName

const BottomSheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <BottomSheetPortal>
    <BottomSheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 bg-background border-t",
        "inset-x-0 bottom-0 rounded-t-3xl",
        "max-h-[85vh] overflow-y-auto",
        "pb-8",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        "data-[state=open]:duration-300 data-[state=closed]:duration-200",
        "data-[state=open]:ease-out data-[state=closed]:ease-in",
        "sm:inset-x-auto sm:bottom-auto sm:left-[50%] sm:top-[50%]",
        "sm:translate-x-[-50%] sm:translate-y-[-50%]",
        "sm:rounded-2xl sm:max-w-lg sm:w-full sm:border sm:shadow-xl",
        "sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0",
        "sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95",
        "sm:data-[state=closed]:slide-out-to-bottom-0",
        "sm:data-[state=open]:slide-in-from-bottom-0",
        className
      )}
      {...props}
    >
      <div className="sticky top-0 bg-background pt-3 pb-2 px-6 flex justify-center sm:hidden">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>
      <div className="px-6">
        {children}
      </div>
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1.5 opacity-70 hover:opacity-100 hover:bg-accent transition-all focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </BottomSheetPortal>
))
BottomSheetContent.displayName = DialogPrimitive.Content.displayName

const BottomSheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left pt-2 pb-4", className)} {...props} />
)
BottomSheetHeader.displayName = "BottomSheetHeader"

const BottomSheetTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
BottomSheetTitle.displayName = DialogPrimitive.Title.displayName

export { BottomSheet, BottomSheetPortal, BottomSheetOverlay, BottomSheetTrigger, BottomSheetClose, BottomSheetContent, BottomSheetHeader, BottomSheetTitle }
