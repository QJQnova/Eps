import { useParams } from "wouter";
import AdminSidebar from "@/components/admin/sidebar";
import ProductForm from "@/components/admin/product-form";

export default function ProductFormPage() {
  const params = useParams<{ id?: string }>();
  const productId = params.id ? parseInt(params.id) : undefined;
  const isEditing = !!productId;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {isEditing ? "Редактирование товара" : "Создание нового товара"}
        </h1>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <ProductForm productId={productId} />
        </div>
      </div>
    </div>
  );
}