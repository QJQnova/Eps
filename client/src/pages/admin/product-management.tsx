import AdminSidebar from "@/components/admin/sidebar";
import ProductTable from "@/components/admin/product-table";

export default function ProductManagement() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Управление товарами</h1>
        <ProductTable />
      </div>
    </div>
  );
}
