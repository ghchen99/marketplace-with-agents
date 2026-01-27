import requests
import json
import sys
import time
from uuid import UUID

BASE_URL = "http://127.0.0.1:8000"

def print_response(response):
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print("-" * 50)

def main():
    try:
        # 1. Create a product
        print("Creating a product...")
        product_data = {
            "name": "Mechanical Keyboard",
            "description": "RGB Mechanical Keyboard with Blue Switches",
            "price": 89,
            "stock_quantity": 50,
            "category": "Electronics",
            "image_url": "https://example.com/keyboard.jpg"
        }
        res = requests.post(f"{BASE_URL}/products", json=product_data)
        print_response(res)
        product_id = res.json()["id"]

        # 2. List products
        print("Listing products...")
        res = requests.get(f"{BASE_URL}/products")
        print_response(res)

        # 3. Search for the product
        print("Searching for product 'Mechanical'...")
        res = requests.get(f"{BASE_URL}/products/search", params={"q": "Mechanical"})
        print_response(res)

        # 4. Add to cart
        print(f"Adding product {product_id} to cart...")
        cart_data = {
            "product_id": product_id,
            "quantity": 2
        }
        res = requests.post(f"{BASE_URL}/cart", json=cart_data)
        print_response(res)
        cart_item_id = res.json()["id"]

        # 5. Get cart content
        print("Getting cart content...")
        res = requests.get(f"{BASE_URL}/cart")
        print_response(res)

        # 6. Update cart item
        print(f"Updating cart item {cart_item_id} quantity to 3...")
        res = requests.put(f"{BASE_URL}/cart/{cart_item_id}", params={"quantity": 3})
        print_response(res)

        # 7. Create an order
        print("Creating an order...")
        order_data = {
            "cart_item_ids": [cart_item_id]
        }
        res = requests.post(f"{BASE_URL}/orders", json=order_data)
        print_response(res)
        order_id = res.json()["id"]

        # 8. Create a payment intent
        print(f"Creating payment intent for order {order_id}...")
        payment_intent_data = {
            "order_id": order_id
        }
        res = requests.post(f"{BASE_URL}/payments/create-intent", json=payment_intent_data)
        print_response(res)
        payment_id = res.json()["id"]

        # 9. Confirm payment
        print(f"Confirming payment {payment_id}...")
        confirm_data = {
            "payment_id": payment_id
        }
        res = requests.post(f"{BASE_URL}/payments/confirm", json=confirm_data)
        print_response(res)

        # 10. Check order status
        print(f"Checking status of order {order_id}...")
        res = requests.get(f"{BASE_URL}/orders/{order_id}")
        print_response(res)

        print("Tests completed successfully!")

    except requests.exceptions.ConnectionError:
        print(f"Error: Could not connect to the backend at {BASE_URL}.")
        print("Make sure the backend is running (python backend/main.py)")
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
