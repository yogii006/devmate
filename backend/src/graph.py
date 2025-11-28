from src.tools.file_tools import write_file, read_file
from src.tools.time_tools import current_time_tool
from src.tools.web_tools import tavily_search_tool
from src.tools.calculator_tools import calculator_tool
from src.tools.currency_tools import currency_converter
from src.tools.weather_tools import weather_tool
from src.tools.youtube_tools import youtube_summary_tool
# from src.tools.st_tools import youtube_summary_tool
from src.tools.stock_tools import stock_price_tool
from src.agents.study_agent import StudyAgent
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState
from langgraph.prebuilt import ToolNode
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    # dotenv is optional in some environments; ignore if not available
    pass

# -----------------------------
# Helper function to format messages for API
# -----------------------------
def format_messages_for_api(messages):
    """Convert LangChain message objects to API-friendly dicts with role and content"""
    formatted = []
    for msg in messages:
        if isinstance(msg, HumanMessage):
            formatted.append({"role": "user", "content": msg.content})
        elif isinstance(msg, AIMessage):
            formatted.append({"role": "assistant", "content": msg.content})
        elif isinstance(msg, SystemMessage):
            formatted.append({"role": "system", "content": msg.content})
        elif isinstance(msg, ToolMessage):
            # Skip tool messages or include them as system messages
            formatted.append({"role": "system", "content": f"Tool result: {msg.content}"})
        elif isinstance(msg, dict):
            # Already a dict, ensure it has role and content
            if "role" in msg and "content" in msg:
                formatted.append({"role": msg["role"], "content": msg["content"]})
            elif "content" in msg:
                formatted.append({"role": "assistant", "content": msg["content"]})
        else:
            # Unknown message type, try to extract content
            content = getattr(msg, "content", str(msg))
            formatted.append({"role": "assistant", "content": content})
    return formatted


def convert_api_messages_to_langchain(messages):
    """Convert API dicts to LangChain message objects"""
    langchain_messages = []
    for msg in messages:
        if isinstance(msg, dict):
            role = msg.get("role", "user")
            content = msg.get("content", "")
            
            if role == "user":
                langchain_messages.append(HumanMessage(content=content))
            elif role == "assistant":
                langchain_messages.append(AIMessage(content=content))
            elif role == "system":
                langchain_messages.append(SystemMessage(content=content))
        else:
            # Already a LangChain message object
            langchain_messages.append(msg)
    return langchain_messages


# -----------------------------
# Use the State class, not instance
# -----------------------------
persistent_memory_class = MessagesState

class DevGraph:
    def __init__(self, model_name: str = "gpt-4o-mini"):
        self.llm = ChatOpenAI(
            model=model_name,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.tools = [write_file, read_file, current_time_tool, tavily_search_tool, youtube_summary_tool,calculator_tool, currency_converter, weather_tool, stock_price_tool]
        # Bind tools to the LLM so it can emit tool calls
        try:
            self.llm_with_tools = self.llm.bind_tools(self.tools)
        except Exception:
            # If binding fails (different runtime versions), fall back to raw llm
            self.llm_with_tools = self.llm

        self.tool_node = ToolNode(self.tools)
        
        # Build graph once during initialization (thread-safe, stateless)
        self.compiled_graph = self._build()

    def _build(self):
        """Build the graph once - reused for all requests"""
        # pass the class, not an instance
        graph = StateGraph(persistent_memory_class)

        # Agents
        # Give the agent the tool-aware LLM when available
        study_agent = StudyAgent(self.llm_with_tools)

        # Nodes
        graph.add_node("study_agent", study_agent.run)
        graph.add_node("tool_node", self.tool_node)

        graph.set_entry_point("study_agent")

        graph.add_conditional_edges(
            "study_agent",
            study_agent.route,
            {
                "tools": "tool_node",
                "end": "__end__",
            },
        )

        graph.add_edge("tool_node", "study_agent")
        return graph.compile()
    
    def invoke(self, input_data):
        """Wrapper around graph invoke to handle message format conversion
        
        Each invocation is independent - state comes from input_data parameter.
        This makes it safe for concurrent users.
        """
        # Convert incoming API messages to LangChain format
        if "messages" in input_data:
            input_data["messages"] = convert_api_messages_to_langchain(input_data["messages"])
        
        # Invoke the compiled graph (each call gets its own state)
        # The graph is stateless - all data flows through input_data
        result = self.compiled_graph.invoke(input_data)
        
        # Convert output messages back to API format
        if isinstance(result, dict) and "messages" in result:
            result["messages"] = format_messages_for_api(result["messages"])
        
        return result


# Create single instance - safe for multiple concurrent users
# because each invoke() call gets its own state from input_data
dev_graph = DevGraph()
sync_graph = dev_graph