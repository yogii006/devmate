
from src.tools.file_tools import write_file, read_file
from src.tools.time_tools import current_time_tool
from src.agents.study_agent import StudyAgent
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState
from langgraph.prebuilt import ToolNode
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    # dotenv is optional in some environments; ignore if not available
    pass

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
        self.tools = [write_file, read_file, current_time_tool]
        # Bind tools to the LLM so it can emit tool calls
        try:
            self.llm_with_tools = self.llm.bind_tools(self.tools)
        except Exception:
            # If binding fails (different runtime versions), fall back to raw llm
            self.llm_with_tools = self.llm

        self.tool_node = ToolNode(self.tools)

    def build(self):
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


dev_graph = DevGraph()
sync_graph = dev_graph.build()
