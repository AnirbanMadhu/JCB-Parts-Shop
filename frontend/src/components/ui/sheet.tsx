"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Sheet = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(({ children, open, onOpenChange, ...props }, ref) => {
  // Close on escape key
  React.useEffect(() => {
    if (!open) return
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange?.(false)
      }
    }
    
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, onOpenChange])

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <div ref={ref} {...props}>
      {/* Backdrop/Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
        aria-hidden="true"
      />
      {children}
    </div>
  )
})
Sheet.displayName = "Sheet"

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    side?: "left" | "right" | "top" | "bottom"
    onClose?: () => void
  }
>(({ className, side = "right", children, onClose, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "fixed z-50 gap-4 bg-background p-6 shadow-lg transition-transform ease-in-out duration-300",
        side === "right" && "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
        side === "left" && "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        side === "top" && "inset-x-0 top-0 border-b",
        side === "bottom" && "inset-x-0 bottom-0 border-t",
        className
      )}
      {...props}
    >
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
      {children}
    </div>
  )
})
SheetContent.displayName = "SheetContent"

export { Sheet, SheetContent }
