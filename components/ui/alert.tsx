import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => {
  // Áp dụng hiệu ứng kim loại pearl cho Alert
  const metalClass = getMetalClassName('pearl', 'static');
  const metalStyle = getMetalStyle('pearl');
  
  return (
    <div 
      ref={ref} 
      role="alert" 
      className={cn(alertVariants({ variant }), className, metalClass)} 
      style={{...metalStyle, ...props.style}}
      {...props} 
    />
  );
})
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  ),
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription }
