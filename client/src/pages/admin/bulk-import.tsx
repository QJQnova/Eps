import AdminSidebar from "@/components/admin/sidebar";
import ImportForm from "@/components/admin/import-form";

export default function BulkImport() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Bulk Product Import</h1>
        <ImportForm />
      </div>
    </div>
  );
}
