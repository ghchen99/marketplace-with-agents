"use client";

import { useEffect, useState } from "react";
import { getOrders } from "@/lib/api";
import { OrderRead } from "@/types";
import { Package, ChevronRight } from "lucide-react";

export default function OrdersPage() {
    const [orders, setOrders] = useState<OrderRead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await getOrders();
                // Sort by ID or creation date if available (here we just reverse for newest first)
                setOrders(data.reverse());
            } catch (err) {
                console.error("Failed to fetch orders:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    return (
        <main className="bg-background min-h-screen p-4 md:p-8">
            <div className="max-w-[1000px] mx-auto space-y-6">
                <nav className="flex items-center text-sm text-gray-500 gap-1 mb-2">
                    <span>Your Account</span>
                    <ChevronRight size={14} />
                    <span className="text-amazon-orange font-medium">Your Orders</span>
                </nav>

                <h1 className="text-3xl font-medium text-gray-900">Your Orders</h1>

                <div className="border-b border-gray-200">
                    <div className="flex gap-8 text-sm font-medium pb-2">
                        <span className="border-b-2 border-amazon-orange text-gray-900 pb-2">Orders</span>
                        <span className="text-gray-500 hover:text-gray-700 cursor-pointer">Buy Again</span>
                        <span className="text-gray-500 hover:text-gray-700 cursor-pointer">Not Yet Shipped</span>
                        <span className="text-gray-500 hover:text-gray-700 cursor-pointer">Cancelled</span>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center">Loading your orders...</div>
                ) : orders.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-sm border border-gray-200">
                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                        <h2 className="text-xl font-bold mb-2">You haven't placed any orders yet.</h2>
                        <p className="text-sm text-gray-500">Go to the homepage to find something you'll love!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-lg border border-gray-300 overflow-hidden shadow-sm">
                                {/* Order Header */}
                                <div className="bg-[#F0F2F2] px-6 py-4 flex flex-wrap justify-between gap-4 border-b border-gray-300 text-xs text-gray-600">
                                    <div className="flex gap-8">
                                        <div>
                                            <p className="uppercase font-bold">Order Placed</p>
                                            <p>Today</p>
                                        </div>
                                        <div>
                                            <p className="uppercase font-bold">Total</p>
                                            <p className="font-bold text-gray-900">${(order.total_amount / 100).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="uppercase font-bold">Ship To</p>
                                            <p className="text-amazon-link hover:underline cursor-pointer">User</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="uppercase font-bold">Order # {order.id.split('-')[0].toUpperCase()}</p>
                                        <div className="flex gap-2 justify-end mt-1">
                                            <span className="text-amazon-link hover:underline cursor-pointer">View order details</span>
                                            <span className="text-gray-300">|</span>
                                            <span className="text-amazon-link hover:underline cursor-pointer">Invoice</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 space-y-4">
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {order.status === 'paid' ? 'Delivered 📦' : 'Status: ' + order.status}
                                            </h3>
                                            <p className="text-sm text-gray-600">Package was handed directly to resident</p>

                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex gap-4">
                                                    <div className="w-20 h-20 bg-gray-50 rounded border flex items-center justify-center p-1">
                                                        {/* For simplicity we show a placeholder since we only have productIds here */}
                                                        <Package size={32} className="text-gray-300" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-amazon-link hover:underline cursor-pointer line-clamp-2">
                                                            Product ID: {item.product_id}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">Quantity: {item.quantity}</p>
                                                        <button className="bg-amazon-yellow px-4 py-1 rounded-full text-xs font-medium border border-[#F2C200] mt-2">
                                                            Buy it again
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="w-48 space-y-2 shrink-0">
                                            <button className="w-full bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors">
                                                Track package
                                            </button>
                                            <button className="w-full bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors">
                                                Return or replace items
                                            </button>
                                            <button className="w-full bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors">
                                                Share gift receipt
                                            </button>
                                            <button className="w-full bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors">
                                                Write a product review
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
