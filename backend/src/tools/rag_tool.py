"""
RAG Tool for file processing and question answering
File: src/tools/rag_tool.py
"""

import base64
import io
import os
import re
from typing import Optional, List, Dict, Any
from datetime import datetime
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from src.db import rag_documents_collection  # Import from centralized db
import PyPDF2
from PIL import Image
import pytesseract
from contextvars import ContextVar

# Context variable to store current user_id
current_user_id: ContextVar[Optional[str]] = ContextVar('current_user_id', default=None)


# Helper Functions

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks"""
    chunks = []
    sentences = re.split(r'[.!?]+', text)
    
    current_chunk = ""
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
            
        if len(current_chunk) + len(sentence) > chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            # Add overlap by keeping last part of chunk
            words = current_chunk.split()
            overlap_text = " ".join(words[-overlap:]) if len(words) > overlap else current_chunk
            current_chunk = overlap_text + " " + sentence
        else:
            current_chunk += " " + sentence
    
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    return chunks


def extract_text_from_pdf(file_data: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_file = io.BytesIO(file_data)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise Exception(f"Error extracting PDF text: {str(e)}")


def extract_text_from_image_ocr(file_data: bytes) -> str:
    """Extract text from image using OCR (fallback option)"""
    try:
        image = Image.open(io.BytesIO(file_data))
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        # If OCR fails, return empty string (will use OpenAI vision as fallback)
        return ""


def extract_text_with_openai_vision(file_data: bytes, file_type: str) -> str:
    """Use OpenAI Vision to extract text from images"""
    try:
        base64_data = base64.b64encode(file_data).decode('utf-8')
        
        llm = ChatOpenAI(
            model="gpt-4o",  # GPT-4 Vision model
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        from langchain_core.messages import HumanMessage
        
        message = HumanMessage(
            content=[
                {
                    "type": "text",
                    "text": "Extract all text and describe all content from this image in detail. Include any text, labels, diagrams, charts, or visual information. Be comprehensive and structured."
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{file_type};base64,{base64_data}"
                    }
                }
            ]
        )
        
        response = llm.invoke([message])
        return response.content
    except Exception as e:
        raise Exception(f"Error with OpenAI vision extraction: {str(e)}")


def simple_similarity_search(chunks: List[str], query: str, top_k: int = 3) -> List[str]:
    """Simple keyword-based similarity search"""
    query_lower = query.lower()
    query_words = set(query_lower.split())
    # Keep words longer than 2 characters, but also include important short words
    query_words = {w for w in query_words if len(w) > 2 or w in ['is', 'are', 'was', 'the', 'a', 'an']}
    
    # If query is very short or generic, return first chunks
    if len(query_words) == 0 or len(query) < 5:
        return chunks[:top_k] if len(chunks) >= top_k else chunks
    
    scored_chunks = []
    for chunk in chunks:
        chunk_lower = chunk.lower()
        # Score based on word matches
        score = sum(1 for word in query_words if word in chunk_lower)
        # Bonus for exact phrase match
        if query_lower in chunk_lower:
            score += 5
        if score > 0:
            scored_chunks.append((chunk, score))
    
    # Sort by score and return top_k
    scored_chunks.sort(key=lambda x: x[1], reverse=True)
    
    # If we found matches, return them; otherwise return first chunks as fallback
    if scored_chunks:
        return [chunk for chunk, _ in scored_chunks[:top_k]]
    else:
        return chunks[:top_k] if len(chunks) >= top_k else chunks


# LangChain Tools

@tool
async def process_and_store_file(file_data: str, file_name: str, file_type: str, user_id: str) -> str:
    """
    Process uploaded file, extract text content, and store in MongoDB.
    Use this tool when a user uploads a document (PDF, image, text file, etc.) that they want to analyze or ask questions about.
    
    Args:
        file_data: Base64 encoded file data
        file_name: Name of the uploaded file
        file_type: MIME type of the file (e.g., 'application/pdf', 'image/png')
        user_id: ID of the user uploading the file
    
    Returns:
        Success message with file information or error message
    """
    try:
        # Decode file data
        file_bytes = base64.b64decode(file_data)
        
        # Extract text based on file type
        extracted_text = ""
        
        if file_type == 'application/pdf':
            # Try PyPDF2 first
            try:
                extracted_text = extract_text_from_pdf(file_bytes)
            except Exception as e:
                return f"Error extracting PDF text: {str(e)}"
                
        elif file_type.startswith('image/'):
            # Use OpenAI Vision for image processing
            try:
                extracted_text = extract_text_with_openai_vision(file_bytes, file_type)
                if not extracted_text.strip():
                    # Fallback to OCR if vision fails
                    extracted_text = extract_text_from_image_ocr(file_bytes)
            except Exception as e:
                return f"Error extracting image text: {str(e)}"
            
        elif file_type.startswith('text/') or file_type == 'application/json':
            try:
                extracted_text = file_bytes.decode('utf-8')
            except Exception as e:
                return f"Error decoding text file: {str(e)}"
            
        else:
            return f"Unsupported file type: {file_type}. Supported types: PDF, images (JPG, PNG), text files, JSON."
        
        if not extracted_text.strip():
            return "No text could be extracted from the file. The file might be empty or corrupted."
        
        # Chunk the text
        chunks = chunk_text(extracted_text)
        
        # Create document for MongoDB
        document = {
            "user_id": user_id,
            "file_name": file_name,
            "file_type": file_type,
            "file_size": len(file_bytes),
            "extracted_text": extracted_text,
            "chunks": chunks,
            "chunk_count": len(chunks),
            "uploaded_at": datetime.utcnow(),
            "is_latest": False,
            "metadata": {
                "processed_by": "rag_tool",
                "version": "1.0"
            }
        }
        
        # Mark all previous files as not latest
        await rag_documents_collection.update_many(
            {"user_id": user_id, "is_latest": True},
            {"$set": {"is_latest": False}}
        )
        
        # Insert new document and mark as latest
        document["is_latest"] = True
        result = await rag_documents_collection.insert_one(document)
        
        return f"✅ File '{file_name}' processed successfully! Extracted {len(chunks)} chunks of text ({len(extracted_text)} characters). You can now ask questions about this document."
        
    except Exception as e:
        return f"Error processing file: {str(e)}"


@tool
async def query_documents(question: str) -> str:
    """
    Query stored documents to answer questions using RAG (Retrieval Augmented Generation).
    Use this tool when a user asks questions about their uploaded documents.
    This tool automatically uses the current user's latest uploaded document.
    
    Args:
        question: The question to answer based on uploaded documents
    
    Returns:
        Answer based on document content or error message
    """
    try:
        # Get user_id from context
        user_id = current_user_id.get()
        if not user_id:
            return "Error: User context not available. Please try again."
        
        # Retrieve latest document from MongoDB
        document = await rag_documents_collection.find_one(
            {"user_id": user_id, "is_latest": True}
        )
        
        if not document:
            return "No document found. Please upload a file first using the file upload feature, then I can answer questions about it."
        
        # Get relevant chunks
        chunks = document.get("chunks", [])
        if not chunks:
            return "Document found but no content available. Please try uploading the file again."
        
        # Check if user wants a summary
        question_lower = question.lower()
        is_summary_request = any(keyword in question_lower for keyword in [
            "summarize", "summary", "summarise", "overview", "what is this about",
            "what does this say", "what's in this", "tell me about this"
        ])
        
        # For summary requests, use more chunks or all chunks if document is small
        if is_summary_request:
            # Use all chunks for summary, but limit to reasonable size (max 8000 chars)
            all_text = document.get("extracted_text", "")
            if len(all_text) > 8000:
                # If too long, use top 10 chunks or first 8000 chars
                relevant_chunks = chunks[:10] if len(chunks) > 10 else chunks
                context = "\n\n".join(relevant_chunks)
                if len(context) > 8000:
                    context = context[:8000] + "..."
            else:
                context = all_text
        else:
            # For specific questions, use similarity search
            relevant_chunks = simple_similarity_search(chunks, question, top_k=5)
            
            if not relevant_chunks:
                # If no relevant chunks found, try using first few chunks as fallback
                relevant_chunks = chunks[:3] if len(chunks) >= 3 else chunks
            
            context = "\n\n".join(relevant_chunks)
        
        # Query LLM with context
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        if is_summary_request:
            # Special prompt for summaries
            prompt = f"""Please provide a comprehensive summary of the following document.

Document Name: {document['file_name']}
Document Content:
{context}

Instructions:
- Provide a clear and structured summary covering the main topics, key points, and important information
- Organize the summary with clear sections if the document covers multiple topics
- Include important details, facts, and conclusions from the document
- Be thorough but concise
- If the document is technical, include key technical details
- If the document is a report or analysis, include main findings and recommendations

Summary:"""
        else:
            # Regular question-answering prompt
            prompt = f"""Based on the following document content, please answer the question accurately and concisely.

Document Name: {document['file_name']}
Document Context:
{context}

User Question: {question}

Instructions:
- Answer based ONLY on the information provided in the document context
- Be specific and cite relevant details from the document
- If the answer is not in the document, clearly state that
- Keep your answer clear and well-structured

Answer:"""
        
        response = llm.invoke(prompt)
        answer = response.content
        
        return f"{answer}\n\n📄 Source: {document['file_name']}"
        
    except Exception as e:
        return f"Error querying documents: {str(e)}"


@tool
async def list_user_files() -> str:
    """
    List all files uploaded by the current user.
    Use this tool when a user wants to see what documents they have uploaded.
    
    Returns:
        Formatted list of user's uploaded files
    """
    try:
        # Get user_id from context
        user_id = current_user_id.get()
        if not user_id:
            return "Error: User context not available. Please try again."
        
        cursor = rag_documents_collection.find({"user_id": user_id}).sort("uploaded_at", -1)
        files = await cursor.to_list(length=None)
        
        if not files:
            return "You haven't uploaded any files yet. Upload a document to get started!"
        
        file_list = []
        for idx, doc in enumerate(files, 1):
            status = "📌 (Latest)" if doc.get('is_latest', False) else ""
            file_info = (
                f"{idx}. {doc['file_name']} {status}\n"
                f"   Type: {doc['file_type']}\n"
                f"   Size: {doc['file_size'] / 1024:.2f} KB\n"
                f"   Chunks: {doc.get('chunk_count', 0)}\n"
                f"   Uploaded: {doc['uploaded_at'].strftime('%Y-%m-%d %H:%M:%S')}"
            )
            file_list.append(file_info)
        
        result = f"📚 Your Uploaded Documents ({len(files)} total):\n\n" + "\n\n".join(file_list)
        return result
        
    except Exception as e:
        return f"Error listing files: {str(e)}"


@tool
async def delete_user_file(file_name: str) -> str:
    """
    Delete a specific file for the current user.
    Use this tool when a user wants to delete their uploaded documents.
    
    Args:
        file_name: Specific file name to delete
    
    Returns:
        Deletion status message
    """
    try:
        # Get user_id from context
        user_id = current_user_id.get()
        if not user_id:
            return "Error: User context not available. Please try again."
        
        # Delete specific file
        result = await rag_documents_collection.delete_one({
            "user_id": user_id,
            "file_name": file_name
        })
        
        if result.deleted_count > 0:
            # If deleted file was latest, mark another as latest
            remaining = await rag_documents_collection.find_one({"user_id": user_id})
            if remaining:
                await rag_documents_collection.update_one(
                    {"_id": remaining["_id"]},
                    {"$set": {"is_latest": True}}
                )
            return f"✅ File '{file_name}' has been deleted successfully."
        else:
            return f"File '{file_name}' not found in your uploads."
        
    except Exception as e:
        return f"Error deleting file: {str(e)}"


@tool
async def delete_all_user_files(confirmation: str = "no") -> str:
    """
    Delete all files for the current user. Requires explicit confirmation.
    Use this tool only when user explicitly confirms they want to delete ALL their files.
    
    Args:
        confirmation: Must be "yes" to proceed with deletion
    
    Returns:
        Deletion status message
    """
    try:
        # Get user_id from context
        user_id = current_user_id.get()
        if not user_id:
            return "Error: User context not available. Please try again."
        
        if confirmation.lower() != "yes":
            count = await rag_documents_collection.count_documents({"user_id": user_id})
            return f"⚠️ You have {count} file(s). To delete all files, please confirm by saying 'yes, delete all my files'."
        
        result = await rag_documents_collection.delete_many({"user_id": user_id})
        
        if result.deleted_count > 0:
            return f"✅ Successfully deleted {result.deleted_count} file(s)."
        else:
            return "You don't have any files to delete."
        
    except Exception as e:
        return f"Error deleting files: {str(e)}"


# Function to set user context
def set_user_context(user_id: str):
    """Set the current user_id in context"""
    current_user_id.set(user_id)