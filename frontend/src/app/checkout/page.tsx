"use client";

import { useEffect, useState } from "react";
import { getCart, createOrder, createPaymentIntent, confirmPayment } from "@/lib/api";
import { CartItemRead, OrderRead, PaymentIntent } from "@/types";
import { ShieldCheck, ChevronRight, MapPin, CreditCard } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
    const [cart, setCart] = useState<CartItemRead[]>([]);
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<OrderRead | null>(null);
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);

    const fetchCart = async () => {
        const data = await getCart();
        setCart(data);
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setLoading(true);

        try {
            const orderData = await createOrder({
                cart_item_ids: cart.map((c) => c.id),
            });
            setOrder(orderData);

            const paymentIntent = await createPaymentIntent({ order_id: orderData.id });
            await confirmPayment({ payment_id: paymentIntent.id });
            setPaymentConfirmed(true);
            await fetchCart();
        } catch (error) {
            console.error("Checkout failed:", error);
        }

        setLoading(false);
    };

    const subtotal = cart.reduce((acc, c) => acc + c.product.price * c.quantity, 0);

    if (cart.length === 0 && !order) {
        return (
            <main className="bg-white min-h-screen">
                <div className="max-w-4xl mx-auto p-8 text-center">
                    <h1 className="text-3xl font-medium mb-6">Your checkout is empty</h1>
                    <Link href="/">
                        <button className="bg-amazon-yellow px-8 py-2 rounded-full font-medium border border-[#F2C200]">
                            Go back to shopping
                        </button>
                    </Link>
                </div>
            </main>
        );
    }

    if (paymentConfirmed && order) {
        return (
            <main className="bg-[#EAEDED] min-h-screen p-4 md:p-8">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-white p-8 rounded-lg shadow-sm text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck size={40} />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Thank you, your order has been placed.</h1>
                        <p className="text-gray-600">Please check your email for order confirmation and detailed delivery information.</p>
                        <div className="text-sm text-gray-500 pt-4">
                            Order # {order.id.split('-')[0].toUpperCase()}
                        </div>
                        <Link href="/" className="block pt-4">
                            <button className="bg-amazon-yellow px-8 py-2 rounded-full font-medium border border-[#F2C200]">
                                Return to Store
                            </button>
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="bg-[#EAEDED] min-h-screen">
            {/* Minimal Header */}
            <div className="bg-white border-b border-gray-200 py-3">
                <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center">
                    <Link href="/" className="text-2xl font-bold text-amazon-blue">MyShop</Link>
                    <h1 className="text-2xl font-medium text-gray-700 hidden md:block">Checkout</h1>
                    <div className="text-gray-400">
                        <ShieldCheck size={24} />
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-6">

                {/* Steps Section */}
                <div className="flex-1 space-y-4">
                    {/* Item 1: Shipping */}
                    <div className="bg-white rounded-md border border-gray-200">
                        <div className="p-4 flex gap-4">
                            <span className="font-bold text-gray-900 text-lg">1</span>
                            <div className="flex-1 flex justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900">Shipping address</h3>
                                    <p className="text-sm text-gray-700 mt-1">123 MyStreet, Tech City, 94043</p>
                                </div>
                                <button className="text-sm text-amazon-link hover:underline">Change</button>
                            </div>
                        </div>
                    </div>

                    {/* Item 2: Payment */}
                    <div className="bg-white rounded-md border border-gray-200">
                        <div className="p-4 flex gap-4">
                            <span className="font-bold text-gray-900 text-lg">2</span>
                            <div className="flex-1 flex justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900">Payment method</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                                        <CreditCard size={16} />
                                        <span>Visa ending in 1234</span>
                                    </div>
                                </div>
                                <button className="text-sm text-amazon-link hover:underline">Change</button>
                            </div>
                        </div>
                    </div>

                    {/* Item 3: Review Items */}
                    <div className="bg-white rounded-md border border-gray-200 p-4">
                        <div className="flex gap-4">
                            <span className="font-bold text-gray-900 text-lg">3</span>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 mb-4">Review items and shipping</h3>
                                <div className="space-y-4">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex gap-4 p-2 border border-gray-100 rounded-md">
                                            <img
                                                src={item.product.image_url}
                                                className="w-20 h-20 object-contain shrink-0 mix-blend-multiply"
                                                alt=""
                                            />
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold line-clamp-2">{item.product.name}</h4>
                                                <p className="text-sm text-[#B12704] font-medium mt-1">
                                                    ${(item.product.price / 100).toFixed(2)}
                                                </p>
                                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Place Order Sidebar */}
                <div className="w-full lg:w-[350px]">
                    <div className="bg-white p-6 rounded-md border border-gray-200 space-y-4 sticky top-4">
                        <button
                            disabled={loading}
                            onClick={handleCheckout}
                            className="w-full bg-amazon-yellow hover:bg-[#F7CA00] text-gray-900 py-2 rounded-md font-medium shadow-sm transition-colors border border-[#F2C200] text-sm"
                        >
                            {loading ? "Processing..." : "Place your order"}
                        </button>

                        <p className="text-[10px] text-gray-500 text-center text-xs leading-tight">
                            By placing your order, you agree to MyShop's privacy notice and conditions of use.
                        </p>

                        <div className="border-t border-gray-200 pt-4 space-y-2">
                            <h3 className="font-bold text-gray-900">Order Summary</h3>
                            <div className="flex justify-between text-sm">
                                <span>Items ({cart.length}):</span>
                                <span>${(subtotal / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Shipping & handling:</span>
                                <span>$0.00</span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-gray-100 pt-2 font-bold text-[#B12704] text-lg">
                                <span>Order total:</span>
                                <span>${(subtotal / 100).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="bg-[#F0F2F2] border border-[#D5D9D9] p-3 rounded-md">
                            <p className="text-xs text-amazon-link hover:underline cursor-pointer">How are shipping costs calculated?</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
