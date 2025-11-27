from datetime import datetime
from langchain.tools import tool

@tool
def current_time_tool() -> str:
    """
    Returns the current date and time in ISO format.
    """
    now = datetime.now()
    return now.isoformat()
