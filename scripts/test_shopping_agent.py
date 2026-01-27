import requests
import json
import sys
import uuid

# Assume deploy_shopping.py is running on port 8001
BASE_URL = "http://127.0.0.1:8001"

def stream_chat(messages, thread_id, resume_value=None):
    payload = {
        "messages": messages,
        "thread_id": thread_id,
        "resume_value": resume_value
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chat/stream", json=payload, stream=True)
        response.raise_for_status()
        
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                if decoded_line.startswith("data: "):
                    data_str = decoded_line[6:]
                    if data_str == "[DONE]":
                        break
                    
                    data = json.loads(data_str)
                    if data["type"] == "token":
                        print(data["content"], end="", flush=True)
                    elif data["type"] == "tool_start":
                        print(f"\n\033[94m[Tool Start: {data['name']}({data['input']})]\033[0m")
                    elif data["type"] == "tool_end":
                        output = data.get('output', '')
                        preview = str(output)[:150] + "..." if len(str(output)) > 150 else str(output)
                        print(f"\033[94m[Tool End: {data['name']}]\033[0m")
                        print(f"\033[90m  Result: {preview}\033[0m\n")
                   
        print() # New line after response complete
        
    except requests.exceptions.ConnectionError:
        print(f"\nError: Could not connect to the shopping agent API at {BASE_URL}.")
        sys.exit(1)
    except Exception as e:
        print(f"\nAn error occurred: {e}")

def chat_interface():
    print("\033[95m--- Shopping Agent Chat Interface ---\033[0m")
    print("Type 'exit' or 'quit' to stop.")
    
    thread_id = str(uuid.uuid4())
    print(f"Session Thread ID: {thread_id}\n")
    
    while True:
        try:
            user_input = input("\033[92mYou: \033[0m")
            if user_input.lower() in ["exit", "quit"]:
                print("Goodbye!")
                break
            
            if not user_input.strip():
                continue
                
            messages = [{"role": "user", "content": user_input}]
            print("\033[96mAgent: \033[0m", end="")
            stream_chat(messages, thread_id)
            
        except KeyboardInterrupt:
            print("\nGoodbye!")
            break

if __name__ == "__main__":
    chat_interface()

