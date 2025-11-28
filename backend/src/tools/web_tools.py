import os
from dotenv import load_dotenv
import requests
from langchain.tools import tool

# Load environment variables from .env
load_dotenv()

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

@tool
def tavily_search_tool(query: str) -> str:
    """
    Searches the web using the Tavily Search API and returns the result summary text.
    Provide a search query as the input string.
    """
    if not TAVILY_API_KEY:
        return "Error: TAVILY_API_KEY not found in environment variables."

    url = "https://api.tavily.com/search"
    payload = {
        "api_key": TAVILY_API_KEY,
        "query": query,
        "search_depth": "advanced",
        "include_answer": True
    }

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()  # Raise error for bad responses
        result = response.json()
        return result.get("answer") or "No summarized answer available."

    except Exception as e:
        return f"Error occurred while fetching data: {str(e)}"
