import { searchProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

interface SearchPageProps {
    searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams;
    const query = params.q || "";
    const category = params.category || "";
    const products = await searchProducts(query, category);

    const displayTitle = () => {
        if (query && category && category !== "All") return <>Results for <span className="text-amazon-orange font-bold">"{query}"</span> in <span className="font-bold text-gray-700">{category}</span></>;
        if (query) return <>Results for <span className="text-amazon-orange font-bold">"{query}"</span></>;
        if (category && category !== "All") return <>Products in <span className="font-bold text-gray-700">{category}</span></>;
        return <>All Products</>;
    };

    return (
        <main className="bg-background min-h-screen">
            <div className="max-w-[1500px] mx-auto p-4 md:p-6">
                <div className="mb-6">
                    <h1 className="text-xl font-medium text-gray-900">
                        {products.length > 0 ? (
                            displayTitle()
                        ) : (
                            <>No results found for <span className="text-amazon-orange font-bold">"{query}"</span> {category && category !== "All" && <>in <span className="font-bold text-gray-700">{category}</span></>}</>
                        )}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">{products.length} items found</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {products.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>

                {products.length === 0 && (
                    <div className="mt-12 text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-800">No matches found</h2>
                        <p className="text-gray-600 mt-2">Try checking your spelling or use more general terms</p>
                    </div>
                )}
            </div>
        </main>
    );
}
