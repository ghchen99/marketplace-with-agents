import os
import asyncio
from dotenv import load_dotenv
from langchain.messages import HumanMessage
from agent import agent

load_dotenv()
BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

async def main():
    print("--- Shopping Assistant Agent ---")
    print(f"Backend: {BASE_URL}")
    print("Type 'exit' or 'quit' to end.\n")

    config = {"configurable": {"thread_id": "cli_user"}}

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
