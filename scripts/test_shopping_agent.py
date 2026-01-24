import requests
import json
import sys

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
                    elif data["type"] == "interrupt":
                        print(f"\n\033[93m[INTERRUPT: {data['content']}]\033[0m")
                        # Prompt for approval
                        choice = input("\nApprove checkout? (y/n): ").lower().strip()
                        approved = choice == 'y'
                        print(f"Sending approval: {approved}")
                        # Resume the stream with the decision
                        return stream_chat(messages, thread_id, resume_value=approved)
        
    except requests.exceptions.ConnectionError:
        print(f"\nError: Could not connect to the shopping agent API at {BASE_URL}.")
        sys.exit(1)
    except Exception as e:
        print(f"\nAn error occurred: {e}")

def test_checkout_flow():
    print("--- Testing Shopping Agent Checkout with Human Approval ---")
    thread_id = "test_checkout_thread_v3" # Using v2 to avoid stale data
    
    # 1. Add something to cart and then try to checkout
    messages = [
        {"role": "user", "content": "let's checkout now!"}
    ]
    
    stream_chat(messages, thread_id)

if __name__ == "__main__":
    test_checkout_flow()
