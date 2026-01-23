"use client";

import { useEffect, useState } from "react";
import { getCart, updateCartItem, deleteCartItem } from "@/lib/api";
import { CartItemRead } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";

export default function CartPage() {
    const [cart, setCart] = useState<CartItemRead[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchCart = async () => {
        const data = await getCart();
        setCart(data);
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const handleUpdateQuantity = async (id: string, qty: number) => {
        if (qty < 1) return;
        setLoading(true);
        await updateCartItem(id, qty);
        await fetchCart();
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        await deleteCartItem(id);
        await fetchCart();
        setLoading(false);
    };

    const total = cart.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0
    );

    return (
        <main className="p-6 bg-[#f3f3f3] min-h-screen">
            <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
            {cart.length === 0 && <p>Your cart is empty.</p>}
            <div className="space-y-4">
                {cart.map((item) => (
                    <Card key={item.id}>
                        <CardContent className="flex items-center gap-4">
                            <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="w-24 h-24 object-cover rounded-md"
                            />
                            <div className="flex-1">
                                <h2 className="font-semibold">{item.product.name}</h2>
                                <p>${item.product.price}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            handleUpdateQuantity(item.id, item.quantity - 1)
                                        }
                                        disabled={loading || item.quantity <= 1}
                                    >
                                        -
                                    </Button>
                                    <span>{item.quantity}</span>
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            handleUpdateQuantity(item.id, item.quantity + 1)
                                        }
                                        disabled={loading}
                                    >
                                        +
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDelete(item.id)}
                                        disabled={loading}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {cart.length > 0 && (
                <div className="mt-6 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Total: ${total}</h2>
                    <Link href="/checkout">
                        <Button>Proceed to Checkout</Button>
                    </Link>
                </div>
            )}
        </main>
    );
}
