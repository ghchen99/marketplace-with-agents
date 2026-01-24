import requests
import json
import sys

# Assume deploy_shopping.py is running on port 8001
BASE_URL = "http://127.0.0.1:8001"

def test_streaming():
    print("Testing Shopping Agent Streaming API...")
    
    payload = {
        "messages": [
            {"role": "user", "content": "I want to buy a football. Can you find one for me and add it to my cart?"}
        ],
        "thread_id": "test_thread_1"
    }
    
    try:
        # Use stream=True to handle the response as a stream
        response = requests.post(f"{BASE_URL}/chat/stream", json=payload, stream=True)
        response.raise_for_status()
        
        print("\n--- Streaming Response ---")
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                if decoded_line.startswith("data: "):
                    data_str = decoded_line[6:]
                    if data_str == "[DONE]":
                        print("\n--- Stream Finished ---")
                        break
                    
                    try:
                        data = json.loads(data_str)
                        if data["type"] == "token":
                            print(data["content"], end="", flush=True)
                        elif data["type"] == "tool_start":
                            print(f"\n\033[94m[Tool Start: {data['name']}({data['input']})]\033[0m")
                        elif data["type"] == "tool_end":
                            output = data.get('output', '')
                            # Show a small preview of the result
                            preview = str(output)[:150] + "..." if len(str(output)) > 150 else str(output)
                            print(f"\033[94m[Tool End: {data['name']}]\033[0m")
                            print(f"\033[90m  Result: {preview}\033[0m\n")
                    except json.JSONDecodeError:
                        print(f"\nRaw line: {decoded_line}")
        
    except requests.exceptions.ConnectionError:
        print(f"\nError: Could not connect to the shopping agent API at {BASE_URL}.")
        print("Please ensure the agent is running by executing:")
        print("   python backend/langgraph-explore/deploy_shopping.py")
    except Exception as e:
        print(f"\nAn error occurred: {e}")

if __name__ == "__main__":
    test_streaming()
