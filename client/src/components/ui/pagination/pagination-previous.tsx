import * as React from "react"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<"button">) => (
  <button
    aria-label="На предыдущую страницу"
    className={cn(buttonVariants({ variant: "outline", size: "icon" }), className)}
    {...props}
  >
    <ArrowLeft className="h-4 w-4" />
  </button>
)
PaginationPrevious.displayName = "PaginationPrevious"

export { PaginationPrevious }