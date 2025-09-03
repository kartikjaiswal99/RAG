# Mini RAG Application

## Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ React Frontend  │────│   FastAPI API    │────│  Cloud Services │
│                 │    │                  │    │                 │
│ • File Upload   │    │ • Document Routes│    │ • Pinecone DB   │
│ • Query Input   │    │ • Processing     │    │ • Google AI     │
│ • Answer Display│    │ • Error Handling │    │ • Cohere Rerank │
│ • Citations     │    │ • CORS Support   │    │ • Gemini LLM    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────┴────────┐             │
         │              │   Core Services │             │
         │              │                 │             │
         │              │ ┌─────────────┐ │             │
         └──────────────┼─│ Chunking    │ │             │
                        │ │ Service     │ │             │
                        │ └─────────────┘ │             │
                        │ ┌─────────────┐ │             │
                        │ │ Embedding   │ │─────────────┤
                        │ │ Service     │ │             │
                        │ └─────────────┘ │             │
                        │ ┌─────────────┐ │             │
                        │ │ Vector Store│ │─────────────┤
                        │ │ Service     │ │             │
                        │ └─────────────┘ │             │
                        │ ┌─────────────┐ │             │
                        │ │ Retrieval   │ │─────────────┤
                        │ │ Service     │ │             │
                        │ └─────────────┘ │             │
                        │ ┌─────────────┐ │             │
                        │ │ LLM         │ │─────────────┤
                        │ │ Service     │ │             │
                        │ └─────────────┘ │             │
                        └─────────────────┘             │
                                                        │
                        ┌─────────────────────────────────┘
                        │
               ┌────────▼────────┐
               │   RAG Pipeline  │
               │                 │
               │ 1. Upload Doc   │
               │ 2. Extract Text │
               │ 3. Chunk Text   │
               │ 4. Generate     │
               │    Embeddings   │
               │ 5. Store Vectors│
               │ 6. Query Search │
               │ 7. Rerank       │
               │ 8. Generate     │
               │    Answer       │
               │ 9. Extract      │
               │    Citations    │
               └─────────────────┘
```
---

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 14+
- API Keys for:
  - Google AI (Gemini + Embeddings)
  - Pinecone (Vector Database)
  - Cohere (Reranking)

### 1. Clone Repository

```bash
git clone <repository-url>
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
uv pip install -r pyproject.toml 

# Create environment file
cp .env.example .env
# Edit .env with your API keys (see Environment Variables section)

# Start backend server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 4. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Google AI Configuration
GOOGLE_API_KEY=your_google_ai_api_key

# Pinecone Configuration  
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=rag-documents

# Cohere Configuration
COHERE_API_KEY=your_cohere_api_key

# Optional Configuration
MAX_FILE_SIZE_MB=10
```
---

##  Technical Specifications

### Vector Database Configuration (Pinecone)

- **Provider**: Pinecone Serverless
- **Dimensionality**: 768 (Google text-embedding-004)
- **Upsert Strategy**: Individual document chunks with metadata

### Chunking Parameters

- **Strategy**: Character-based chunking with word boundary awareness
- **Chunk Size**: 1,000 characters
- **Overlap**: 150 characters (15% overlap)
- **Metadata Stored**: 
  - `source`: Document filename/identifier
  - `title`: Document title
  - `section`: Document section (default: "main")
  - `position`: Chunk position in document


### Embedding Model

- **Provider**: Google AI
- **Model**: `text-embedding-004`
- **Dimension**: 768
- **Task Types**:
  - `RETRIEVAL_DOCUMENT`: For storing document chunks
  - `RETRIEVAL_QUERY`: For query embedding


### Retrieval & Reranking Settings

- **Initial Retrieval**: Top-k=10 documents via vector similarity
- **Reranker**: Cohere `rerank-english-v3.0`
- **Final Selection**: Top-5 reranked documents
- **Fallback**: Vector similarity only if reranking fails

### LLM Configuration

- **Provider**: Google Gemini
- **Model**: `gemini-2.5-flash`
- **Temperature**: 0.1 (for consistency)
- **Max Output Tokens**: 1,024
- **Features**: Inline citations, source mapping, no-answer handling


## API Endpoints

### Upload Document
```
POST /upload
Content-Type: multipart/form-data

Parameters:
- file: UploadFile (PDF or text file)
- text: str (alternative to file upload)
- title: str (document title, default: "Untitled Document")
```

### Query Documents
```
POST /query
Content-Type: application/json

Body:
{
  "query": "Your question here",
  "top_k": 10,           // Initial retrieval count
  "rerank_top_k": 5      // Final reranked count
}
```

##  Frontend Features

- **Document Upload**: Drag-and-drop file upload with PDF and text support
- **Query Interface**: Clean search interface with advanced settings
- **Answer Display**: Markdown-rendered responses with inline citations
- **Citations Panel**: Source snippets with document references
- **Performance Metrics**: Request timing and token/cost estimates
- **Evaluation System**: Built-in evaluation with 5 Q/A gold standard pairs

##  Project Structure

```
AssgnM/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   └── schemas.py          # Pydantic models
│   │   ├── services/
│   │   │   ├── chunking.py         # Text chunking logic
│   │   │   ├── embedding.py        # Google AI embeddings
│   │   │   ├── vector_store.py     # Pinecone operations
│   │   │   ├── retrieval.py        # Search + reranking
│   │   │   └── llm.py             # Gemini LLM service
│   │   └── routes.py              # API route handlers
│   ├── main.py                    # FastAPI application
│   ├── .env                       # Environment variables
│   └── requirements.txt           # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DocumentUpload.js   # File upload component
│   │   │   ├── QueryInterface.js   # Search interface
│   │   │   ├── AnswerDisplay.js    # Response display
│   │   │   ├── Evaluation.js       # Evaluation system
│   │   │   └── Icons.js           # Custom SVG icons
│   │   ├── App.js                 # Main application
│   │   └── index.js               # React entry point
│   ├── package.json               # Node.js dependencies
│   └── tailwind.config.js         # Tailwind CSS config
└── README.md                      # This file
```

##  Evaluation System

The application includes a built-in evaluation system with:

- **5 Q/A Standard Pairs**: Predefined question-answer pairs for testing
- **Metrics Calculated**:
  - Success Rate: Percentage of successful retrievals
  - Keyword Precision: Accuracy of key terms in responses
  - Citation Quality: Relevance of provided citations
  - Average Response Time: Performance measurement
- **Interactive Testing**: Run evaluations through the frontend interface
## Remarks & Trade-offs

### Provider Limitations
- **Google AI**: 100 requests/min rate limit - handled with retry logic
- **Pinecone**: Cold start latency (~2-3s) for first query after inactivity  
- **Cohere**: $3/1000 rerank requests - fallback to vector similarity if needed

### Key Design Decisions
1. **Character-based chunking** (1000 chars) instead of sentence-based for consistency
2. **Rough token estimation** (1 token ≈ 4 chars) to avoid extra dependencies
4. **Gemini 2.5 Flash** for speed/cost balance over higher-quality models(OPENAI)

### Production Next Steps
- Authentication and user management
- Caching layer (Redis) for performance
- Better PDF processing for tables/images
- Conversation memory for multi-turn queries

### Current Limitations
- English-optimized (though models support multilingual)
- Simple text extraction from PDFs
- No real-time document updates
- Context window limits number of source chunks