"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type CollapsibleContextType = {
  open: boolean
  setOpen: (open: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextType | null>(null)

const useCollapsible = () => {
  const context = React.useContext(CollapsibleContext)
  if (!context) {
    throw new Error("useCollapsible must be used within a Collapsible")
  }
  return context
}

const Collapsible = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    defaultOpen?: boolean
  }
>(({ children, open: controlledOpen, onOpenChange, defaultOpen = false, className, ...props }, ref) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  
  const setOpen = React.useCallback((newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [controlledOpen, onOpenChange])

  return (
    <CollapsibleContext.Provider value={{ open, setOpen }}>
      <div ref={ref} data-state={open ? "open" : "closed"} className={className} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
})
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, className, asChild, onClick, ...props }, ref) => {
  const { open, setOpen } = useCollapsible()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(!open)
    onClick?.(e)
  }

  if (asChild) {
    // Clone the child and add the onClick handler
    return <>{React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, {
          onClick: handleClick,
          'data-state': open ? 'open' : 'closed',
        })
      }
      return child
    })}</>
  }

  return (
    <button
      ref={ref}
      type="button"
      data-state={open ? "open" : "closed"}
      className={cn("flex items-center justify-between w-full", className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
})
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  const { open } = useCollapsible()

  return (
    <div
      ref={ref}
      data-state={open ? "open" : "closed"}
      className={cn(
        "overflow-hidden transition-all duration-200",
        open ? "animate-accordion-down" : "animate-accordion-up hidden",
        className
      )}
      {...props}
    >
      {open && children}
    </div>
  )
})
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
