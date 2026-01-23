from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime
from enum import Enum

app = FastAPI(title="Simple E-Commerce Backend")

# -----------------------------
# Mock Database (In-Memory)
# -----------------------------
from database import products_db, cart_db, orders_db, order_items_db, payments_db

# -----------------------------
# Enums
# -----------------------------
class OrderStatus(str, Enum):
    pending = "pending"
    paid = "paid"

class PaymentStatus(str, Enum):
    pending = "pending"
    succeeded = "succeeded"
    failed = "failed"

# -----------------------------
# Product Schemas
# -----------------------------
class ProductCreate(BaseModel):
    name: str
    description: str
    price: int
    stock_quantity: int
    category: str
    image_url: str

class ProductRead(ProductCreate):
    id: UUID

# -----------------------------
# Cart Schemas
# -----------------------------
class CartItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0)

class CartItemRead(BaseModel):
    id: UUID
    product: ProductRead
    quantity: int

# -----------------------------
# Order Schemas
# -----------------------------
class OrderItemRead(BaseModel):
    product_id: UUID
    quantity: int
    price_at_purchase: int

class OrderCreate(BaseModel):
    cart_item_ids: List[UUID]

class OrderRead(BaseModel):
    id: UUID
    total_amount: int
    status: OrderStatus
    items: List[OrderItemRead]

# -----------------------------
# Payment Schemas
# -----------------------------
class PaymentCreateIntent(BaseModel):
    order_id: UUID

class PaymentConfirm(BaseModel):
    payment_id: UUID

# -----------------------------
# Products Endpoints
# -----------------------------
@app.post("/products", response_model=ProductRead)
def create_product(product: ProductCreate):
    product_id = uuid4()
    products_db[product_id] = {
        **product.dict(),
        "id": product_id,
        "is_active": True,
        "created_at": datetime.utcnow(),
    }
    return products_db[product_id]

@app.get("/products", response_model=List[ProductRead])
def list_products():
    return [p for p in products_db.values() if p["is_active"]]

@app.get("/products/search", response_model=List[ProductRead])
def search_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    sort: Optional[str] = None,
):
    results = list_products()

    if q:
        results = [p for p in results if q.lower() in p["name"].lower()]
    if category:
        results = [p for p in results if p["category"] == category]
    if min_price:
        results = [p for p in results if p["price"] >= min_price]
    if max_price:
        results = [p for p in results if p["price"] <= max_price]
    if sort == "price_asc":
        results.sort(key=lambda x: x["price"])
    if sort == "price_desc":
        results.sort(key=lambda x: x["price"], reverse=True)

    return results

@app.get("/products/{product_id}", response_model=ProductRead)
def get_product(product_id: UUID):
    product = products_db.get(product_id)
    if not product or not product["is_active"]:
        raise HTTPException(404, "Product not found")
    return product

# -----------------------------
# Cart Endpoints
# -----------------------------
@app.get("/cart", response_model=List[CartItemRead])
def get_cart():
    response = []
    for item in cart_db.values():
        product = products_db.get(item["product_id"])
        response.append({
            "id": item["id"],
            "product": product,
            "quantity": item["quantity"],
        })
    return response

@app.post("/cart", response_model=CartItemRead)
def add_to_cart(item: CartItemCreate):
    if item.product_id not in products_db:
        raise HTTPException(404, "Product not found")

    cart_item_id = uuid4()
    cart_db[cart_item_id] = {
        "id": cart_item_id,
        "product_id": item.product_id,
        "quantity": item.quantity,
        "created_at": datetime.utcnow(),
    }
    return {
        "id": cart_item_id,
        "product": products_db[item.product_id],
        "quantity": item.quantity,
    }

@app.put("/cart/{item_id}", response_model=CartItemRead)
def update_cart_item(item_id: UUID, quantity: int = Query(gt=0)):
    if item_id not in cart_db:
        raise HTTPException(404, "Cart item not found")
    cart_db[item_id]["quantity"] = quantity
    product = products_db[cart_db[item_id]["product_id"]]
    return {"id": item_id, "product": product, "quantity": quantity}

@app.delete("/cart/{item_id}")
def delete_cart_item(item_id: UUID):
    if item_id not in cart_db:
        raise HTTPException(404, "Cart item not found")
    del cart_db[item_id]
    return {"success": True}

# -----------------------------
# Orders Endpoints
# -----------------------------
@app.post("/orders", response_model=OrderRead)
def create_order(order: OrderCreate):
    items = []
    total = 0

    for cart_item_id in order.cart_item_ids:
        cart_item = cart_db.get(cart_item_id)
        if not cart_item:
            raise HTTPException(404, "Cart item not found")

        product = products_db[cart_item["product_id"]]
        price = product["price"]
        quantity = cart_item["quantity"]
        total += price * quantity

        items.append({
            "product_id": product["id"],
            "quantity": quantity,
            "price_at_purchase": price,
        })

    order_id = uuid4()
    orders_db[order_id] = {
        "id": order_id,
        "total_amount": total,
        "status": OrderStatus.pending,
        "created_at": datetime.utcnow(),
    }
    order_items_db[order_id] = items

    # clear cart items
    for cid in order.cart_item_ids:
        cart_db.pop(cid, None)

    return {**orders_db[order_id], "items": items}

@app.get("/orders", response_model=List[OrderRead])
def list_orders():
    return [
        {**order, "items": order_items_db[oid]}
        for oid, order in orders_db.items()
    ]

@app.get("/orders/{order_id}", response_model=OrderRead)
def get_order(order_id: UUID):
    order = orders_db.get(order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    return {**order, "items": order_items_db[order_id]}

# -----------------------------
# Payments Endpoints (Mocked)
# -----------------------------
@app.post("/payments/create-intent")
def create_payment_intent(payload: PaymentCreateIntent):
    order = orders_db.get(payload.order_id)
    if not order:
        raise HTTPException(404, "Order not found")

    payment_id = uuid4()
    payments_db[payment_id] = {
        "id": payment_id,
        "order_id": payload.order_id,
        "provider": "stripe",
        "provider_payment_id": f"pi_{uuid4().hex}",
        "amount": order["total_amount"],
        "currency": "usd",
        "status": PaymentStatus.pending,
        "created_at": datetime.utcnow(),
    }
    return payments_db[payment_id]

@app.post("/payments/confirm")
def confirm_payment(payload: PaymentConfirm):
    payment = payments_db.get(payload.payment_id)
    if not payment:
        raise HTTPException(404, "Payment not found")

    payment["status"] = PaymentStatus.succeeded
    order = orders_db[payment["order_id"]]
    order["status"] = OrderStatus.paid

    return {"success": True, "order_id": payment["order_id"]}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
