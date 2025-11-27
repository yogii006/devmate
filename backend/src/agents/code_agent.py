from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage


class CodeAgent:
    def __init__(self, model_name):
        self.llm = ChatOpenAI(model=model_name, temperature=0.3)

    def handle_code_task(self, query: str) -> str:
        prompt = f"You are a coding assistant.\nTask: {query}"
        result = self.llm.invoke([HumanMessage(content=prompt)])

        # Normalize different possible return shapes from various LLM wrappers
        #  - Some libraries return a message-like object with `.content`.
        #  - Some return a list of messages, or a dict.
        content = getattr(result, "content", None)
        if content is None and isinstance(result, list) and result:
            first = result[0]
            content = getattr(first, "content", None)
            if content is None and isinstance(first, dict):
                content = first.get("content")
        if content is None and isinstance(result, dict):
            content = result.get("content")

        # Fallback to string representation if no `.content` found
        return content or str(result)
