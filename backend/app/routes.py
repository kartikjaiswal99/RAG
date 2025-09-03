from fastapi import HTTPException, UploadFile, File, Form
from typing import Optional
import logging
import fitz  # PyMuPDF
import os

from .models.schemas import QueryRequest, QueryResponse, DocumentUploadResponse

logger = logging.getLogger(__name__)

class DocumentRoutes:
    def __init__(self, services):
        self.vector_store = services['vector_store']
        self.embedding = services['embedding']
        self.chunking = services['chunking']
        self.retrieval = services['retrieval']
        self.llm = services['llm']
    
    async def upload_document(self, file: Optional[UploadFile] = None, text: Optional[str] = None, title: str = "Untitled Document"):
        """Simplified upload handler"""
        try:
            # Extract text content
            text_content, source = await self._extract_text(file, text)
            
            # Process and store
            chunks = self.chunking.chunk_text(text_content, source, title, "main")
            stored_count = await self._store_chunks(chunks)
            
            return DocumentUploadResponse(
                message=f"Successfully processed and stored {stored_count} chunks",
                chunks_created=stored_count,
                document_id=source
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Upload error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def query_documents(self, request: QueryRequest):
        """Simplified query handler"""
        try:
            # Retrieve documents
            retrieval_results = await self.retrieval.retrieve_and_rerank(
                query=request.query,
                top_k=request.top_k,
                rerank_top_k=request.rerank_top_k
            )
            
            if not retrieval_results.documents:
                return self._no_results_response(retrieval_results)
            
            # Generate answer
            llm_response = await self.llm.generate_answer(
                query=request.query,
                context_documents=retrieval_results.documents
            )
            
            return self._build_response(retrieval_results, llm_response)
            
        except Exception as e:
            logger.error(f"Query error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def _extract_text(self, file, text):
        """Extract text from file or use provided text"""
        if text:
            return text, "text_input"
        
        if not file:
            raise HTTPException(400, "Either file or text must be provided")
        
        # Check file size
        if file.size > int(os.getenv("MAX_FILE_SIZE_MB", 10)) * 1024 * 1024:
            raise HTTPException(413, "File size exceeds maximum allowed size")
        
        content = await file.read()
        
        if file.filename and file.filename.lower().endswith('.pdf'):
            return self._extract_pdf_text(content), file.filename or "uploaded_file"
        else:
            return self._extract_text_file(content), file.filename or "uploaded_file"
    
    def _extract_pdf_text(self, content):
        """Extract text from PDF"""
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            text_content = ""
            for page in doc:
                text_content += page.get_text()
            doc.close()
            
            if not text_content.strip():
                raise HTTPException(400, "PDF file appears to be empty or contains no extractable text")
            
            logger.info(f"Successfully extracted text from PDF: {len(text_content)} characters")
            return text_content
            
        except Exception as e:
            logger.error(f"Error processing PDF: {e}")
            raise HTTPException(400, "Unable to process PDF file. Please ensure it contains extractable text.")
    
    def _extract_text_file(self, content):
        """Extract text from text file with encoding detection"""
        try:
            # Try UTF-8 first
            return content.decode('utf-8')
        except UnicodeDecodeError:
            # Try other common encodings
            for encoding in ['latin-1', 'cp1252', 'iso-8859-1']:
                try:
                    text_content = content.decode(encoding)
                    logger.info(f"Successfully decoded file with {encoding} encoding")
                    return text_content
                except UnicodeDecodeError:
                    continue
            
            raise HTTPException(400, "Unable to read file. Please ensure it's a valid text file with UTF-8, Latin-1, or similar encoding.")
    
    async def _store_chunks(self, chunks):
        """Store chunks in vector database"""
        stored_count = 0
        for chunk in chunks:
            embedding = await self.embedding.generate_embedding(chunk.content)
            await self.vector_store.upsert_document(
                doc_id=chunk.id,
                embedding=embedding,
                metadata=chunk.metadata,
                content=chunk.content
            )
            stored_count += 1
        return stored_count
    
    def _no_results_response(self, retrieval_results):
        """Return response when no documents found"""
        return QueryResponse(
            answer="I couldn't find any relevant information to answer your question. Please try rephrasing your query or upload relevant documents.",
            citations=[],
            sources=[],
            retrieval_time=retrieval_results.retrieval_time,
            rerank_time=retrieval_results.rerank_time,
            llm_time=0.0,
            total_time=retrieval_results.retrieval_time + retrieval_results.rerank_time
        )
    
    def _build_response(self, retrieval_results, llm_response):
        """Build the final query response"""
        total_time = (retrieval_results.retrieval_time + 
                     retrieval_results.rerank_time + 
                     llm_response.generation_time)
        
        return QueryResponse(
            answer=llm_response.answer,
            citations=llm_response.citations,
            sources=retrieval_results.documents,
            retrieval_time=retrieval_results.retrieval_time,
            rerank_time=retrieval_results.rerank_time,
            llm_time=llm_response.generation_time,
            total_time=total_time,
            token_usage=llm_response.token_usage,
            estimated_cost=llm_response.estimated_cost
        )
