import { getProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main className="p-6 bg-[#f3f3f3] min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </main>
  );
}
