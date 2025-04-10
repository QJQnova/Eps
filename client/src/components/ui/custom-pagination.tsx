import * as React from "react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"

// Pagination
const Pagination = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
))
Pagination.displayName = "Pagination"

// PaginationContent
const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

// PaginationItem
const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

// PaginationLink
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

// PaginationPrevious
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

// PaginationNext
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

// PaginationEllipsis
const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
    <span className="sr-only">Больше страниц</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
}