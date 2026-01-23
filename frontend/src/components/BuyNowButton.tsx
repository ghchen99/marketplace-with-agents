"use client";

import { addToCart } from "@/lib/api";
import { ProductRead } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
    product: ProductRead;
}

export default function BuyNowButton({ product }: Props) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleBuyNow = async () => {
        setLoading(true);
        try {
            await addToCart({ product_id: product.id, quantity: 1 });
            window.dispatchEvent(new Event('cart-updated'));
            router.push("/checkout");
        } catch (error) {
            console.error("Failed to process Buy Now:", error);
            alert("Failed to process Buy Now.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleBuyNow}
            disabled={loading}
            className="w-full bg-amazon-orange hover:bg-[#e47911] text-gray-900 py-3 rounded-full font-medium shadow-sm transition-colors border border-[#a88734] disabled:opacity-50"
        >
            {loading ? "Processing..." : "Buy Now"}
        </button>
    );
}
