class Orchestrator:
    """
    Routes the user request to the correct agent.
    """

    def route(self, query: str) -> str:
        q = query.lower()

        if "study" in q or "plan" in q or "notes" in q:
            return "study_agent"

        if "code" in q or "bug" in q or "function" in q:
            return "code_agent"

        return "study_agent"   # fallback
