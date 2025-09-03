import os
import logging
from typing import List
import google.generativeai as genai
import time

logger = logging.getLogger(__name__)

class EmbeddingService:
    """
    Embedding Service using Google's text-embedding-004
    
    Model Configuration:
    - Model: text-embedding-004
    - Dimension: 768
    - Max tokens: 2048
    """
    
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.model = "models/text-embedding-004"
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Google AI client"""
        try:
            if not self.api_key:
                raise ValueError("GOOGLE_API_KEY environment variable is required")
            
            genai.configure(api_key=self.api_key)
            logger.info("Google AI embedding client initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize Google AI client: {e}")
            raise
    
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text using Google AI
        
        Args:
            text: Text to embed
            
        Returns:
            List of floats representing the embedding vector
        """
        try:
            # Clean and truncate text if necessary
            cleaned_text = self._clean_text(text)
            
            # Generate embedding using Google AI
            result = genai.embed_content(
                model=self.model,
                content=cleaned_text,
                task_type="retrieval_document"
            )
            
            embedding = result['embedding']
            logger.debug(f"Generated embedding for text of length {len(text)}")
            
            return embedding
            
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise
    
    async def generate_query_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a query using Google AI
        
        Args:
            text: Query text to embed
            
        Returns:
            List of floats representing the embedding vector
        """
        try:
            # Clean and truncate text if necessary
            cleaned_text = self._clean_text(text)
            
            # Generate embedding using Google AI with query task type
            result = genai.embed_content(
                model=self.model,
                content=cleaned_text,
                task_type="retrieval_query"
            )
            
            embedding = result['embedding']
            logger.debug(f"Generated query embedding for text of length {len(text)}")
            
            return embedding
            
        except Exception as e:
            logger.error(f"Failed to generate query embedding: {e}")
            raise
    
    async def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batch
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        try:
            # Clean texts
            cleaned_texts = [self._clean_text(text) for text in texts]
            
            # Generate embeddings one by one (Google AI doesn't support batch processing)
            embeddings = []
            for text in cleaned_texts:
                result = genai.embed_content(
                    model=self.model,
                    content=text,
                    task_type="retrieval_document"
                )
                embeddings.append(result['embedding'])
            
            logger.debug(f"Generated {len(embeddings)} embeddings in batch")
            
            return embeddings
            
        except Exception as e:
            logger.error(f"Failed to generate batch embeddings: {e}")
            raise
    
    def _clean_text(self, text: str) -> str:
        """
        Clean and prepare text for embedding
        
        Args:
            text: Raw text
            
        Returns:
            Cleaned text
        """
        # Remove excessive whitespace
        cleaned = " ".join(text.split())
        
        # Truncate if too long (text-embedding-004 has 2048 token limit)
        # Rough estimate: 1 token ≈ 4 characters
        max_chars = 2048 * 4
        if len(cleaned) > max_chars:
            cleaned = cleaned[:max_chars]
            logger.warning(f"Text truncated from {len(text)} to {len(cleaned)} characters")
        
        return cleaned
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings produced by this service"""
        return 768  # text-embedding-004 dimension
