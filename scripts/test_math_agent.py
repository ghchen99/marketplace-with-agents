import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def print_response(title, response):
    print(f"\n[ {title} ]")
    print(f"Status: {response.status_code}")
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
    except:
        print(f"Response: {response.text}")
    print("-" * 50)

def main():
    print("Starting Math Agent API Tests...")
    
    try:
        # 1. Test /invoke (Simple single-query interface)
        print("\n1. Testing /invoke endpoint (Single Query)...")
        invoke_data = {
            "role": "user",
            "content": "What is (45 + 55) * 2 / 10?"
        }
        res = requests.post(f"{BASE_URL}/invoke", json=invoke_data)
        print_response("Invoke Result", res)

        # 2. Test /chat (Conversation history interface)
        print("\n2. Testing /chat endpoint (Multi-turn Conversation)...")
        chat_data = {
            "messages": [
                {"role": "user", "content": "I have 100 dollars."},
                {"role": "assistant", "content": "Understood. You have 100 dollars."},
                {"role": "user", "content": "Multiply that by 5 and then subtract 30. How much is left?"}
            ]
        }
        res = requests.post(f"{BASE_URL}/chat", json=chat_data)
        print_response("Chat Result", res)

        print("\n✅ All tests sent. Verify responses above.")

    except requests.exceptions.ConnectionError:
        print(f"\n❌ Error: Could not connect to the math agent at {BASE_URL}.")
        print("Please ensure the agent is running by executing:")
        print("   python backend/langgraph-explore/deploy_math.py")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
