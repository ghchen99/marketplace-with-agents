import { getProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main className="bg-background min-h-screen">
      <div className="max-w-[1500px] mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Recommended for you</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </main>
  );
}
