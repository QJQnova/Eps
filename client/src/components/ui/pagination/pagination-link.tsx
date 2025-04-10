import * as React from "react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface PaginationLinkProps extends React.HTMLAttributes<HTMLButtonElement> {
  isActive?: boolean
}

const PaginationLink = ({
  className,
  isActive,
  children,
  ...props
}: PaginationLinkProps) => (
  <button
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size: "icon",
      }),
      className
    )}
    {...props}
  >
    {children}
  </button>
)
PaginationLink.displayName = "PaginationLink"

export { PaginationLink }