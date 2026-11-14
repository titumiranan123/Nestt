import ProductEditor from "@/components/admin/products/ProductEditor";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  return <ProductEditor productId={id} />;
}
