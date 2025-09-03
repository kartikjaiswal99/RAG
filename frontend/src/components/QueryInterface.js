import React, { useState } from 'react';
import { Search, Settings, AlertCircle, X } from './Icons';
import apiService from '../services/api';

const QueryInterface = ({ onQueryResponse, isLoading, setIsLoading }) => {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(10);
  const [rerankTopK, setRerankTopK] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a question');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.queryDocuments(query, topK, rerankTopK);
      onQueryResponse(response);
      
      // Clear query after successful submission
      setQuery('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Query failed');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Query Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Question
          </label>
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your uploaded documents..."
              rows={3}
              className="textarea-field pr-12"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
              title="Query Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Advanced Settings */}
        {showSettings && (
          <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Query Settings</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Retrieval Count
                </label>
                <input
                  type="number"
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value) || 10)}
                  min="1"
                  max="50"
                  className="input-field text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Documents to retrieve from vector DB
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Rerank Count
                </label>
                <input
                  type="number"
                  value={rerankTopK}
                  onChange={(e) => setRerankTopK(parseInt(e.target.value) || 5)}
                  min="1"
                  max={topK}
                  className="input-field text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Documents to keep after reranking
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Searching...</span>
            </div>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Ask Question
            </>
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default QueryInterface;
