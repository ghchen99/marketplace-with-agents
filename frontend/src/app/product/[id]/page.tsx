import { getProduct } from "@/lib/api";
import AddToCartButton from "@/components/AddToCartButton";

export default async function ProductPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const product = await getProduct(params.id);

    return (
        <main className="p-6 bg-[#f3f3f3] min-h-screen">
            <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto">
                <div className="w-full md:w-1/2 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="max-h-[500px] object-contain rounded-md"
                    />
                </div>
                <div className="flex-1 space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                        <p className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                            {product.category}
                        </p>
                    </div>

                    <div className="border-y border-gray-100 py-6">
                        <p className="text-gray-700 leading-relaxed text-lg">{product.description}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-gray-900">${(product.price / 100).toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                            {product.stock_quantity > 0 ? (
                                <span className="text-green-600">In Stock ({product.stock_quantity} available)</span>
                            ) : (
                                <span className="text-red-500">Out of Stock</span>
                            )}
                        </p>
                    </div>

                    <div className="pt-4">
                        <AddToCartButton product={product} />
                    </div>
                </div>
            </div>
        </main>
    );
}
