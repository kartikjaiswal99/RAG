import os
import logging
from typing import List, Dict, Any, Optional
from pinecone import Pinecone, ServerlessSpec
import time

logger = logging.getLogger(__name__)

class VectorStoreService:
    """Simple Pinecone vector store for Mini RAG"""
    
    def __init__(self):
        self.api_key = os.getenv("PINECONE_API_KEY")
        self.index_name = os.getenv("PINECONE_INDEX_NAME", "rag-documents")
        self.pc = None
        self.index = None
    
    async def initialize(self):
        """Initialize Pinecone client and index"""
        try:
            if not self.api_key:
                raise ValueError("PINECONE_API_KEY environment variable is required")
            
            # Initialize Pinecone
            self.pc = Pinecone(api_key=self.api_key)
            
            # Create index if it doesn't exist
            existing_indexes = self.pc.list_indexes()
            index_names = [idx.name for idx in existing_indexes.indexes]
            
            if self.index_name not in index_names:
                logger.info(f"Creating Pinecone index: {self.index_name}")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=768,  # Google text-embedding-004 dimension
                    metric="cosine",
                    spec=ServerlessSpec(cloud="aws", region="us-east-1")
                )
                time.sleep(10)  # Wait for index to be ready
            
            # Connect to index
            self.index = self.pc.Index(self.index_name)
            logger.info(f"Connected to Pinecone index: {self.index_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Pinecone: {e}")
            raise
    
    async def upsert_document(self, doc_id: str, embedding: List[float], metadata: Dict[str, Any], content: str):
        """Store a document chunk in the vector database"""
        try:
            if not self.index:
                raise ValueError("Vector store not initialized")
            
            # Add content to metadata for easy retrieval
            full_metadata = {**metadata, "content": content}
            
            # Store the vector
            self.index.upsert(vectors=[(doc_id, embedding, full_metadata)])
            logger.debug(f"Stored document chunk: {doc_id}")
            
        except Exception as e:
            logger.error(f"Failed to store document {doc_id}: {e}")
            raise
    
    async def query_similar(self, query_embedding: List[float], top_k: int = 10) -> List[Dict[str, Any]]:
        """Find similar documents using vector search"""
        try:
            if not self.index:
                raise ValueError("Vector store not initialized")
            
            # Search for similar vectors
            response = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True
            )
            
            # Format results
            results = []
            for match in response.matches:
                results.append({
                    "id": match.id,
                    "score": float(match.score),
                    "content": match.metadata.get("content", ""),
                    "source": match.metadata.get("source", ""),
                    "title": match.metadata.get("title", ""),
                    "metadata": match.metadata
                })
            
            logger.debug(f"Found {len(results)} similar documents")
            return results
            
        except Exception as e:
            logger.error(f"Failed to query similar documents: {e}")
            raise
