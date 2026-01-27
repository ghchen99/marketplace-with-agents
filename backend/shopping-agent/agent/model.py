import os
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
from .tools import TOOLS

load_dotenv()

def get_model():
    model = init_chat_model(
        "azure_openai:gpt-4.0",
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
    )
    return model.bind_tools(TOOLS)
