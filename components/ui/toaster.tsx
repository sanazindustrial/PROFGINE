"use client"

import { useToast } from "@/components/ui/use-toast"
import { X } from "lucide-react"

export function Toaster() {
    const { toasts, dismiss } = useToast()

    if (toasts.length === 0) return null

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`pointer-events-auto animate-in slide-in-from-bottom-5 rounded-lg border p-4 shadow-lg transition-all ${t.variant === "destructive"
                        ? "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
                        : "border-border bg-background text-foreground"
                        }`}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                            {t.title && (
                                <p className="text-sm font-semibold">{t.title}</p>
                            )}
                            {t.description && (
                                <p className="text-sm opacity-90">{t.description}</p>
                            )}
                        </div>
                        <button
                            onClick={() => dismiss(t.id)}
                            className="shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
                            aria-label="Dismiss notification"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                    {t.action && <div className="mt-2">{t.action}</div>}
                </div>
            ))}
        </div>
    )
}
