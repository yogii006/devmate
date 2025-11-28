import yfinance as yf
from langchain.tools import tool

@tool("stock_price_tool", return_direct=True)
def stock_price_tool(ticker: str) -> str:
    """
    Returns the current stock price for a given ticker.
    Example Input:
    'AAPL'  -> Apple
    'TSLA'  -> Tesla
    'RELIANCE.NS' -> Reliance Industries (NSE)
    'TCS.NS' -> Tata Consultancy Services (NSE)
    """

    try:
        stock = yf.Ticker(ticker)
        price = stock.history(period="1d")["Close"].iloc[-1]

        if price:
            return f"Current price of {ticker}: ₹{price:.2f}" if ticker.endswith(".NS") else f"Current price of {ticker}: ${price:.2f}"
        return "Price not found."
    except Exception as e:
        return f"Error fetching price: {str(e)}"
