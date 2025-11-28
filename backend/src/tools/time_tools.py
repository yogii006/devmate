import requests
from langchain.tools import tool

@tool
def current_time_tool() -> str:
    """
    Returns accurate real world time using WorldTimeAPI.
    """
    response = requests.get("https://worldtimeapi.org/api/timezone/Asia/Kolkata")
    data = response.json()
    return data["datetime"]
