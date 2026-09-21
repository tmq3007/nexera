import { ProductFormPage } from "@/components/admin/ProductFormPage";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { productsApi } from "@/lib/api/products.api";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await productsApi.getProductDetail(id);

  return {
    title: product ? `Sửa: ${product.name} | Nexera Admin` : "Chỉnh sửa sản phẩm | Nexera Admin",
  };
}

export default async function ProductEditPage({ params }: Props) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    productsApi.getProductDetail(id),
    productsApi.getCategories(),
  ]);

  if (!product) notFound();

  return (
    <ProductFormPage
      mode="edit"
      initialData={product}
      categories={categories || []}
    />
  );
}
