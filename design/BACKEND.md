# 🛒 Simple E-Commerce Backend Schema (FastAPI)

## Overview

This document defines a **simple, userless e-commerce backend** intended to be consumed by a Next.js frontend.

Supported features:
- Product catalog & search
- Product detail pages
- Anonymous shopping cart
- Checkout & payment
- Order creation & lookup

**Tech assumptions**
- FastAPI
- Mocked database
- Pydantic v2
- Mocked payment provider

---

## Core Entity Relationships

```
Product → CartItem → Order → OrderItem → Payment
```

---

## 1. Products

### Database Model: `products`

| Field | Type | Notes |
|------|------|------|
| id | UUID | Primary key |
| name | string | Indexed |
| description | text | |
| price | int | Stored in pence |
| stock_quantity | int | |
| category | string | Indexed |
| image_url | string | |
| is_active | boolean | Soft delete |
| created_at | datetime | |

### Pydantic Schemas

```python
ProductCreate
- name: str
- description: str
- price: int
- stock_quantity: int
- category: str
- image_url: str

ProductRead
- id: UUID
- name: str
- description: str
- price: int
- stock_quantity: int
- category: str
- image_url: str
```

### API Endpoints

```
GET /products
GET /products/{product_id}
GET /products/search?q=mouse&category=electronics
```

---

## 2. Cart (Anonymous)

> Cart is anonymous and global or session-based (cookie or session header).

### Database Model: `cart_items`

| Field | Type | Notes |
|------|------|------|
| id | UUID | Primary key |
| product_id | UUID | FK → products |
| quantity | int | |
| created_at | datetime | |

### Pydantic Schemas

```python
CartItemCreate
- product_id: UUID
- quantity: int

CartItemRead
- id: UUID
- product: ProductRead
- quantity: int
```

### API Endpoints

```
GET    /cart
POST   /cart
PUT    /cart/{item_id}
DELETE /cart/{item_id}
```

---

## 3. Orders

### Database Model: `orders`

| Field | Type | Notes |
|------|------|------|
| id | UUID | Primary key |
| total_amount | int | In pence |
| status | enum | pending, paid |
| created_at | datetime | |

### Database Model: `order_items`

| Field | Type | Notes |
|------|------|------|
| id | UUID | Primary key |
| order_id | UUID | FK → orders |
| product_id | UUID | FK → products |
| quantity | int | |
| price_at_purchase | int | Snapshot |

### Pydantic Schemas

```python
OrderCreate
- cart_item_ids: list[UUID]

OrderRead
- id: UUID
- total_amount: int
- status: str
- items: list[OrderItemRead]

OrderItemRead
- product_id: UUID
- quantity: int
- price_at_purchase: int
```

### API Endpoints

```
POST /orders
GET  /orders
GET  /orders/{order_id}
```

---

## 4. Payments

### Database Model: `payments`

| Field | Type | Notes |
|------|------|------|
| id | UUID | Primary key |
| order_id | UUID | FK → orders |
| provider | string | stripe |
| provider_payment_id | string | |
| amount | int | |
| currency | string | usd |
| status | enum | pending, succeeded, failed |
| created_at | datetime | |

### API Endpoints

```
POST /payments/create-intent
POST /payments/confirm
```

---

## 5. Search & Filtering

### Query Parameters

```
GET /products/search
```

| Param | Type | Example |
|------|------|------|
| q | string | "headphones" |
| category | string | "audio" |
| min_price | int | 1000 |
| max_price | int | 50000 |
| sort | string | price_asc |

---

## Typical Frontend → Backend Flow

```
Browse products
→ View product detail
→ Add to cart
→ Create order
→ Create payment
→ Confirm payment
→ Order status = paid
```

---

## MVP Design Notes

- Prices are stored as **integers (pence)** to avoid floating point issues
- Order items snapshot product price at purchase time
- Cart can later be upgraded to:
  - cookie-based sessions
  - authenticated users
  - persistent carts

---

## Future Extensions

- User accounts & authentication
- Shipping addresses
- Order status tracking (shipped, delivered)
- Inventory reservation
- Admin product management
- Reviews & ratings

