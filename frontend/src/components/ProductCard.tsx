import Link from "next/link";
import { ProductRead } from "@/types";
import { Star } from "lucide-react";
import AddToCartButton from "./AddToCartButton";

interface Props {
    product: ProductRead;
}

export default function ProductCard({ product }: Props) {
    return (
        <div className="bg-white p-4 flex flex-col h-full border border-transparent hover:border-gray-200 transition-all rounded-md">
            <Link href={`/product/${product.id}`} className="flex-1 flex flex-col">
                <div className="h-48 flex items-center justify-center p-4 bg-gray-50 rounded-md mb-4">
                    <img src={product.image_url} alt={product.name} className="max-h-full object-contain mix-blend-multiply" />
                </div>

                <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-amazon-link transition-colors leading-tight mb-2">
                    {product.name}
                </h3>
            </Link>

            <div className="mt-auto space-y-2">
                <div className="flex items-center text-amazon-orange">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} strokeWidth={1.5} />
                    ))}
                    <span className="text-xs text-amazon-link ml-1 mt-1 font-medium hover:text-[#c45500]">
                        {product.review_count.toLocaleString()}
                    </span>
                </div>

                <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-sm font-medium self-start mt-0.5">$</span>
                    <span className="text-2xl font-bold">{(product.price / 100).toFixed(0)}</span>
                    <span className="text-sm font-medium self-start mt-0.5">{(product.price % 100).toString().padStart(2, '0')}</span>
                </div>

                <p className="text-xs text-gray-500 mb-2">
                    Prime <span className="text-gray-900 font-medium">Overnight</span>
                </p>

                <div className="pt-2">
                    <AddToCartButton product={product} variant="small" />
                </div>
            </div>
        </div>
    );
}
