from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from .state import MessagesState
from .nodes import llm_call, tool_node, should_continue

def get_graph():
    agent_builder = StateGraph(MessagesState)
    agent_builder.add_node("llm_call", llm_call)
    agent_builder.add_node("tool_node", tool_node)
    
    agent_builder.add_edge(START, "llm_call")
    agent_builder.add_conditional_edges("llm_call", should_continue, {"tool_node": "tool_node", END: END})
    agent_builder.add_edge("tool_node", "llm_call")

    memory = MemorySaver()
    return agent_builder.compile(checkpointer=memory)

agent = get_graph()
