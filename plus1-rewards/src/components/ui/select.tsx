import * as React from "react"
import { clsx } from "clsx"
import { ChevronDown } from "lucide-react"

// Simple native select wrappers matching the shadcn/ui API surface

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}

const SelectContext = React.createContext<{ value?: string; onValueChange?: (v: string) => void }>({})

function Select({ value, onValueChange, children }: SelectProps) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      {children}
    </SelectContext.Provider>
  )
}

function SelectTrigger({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("relative flex items-center", className)} {...props}>
      {children}
    </div>
  )
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext)
  return <span className="flex-1 text-left">{value || placeholder}</span>
}

interface SelectContentProps {
  className?: string
  children?: React.ReactNode
}

function SelectContent({ className, children }: SelectContentProps) {
  return <>{children}</>
}

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  value: string
  children?: React.ReactNode
}

function SelectItem({ value, children, ...props }: SelectItemProps) {
  return <option value={value} {...props}>{children}</option>
}

// The actual rendered select — wraps everything into a native <select>
interface NativeSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children?: React.ReactNode
  placeholder?: string
}

// Re-export a combined component that works as a native select
function SelectRoot({ value, onValueChange, className, children, placeholder }: NativeSelectProps) {
  // Extract option values from SelectItem children
  const options: { value: string; label: React.ReactNode }[] = []

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && (child.type === SelectContent || child.type === SelectItem)) {
      if (child.type === SelectContent) {
        React.Children.forEach((child as React.ReactElement<SelectContentProps>).props.children, (item) => {
          if (React.isValidElement(item) && item.type === SelectItem) {
            const itemEl = item as React.ReactElement<SelectItemProps>
            options.push({ value: itemEl.props.value, label: itemEl.props.children })
          }
        })
      } else {
        const itemEl = child as React.ReactElement<SelectItemProps>
        options.push({ value: itemEl.props.value, label: itemEl.props.children })
      }
    }
  })

  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        className={clsx(
          "w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    </div>
  )
}

export { SelectRoot as Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
