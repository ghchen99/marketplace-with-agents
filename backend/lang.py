# script.py
# ============================
# Step 1: Define tools and model
# ============================

from langchain.tools import tool
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
import os

load_dotenv()

model = init_chat_model(
    "azure_openai:gpt-4.0",
    azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
)

@tool
def multiply(a: int, b: int) -> int:
    """Multiply two integers."""
    return a * b


@tool
def add(a: int, b: int) -> int:
    """Add two integers."""
    return a + b


@tool
def divide(a: int, b: int) -> float:
    """Divide a by b."""
    return a / b


tools = [add, multiply, divide]
tools_by_name = {tool.name: tool for tool in tools}
model_with_tools = model.bind_tools(tools)

# ============================
# Step 2: Define state
# ============================

from langchain.messages import AnyMessage
from typing_extensions import TypedDict, Annotated
import operator

class MessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    llm_calls: int

# ============================
# Step 3: Define LLM node
# ============================

from langchain.messages import SystemMessage

def llm_call(state: dict):
    """Invoke the LLM and let it decide whether to call tools."""
    return {
        "messages": [
            model_with_tools.invoke(
                [
                    SystemMessage(
                        content=(
                            "You are a helpful assistant tasked with performing "
                            "arithmetic on a set of inputs."
                        )
                    )
                ]
                + state["messages"]
            )
        ],
        "llm_calls": state.get("llm_calls", 0) + 1,
    }

# ============================
# Step 4: Define tool node
# ============================

from langchain.messages import ToolMessage

def tool_node(state: dict):
    """Execute tool calls requested by the LLM."""
    results = []

    last_message = state["messages"][-1]
    for tool_call in last_message.tool_calls:
        tool = tools_by_name[tool_call["name"]]
        observation = tool.invoke(tool_call["args"])

        results.append(
            ToolMessage(
                content=str(observation),
                tool_call_id=tool_call["id"],
            )
        )

    return {"messages": results}

# ============================
# Step 5: Routing logic
# ============================

from typing import Literal
from langgraph.graph import StateGraph, START, END

def should_continue(state: MessagesState) -> Literal["tool_node", END]:
    """Route to tool execution if the LLM requested tools."""
    last_message = state["messages"][-1]
    return "tool_node" if last_message.tool_calls else END

# ============================
# Step 6: Build LangGraph agent
# ============================

agent_builder = StateGraph(MessagesState)

agent_builder.add_node("llm_call", llm_call)
agent_builder.add_node("tool_node", tool_node)

agent_builder.add_edge(START, "llm_call")
agent_builder.add_conditional_edges(
    "llm_call",
    should_continue,
    ["tool_node", END],
)
agent_builder.add_edge("tool_node", "llm_call")

agent = agent_builder.compile()

# ============================
# Step 7: FastAPI server
# ============================

from fastapi import FastAPI
from pydantic import BaseModel
from langchain.messages import HumanMessage
import uvicorn

app = FastAPI(title="LangGraph Arithmetic Agent")

class Query(BaseModel):
    message: str

@app.post("/invoke")
def invoke_agent(query: Query):
    result = agent.invoke(
        {
            "messages": [HumanMessage(content=query.message)]
        }
    )

    return {
        "llm_calls": result.get("llm_calls", 0),
        "messages": [m.content for m in result["messages"]],
    }

# ============================
# Entry point
# ============================

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info",
    )
