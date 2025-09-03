from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import logging
from dotenv import load_dotenv

from app.routes import DocumentRoutes
from app.services.vector_store import VectorStoreService
from app.services.embedding import EmbeddingService
from app.services.chunking import ChunkingService
from app.services.retrieval import RetrievalService
from app.services.llm import LLMService
from app.models.schemas import QueryRequest

# Load environment variables and configure logging
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Mini RAG API",
    description="Mini RAG Application",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize services
vector_store_service = VectorStoreService()
embedding_service = EmbeddingService()
chunking_service = ChunkingService()
retrieval_service = RetrievalService(vector_store_service, embedding_service)
llm_service = LLMService()

services = {
    'vector_store': vector_store_service,
    'embedding': embedding_service,
    'chunking': chunking_service,
    'retrieval': retrieval_service,
    'llm': llm_service
}

# Initialize routes
routes = DocumentRoutes(services)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    try:
        await vector_store_service.initialize()
        logger.info("Vector store initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize vector store: {e}")
        raise

@app.get("/")
async def root():
    return {"message": "Mini RAG API is running!", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "services": "operational"}

@app.options("/upload")
async def upload_options():
    """Handle OPTIONS request for upload endpoint"""
    return {"message": "OK"}

@app.post("/upload")
async def upload_document(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    title: Optional[str] = Form("Untitled Document")
):
    """Upload and process a document or text"""
    return await routes.upload_document(file, text, title)

@app.options("/query")
async def query_options():
    """Handle OPTIONS request for query endpoint"""
    return {"message": "OK"}

@app.post("/query")
async def query_documents(request: QueryRequest):
    """Query the RAG system with a question"""
    return await routes.query_documents(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
