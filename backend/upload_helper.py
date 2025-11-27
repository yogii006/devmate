"""Supabase file upload helper for DevMate backend."""

from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

# Load Supabase credentials from .env
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://mcytoihwcoitrqemqqwv.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeXRvaWh3Y29pdHJxZW1xcXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMjk2MDgsImV4cCI6MjA3OTgwNTYwOH0.9Z9YmRCGrg5ATe370Mr9hBDHKU4nnVAhW0WHqxQ7Grw")
BUCKET_NAME = os.getenv("SUPABASE_BUCKET", "devmate")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def upload_to_supabase(file_bytes: bytes, filename: str) -> str:
    """Upload file bytes to Supabase and return public URL.
    
    Args:
        file_bytes: File content as bytes
        filename: Name of file (should be unique or include timestamp)
    
    Returns:
        Public download URL from Supabase
    """
    try:
        # Upload bytes to Supabase storage bucket
        supabase.storage.from_(BUCKET_NAME).upload(filename, file_bytes)
        
        # Get public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(filename)
        return public_url
    except Exception as e:
        raise Exception(f"Supabase upload failed: {str(e)}")
