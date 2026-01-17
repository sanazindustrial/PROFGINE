"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value?: number[]
    onValueChange?: (value: number[]) => void
    max?: number
    min?: number
    step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, value = [0], onValueChange, max = 100, min = 0, step = 1, ...props }, ref) => {
        const [internalValue, setInternalValue] = React.useState(value[0] || 0)

        React.useEffect(() => {
            if (value && value[0] !== undefined) {
                setInternalValue(value[0])
            }
        }, [value])

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = parseFloat(e.target.value)
            setInternalValue(newValue)
            if (onValueChange) {
                onValueChange([newValue])
            }
        }

        const percentage = ((internalValue - min) / (max - min)) * 100

        const progressPercentage = Math.max(0, Math.min(100, percentage))

        return (
            <div className="relative flex w-full items-center">
                <div
                    className={cn(
                        "relative h-2 w-full overflow-hidden rounded-full bg-gray-200",
                        className
                    )}
                    style={{ "--progress-width": `${progressPercentage}%` } as React.CSSProperties}
                >
                    {/* Progress bar */}
                    <div
                        className="absolute left-0 top-0 h-full rounded-full bg-blue-600 transition-all duration-150 ease-in-out"
                        style={{ width: "var(--progress-width)" }}
                    />

                    {/* Actual range input */}
                    <input
                        {...props}
                        ref={ref}
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={internalValue}
                        onChange={handleChange}
                        className={cn(
                            "absolute inset-0 size-full cursor-pointer opacity-0",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        )}
                    />

                    {/* Thumb */}
                    <div
                        className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-600 bg-white shadow-sm transition-all duration-150 ease-in-out hover:scale-110"
                        style={{ left: "var(--progress-width)" }}
                    />
                </div>
            </div>
        )
    }
)

Slider.displayName = "Slider"

export { Slider }