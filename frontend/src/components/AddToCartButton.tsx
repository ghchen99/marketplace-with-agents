"use client";

import { addToCart } from "@/lib/api";
import { ProductRead } from "@/types";

interface Props {
    product: ProductRead;
    variant?: "default" | "small";
}

export default function AddToCartButton({ product, variant = "default" }: Props) {
    const handleAddToCart = async () => {
        try {
            await addToCart({ product_id: product.id, quantity: 1 });
            // Alert the navbar to update
            window.dispatchEvent(new Event('cart-updated'));
            // Optional: You could show a more subtle notification instead of an alert
            // alert("Added to basket!"); 
        } catch (error) {
            console.error("Failed to add to basket:", error);
            alert("Failed to add to basket.");
        }
    };

    if (variant === "small") {
        return (
            <button
                onClick={handleAddToCart}
                className="w-full bg-amazon-yellow hover:bg-[#F3A847] text-gray-900 py-1.5 rounded-full text-sm font-medium shadow-sm transition-colors"
            >
                Add to basket
            </button>
        );
    }

    return (
        <button
            onClick={handleAddToCart}
            className="w-full bg-amazon-yellow hover:bg-[#F7CA00] text-gray-900 py-3 rounded-full font-medium shadow-sm transition-colors border border-[#F2C200]"
        >
            Add to basket
        </button>
    );
}
