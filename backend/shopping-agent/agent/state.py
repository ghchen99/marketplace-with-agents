from typing import TypedDict, Annotated, List
import operator
from langchain.messages import AnyMessage

class MessagesState(TypedDict):
    messages: Annotated[List[AnyMessage], operator.add]
