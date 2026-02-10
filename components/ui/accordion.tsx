"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type AccordionContextValue = {
    value?: string
    onValueChange?: (value?: string) => void
    collapsible?: boolean
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null)

type AccordionItemContextValue = {
    value: string
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null)

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: string
    onValueChange?: (value?: string) => void
    type?: "single"
    collapsible?: boolean
}

const Accordion = ({
    value,
    onValueChange,
    collapsible = false,
    className,
    children,
    ...props
}: AccordionProps) => (
    <AccordionContext.Provider value={{ value, onValueChange, collapsible }}>
        <div className={cn("w-full", className)} {...props}>
            {children}
        </div>
    </AccordionContext.Provider>
)

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string
}

const AccordionItem = ({ value, className, children, ...props }: AccordionItemProps) => (
    <AccordionItemContext.Provider value={{ value }}>
        <div className={cn("w-full", className)} data-value={value} {...props}>
            {children}
        </div>
    </AccordionItemContext.Provider>
)

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { }

const AccordionTrigger = ({ className, children, onClick, ...props }: AccordionTriggerProps) => {
    const accordion = React.useContext(AccordionContext)
    const item = React.useContext(AccordionItemContext)
    const isOpen = accordion?.value === item?.value

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented || !accordion || !item) return

        if (isOpen && accordion.collapsible) {
            accordion.onValueChange?.(undefined)
            return
        }

        accordion.onValueChange?.(item.value)
    }

    return (
        <button
            type="button"
            className={cn("w-full", className)}
            data-state={isOpen ? "open" : "closed"}
            onClick={handleClick}
            {...props}
        >
            {children}
        </button>
    )
}

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> { }

const AccordionContent = ({ className, children, ...props }: AccordionContentProps) => {
    const accordion = React.useContext(AccordionContext)
    const item = React.useContext(AccordionItemContext)
    const isOpen = accordion?.value === item?.value

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

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
