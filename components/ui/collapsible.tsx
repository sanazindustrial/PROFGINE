"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type CollapsibleContextValue = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null)

interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
}

const Collapsible = ({
    open,
    defaultOpen = false,
    onOpenChange,
    className,
    children,
    ...props
}: CollapsibleProps) => {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
    const isControlled = typeof open === "boolean"
    const isOpen = isControlled ? open : internalOpen

    const handleOpenChange = (nextOpen: boolean) => {
        if (!isControlled) {
            setInternalOpen(nextOpen)
        }
        onOpenChange?.(nextOpen)
    }

    return (
        <CollapsibleContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
            <div className={cn("w-full", className)} {...props}>
                {children}
            </div>
        </CollapsibleContext.Provider>
    )
}

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean
}

const CollapsibleTrigger = ({
    className,
    children,
    onClick,
    ...props
}: CollapsibleTriggerProps) => {
    const context = React.useContext(CollapsibleContext)

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (context) {
            context.onOpenChange(!context.open)
        }
    }

    return (
        <button
            type="button"
            className={cn("w-full", className)}
            data-state={context?.open ? "open" : "closed"}
            onClick={handleClick}
            {...props}
        >
            {children}
        </button>
    )
}

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> { }

const CollapsibleContent = ({ className, children, ...props }: CollapsibleContentProps) => {
    const context = React.useContext(CollapsibleContext)
    const isOpen = context?.open

    return (
        <div
            className={cn(isOpen ? "block" : "hidden", className)}
            data-state={isOpen ? "open" : "closed"}
            {...props}
        >
            {children}
        </div>
    )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
