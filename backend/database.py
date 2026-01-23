from uuid import uuid4, UUID
from datetime import datetime
import random

# -----------------------------
# Mock Database (In-Memory)
# -----------------------------
products_db = {}
cart_db = {}
orders_db = {}
order_items_db = {}
payments_db = {}

def initialize_products():
    categories = ["Electronics", "Home & Kitchen", "Books", "Clothing", "Sports", "Beauty", "Automotive"]
    adjectives = ["Pro", "Ultra", "Smart", "Mini", "Classic", "Premium", "Elite", "Basic", "Advanced", "Legendary"]
    product_bases = [
        ("Phone", "Electronics"),
        ("Laptop", "Electronics"),
        ("Headphones", "Electronics"),
        ("Monitor", "Electronics"),
        ("Keyboard", "Electronics"),
        ("Mouse", "Electronics"),
        ("Smartwatch", "Electronics"),
        ("Camera", "Electronics"),
        ("Speaker", "Electronics"),
        ("Tablet", "Electronics"),
        ("Coffee Maker", "Home & Kitchen"),
        ("Blender", "Home & Kitchen"),
        ("Toaster", "Home & Kitchen"),
        ("Air Fryer", "Home & Kitchen"),
        ("Vacuum Cleaner", "Home & Kitchen"),
        ("Rice Cooker", "Home & Kitchen"),
        ("Kettle", "Home & Kitchen"),
        ("Lamp", "Home & Kitchen"),
        ("Stand Mixer", "Home & Kitchen"),
        ("Microwave", "Home & Kitchen"),
        ("Yoga Mat", "Sports"),
        ("Dumbbell Set", "Sports"),
        ("Treadmill", "Sports"),
        ("Bicycle", "Sports"),
        ("Tennis Racket", "Sports"),
        ("Basketball", "Sports"),
        ("Soccer Ball", "Sports"),
        ("Gym Bag", "Sports"),
        ("Protein Shaker", "Sports"),
        ("Jump Rope", "Sports"),
        ("Novel", "Books"),
        ("Cookbook", "Books"),
        ("Textbook", "Books"),
        ("Biography", "Books"),
        ("Comic Book", "Books"),
        ("Dictionary", "Books"),
        ("Poetry Book", "Books"),
        ("Art Book", "Books"),
        ("Journal", "Books"),
        ("Travel Guide", "Books"),
        ("T-Shirt", "Clothing"),
        ("Jeans", "Clothing"),
        ("Jacket", "Clothing"),
        ("Sweater", "Clothing"),
        ("Shoes", "Clothing"),
        ("Hat", "Clothing"),
        ("Socks", "Clothing"),
        ("Dress", "Clothing"),
        ("Scarf", "Clothing"),
        ("Belt", "Clothing"),
        ("Face Cream", "Beauty"),
        ("Shampoo", "Beauty"),
        ("Lipstick", "Beauty"),
        ("Perfume", "Beauty"),
        ("Serum", "Beauty"),
        ("Sunscreen", "Beauty"),
        ("Oil Filter", "Automotive"),
        ("Wiper Blades", "Automotive"),
        ("Car Battery", "Automotive"),
        ("Floor Mats", "Automotive"),
    ]

    for i in range(1, 151): # Create 150 products
        adj = random.choice(adjectives)
        base_name, category = random.choice(product_bases)
        name = f"{adj} {base_name} {random.randint(100, 999)}"
        # Prices in cents, ranging from $5.00 to $1500.00
        price = random.randint(500, 150000)
        stock = random.randint(0, 100)
        product_id = uuid4()
        
        products_db[product_id] = {
            "id": product_id,
            "name": name,
            "description": f"Experience the ultimate {base_name.lower()} with the {name}. This {category.lower()} essential features {adj.lower()} technology and premium materials.",
            "price": price,
            "stock_quantity": stock,
            "category": category,
            "image_url": f"https://picsum.photos/seed/{product_id.hex[:8]}/600/600",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "rating": round(random.uniform(3.5, 5.0), 1),
            "review_count": random.randint(10, 5000),
        }

# Populate the database immediately upon import
initialize_products()
