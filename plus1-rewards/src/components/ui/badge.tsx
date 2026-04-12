import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { clsx } from "clsx"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-blue-600 text-white",
        secondary: "border-transparent bg-gray-100 text-gray-900",
        destructive: "border-transparent bg-red-100 text-red-700",
        outline: "border-gray-200 text-gray-700",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={clsx(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
