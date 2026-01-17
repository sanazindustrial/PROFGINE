import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: 'sm' | 'md' | 'lg'
    text?: string
}

export function LoadingSpinner({
    size = 'md',
    text,
    className,
    ...props
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8'
    }

    return (
        <div
            className={cn(
                "flex items-center justify-center space-x-2",
                className
            )}
            {...props}
        >
            <Loader2 className={cn("animate-spin", sizeClasses[size])} />
            {text && (
                <span className="animate-pulse text-sm text-muted-foreground">
                    {text}
                </span>
            )}
        </div>
    )
}

interface LoadingCardProps {
    title?: string
    description?: string
}

export function LoadingCard({ title, description }: LoadingCardProps) {
    return (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="space-y-4">
                <div className="space-y-2">
                    {title && (
                        <div className="h-6 w-1/3 animate-pulse rounded bg-muted"></div>
                    )}
                    {description && (
                        <div className="h-4 w-2/3 animate-pulse rounded bg-muted"></div>
                    )}
                </div>
                <div className="space-y-3">
                    <div className="h-4 animate-pulse rounded bg-muted"></div>
                    <div className="h-4 w-4/5 animate-pulse rounded bg-muted"></div>
                    <div className="h-4 w-3/5 animate-pulse rounded bg-muted"></div>
                </div>
            </div>
        </div>
    )
}

export function LoadingPage() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="space-y-4 text-center">
                <LoadingSpinner size="lg" />
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold">Loading</h2>
                    <p className="text-sm text-muted-foreground">
                        Please wait while we prepare your content...
                    </p>
                </div>
            </div>
        </div>
    )
}