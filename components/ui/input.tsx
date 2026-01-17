import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  `
    block w-full text-sm text-gray-500
    file:me-4 file:py-2 file:px-4
    file:rounded-lg file:border-0
    file:text-sm file:font-semibold
    file:disabled:opacity-50
    file:disabled:pointer-events-none
    dark:text-neutral-500
  `,
  {
    variants: {
      variant: {
        default: `
          file:text-slate-200
          file:bg-blue-myta
          hover:file:bg-blue-700
        `,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
