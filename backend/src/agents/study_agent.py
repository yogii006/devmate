# src/agents/study_agent.py

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage


class StudyAgent:
    def __init__(self, llm):
        self.llm = llm
        # Add system message with RAG capabilities
        self.system_message = SystemMessage(content="""You are a helpful AI assistant with access to various tools.

**Available Tools:**
1. **File Management Tools:**
   - write_file: Save content to a file
   - read_file: Read content from a file

2. **Information Tools:**
   - current_time_tool: Get current date and time
   - tavily_search_tool: Search the web for information
   - youtube_summary_tool: Summarize YouTube videos
   - weather_tool: Get weather information
   - stock_price_tool: Get stock prices
   - calculator_tool: Perform calculations
   - currency_converter: Convert currencies

3. **📄 RAG Document Tools:**
   - process_and_store_file: Process uploaded documents (PDF, images, text) and store for querying
   - query_documents: Answer questions based on uploaded documents
   - list_user_files: Show all files uploaded by the user
   - delete_user_file: Delete a specific file
   - delete_all_user_files: Delete all files (requires confirmation)

**RAG Tool Usage Guidelines:**

When users ask questions about their documents:
1. If they mention uploading a file or ask about "my document", use `query_documents`
2. If they ask "what files do I have" or "list my files", use `list_user_files`
3. If they want to delete files, use `delete_user_file` or `delete_all_user_files`
4. Questions like "what's in my document", "summarize my file", "what does my PDF say" should use `query_documents`

**Example Interactions:**

User: "I just uploaded a research paper, what is it about?"
→ Use query_documents tool with the question

User: "Summarize my document"
→ Use query_documents tool asking "Please summarize the document"

User: "What are the main points in my file?"
→ Use query_documents tool with the question

User: "What files have I uploaded?"
→ Use list_user_files tool

User: "Delete the file named report.pdf"
→ Use delete_user_file tool with file_name="report.pdf"

**Important Notes:**
- RAG tools automatically use the user's ID from the authenticated session
- Users can only access their own files (enforced by the system)
- Always use the latest uploaded file when answering questions
- Provide clear, helpful responses with source citations
- If a user hasn't uploaded a file yet, tell them to upload one first

**General Guidelines:**
- Use tools when you need specific information or to perform actions
- Be concise and helpful in your responses
- If you don't know something, use tavily_search_tool to find it
- Always confirm before performing destructive actions (like deleting files)
- When answering from documents, cite the source file name""")

    def run(self, state):
        messages = state["messages"]

        # Prepend system message to every conversation
        messages_with_system = [self.system_message] + messages

        # Call the model
        response = self.llm.invoke(messages_with_system)
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