from langchain.tools import tool
import math

@tool
def calculator_tool(expression: str) -> str:
    """
    A safe calculator tool that evaluates mathematical expressions.
    Example input: "10 + 20 / 2", "5 * (4 + 3)", "2 ** 8"
    Returns the calculated result.
    """

    allowed_chars = "0123456789+-*/().% "
    if any(ch not in allowed_chars for ch in expression):
        return "Invalid characters in expression"

    try:
        result = eval(expression, {"__builtins__": None}, {})
        return str(result)
    except Exception as e:
        return f"Calculation error: {str(e)}"
