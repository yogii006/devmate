# src/tools/file_tools.py

from langchain.tools import tool
import os
import sys

# Add backend to path so we can import upload_helper
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from upload_helper import upload_to_supabase


@tool
def write_file(filename: str, content: str, username: str = None) -> str:
    """
    Create a file and upload to Supabase (if not exists already).
    Checks if filename already exists and prevents overwrite.
    Saves file in a folder named after the username if provided.
    """
    try:
        from dotenv import load_dotenv
        load_dotenv()

        SUPABASE_URL = os.getenv("SUPABASE_URL", "https://mcytoihwcoitrqemqqwv.supabase.co")
        BUCKET_NAME = os.getenv("SUPABASE_BUCKET", "devmate")

        # Prefix filename with username folder if provided
        if username:
            filename = f"{username}/{filename}"

        # Public object URL
        file_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{filename}"

        # Check if file already exists
        import requests
        check = requests.get(file_url)

        if check.status_code == 200:
            # File exists already
            return (
                f"⚠️ A file named '{filename}' already exists.\n"
                f"Download link: {file_url}\n"
                f"Would you like to use this existing file, or choose another filename?"
            )

        # If does not exist → create file
        content_to_write = "" if content is None else str(content)
        file_bytes = content_to_write.encode("utf-8")

        download_url = upload_to_supabase(file_bytes, filename)

        return f"✅ File created successfully: {filename}. Download link: {download_url}"

    except Exception as e:
        return f"❌ Error writing file {filename}: {e}"

@tool
def read_file(filename: str) -> str:
    """
    Read content from a file stored in Supabase by fetching it.
    Args:
        filename: Name of the file to read from Supabase
    """
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        SUPABASE_URL = os.getenv("SUPABASE_URL", "https://mcytoihwcoitrqemqqwv.supabase.co")
        BUCKET_NAME = os.getenv("SUPABASE_BUCKET", "devmate")
        read_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{filename}"
        
        import requests
        res = requests.get(read_url)
        if res.status_code == 200:
            return res.text
        else:
            return f"File not found or not accessible: {filename}"
    except Exception as e:
        return f"Error reading file {filename}: {e}"
