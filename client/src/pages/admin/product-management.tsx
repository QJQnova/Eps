import AdminSidebar from "@/components/admin/sidebar";
import ProductTable from "@/components/admin/product-table";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function ProductManagement() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Управление товарами</h1>
          <Link href="/emergency-delete">
            <Button variant="outline" className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              Экстренное удаление
            </Button>
          </Link>
        </div>
        <ProductTable />
      </div>
    </div>
  );
}
