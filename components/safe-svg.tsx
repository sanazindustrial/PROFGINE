"use client"

import { sanitizeSVG } from "@/lib/sanitize-svg"

interface SafeSVGProps {
    svg: string
    className?: string
    onClick?: () => void
}

/**
 * Renders AI-generated SVG safely by sanitizing dangerous elements/attributes first.
 */
export function SafeSVG({ svg, className, onClick }: SafeSVGProps) {
    return (
        <div
            className={className}
            onClick={onClick}
            dangerouslySetInnerHTML={{ __html: sanitizeSVG(svg) }}
        />
    )
}
