import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                "skeleton animate-pulse rounded-md bg-muted",
                className
            )}
            {...props}
        />
    )
}

// Specialized skeleton components for common use cases
export function SkeletonCard({ className, ...props }: SkeletonProps) {
    return (
        <div className={cn("space-y-3", className)} {...props}>
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </div>
    )
}

export function SkeletonText({ lines = 3, className, ...props }: SkeletonProps & { lines?: number }) {
    return (
        <div className={cn("space-y-2", className)} {...props}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        "h-4",
                        i === lines - 1 ? "w-3/4" : "w-full"
                    )}
                />
            ))}
        </div>
    )
}

export function SkeletonButton({ className, ...props }: SkeletonProps) {
    return (
        <Skeleton
            className={cn("h-10 w-24 rounded-md", className)}
            {...props}
        />
    )
}