"use client";

import { addToCart } from "@/lib/api";
import { ProductRead } from "@/types";

interface Props {
    product: ProductRead;
}

export default function AddToCartButton({ product }: Props) {
    const handleAddToCart = async () => {
        try {
            await addToCart({ product_id: product.id, quantity: 1 });
            // Alert the navbar to update
            window.dispatchEvent(new Event('cart-updated'));
            alert("Added to cart!");
        } catch (error) {
            console.error("Failed to add to cart:", error);
            alert("Failed to add to cart.");
        }
    };

    return (
        <button
            onClick={handleAddToCart}
            className="w-full bg-amazon-yellow hover:bg-[#F7CA00] text-gray-900 py-3 rounded-full font-medium shadow-sm transition-colors border border-[#F2C200]"
        >
            Add to Cart
        </button>
    );
}
