import os
import json
import asyncio
from typing import List, Optional
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.types import Command
from shopping_agent import agent
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Shopping Agent Streaming API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    thread_id: Optional[str] = "1"
    resume_value: Optional[bool] = None

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

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    # If the user provides multiple messages, we assume they want to seed/resume.
    # But with a checkpointer, we typically just need the latest one.
    # For flexibility, we'll pass the whole list if it's the first time, 
    # but normally you'd just send the latest HumanMessage.
    lc_messages = convert_to_langchain_messages(request.messages)
    config = {"configurable": {"thread_id": request.thread_id}}

    async def event_generator():
        # Using astream_events v2 for granular streaming
        
        if request.resume_value is not None:
            # We are resuming after an interrupt
            input_data = Command(resume=request.resume_value)
        else:
            # We are sending a new message
            # We pass ONLY the latest message to avoid duplication if the thread already exists
            input_data = {"messages": [lc_messages[-1]]} if lc_messages else {"messages": []}
        
        async for event in agent.astream_events(input_data, config, version="v2"):
            kind = event["event"]
            
            # Send events as JSON strings separated by newlines (NDJSON or SSE-like)
            if kind == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content:
                    yield f"data: {json.dumps({'type': 'token', 'content': content})}\n\n"
            
            elif kind == "on_tool_start":
                yield f"data: {json.dumps({'type': 'tool_start', 'name': event['name'], 'input': event['data'].get('input')})}\n\n"
            
            elif kind == "on_tool_end":
                output = event['data'].get('output')
                yield f"data: {json.dumps({'type': 'tool_end', 'name': event['name'], 'output': str(output)})}\n\n"

            elif kind == "on_interrupt":
                # event["data"] contains the list of interrupts
                interrupts = event["data"]
                yield f"data: {json.dumps({'type': 'interrupt', 'content': interrupts})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    # Run on a different port if main.py is running on 8000
    uvicorn.run(
        "deploy_shopping:app", 
        host="0.0.0.0", 
        port=8001, 
        reload=True,
        reload_excludes=["scripts/*", "*.log", "**/__pycache__/*"]
    )
