"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProviderProps {
    children: React.ReactNode
    delayDuration?: number
}

const TooltipProvider = ({ children }: TooltipProviderProps) => {
    return <>{children}</>
}

interface TooltipProps {
    children: React.ReactNode
}

const Tooltip = ({ children }: TooltipProps) => {
    return <div className="relative inline-block">{children}</div>
}

interface TooltipTriggerProps {
    children: React.ReactNode
    asChild?: boolean
}

const TooltipTrigger = React.forwardRef<
    HTMLDivElement,
    TooltipTriggerProps & React.HTMLAttributes<HTMLDivElement>
>(({ children, asChild, className, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            "data-tooltip-trigger": true,
            ...props,
        })
    }
    return (
        <div ref={ref} className={cn("inline-block", className)} {...props}>
            {children}
        </div>
    )
})
TooltipTrigger.displayName = "TooltipTrigger"

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    side?: "top" | "right" | "bottom" | "left"
    sideOffset?: number
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
    ({ className, children, side = "top", sideOffset = 4, ...props }, ref) => (
        <div
            ref={ref}
            role="tooltip"
            className={cn(
                "absolute z-50 hidden overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md group-hover:block peer-hover:block",
                side === "top" && "bottom-full left-1/2 mb-2 -translate-x-1/2",
                side === "bottom" && "left-1/2 top-full mt-2 -translate-x-1/2",
                side === "left" && "right-full top-1/2 mr-2 -translate-y-1/2",
                side === "right" && "left-full top-1/2 ml-2 -translate-y-1/2",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
)
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
