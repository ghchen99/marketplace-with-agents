import { ProductRead, CartItemRead, OrderRead, CartItemCreate, OrderCreate, PaymentCreateIntent, PaymentConfirm, PaymentIntent } from "../types";

const BASE_URL = "http://127.0.0.1:8000";

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${url}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    if (!res.ok) throw new Error("API Error: " + res.statusText);
    return res.json();
}

// Products
export const getProducts = () => fetcher<ProductRead[]>("/products");
export const getProduct = (id: string) => fetcher<ProductRead>(`/products/${id}`);
export const searchProducts = (q?: string, category?: string) => {
    let url = `/products/search?`;
    if (q) url += `q=${encodeURIComponent(q)}&`;
    if (category && category !== "All") url += `category=${encodeURIComponent(category)}`;
    return fetcher<ProductRead[]>(url);
};
export const getCategories = () => fetcher<string[]>("/products/categories");

// Cart
export const getCart = () => fetcher<CartItemRead[]>("/cart");
export const addToCart = (data: CartItemCreate) =>
    fetcher<CartItemRead>("/cart", { method: "POST", body: JSON.stringify(data) });
export const updateCartItem = (id: string, quantity: number) =>
    fetcher<CartItemRead>(`/cart/${id}?quantity=${quantity}`, { method: "PUT" });
export const deleteCartItem = (id: string) =>
    fetcher(`/cart/${id}`, { method: "DELETE" });

// Orders
export const createOrder = (data: OrderCreate) => fetcher<OrderRead>("/orders", { method: "POST", body: JSON.stringify(data) });
export const getOrder = (id: string) => fetcher<OrderRead>(`/orders/${id}`);
export const getOrders = () => fetcher<OrderRead[]>("/orders");

// Payments
export const createPaymentIntent = (data: PaymentCreateIntent) =>
    fetcher<PaymentIntent>(`/payments/create-intent`, { method: "POST", body: JSON.stringify(data) });
export const confirmPayment = (data: PaymentConfirm) =>
    fetcher(`/payments/confirm`, { method: "POST", body: JSON.stringify(data) });
