export interface ProductRead {
    id: string;
    name: string;
    description: string;
    price: number;
    stock_quantity: number;
    category: string;
    image_url: string;
}

export interface CartItemRead {
    id: string;
    product: ProductRead;
    quantity: number;
}

export interface CartItemCreate {
    product_id: string;
    quantity: number;
}

export interface OrderItemRead {
    product_id: string;
    quantity: number;
    price_at_purchase: number;
}

export interface OrderRead {
    id: string;
    total_amount: number;
    status: "pending" | "paid";
    items: OrderItemRead[];
}

export interface OrderCreate {
    cart_item_ids: string[];
}

export interface PaymentCreateIntent {
    order_id: string;
}

export interface PaymentConfirm {
    payment_id: string;
}
