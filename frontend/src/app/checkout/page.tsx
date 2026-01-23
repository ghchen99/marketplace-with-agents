"use client";

import { useEffect, useState } from "react";
import { getCart, createOrder, createPaymentIntent, confirmPayment } from "@/lib/api";
import { CartItemRead, OrderRead } from "@/types";
import { Button } from "@/components/ui/button";

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
            // 1️⃣ Create order
            const orderData = await createOrder({
                cart_item_ids: cart.map((c) => c.id),
            });
            setOrder(orderData);

            // 2️⃣ Create payment intent
            const paymentIntent = await createPaymentIntent({ order_id: orderData.id });

            // 3️⃣ Confirm payment (mock)
            await confirmPayment({ payment_id: paymentIntent.id });
            setPaymentConfirmed(true);

            // 4️⃣ Refresh cart
            await fetchCart();
        } catch (error) {
            console.error("Checkout failed:", error);
        }

        setLoading(false);
    };

    if (cart.length === 0 && !order) {
        return (
            <main className="p-6 bg-[#f3f3f3] min-h-screen">
                <h1 className="text-3xl font-bold mb-6">Checkout</h1>
                <p>Your cart is empty.</p>
            </main>
        );
    }

    return (
        <main className="p-6 bg-[#f3f3f3] min-h-screen">
            <h1 className="text-3xl font-bold mb-6">Checkout</h1>

            {order ? (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">
                        Order #{order.id.slice(0, 8)}
                    </h2>
                    <p className="text-lg font-medium">Total: <span className="font-bold">${(order.total_amount / 100).toFixed(2)}</span></p>
                    <p>Status: {paymentConfirmed ? "Paid ✅" : order.status}</p>
                    <h3 className="font-semibold mt-4">Items:</h3>
                    <ul className="list-disc list-inside">
                        {order.items.map((item) => (
                            <li key={item.product_id}>
                                Product ID: {item.product_id.slice(0, 8)}, Quantity: {item.quantity}, Price: ${(item.price_at_purchase / 100).toFixed(2)}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Order Summary</h2>
                    <ul className="space-y-2">
                        {cart.map((item) => (
                            <li key={item.id} className="flex justify-between">
                                <span>{item.product.name} x {item.quantity}</span>
                                <span>${((item.product.price * item.quantity) / 100).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-xl font-bold border-t pt-4">Total: ${(cart.reduce((acc, c) => acc + c.product.price * c.quantity, 0) / 100).toFixed(2)}</p>
                    <Button onClick={handleCheckout} disabled={loading}>
                        {loading ? "Processing..." : "Pay Now"}
                    </Button>
                </div>
            )}
        </main>
    );
}
