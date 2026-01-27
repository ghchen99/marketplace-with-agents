# Design Document: conversational "Command Center" Agent for MyShop

## 1. Overview
The goal is to integrate a sophisticated AI-powered conversational agent that acts as a standalone "Command Center" for the user. Instead of the agent manipulating the website's external UI (navigation, sidebars), the agent brings the website's functionality *into* the chat interface using Rich UI Components. 

This approach prioritizes a "Human-in-the-Loop" (HITL) experience where users can browse, manage their basket, and complete purchases entirely through a multi-turn dialogue.

## 2. Core Philosophy: The Chat-First Interface
- **Self-Contained**: The agent is an *alternative* way to interact with the store, not a background scripts that clicks buttons for the user.
- **Rich Feedback**: Information (product results, basket status) is presented as structured UI cards within the chat bubbles.
- **Explicit Confirmation (HITL)**: Sensitive actions (like final payment or clearing a basket) require a user-initiated button click within the chat before the agent proceeds.

## 3. Proposed Architecture

### 3.1 Backend: LangGraph Reasoning Engine
- **Framework**: LangGraph (Python).
- **State**: The graph will track `messages` and internal variables like `current_basket_total` or `pending_confirmation`.
- **Checkpointing**: Use LangGraph's `MemorySaver` to allow the human to step away and return to a checkout process.
- **Tools**:
    - `search_products(q, ...)`: Returns a list of product objects.
    - `get_basket()`: Returns current basket contents.
    - `update_basket(product_id, quantity)`: Modifies the data.
    - `prepare_checkout()`: Calculates totals and returns a summary for HITL review.

### 3.2 Frontend: The Rich Chat Widget
- **Message Types**:
    - `TEXT`: Standard markdown messages.
    - `PRODUCT_LIST`: A horizontal carousel of product cards with "Add to Basket" buttons.
    - `BASKET_VIEW`: A summary card showing items, prices, and a "Checkout" button.
    - `CHECKOUT_CONFIRMATION`: A specialized UI that requires a "Pay Now" or "Cancel" response.
- **Event Handling**: Clicks on buttons inside chat cards (e.g., "Add to Basket") are sent back to the agent as "hidden" human messages (events).

## 4. Communication Protocol

**Response (Backend -> Frontend):**
```json
{
  "text": "I found these shoes for you. Would you like to add any to your basket?",
  "data": {
    "type": "PRODUCT_LIST",
    "products": [
      { "id": "1", "name": "Blue Runner", "price": 45.0, "image": "..." },
      { "id": "2", "name": "Red Trekker", "price": 60.0, "image": "..." }
    ]
  },
  "requires_confirmation": false
}
```

## 5. Human-in-the-Loop (HITL) Workflow
Example: Proceeding to Checkout

1.  **User**: "I'm ready to buy these."
2.  **Agent**: 
    - Calls `prepare_checkout()`.
    - Returns a `CHECKOUT_CONFIRMATION` message.
    - The graph enters a **"wait"** state (interrupt).
3.  **Frontend**: Displays a card with the total, shipping info, and a **[Confirm Purchase]** button.
4.  **User**: Clicks **[Confirm Purchase]**.
5.  **Frontend**: Sends an event `confirm_payment` to the backend.
6.  **Agent**: Resumes the graph, executes the payment tool, and confirms success.

## 6. Implementation Roadmap

1.  **Tool Development**: Convert `database.py` functions into LangChain-compatible tools.
2.  **LangGraph Logic**: Implement the reasoning loop (similar to `sample.py`) but with specialized nodes for "Review" and "Confirmation".
3.  **Rich Message Renderer**: Build the React components in the frontend that can render the `data` payload from the agent response.
4.  **HITL Persistence**: Set up a `thread_id` system so the backend recognizes returning users and pending checkout states.

## 7. Security
- The agent only accesses tools based on the current session's user ID.
- Actions that result in financial transactions *must* be accompanied by a manual confirmation event from the frontend.
