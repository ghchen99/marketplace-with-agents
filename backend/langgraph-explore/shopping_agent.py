import os
import requests
from typing import List, Optional, Literal, TypedDict, Annotated
import operator
from uuid import UUID

from langchain.tools import tool
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage, AnyMessage, ToolMessage, AIMessage
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command, interrupt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

# Initialize LLM
model = init_chat_model(
    "azure_openai:gpt-4.0",
    azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
)

# ---------------------------------------------------------
# Define Shopping Tools
# ---------------------------------------------------------

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
    def perform_search(query_str):
        p = {
            "q": query_str,
            "category": category,
            "min_price": min_price,
            "max_price": max_price
        }
        print(f"  [Debug] Searching products with params: {p}")
        resp = requests.get(f"{BASE_URL}/products/search", params=p)
        resp.raise_for_status()
        return resp.json()

    try:
        products = perform_search(q)
        
        if not products and q and q.endswith('s'):
            print(f"  [Debug] No results for '{q}', trying singular '{q[:-1]}'...")
            products = perform_search(q[:-1])

        print(f"  [Debug] Found {len(products)} products.")
        if not products:
            return "No products found matching those criteria. Try a broader search or singular terms."
        
        lines = []
        for p in products:
            lines.append(f"- {p['name']} (ID: {p['id']}) | Price: ${p['price']/100:.2f} | Category: {p['category']}")
        return "\n".join(lines)
    except Exception as e:
        return f"Error searching products: {str(e)}"

@tool
def get_product_details(product_id: str) -> str:
    """Get detailed information about a specific product by its ID."""
    try:
        response = requests.get(f"{BASE_URL}/products/{product_id}")
        response.raise_for_status()
        p = response.json()
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
    """Add a product to the shopping cart."""
    try:
        payload = {"product_id": product_id, "quantity": quantity}
        url = f"{BASE_URL}/cart"
        print(f"  [Debug] Posting to {url} with {payload}")
        response = requests.post(url, json=payload)
        response.raise_for_status()
        item = response.json()
        return f"Added {item['quantity']} of '{item['product']['name']}' to your cart. Cart Item ID: {item['id']}"
    except Exception as e:
        return f"Error adding to cart: {str(e)}"

@tool
def view_cart() -> str:
    """View the current contents of the shopping cart."""
    try:
        response = requests.get(f"{BASE_URL}/cart")
        response.raise_for_status()
        items = response.json()
        if not items:
            return "Your cart is currently empty."
        
        lines = []
        total = 0
        for item in items:
            p = item['product']
            qty = item['quantity']
            subtotal = p['price'] * qty
            total += subtotal
            lines.append(f"- {p['name']} (Cart Item ID: {item['id']}) | Qty: {qty} | Subtotal: ${subtotal/100:.2f}")
        
        lines.append(f"\nTotal: ${total/100:.2f}")
        return "\n".join(lines)
    except Exception as e:
        return f"Error viewing cart: {str(e)}"

@tool
def checkout() -> str:
    """Proceed to checkout and create an order for all items in the cart."""
    try:
        response = requests.get(f"{BASE_URL}/cart")
        response.raise_for_status()
        cart_items = response.json()
        
        if not cart_items:
            return "Cannot checkout: your cart is empty."
        
        cart_item_ids = [item['id'] for item in cart_items]
        order_payload = {"cart_item_ids": cart_item_ids}
        order_resp = requests.post(f"{BASE_URL}/orders", json=order_payload)
        order_resp.raise_for_status()
        order = order_resp.json()
        
        return f"Order created successfully! Order ID: {order['id']} | Total: ${order['total_amount']/100:.2f}"
    except Exception as e:
        return f"Error during checkout: {str(e)}"

@tool
def list_categories() -> str:
    """Get a list of all available product categories."""
    try:
        response = requests.get(f"{BASE_URL}/products/categories")
        response.raise_for_status()
        categories = response.json()
        return "Available categories: " + ", ".join(categories)
    except Exception as e:
        return f"Error listing categories: {str(e)}"

@tool
def pay(order_id: str) -> str:
    """Pay for an existing order."""
    try:
        intent_resp = requests.post(f"{BASE_URL}/payments/create-intent", json={"order_id": order_id})
        intent_resp.raise_for_status()
        intent = intent_resp.json()
        payment_id = intent["id"]
        
        confirm_resp = requests.post(f"{BASE_URL}/payments/confirm", json={"payment_id": payment_id})
        confirm_resp.raise_for_status()
        
        return f"Payment successful for Order {order_id}! Transaction ID: {payment_id}"
    except Exception as e:
        return f"Payment failed: {str(e)}"

# Define tools list and bind to model
tools = [search_products, get_product_details, add_to_cart, view_cart, checkout, list_categories, pay]
tools_by_name = {tool.name: tool for tool in tools}
model_with_tools = model.bind_tools(tools)

# ---------------------------------------------------------
# Define LangGraph State and Nodes
# ---------------------------------------------------------

class MessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]


def llm_call(state: MessagesState):
    """LLM decides whether to call a tool or not"""
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
    """Execute tools, with approval required for sensitive operations"""
    result = []
    
    for tool_call in state["messages"][-1].tool_calls:
        tool_name = tool_call["name"]
        
        # Check if this is a sensitive tool that needs approval
        if tool_name in ["checkout", "pay"]:
            action_text = "proceed to checkout" if tool_name == "checkout" else "make a payment"
            
            # Ask for approval
            approved = interrupt({
                "question": f"Approve {tool_name.capitalize()}?",
                "details": f"The agent wants to {action_text}. Do you approve?",
                "action": tool_name,
                "args": tool_call["args"],
            })
            
            if approved:
                tool_func = tools_by_name[tool_name]
                observation = tool_func.invoke(tool_call["args"])
                result.append(ToolMessage(content=observation, tool_call_id=tool_call["id"]))
            else:
                result.append(ToolMessage(
                    content=f"{tool_name.capitalize()} was rejected by the user.",
                    tool_call_id=tool_call["id"]
                ))
        else:
            # Non-sensitive tool - execute directly
            tool_func = tools_by_name[tool_name]
            observation = tool_func.invoke(tool_call["args"])
            result.append(ToolMessage(content=observation, tool_call_id=tool_call["id"]))
    
    return {"messages": result}


def should_continue(state: MessagesState) -> Literal["tool_node", END]:
    """Decide if we should continue calling tools or stop"""
    messages = state["messages"]
    last_message = messages[-1]
    
    if not last_message.tool_calls:
        return END
    
    return "tool_node"


# Build workflow
agent_builder = StateGraph(MessagesState)
agent_builder.add_node("llm_call", llm_call)
agent_builder.add_node("tool_node", tool_node)

agent_builder.add_edge(START, "llm_call")
agent_builder.add_conditional_edges(
    "llm_call",
    should_continue,
    {
        "tool_node": "tool_node",
        END: END
    }
)
agent_builder.add_edge("tool_node", "llm_call")

# Compile the agent with memory
memory = MemorySaver()
agent = agent_builder.compile(checkpointer=memory)

# ---------------------------------------------------------
# Interactive Chat Interface
# ---------------------------------------------------------

import asyncio

async def main():
    print("--- Shopping Assistant Agent ---")
    print(f"Connecting to backend at: {BASE_URL}")
    print("Type 'exit' or 'quit' to end the conversation.")
    
    config = {"configurable": {"thread_id": "1"}}

    while True:
        try:
            user_input = await asyncio.to_thread(input, "\nYou: ")
        except EOFError:
            break
            
        if user_input.lower() in {"exit", "quit"}:
            break

        print("AI: ", end="", flush=True)
        
        # Stream the agent's response
        async for event in agent.astream_events(
            {"messages": [HumanMessage(content=user_input)]}, 
            config, 
            version="v2"
        ):
            kind = event["event"]
            
            # Handle chat model streaming
            if kind == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content:
                    print(content, end="", flush=True)
            
            # Handle tool calls
            elif kind == "on_tool_start":
                print(f"\n  [Agent is using tool: {event['name']} with args: {event['data'].get('input')}]")
            
            elif kind == "on_tool_end":
                output = event['data'].get('output')
                summary = str(output)[:100] + "..." if len(str(output)) > 100 else str(output)
                print(f"\n  [Tool Result: {summary}]")
                print("AI: ", end="", flush=True)

        print()  # New line after response

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass