import React, { useState } from 'react';
import DocumentUpload from './components/DocumentUpload';
import QueryInterface from './components/QueryInterface';
import AnswerDisplay from './components/AnswerDisplay';
import Evaluation from './components/Evaluation';
import { FileText, MessageSquare, Brain, Target } from './components/Icons';

function App() {
  const [queryResponse, setQueryResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [activeTab, setActiveTab] = useState('query'); // 'query' or 'evaluation'

  const handleUploadSuccess = (response) => {
    setUploadedDocs(prev => [...prev, response]);
  };

  const handleQueryResponse = (response) => {
    setQueryResponse(response);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">RAG</h1>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('query')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'query'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  Query
                </button>
                <button
                  onClick={() => setActiveTab('evaluation')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'evaluation'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Target className="h-4 w-4 inline mr-1" />
                  Evaluation
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'query' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Document Upload */}
            <div className="lg:col-span-1">
              <div className="card p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Document Upload
                  </h2>
                </div>
                <DocumentUpload 
                  onUploadSuccess={handleUploadSuccess}
                  setIsLoading={setIsLoading}
                />
                
                {/* Upload History */}
                {uploadedDocs.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Uploaded Documents
                    </h3>
                    <div className="space-y-2">
                      {uploadedDocs.slice(-5).map((doc, index) => (
                        <div 
                          key={index}
                          className="text-xs bg-gray-50 p-2 rounded border"
                        >
                          <div className="font-medium text-gray-800">
                            {doc.document_id}
                          </div>
                          <div className="text-gray-600">
                            {doc.chunks_created} chunks created
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Query and Results */}
            <div className="lg:col-span-2 space-y-8">
              {/* Query Interface */}
              <div className="card p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Ask a Question
                  </h2>
                </div>
                <QueryInterface 
                  onQueryResponse={handleQueryResponse}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              </div>

              {/* Answer Display */}
              {queryResponse && (
                <AnswerDisplay 
                  response={queryResponse}
                  isLoading={isLoading}
                />
              )}
            </div>
          </div>
        ) : (
          <Evaluation />
        )}
      </main>
    </div>
  );
}

export default App;
