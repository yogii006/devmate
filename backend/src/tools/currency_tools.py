
import requests
from langchain.tools import tool


# ---------------------------------------------------------
# 5. Currency Converter Tool
# ---------------------------------------------------------
@tool
def currency_converter(from_currency: str, to_currency: str, amount: float) -> str:
    """
    Converts currency example input: 'USD', 'INR', 10
    """
    try:
        url = f"https://api.exchangerate-api.com/v4/latest/{from_currency.upper()}"
        data = requests.get(url).json()
        rate = data["rates"][to_currency.upper()]
        return f"{amount} {from_currency} = {round(amount * rate, 2)} {to_currency}"
    except:
        return "Conversion failed."
