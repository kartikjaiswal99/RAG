from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class DocumentChunk(BaseModel):
    id: str
    content: str
    metadata: Dict[str, Any]

class QueryRequest(BaseModel):
    query: str = Field(..., description="The question to ask")
    top_k: int = Field(default=10, description="Number of documents to retrieve")
    rerank_top_k: int = Field(default=5, description="Number of documents to keep after reranking")

class Citation(BaseModel):
    index: int
    source: str
    title: str
    content_snippet: str

class SourceDocument(BaseModel):
    id: str
    content: str
    source: str
    title: str
    score: float
    rerank_score: Optional[float] = None

class TokenUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class QueryResponse(BaseModel):
    answer: str
    citations: List[Citation]
    sources: List[SourceDocument]
    retrieval_time: float
    rerank_time: float
    llm_time: float
    total_time: float
    token_usage: Optional[TokenUsage] = None
    estimated_cost: Optional[float] = None

class DocumentUploadResponse(BaseModel):
    message: str
    chunks_created: int
    document_id: str

class RetrievalResult(BaseModel):
    documents: List[SourceDocument]
    retrieval_time: float
    rerank_time: float

class LLMResponse(BaseModel):
    answer: str
    citations: List[Citation]
    generation_time: float
    token_usage: Optional[TokenUsage] = None
    estimated_cost: Optional[float] = None
