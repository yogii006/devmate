# src/agents/study_agent.py

from langchain_core.messages import HumanMessage, AIMessage


class StudyAgent:
    def __init__(self, llm):
        self.llm = llm

    def run(self, state):
        messages = state["messages"]

        # Call the model
        response = self.llm.invoke(messages)
        return {"messages": messages + [response]}

    def route(self, state):
        """Decide where to go next in the graph."""
        last = state["messages"][-1]
        # LLM wants to use a tool — support multiple possible shapes
        # Some runtimes return message objects with attributes like `tool_calls`
        # Others include tool calls inside `additional_kwargs` or as dict fields.
        try:
            # 1) message object with attribute
            if getattr(last, "tool_calls", None):
                return "tools"

            # 2) message object with additional_kwargs.tool_calls
            additional = getattr(last, "additional_kwargs", None)
            if additional and additional.get("tool_calls"):
                return "tools"

            # 3) dict-like shapes
            if isinstance(last, dict):
                if last.get("tool_calls"):
                    return "tools"
                if isinstance(last.get("additional_kwargs"), dict) and last["additional_kwargs"].get("tool_calls"):
                    return "tools"

            # 4) some wrappers use 'tool_call' or other variants
            if getattr(last, "tool_call", None) or (isinstance(last, dict) and last.get("tool_call")):
                return "tools"
        except Exception:
            # If any introspection fails, fall through to end
            pass

        # Normal response, end workflow
        return "end"
