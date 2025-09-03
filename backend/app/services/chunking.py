import logging
from typing import List, Dict, Any
import uuid
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class TextChunk:
    id: str
    content: str
    metadata: Dict[str, Any]

class ChunkingService:
    """Simple text chunking service"""
    
    def __init__(self):
        self.chunk_size = 1000
        self.chunk_overlap = 150
        
    def chunk_text(self, text: str, source: str = "unknown", title: str = "Untitled", section: str = "main") -> List[TextChunk]:
        """Split text into overlapping chunks"""
        try:
            # Clean text
            cleaned_text = " ".join(text.split())
            
            # Create chunks
            chunks = []
            start = 0
            chunk_num = 0
            
            while start < len(cleaned_text):
                # Get chunk end position
                end = start + self.chunk_size
                
                # If not the last chunk, try to break at word boundary
                if end < len(cleaned_text):
                    while end > start and cleaned_text[end] != ' ':
                        end -= 1
                    if end == start:  # No space found, use original end
                        end = start + self.chunk_size
                
                chunk_text = cleaned_text[start:end].strip()
                
                if chunk_text:
                    chunk_id = f"{source}_{chunk_num}_{uuid.uuid4().hex[:8]}"
                    metadata = {
                        "source": source,
                        "title": title,
                        "section": section,
                        "position": chunk_num
                    }
                    
                    chunks.append(TextChunk(
                        id=chunk_id,
                        content=chunk_text,
                        metadata=metadata
                    ))
                    chunk_num += 1
                
                # Move start with overlap
                start = end - self.chunk_overlap
                if start < 0:
                    start = end
            
            logger.info(f"Created {len(chunks)} chunks from {len(text)} characters")
            return chunks
            
        except Exception as e:
            logger.error(f"Failed to chunk text: {e}")
            raise
