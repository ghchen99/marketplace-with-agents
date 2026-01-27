from langchain.messages import SystemMessage, ToolMessage
from langgraph.graph import END
from typing import Literal

from .state import MessagesState
from .tools import TOOLS
from .model import get_model
from .prompts import SYSTEM_PROMPT

# Initialize model and tools
model_with_tools = get_model()
tools_by_name = {tool.name: tool for tool in TOOLS}

def llm_call(state: MessagesState):
    """
    LLM decides whether to call a tool or not.
    Provides reasoning and context for the agent.
    """
    return {
        "messages": [
            model_with_tools.invoke(
                [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
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
        if tool_name in tools_by_name:
            # Execute all tools immediately
            obs = tools_by_name[tool_name].invoke(tool_call["args"])
            result.append(ToolMessage(content=str(obs), tool_call_id=tool_call["id"]))
        else:
            result.append(ToolMessage(content=f"Error: Tool {tool_name} not found.", tool_call_id=tool_call["id"]))

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
