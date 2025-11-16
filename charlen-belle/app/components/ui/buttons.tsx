import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c3aa4c] disabled:pointer-events-none disabled:opacity-50",
          {
            // Updated default variant to match your login page design
            'bg-[#c3aa4c] text-white hover:bg-[#b0963d] active:bg-[#9c8536] shadow-sm': variant === 'default',
            
            // Updated outline variant to match the color scheme
            'border border-[#c3aa4c] text-[#c3aa4c] hover:bg-[#fdf8e8]': variant === 'outline',
            
            // Neutral secondary variant
            'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
            
            // Minimal ghost variant
            'text-gray-700 hover:bg-gray-100': variant === 'ghost',
            
            // Error state
            'bg-red-500 text-white hover:bg-red-600': variant === 'destructive',
          },
          {
            'h-12 px-6 text-base': size === 'default',
            'h-9 px-4 text-sm': size === 'sm',
            'h-14 px-8 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button }