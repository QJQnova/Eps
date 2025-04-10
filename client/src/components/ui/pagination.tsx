import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Generate page numbers to show
  const getPageNumbers = () => {
    const range: number[] = [];
    
    // Always show the first page
    range.push(1);
    
    // Calculate the range of pages to show around the current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    // Add ellipsis after first page if needed
    if (start > 2) {
      range.push(-1); // Use -1 to indicate ellipsis
    }
    
    // Add the range of pages
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (end < totalPages - 1) {
      range.push(-2); // Use -2 to indicate ellipsis (different key)
    }
    
    // Always show the last page
    if (totalPages > 1) {
      range.push(totalPages);
    }
    
    return range;
  };
  
  return (
    <nav className="inline-flex rounded-md shadow">
      <Button
        variant="outline"
        size="icon"
        className="py-2 px-4 border border-gray-300 bg-white text-sm text-gray-500 hover:bg-gray-50"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {getPageNumbers().map((pageNum, index) => (
        pageNum < 0 ? (
          // Render ellipsis
          <span 
            key={pageNum} 
            className="py-2 px-4 border border-gray-300 bg-white text-sm font-medium text-gray-700"
          >
            ...
          </span>
        ) : (
          // Render page number
          <Button
            key={pageNum}
            variant={pageNum === currentPage ? "default" : "outline"}
            className={`py-2 px-4 border border-gray-300 text-sm font-medium ${
              pageNum === currentPage
                ? "bg-primary text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum}
          </Button>
        )
      ))}
      
      <Button
        variant="outline"
        size="icon"
        className="py-2 px-4 border border-gray-300 bg-white text-sm text-gray-500 hover:bg-gray-50"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
