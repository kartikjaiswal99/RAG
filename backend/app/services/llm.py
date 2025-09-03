import os
import logging
from typing import List
import time
import re
import google.generativeai as genai
from app.models.schemas import SourceDocument, Citation, LLMResponse, TokenUsage

logger = logging.getLogger(__name__)

class LLMService:
    """Simple Google Gemini service for Mini RAG"""
    
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.model = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Google Gemini client"""
        try:
            if not self.api_key:
                raise ValueError("GOOGLE_API_KEY environment variable is required")
            
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-1.5-flash")
            logger.info("Google Gemini client initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            raise
    
    async def generate_answer(self, query: str, context_documents: List[SourceDocument]) -> LLMResponse:
        """Generate answer with citations"""
        try:
            if not self.model:
                raise ValueError("Gemini model not initialized")
            
            if not context_documents:
                return LLMResponse(
                    answer="I couldn't find any relevant information to answer your question.",
                    citations=[],
                    generation_time=0.0
                )
            
            generation_start = time.time()
            
            # Build prompt
            context_text = ""
            for i, doc in enumerate(context_documents, 1):
                context_text += f"[{i}] Source: {doc.source}\nContent: {doc.content}\n\n"
            
            prompt = f"""Answer the question using only the provided context documents. Include citations [1], [2], etc.

CONTEXT:
{context_text}

QUESTION: {query}

ANSWER WITH CITATIONS:"""
            
            # Generate response
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=1024
                )
            )
            
            generation_time = time.time() - generation_start
            
            # Get answer text
            try:
                answer_text = response.text
            except:
                answer_text = "I apologize, but I couldn't generate a proper response."
            
            # Extract citations
            citations = self._extract_citations(answer_text, context_documents)
            
            # Estimate token usage and cost (rough estimates)
            token_usage = self._estimate_token_usage(prompt, answer_text)
            estimated_cost = self._estimate_cost(token_usage)
            
            return LLMResponse(
                answer=answer_text,
                citations=citations,
                generation_time=generation_time,
                token_usage=token_usage,
                estimated_cost=estimated_cost
            )
            
        except Exception as e:
            logger.error(f"Failed to generate answer: {e}")
            return LLMResponse(
                answer="I apologize, but I encountered an error while generating the answer.",
                citations=[],
                generation_time=0.0
            )
    
    def _extract_citations(self, answer_text: str, context_documents: List[SourceDocument]) -> List[Citation]:
        """Extract citations from answer"""
        citations = []
        citation_pattern = r'\[(\d+)\]'
        found_citations = re.findall(citation_pattern, answer_text)
        
        for citation_num_str in set(found_citations):
            try:
                citation_num = int(citation_num_str)
                if 1 <= citation_num <= len(context_documents):
                    doc = context_documents[citation_num - 1]
                    content_snippet = doc.content[:150] + ("..." if len(doc.content) > 150 else "")
                    
                    citations.append(Citation(
                        index=citation_num,
                        source=doc.source,
                        title=doc.title,
                        content_snippet=content_snippet
                    ))
            except ValueError:
                continue
        
        citations.sort(key=lambda x: x.index)
        return citations
    
    def _estimate_token_usage(self, prompt: str, response: str) -> TokenUsage:
        """Estimate token usage (rough approximation)"""
        # Rough estimation: 1 token ≈ 4 characters for English text
        prompt_tokens = len(prompt) // 4
        completion_tokens = len(response) // 4
        total_tokens = prompt_tokens + completion_tokens
        
        return TokenUsage(
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens
        )
    
    def _estimate_cost(self, token_usage: TokenUsage) -> float:
        """Estimate API cost (rough approximation for Gemini)"""
        # Gemini 1.5 Flash pricing (approximate)
        input_cost = (token_usage.prompt_tokens / 1000) * 0.000075  # $0.075 per 1M tokens
        output_cost = (token_usage.completion_tokens / 1000) * 0.0003  # $0.3 per 1M tokens
        
        return round(input_cost + output_cost, 6)
