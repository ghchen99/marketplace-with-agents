import { getProduct, addToCart } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Props {
    params: { id: string };
}

export default async function ProductPage({ params }: Props) {
    const product = await getProduct(params.id);

    const handleAddToCart = async () => {
        await addToCart({ product_id: product.id, quantity: 1 });
        alert("Added to cart!");
    };

    return (
        <main className="p-6 bg-[#f3f3f3] min-h-screen">
            <div className="flex flex-col md:flex-row gap-6">
                <img src={product.image_url} alt={product.name} className="w-full md:w-1/2 rounded-md" />
                <div className="flex-1 space-y-4">
                    <h1 className="text-2xl font-bold">{product.name}</h1>
                    <p className="text-gray-600">{product.description}</p>
                    <p className="text-xl font-semibold">${product.price}</p>
                    <Button onClick={handleAddToCart}>Add to Cart</Button>
                </div>
            </div>
        </main>
    );
}
