import requests
import uuid

BASE_URL = "http://localhost:8000"

def test_add_to_cart():
    # Try GET first
    try:
        r = requests.get(f"{BASE_URL}/cart")
        print(f"GET /cart: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"GET /cart failed: {e}")

    # Try POST
    try:
        # Get a product ID first to be safe
        rp = requests.get(f"{BASE_URL}/products")
        products = rp.json()
        if not products:
            print("No products found to add to cart")
            return
        
        pid = products[0]['id']
        print(f"Adding product {pid} to cart")
        
        payload = {"product_id": pid, "quantity": 1}
        r = requests.post(f"{BASE_URL}/cart", json=payload)
        print(f"POST /cart: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"POST /cart failed: {e}")

if __name__ == "__main__":
    test_add_to_cart()
