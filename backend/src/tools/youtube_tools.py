
from langchain.tools import tool
from youtube_transcript_api import YouTubeTranscriptApi


# ---------------------------------------------------------
# 4. YouTube Transcription Tool
# ---------------------------------------------------------
@tool
def youtube_summary_tool(url: str) -> str:
    """
    Returns the transcript of a YouTube video.
    Input: full YouTube video link
    """
    try:
        video_id = url.split("v=")[1]
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        text = " ".join([t["text"] for t in transcript])
        return text[:4000]
    except:
        return "Transcript not available or video unsupported."

