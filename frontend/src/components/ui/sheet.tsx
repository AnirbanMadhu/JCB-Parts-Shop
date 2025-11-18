"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Sheet = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(({ children, open, onOpenChange, ...props }, ref) => {
  return open ? <div ref={ref} {...props}>{children}</div> : null
})
Sheet.displayName = "Sheet"

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    side?: "left" | "right" | "top" | "bottom"
  }
>(({ className, side = "right", children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
        side === "right" && "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
        side === "left" && "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
SheetContent.displayName = "SheetContent"

export { Sheet, SheetContent }
