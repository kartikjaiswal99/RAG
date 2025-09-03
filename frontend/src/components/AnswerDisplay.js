import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  MessageCircle, 
  Clock, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Hash
} from './Icons';

const AnswerDisplay = ({ response, isLoading }) => {
  const [showSources, setShowSources] = useState(true);
  const [showMetrics, setShowMetrics] = useState(false);

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
          <span className="text-gray-600">Generating answer...</span>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    );
  }

  const formatTime = (time) => {
    return time ? `${(time * 1000).toFixed(0)}ms` : 'N/A';
  };

  const formatCost = (cost) => {
    return cost ? `$${cost.toFixed(6)}` : 'N/A';
  };

  const renderAnswer = (text) => {
    // Custom components for ReactMarkdown with citation support
    const components = {
      // Handle paragraphs and restore citations
      p: ({ children, ...props }) => {
        return <p className="mb-4 last:mb-0" {...props}>{processChildren(children)}</p>;
      },
      // Handle text nodes to process citations
      text: ({ children }) => {
        if (typeof children === 'string') {
          return processCitations(children);
        }
        return children;
      },
      // Style other markdown elements
      h1: ({ children, ...props }) => <h1 className="text-2xl font-bold mb-4" {...props}>{processChildren(children)}</h1>,
      h2: ({ children, ...props }) => <h2 className="text-xl font-semibold mb-3" {...props}>{processChildren(children)}</h2>,
      h3: ({ children, ...props }) => <h3 className="text-lg font-medium mb-2" {...props}>{processChildren(children)}</h3>,
      ul: ({ children, ...props }) => <ul className="list-disc list-inside mb-4 space-y-1" {...props}>{children}</ul>,
      ol: ({ children, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-1" {...props}>{children}</ol>,
      li: ({ children, ...props }) => <li {...props}>{processChildren(children)}</li>,
      strong: ({ children, ...props }) => <strong className="font-semibold" {...props}>{processChildren(children)}</strong>,
      em: ({ children, ...props }) => <em className="italic" {...props}>{processChildren(children)}</em>,
      code: ({ children, ...props }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>,
      pre: ({ children, ...props }) => <pre className="bg-gray-100 p-3 rounded overflow-x-auto mb-4" {...props}>{children}</pre>,
      blockquote: ({ children, ...props }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-4" {...props}>{children}</blockquote>,
    };

    // Function to process citations in text
    const processCitations = (text) => {
      const citationPattern = /\[(\d+)\]/g;
      const parts = text.split(citationPattern);
      
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          // This is a citation number
          const citationNum = parseInt(part);
          const citation = response.citations.find(c => c.index === citationNum);
          
          return (
            <span
              key={index}
              className="citation"
              title={citation ? `Source: ${citation.source}` : `Citation ${citationNum}`}
            >
              [{part}]
            </span>
          );
        }
        return part;
      });
    };

    // Function to process children recursively
    const processChildren = (children) => {
      if (typeof children === 'string') {
        return processCitations(children);
      }
      if (Array.isArray(children)) {
        return children.map((child, index) => {
          if (typeof child === 'string') {
            return processCitations(child);
          }
          return child;
        });
      }
      return children;
    };

    return (
      <ReactMarkdown components={components}>
        {text}
      </ReactMarkdown>
    );
  };

  return (
    <div className="space-y-6">
      {/* Answer Section */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <MessageCircle className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Answer</h3>
        </div>
        
        <div className="prose prose-sm max-w-none">
          <div className="text-gray-800 leading-relaxed">
            {renderAnswer(response.answer)}
          </div>
        </div>

        {/* Performance Metrics Toggle */}
        <div className="mt-6 pt-4 border-t">
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <Clock className="h-4 w-4" />
            <span>Performance Metrics</span>
            {showMetrics ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showMetrics && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-600">Retrieval</div>
                <div className="font-medium">{formatTime(response.retrieval_time)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-600">Reranking</div>
                <div className="font-medium">{formatTime(response.rerank_time)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-600">LLM Generation</div>
                <div className="font-medium">{formatTime(response.llm_time)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-600">Total Time</div>
                <div className="font-medium text-primary-600">{formatTime(response.total_time)}</div>
              </div>
              
              {response.token_usage && (
                <>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-600">Tokens Used</div>
                    <div className="font-medium">{response.token_usage.total_tokens}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-600">Est. Cost</div>
                    <div className="font-medium text-green-600">{formatCost(response.estimated_cost)}</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Citations and Sources */}
      {(response.citations.length > 0 || response.sources.length > 0) && (
        <div className="card p-6">
          <button
            onClick={() => setShowSources(!showSources)}
            className="flex items-center justify-between w-full mb-4"
          >
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Sources & Citations ({response.sources.length})
              </h3>
            </div>
            {showSources ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {showSources && (
            <div className="space-y-4">
              {/* Citations List */}
              {response.citations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Hash className="h-4 w-4 mr-1" />
                    Citations Used in Answer
                  </h4>
                  <div className="space-y-2">
                    {response.citations.map((citation) => (
                      <div
                        key={citation.index}
                        className="flex items-start space-x-3 p-3 bg-primary-50 rounded-lg border border-primary-200"
                      >
                        <span className="citation text-xs">
                          {citation.index}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            {citation.title}
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            Source: {citation.source}
                          </div>
                          <div className="text-sm text-gray-700">
                            {citation.content_snippet}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Sources */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  All Retrieved Sources
                </h4>
                <div className="space-y-3">
                  {response.sources.map((source, index) => (
                    <div
                      key={source.id}
                      className="p-4 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {source.title}
                            </span>
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mb-2">
                            Source: {source.source}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Score: {source.score.toFixed(3)}
                          </div>
                          {source.rerank_score && (
                            <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Rerank: {source.rerank_score.toFixed(3)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 line-clamp-3">
                        {source.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnswerDisplay;
