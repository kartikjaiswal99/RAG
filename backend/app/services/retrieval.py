import os
import logging
from typing import List
import time
import cohere
from app.models.schemas import SourceDocument, RetrievalResult
from app.services.vector_store import VectorStoreService
from app.services.embedding import EmbeddingService

logger = logging.getLogger(__name__)

class RetrievalService:
    """Simple retrieval and reranking service"""
    
    def __init__(self, vector_store: VectorStoreService, embedding_service: EmbeddingService):
        self.vector_store = vector_store
        self.embedding_service = embedding_service
        self.cohere_client = None
        
        # Initialize Cohere for reranking
        cohere_api_key = os.getenv("COHERE_API_KEY")
        if cohere_api_key:
            self.cohere_client = cohere.Client(api_key=cohere_api_key)
            logger.info("Cohere reranking client initialized")
        else:
            logger.warning("COHERE_API_KEY not provided, reranking disabled")
    
    async def retrieve_and_rerank(
        self, 
        query: str, 
        top_k: int = 10, 
        rerank_top_k: int = 5
    ) -> RetrievalResult:
        """Retrieve documents and rerank them"""
        try:
            # Step 1: Vector search
            retrieval_start = time.time()
            query_embedding = await self.embedding_service.generate_query_embedding(query)
            similar_docs = await self.vector_store.query_similar(query_embedding, top_k)
            retrieval_time = time.time() - retrieval_start
            
            if not similar_docs:
                return RetrievalResult(documents=[], retrieval_time=retrieval_time, rerank_time=0.0)
            
            # Convert to SourceDocument objects
            documents = [
                SourceDocument(
                    id=doc["id"],
                    content=doc["content"],
                    source=doc["source"],
                    title=doc["title"],
                    score=doc["score"]
                ) for doc in similar_docs
            ]
            
            # Step 2: Rerank with Cohere
            rerank_start = time.time()
            if self.cohere_client and len(documents) > 1:
                documents = await self._rerank_documents(query, documents, rerank_top_k)
            else:
                documents = documents[:rerank_top_k]
            rerank_time = time.time() - rerank_start
            
            return RetrievalResult(
                documents=documents,
                retrieval_time=retrieval_time,
                rerank_time=rerank_time
            )
            
        except Exception as e:
            logger.error(f"Failed to retrieve and rerank documents: {e}")
            raise
    
    async def _rerank_documents(self, query: str, documents: List[SourceDocument], top_k: int) -> List[SourceDocument]:
        """Rerank documents using Cohere"""
        try:
            doc_texts = [doc.content for doc in documents]
            rerank_response = self.cohere_client.rerank(
                model="rerank-english-v3.0",
                query=query,
                documents=doc_texts,
                top_n=top_k
            )
            
            # Reorder documents based on rerank scores
            reranked = []
            for result in rerank_response.results:
                doc = documents[result.index]
                doc.rerank_score = result.relevance_score
                reranked.append(doc)
            
            return reranked
            
        except Exception as e:
            logger.error(f"Reranking failed: {e}")
            return documents[:top_k]
