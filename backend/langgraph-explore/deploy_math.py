from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Union, Dict, Any
from langchain.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from math_agent import agent
import uvicorn

app = FastAPI(title="LangGraph Arithmetic Agent API")

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

def convert_to_langchain_messages(messages: List[Message]):
    lc_messages = []
    for msg in messages:
        if msg.role == "user":
            lc_messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            lc_messages.append(AIMessage(content=msg.content))
        elif msg.role == "system":
            lc_messages.append(SystemMessage(content=msg.content))
    return lc_messages

@app.post("/chat")
async def chat(request: ChatRequest):
    # Convert input messages to LangChain format
    lc_messages = convert_to_langchain_messages(request.messages)
    
    # Invoke the agent
    # The agent expects a state with 'messages'
    result = agent.invoke({"messages": lc_messages})
    
    # Extract the last message and llm_calls
    last_message = result["messages"][-1]
    llm_calls = result.get("llm_calls", 0)
    
    return {
        "role": "assistant",
        "content": last_message.content,
        "llm_calls": llm_calls,
        "history": [{"role": "user" if isinstance(m, HumanMessage) else "assistant", "content": m.content} 
                    for m in result["messages"] if not isinstance(m, (ToolMessage, SystemMessage))]
    }

@app.post("/invoke")
async def invoke(request: Message):
    # Backward compatibility endpoint for single message
    result = agent.invoke({"messages": [HumanMessage(content=request.content)]})
    last_message = result["messages"][-1]
    return {
        "llm_calls": result.get("llm_calls", 0),
        "messages": [m.content for m in result["messages"]]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

