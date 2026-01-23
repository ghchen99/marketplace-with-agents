"use client";

import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/api";
import { ProductRead } from "@/types";

interface Props {
    product: ProductRead;
}

export default function AddToCartButton({ product }: Props) {
    const handleAddToCart = async () => {
        try {
            await addToCart({ product_id: product.id, quantity: 1 });
            alert("Added to cart!");
        } catch (error) {
            console.error("Failed to add to cart:", error);
            alert("Failed to add to cart.");
        }
    };

    return (
        <Button onClick={handleAddToCart} size="lg" className="w-full md:w-auto">
            Add to Cart
        </Button>
    );
}
