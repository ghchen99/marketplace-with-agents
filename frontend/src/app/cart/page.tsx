"use client";

import { useEffect, useState } from "react";
import { getCart, updateCartItem, deleteCartItem } from "@/lib/api";
import { CartItemRead } from "@/types";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

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

    const subtotal = cart.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0
    );

    const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <main className="bg-background min-h-screen p-4 md:p-8">
            <div className="max-w-[1500px] mx-auto flex flex-col lg:flex-row gap-6">

                {/* Shopping Cart List */}
                <div className="flex-1 bg-white p-6 shadow-sm rounded-sm">
                    <div className="border-b border-gray-200 pb-2 mb-4 flex justify-between items-end">
                        <h1 className="text-3xl font-medium text-gray-900">Shopping Cart</h1>
                        <span className="text-sm text-gray-500 hidden md:block">Price</span>
                    </div>

                    {cart.length === 0 ? (
                        <div className="py-12 text-center">
                            <h2 className="text-xl font-bold mb-4">Your MyShop Cart is empty.</h2>
                            <p className="text-sm mb-6">Your Shopping Cart lives to serve. Give it purpose — fill it with groceries, clothing, household supplies, electronics, and more.</p>
                            <Link href="/">
                                <button className="bg-amazon-yellow px-6 py-2 rounded-full font-medium border border-[#F2C200]">
                                    Continue shopping
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cart.map((item) => (
                                <div key={item.id} className="flex gap-4 border-b border-gray-200 pb-6">
                                    <div className="w-44 h-44 shrink-0 flex items-center justify-center p-2">
                                        <img
                                            src={item.product.image_url}
                                            alt={item.product.name}
                                            className="max-h-full max-w-full object-contain mix-blend-multiply"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <h2 className="text-lg font-medium text-gray-900 line-clamp-2 hover:text-amazon-link cursor-pointer">
                                                {item.product.name}
                                            </h2>
                                            <p className="text-lg font-bold text-gray-900 ml-4">
                                                ${(item.product.price / 100).toFixed(2)}
                                            </p>
                                        </div>
                                        <p className="text-xs text-[#007600] font-medium">In Stock</p>
                                        <p className="text-xs text-gray-500">Eligible for FREE Shipping</p>

                                        <div className="flex items-center gap-4 mt-3 pt-2">
                                            <div className="flex items-center bg-[#F0F2F2] border border-[#D5D9D9] rounded-md shadow-sm h-8">
                                                <button
                                                    className="px-3 hover:bg-[#E3E6E6] rounded-l-md transition-colors border-r"
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                    disabled={loading || item.quantity <= 1}
                                                >
                                                    -
                                                </button>
                                                <span className="px-4 text-sm font-medium">Qty: {item.quantity}</span>
                                                <button
                                                    className="px-3 hover:bg-[#E3E6E6] rounded-r-md transition-colors border-l"
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                    disabled={loading}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className="w-px h-4 bg-gray-300"></span>
                                            <button
                                                className="text-xs text-amazon-link hover:underline"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="text-right pt-2">
                                <p className="text-lg">
                                    Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''}): <span className="font-bold">${(subtotal / 100).toFixed(2)}</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Subtotal Sidebar */}
                {cart.length > 0 && (
                    <div className="w-full lg:w-[300px] space-y-4">
                        <div className="bg-white p-5 shadow-sm rounded-sm space-y-4 text-center">
                            <div className="flex items-start gap-2 text-sm text-[#007600] mb-2 text-left">
                                <CheckCircle2 size={24} className="shrink-0" />
                                <p>Your order qualifies for FREE Shipping. Choose this option at checkout.</p>
                            </div>

                            <div className="text-lg text-left">
                                Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''}): <span className="font-bold">${(subtotal / 100).toFixed(2)}</span>
                            </div>

                            <Link href="/checkout" className="block">
                                <button className="w-full bg-amazon-yellow hover:bg-[#F7CA00] text-gray-900 py-2 rounded-full font-medium shadow-sm transition-colors border border-[#F2C200] text-sm">
                                    Proceed to Checkout
                                </button>
                            </Link>
                        </div>

                        {/* Recommendation Box */}
                        <div className="bg-white p-5 shadow-sm rounded-sm">
                            <h3 className="font-bold text-sm mb-3">Recently viewed items</h3>
                            <div className="space-y-4">
                                {/* Placeholder for items */}
                                <div className="text-xs text-gray-500">More items coming soon...</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
