# Design Document: Embedded Conversational Agent for MyShop

## 1. Overview
The goal is to integrate an AI-powered conversational agent into the "MyShop" platform. This agent will allow users to search for products, manage their basket, and navigate the site using natural language. A key requirement is that the agent's actions should be reflected visually in the UI (e.g., updating the cart count, navigating to search results).

## 2. Proposed Architecture

We will use a **Hybrid Agent Architecture** where the reasoning logic lives on the backend (FastAPI + LangGraph Python), while the execution of UI-specific side effects happens on the frontend (Next.js).

### 2.1 Backend: The Reasoning Engine
- **Framework**: LangGraph (Python).
- **Endpoint**: A new `/api/chat` endpoint in FastAPI.
- **State Management**: LangGraph will maintain the conversation state, allowing for multi-turn interactions (e.g., "Show me shoes" -> "Which ones are under $50?").
- **Tools**:
    - `search_products(q, category, min_price, max_price)`: Interfaces with existing search logic.
    - `add_to_cart(product_id, quantity)`: Modifies the cart state.
    - `get_cart()`: Retrieves current items.
    - `initiate_checkout()`: Prepares the order.

### 2.2 Frontend: The Interaction Layer
- **UI Components**:
    - A floating **ChatWidget** in the bottom-right corner.
    - A **MessageList** to display the conversation history.
- **Visual Sync Mechanism**:
    - When the backend agent performs an action that affects the UI, it will return a list of `ui_actions` in its response.
    - The frontend will have a "Side Effect Executor" that processes these actions.

## 3. Communication Protocol

The frontend and backend will communicate via a structured JSON format:

**Request (Frontend -> Backend):**
```json
{
  "message": "can you add the belt to my basket please?",
  "thread_id": "user-session-123",
  "current_path": "/product/belt-uuid"
}
```

**Response (Backend -> Frontend):**
```json
{
  "text": "I've added the 'Leather Belt' to your basket! Would you like to checkout now?",
  "ui_actions": [
    { "type": "REFRESH_CART", "payload": null },
    { "type": "SHOW_TOAST", "payload": { "message": "Added to basket!" } }
  ]
}
```

## 4. Implementation Details

### 4.1 UI Action Types
We will define a set of standard UI actions that the agent can trigger:
- `NAVIGATE`: Change the current URL (e.g., to `/search?q=phone`).
- `REFRESH_CART`: Trigger the `cart-updated` event to refresh the Navbar count.
- `OPEN_MODAL`: Open specific UI components (e.g., checkout preview).
- `HIGHLIGHT_ELEMENT`: (Optional) Pulse or highlight a specific product on the page.

### 4.2 LangGraph Layout
The agent graph will consist of:
1.  **Router**: Decides if the user's intent is a query, an action (cart/checkout), or general chat.
2.  **Tool Node**: Executes the selected tools.
3.  **UI Action Formatter**: A final node that inspects the tool outputs and appends the appropriate `ui_actions` to the final response message.

## 5. Visual "Action-Taking" Flow
To achieve the "actions taking place on the website visually" requirement:

1.  **User**: "Find me blue shirts under $30."
2.  **Agent**:
    - Calls `search_products(q="blue shirt", max_price=30)`.
    - Formulates response: "I found 3 blue shirts under $30 for you."
    - Appends `ui_action: { type: 'NAVIGATE', payload: '/search?q=blue+shirt&max_price=30' }`.
3.  **Frontend**:
    - Displays the text.
    - Immediately calls `router.push('/search?q=blue+shirt&max_price=30')`.
    - The user sees the search results page update instantly.

## 6. Why LangGraph?
- **Persistence**: Easily handle returning users or multi-step tasks (like a checkout flow).
- **Control**: Fine-grained control over which tools are called and how the UI actions are structured.
- **Python SDK**: Leverages the existing Python environment and ecosystem (Pydantic models, FastAPI integration).

## 7. Security & Authentication
- The `/api/chat` endpoint will be protected by the same session/auth mechanism as the rest of the API.
- The agent will only be able to perform actions on behalf of the logged-in user.

## 8. Implementation Roadmap

1.  **Backend Setup**: Install `langgraph`, `langchain`, and an LLM provider (e.g., `langchain-openai`). Create a basic graph with a "search" tool.
2.  **API Endpoint**: Implement the `/api/chat` router in `backend/main.py`.
3.  **Frontend Chat Widget**: Create a simple chat interface in `frontend/src/components/ChatWidget.tsx` that sends and receives JSON.
4.  **Side Effect Executor**: Add logic to the Chat Widget to handle `ui_actions` (e.g., calling `router.push` or dispatching `cart-updated`).
5.  **Refinement**: Expand tool definitions to cover basket management and checkout.

## 9. Production & Scalability Path

To ensure this scales from a prototype to a production system, we will implement the following:

### 9.1 Typed Action Schema (Scalability)
Instead of arbitrary JSON, we will define a strict `UIAction` union type. This allows the frontend to safely handle dozens of different action types without becoming a "giant if-statement."
- **Backend (Pydantic)**: `class UIAction(BaseModel): type: ActionType; payload: dict`
- **Frontend (TypeScript)**: `type UIAction = { type: 'NAVIGATE'; url: string } | { type: 'CART_UPDATE'; ... }`

### 9.2 State Persistence (Scale)
LangGraph allows for **Checkpointers**. For this project, we can start with `MemorySaver`, but it can be swapped to `PostgresSaver` in production. This allows the agent to remember context across sessions and even across different devices.

### 9.3 Streaming (UX)
For production, we would move from a standard `POST` to **Streaming Results**. LangGraph supports `astream`, allowing the user to see the agent's "thoughts" or text response in real-time while the tool is still processing.

### 9.4 Security: The "Trust but Verify" Model
The LLM should never be trusted blindly. 
1. The backend validates all tool parameters (e.g., ensuring a `price_max` is a number).
2. The frontend validates all `ui_actions` (e.g., ensuring a `NAVIGATE` action only goes to internal routes).

