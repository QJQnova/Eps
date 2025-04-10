import { useParams } from "wouter";
import ProductForm from "@/components/admin/product-form";
import AdminSidebar from "@/components/admin/sidebar";

export default function ProductFormPage() {
  const params = useParams();
  const productId = params.id ? parseInt(params.id) : undefined;
  
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {productId ? "Редактирование товара" : "Создание товара"}
          </h1>
          <p className="text-muted-foreground">
            {productId
              ? "Измените информацию о товаре"
              : "Заполните форму для создания нового товара"}
          </p>
        </div>
        <ProductForm productId={productId} />
      </div>
    </div>
  );
}