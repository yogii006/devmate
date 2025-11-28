import os
import requests
from dotenv import load_dotenv
from langchain.tools import tool

# Load environment variables
load_dotenv()
WEATHER_API_KEY = os.getenv("WEATHERAPI_KEY")   # update your .env


# ---------------------------------------------------------
# Weather Tool (WeatherAPI free, no card needed)
# ---------------------------------------------------------
@tool("weather_tool", return_direct=True)
def weather_tool(city: str) -> str:
    """
    Returns current weather for a city.
    Example input: 'Delhi', 'Mumbai'
    """
    if not WEATHER_API_KEY:
        return "WEATHERAPI_KEY missing in .env"

    try:
        url = f"http://api.weatherapi.com/v1/current.json?key={WEATHER_API_KEY}&q={city}&aqi=no"
        response = requests.get(url).json()

        if "error" in response:
            return f"Error: {response['error']['message']}"

        temp = response["current"]["temp_c"]
        condition = response["current"]["condition"]["text"]
        location = response["location"]["name"]

        return f"Weather in {location}: {temp}°C, {condition}"
    except Exception as e:
        return f"Failed to fetch weather: {str(e)}"

