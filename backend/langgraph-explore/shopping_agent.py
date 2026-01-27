import os
import requests
from typing import List, Optional, Literal, TypedDict, Annotated, Any
from uuid import UUID
from dotenv import load_dotenv
import operator
import asyncio

from langchain.tools import tool
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage, AnyMessage, ToolMessage
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command

# -----------------------------
# Load environment variables
# -----------------------------
load_dotenv()
BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

# -----------------------------
# Initialize LLM
# -----------------------------
model = init_chat_model(
    "azure_openai:gpt-4.0",
    azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
)

# -----------------------------
# Define Shopping Tools
# -----------------------------
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
            f"- {p['name']} (ID: {p['id']}) | Price: ${p['price']/100:.2f} | Category: {p['category']}"
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
            f"Description: {p['description']}\n"
            f"Price: ${p['price']/100:.2f}\n"
            f"Category: {p['category']}\n"
            f"Stock: {p['stock_quantity']}\n"
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
            f"- {item['product']['name']} (Cart Item ID: {item['id']}) | Qty: {item['quantity']} | Subtotal: ${item['product']['price']*item['quantity']/100:.2f}"
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


# -----------------------------
# Bind tools to model
# -----------------------------
tools = [search_products, get_product_details, add_to_cart, view_cart, checkout, list_categories, pay]
tools_by_name = {tool.name: tool for tool in tools}
model_with_tools = model.bind_tools(tools)


# -----------------------------
# LangGraph State and Nodes
# -----------------------------
class MessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]


def llm_call(state: MessagesState):
    """
    LLM decides whether to call a tool or not.
    Provides reasoning and context for the agent.
    """
    return {
        "messages": [
            model_with_tools.invoke(
                [
                    SystemMessage(
                        content="""You are a helpful shopping assistant for an e-commerce platform. 
                        You can search for products, view details, manage the cart, and help with checkout.
                        Prices are handled in cents internally, but you should display them in dollars.
                        If you need an ID for a product or cart item, look it up via search or view_cart first.
                        
                        CRITICAL: Be extremely verbose and explain your reasoning as you work.
                        ALWAYS state your plan and reasoning in a paragraph BEFORE you call any tools. 
                        For example: "I will first search for 'football' to see what's available in our inventory."
                        Then, call the tool.
                        After getting tool results, explain what the results mean and what you'll do next.
                        The user wants to see your 'stream of consciousness' so they can follow your logic."""
                    )
                ]
                + state["messages"]
            )
        ]
    }


def tool_node(state: MessagesState):
    """
    Execute tools immediately without requiring human approval.
    """
    result = []
    last_message = state["messages"][-1]

    for tool_call in getattr(last_message, "tool_calls", []):
        tool_name = tool_call["name"]
        # Execute all tools immediately
        obs = tools_by_name[tool_name].invoke(tool_call["args"])
        result.append(ToolMessage(content=obs, tool_call_id=tool_call["id"]))

    return {"messages": result}



def should_continue(state: MessagesState) -> Literal["tool_node", END]:
    """
    Decide whether to continue calling tools or stop.
    """
    messages = state["messages"]
    last_message = messages[-1]
    if getattr(last_message, "tool_calls", None):
        return "tool_node"
    return END


# -----------------------------
# Build workflow
# -----------------------------
agent_builder = StateGraph(MessagesState)
agent_builder.add_node("llm_call", llm_call)
agent_builder.add_node("tool_node", tool_node)
agent_builder.add_edge(START, "llm_call")
agent_builder.add_conditional_edges("llm_call", should_continue, {"tool_node": "tool_node", END: END})
agent_builder.add_edge("tool_node", "llm_call")

memory = MemorySaver()
agent = agent_builder.compile(checkpointer=memory)


# -----------------------------
# Async interactive chat
# -----------------------------
async def main():
    print("--- Shopping Assistant Agent ---")
    print(f"Backend: {BASE_URL}")
    print("Type 'exit' or 'quit' to end.\n")

    config = {"configurable": {"thread_id": "1"}}

    while True:
        try:
            user_input = await asyncio.to_thread(input, "\nYou: ")
        except EOFError:
            break
        if user_input.lower() in {"exit", "quit"}:
            break

        print("AI: ", end="", flush=True)

        async for event in agent.astream_events(
            {"messages": [HumanMessage(content=user_input)]},
            config,
            version="v2"
        ):
            kind = event["event"]
            if kind == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content:
                    print(content, end="", flush=True)
            elif kind == "on_tool_start":
                print(f"\n  [Tool Start: {event['name']}({event['data'].get('input')})]")
            elif kind == "on_tool_end":
                output = event["data"].get("output")
                summary = str(output)[:100] + "..." if len(str(output)) > 100 else str(output)
                print(f"\n  [Tool End: {event['name']}] Result: {summary}")
                print("AI: ", end="", flush=True)

        print()  # New line


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
