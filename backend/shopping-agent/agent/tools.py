import os
import requests
from typing import List, Optional
from langchain.tools import tool
from dotenv import load_dotenv

load_dotenv()
BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

@tool
def search_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None
) -> str:
    """
    Search for products in the store.
    You can filter by a search query (q), category, and price range (in cents).
    NOTE: If searching for a plural term (e.g., 'phones') returns nothing, try the singular ('phone').
    """
    try:
        params = {"q": q, "category": category, "min_price": min_price, "max_price": max_price}
        resp = requests.get(f"{BASE_URL}/products/search", params=params)
        resp.raise_for_status()
        products = resp.json()

        # Try singular if plural yields no results
        if not products and q and q.endswith('s'):
            resp = requests.get(f"{BASE_URL}/products/search", params={**params, "q": q[:-1]})
            resp.raise_for_status()
            products = resp.json()

        if not products:
            return "No products found. Try a broader search or singular terms."

        return "\n".join(
            f"- {p['name']} (ID: {p['id']}) | Price: ${p['price']/100:.2f} | Category: {p['category']} | Image: {p['image_url']}"
            for p in products
        )
    except Exception as e:
        return f"Error searching products: {str(e)}"


@tool
def get_product_details(product_id: str) -> str:
    """
    Get detailed information about a specific product by its ID.
    Returns name, description, price, category, stock quantity, and rating info.
    """
    try:
        resp = requests.get(f"{BASE_URL}/products/{product_id}")
        resp.raise_for_status()
        p = resp.json()
        return (
            f"Name: {p['name']}\n"
            f"ID: {p['id']}\n"
            f"Description: {p['description']}\n"
            f"Price: ${p['price']/100:.2f}\n"
            f"Category: {p['category']}\n"
            f"Stock: {p['stock_quantity']}\n"
            f"Image: {p['image_url']}\n"
            f"Rating: {p['rating']} ({p['review_count']} reviews)"
        )
    except Exception as e:
        return f"Error getting product details: {str(e)}"


@tool
def add_to_cart(product_id: str, quantity: int = 1) -> str:
    """
    Add a product to the shopping cart.
    Returns confirmation with quantity and cart item ID.
    """
    try:
        payload = {"product_id": product_id, "quantity": quantity}
        resp = requests.post(f"{BASE_URL}/cart", json=payload)
        resp.raise_for_status()
        item = resp.json()
        return f"Added {item['quantity']} of '{item['product']['name']}' to your cart. Cart Item ID: {item['id']}"
    except Exception as e:
        return f"Error adding to cart: {str(e)}"


@tool
def view_cart() -> str:
    """
    View the current contents of the shopping cart.
    Lists each item with quantity and subtotal, and shows total price.
    """
    try:
        resp = requests.get(f"{BASE_URL}/cart")
        resp.raise_for_status()
        items = resp.json()
        if not items:
            return "Your cart is empty."
        total = sum(item['product']['price']*item['quantity'] for item in items)
        lines = [
            f"- {item['product']['name']} (Cart Item ID: {item['id']}) | Qty: {item['quantity']} | Subtotal: ${item['product']['price']*item['quantity']/100:.2f} | Image: {item['product'].get('image_url', '')}"
            for item in items
        ]
        lines.append(f"\nTotal: ${total/100:.2f}")
        return "\n".join(lines)
    except Exception as e:
        return f"Error viewing cart: {str(e)}"


@tool
def checkout(cart_item_ids: List[str]) -> str:
    """
    Proceed to checkout and create an order for the given cart item IDs.
    Returns the order ID and total amount.
    """
    try:
        resp = requests.post(f"{BASE_URL}/orders", json={"cart_item_ids": cart_item_ids})
        resp.raise_for_status()
        order = resp.json()
        return f"Order created successfully! Order ID: {order['id']} | Total: ${order['total_amount']/100:.2f}"
    except Exception as e:
        return f"Error during checkout: {str(e)}"


@tool
def list_categories() -> str:
    """
    Get a list of all available product categories.
    """
    try:
        resp = requests.get(f"{BASE_URL}/products/categories")
        resp.raise_for_status()
        return "Available categories: " + ", ".join(resp.json())
    except Exception as e:
        return f"Error listing categories: {str(e)}"


@tool
def pay(order_id: str) -> str:
    """
    Pay for an existing order by order ID.
    Returns transaction ID if successful.
    """
    try:
        intent_resp = requests.post(f"{BASE_URL}/payments/create-intent", json={"order_id": order_id})
        intent_resp.raise_for_status()
        payment_id = intent_resp.json()["id"]

        confirm_resp = requests.post(f"{BASE_URL}/payments/confirm", json={"payment_id": payment_id})
        confirm_resp.raise_for_status()
        return f"Payment successful for Order {order_id}! Transaction ID: {payment_id}"
    except Exception as e:
        return f"Payment failed: {str(e)}"

TOOLS = [search_products, get_product_details, add_to_cart, view_cart, checkout, list_categories, pay]
