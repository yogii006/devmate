# DevMate New🤖

**DevMate** is an AI-powered assistant platform that combines conversational AI with document analysis and specialized tools. Built with FastAPI, React, LangChain, and MongoDB, it provides an intelligent chat interface with RAG (Retrieval Augmented Generation) capabilities for document Q&A.

![DevMate](https://img.shields.io/badge/DevMate-AI%20Assistant-blue)
![Python](https://img.shields.io/badge/Python-3.8+-green)
![React](https://img.shields.io/badge/React-18.3-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green)

## ✨ Features

### 🤖 Conversational AI
- **Multi-agent System**: Intelligent routing between StudyAgent and CodeAgent
- **Conversation History**: Persistent chat history with conversation management
- **Context-aware Responses**: Maintains context across multi-turn conversations

### 📄 Document Analysis (RAG)
- **File Upload**: Support for PDFs, images (JPG, PNG), and text files
- **Text Extraction**: 
  - PDF text extraction using PyPDF2
  - Image text extraction using OpenAI Vision API
  - OCR fallback with pytesseract
- **Intelligent Q&A**: Ask questions about uploaded documents
- **Document Summarization**: Automatic summarization of document content
- **File Management**: List, view, and delete uploaded files

### 🛠️ Specialized Tools
- **File Operations**: Read/write files to Supabase storage
- **Web Search**: Real-time web search using Tavily API
- **YouTube**: Extract and summarize YouTube video transcripts
- **Weather**: Get current weather information
- **Stock Prices**: Real-time stock market data
- **Currency Conversion**: Convert between currencies
- **Calculator**: Perform mathematical calculations
- **Time/Date**: Get current time and date information

### 🔐 Authentication & Security
- **User Authentication**: JWT-based signup/login system
- **User Isolation**: Each user's data is completely isolated
- **Secure File Storage**: Files stored in Supabase with user-specific folders

### 💬 Modern Chat Interface
- **Markdown Rendering**: Beautiful markdown formatting for AI responses
- **Syntax Highlighting**: Color-coded code blocks with copy functionality
- **File Downloads**: Direct download links for generated files
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Conversation Sidebar**: Easy navigation through chat history

## 🏗️ Tech Stack

### Backend
- **Framework**: FastAPI
- **AI/ML**: 
  - LangChain & LangGraph for agent orchestration
  - OpenAI GPT-4o-mini & GPT-4o (for vision)
- **Database**: MongoDB (Motor async driver)
- **File Storage**: Supabase Storage
- **Authentication**: JWT tokens with passlib
- **File Processing**: PyPDF2, Pillow, pytesseract

### Frontend
- **Framework**: React 18.3
- **Styling**: Custom CSS with modern design
- **Markdown**: react-markdown
- **Syntax Highlighting**: react-syntax-highlighter
- **HTTP Client**: Fetch API

## 📋 Prerequisites

- Python 3.8 or higher
- Node.js 16+ and npm
- MongoDB instance (local or cloud)
- Supabase account (for file storage)
- OpenAI API key
- Tavily API key (optional, for web search)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd devmate
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd devmate-frontend
npm install
```

### 4. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# Database
MONGO_URI=mongodb://localhost:27017
DB_NAME=devmate

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
SUPABASE_BUCKET=devmate

# JWT Secret (change in production)
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Tavily (optional)
TAVILY_API_KEY=your_tavily_api_key
```

### 5. MongoDB Setup

Ensure MongoDB is running. The application will automatically create indexes on startup.

### 6. Supabase Setup

1. Create a Supabase project
2. Create a storage bucket named `devmate` (or update `SUPABASE_BUCKET` in `.env`)
3. Set the bucket to public or configure appropriate policies

## 🏃 Running the Application

### Start Backend Server

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Start Frontend Development Server

```bash
cd devmate-frontend
npm start
```

The frontend will be available at `http://localhost:3000`

## 📁 Project Structure

```
devmate/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── auth.py                 # Authentication utilities
│   ├── db.py                   # MongoDB connection and collections
│   ├── models.py               # Pydantic models
│   ├── upload_helper.py        # Supabase file upload helper
│   ├── requirements.txt        # Python dependencies
│   └── src/
│       ├── graph.py            # LangGraph orchestration
│       ├── agents/
│       │   ├── study_agent.py  # Study agent implementation
│       │   ├── code_agent.py   # Code agent implementation
│       │   └── orchestrator.py # Agent routing logic
│       └── tools/
│           ├── rag_tool.py           # RAG document processing
│           ├── file_tools.py         # File read/write operations
│           ├── web_tools.py          # Web search (Tavily)
│           ├── youtube_tools.py      # YouTube transcript extraction
│           ├── weather_tools.py      # Weather information
│           ├── stock_tools.py        # Stock price data
│           ├── currency_tools.py     # Currency conversion
│           ├── calculator_tools.py   # Mathematical calculations
│           └── time_tools.py         # Time/date information
│
└── devmate-frontend/
    ├── src/
    │   ├── App.js              # Main React component
    │   ├── App.css              # Application styles
    │   └── index.js             # React entry point
    ├── public/                  # Static assets
    ├── package.json             # Node dependencies
    └── README.md                # Frontend-specific README
```

## 🔌 API Endpoints

### Authentication
- `POST /signup` - User registration
- `POST /login` - User login

### Chat & Conversations
- `POST /run` - Send message to AI agent
- `GET /conversations` - Get all user conversations
- `GET /conversations/{id}` - Get specific conversation

### File Operations
- `POST /upload` - Upload and process document
- `GET /files` - List user's uploaded files
- `DELETE /files/{filename}` - Delete a file

## 💡 Usage Examples

### 1. Upload and Analyze a Document

```
User: [Uploads a PDF file]
AI: ✅ File 'document.pdf' processed successfully! Extracted 15 chunks of text (5000 characters). You can now ask questions about this document.

User: Summarize this file
AI: [Provides comprehensive summary of the document]
```

### 2. Ask Questions About Documents

```
User: What are the main points in my document?
AI: [Answers based on document content with citations]
```

### 3. Use Specialized Tools

```
User: What's the weather in New York?
AI: [Uses weather_tool to fetch and display weather]

User: Search the web for latest AI news
AI: [Uses tavily_search_tool to find and summarize results]

User: Convert 100 USD to EUR
AI: [Uses currency_converter tool]
```

### 4. Code Generation

```
User: Write a Python function to calculate factorial
AI: [Generates code with syntax highlighting]
```

## 🎨 Features in Detail

### RAG (Retrieval Augmented Generation)
- Documents are chunked and stored in MongoDB
- Keyword-based similarity search for relevant chunks
- Context-aware responses using retrieved chunks
- Automatic summarization for summary requests

### Multi-Agent System
- **StudyAgent**: Handles general queries, document Q&A, and study-related tasks
- **CodeAgent**: Specialized for coding tasks and bug fixes
- **Orchestrator**: Routes queries to appropriate agents

### File Processing
- **PDF**: Text extraction using PyPDF2
- **Images**: OpenAI Vision API for text extraction, OCR fallback
- **Text Files**: Direct UTF-8 decoding
- **Chunking**: Intelligent sentence-based chunking with overlap

## 🔧 Configuration

### Backend Configuration

Key configuration options in `backend/src/graph.py`:
- Model selection: Change `model_name` in `DevGraph.__init__()`
- Tool selection: Modify `self.tools` list

### Frontend Configuration

Update API endpoint in `devmate-frontend/src/App.js`:
```javascript
const API_ROOT = "http://127.0.0.1:8000";  // Development
// const API_ROOT = "https://your-api-url.com";  // Production
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check `MONGO_URI` in `.env`
- Verify network connectivity

### File Upload Fails
- Check Supabase credentials
- Verify bucket exists and is accessible
- Check file size limits

### OpenAI API Errors
- Verify `OPENAI_API_KEY` is set correctly
- Check API quota and billing
- Ensure model access (GPT-4o requires access)

### Syntax Highlighting Not Working
- Ensure `react-syntax-highlighter` is installed
- Check browser console for errors
- Verify code block language is detected

## 🚢 Deployment

### Backend Deployment

1. Set production environment variables
2. Use a production ASGI server:
   ```bash
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```
3. Configure reverse proxy (nginx)
4. Set up SSL certificates

### Frontend Deployment

1. Build the production bundle:
   ```bash
   cd devmate-frontend
   npm run build
   ```
2. Serve `build/` directory with a web server
3. Update API endpoint to production URL
4. Configure CORS on backend if needed

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [LangChain](https://www.langchain.com/) for AI orchestration
- [OpenAI](https://openai.com/) for language models
- [FastAPI](https://fastapi.tiangolo.com/) for the web framework
- [React](https://reactjs.org/) for the frontend framework
- [Supabase](https://supabase.com/) for file storage

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Made with ❤️ by the DevMate(Yogesh Yadav) team**

