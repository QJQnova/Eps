import * as React from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<"button">) => (
  <button
    aria-label="На следующую страницу"
    className={cn(buttonVariants({ variant: "outline", size: "icon" }), className)}
    {...props}
  >
    <ArrowRight className="h-4 w-4" />
  </button>
)
PaginationNext.displayName = "PaginationNext"

export { PaginationNext }