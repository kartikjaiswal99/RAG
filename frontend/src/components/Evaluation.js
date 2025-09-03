import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Clock, Target, BarChart3 } from './Icons';
import apiService from '../services/api';

const Evaluation = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [currentTest, setCurrentTest] = useState(null);

  // Gold standard Q/A pairs for evaluation
  const goldStandard = [
    {
      id: 1,
      question: "What are the main benefits of artificial intelligence?",
      expectedKeywords: ["efficiency", "automation", "decision making", "productivity", "accuracy"],
      expectedCitations: 1, // Minimum expected citations
      category: "General AI"
    },
    {
      id: 2,
      question: "How does machine learning improve over time?",
      expectedKeywords: ["training", "data", "algorithms", "learning", "improvement"],
      expectedCitations: 1,
      category: "Machine Learning"
    },
    {
      id: 3,
      question: "What are the challenges in implementing AI systems?",
      expectedKeywords: ["complexity", "cost", "data quality", "integration", "skills"],
      expectedCitations: 1,
      category: "Implementation"
    },
    {
      id: 4,
      question: "What is the role of data in AI applications?",
      expectedKeywords: ["training", "quality", "volume", "preprocessing", "features"],
      expectedCitations: 1,
      category: "Data & AI"
    },
    {
      id: 5,
      question: "How can businesses benefit from AI adoption?",
      expectedKeywords: ["efficiency", "cost reduction", "insights", "competitive advantage", "innovation"],
      expectedCitations: 1,
      category: "Business AI"
    }
  ];

  const evaluateAnswer = (question, answer, citations, expectedKeywords, expectedCitations) => {
    const answerLower = answer.toLowerCase();
    
    // Keyword matching (precision/recall)
    const foundKeywords = expectedKeywords.filter(keyword => 
      answerLower.includes(keyword.toLowerCase())
    );
    
    const keywordPrecision = foundKeywords.length / expectedKeywords.length;
    
    // Citation quality
    const citationScore = citations.length >= expectedCitations ? 1 : 0;
    
    // Answer relevance (simple heuristic)
    const hasAnswer = answer.length > 50 && !answer.includes("couldn't find") && !answer.includes("apologize");
    const relevanceScore = hasAnswer ? 1 : 0;
    
    // Overall success
    const isSuccess = keywordPrecision >= 0.3 && citationScore === 1 && relevanceScore === 1;
    
    return {
      keywordPrecision,
      citationScore,
      relevanceScore,
      foundKeywords,
      isSuccess,
      overallScore: (keywordPrecision + citationScore + relevanceScore) / 3
    };
  };

  const runEvaluation = async () => {
    setIsRunning(true);
    setResults(null);
    
    const testResults = [];
    
    for (let i = 0; i < goldStandard.length; i++) {
      const testCase = goldStandard[i];
      setCurrentTest(testCase);
      
      try {
        const startTime = Date.now();
        const response = await apiService.queryDocuments(testCase.question, 10, 5);
        const endTime = Date.now();
        
        const evaluation = evaluateAnswer(
          testCase.question,
          response.answer,
          response.citations,
          testCase.expectedKeywords,
          testCase.expectedCitations
        );
        
        testResults.push({
          ...testCase,
          response,
          evaluation,
          responseTime: endTime - startTime,
          timestamp: new Date().toISOString()
        });
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        testResults.push({
          ...testCase,
          error: error.message,
          evaluation: {
            keywordPrecision: 0,
            citationScore: 0,
            relevanceScore: 0,
            foundKeywords: [],
            isSuccess: false,
            overallScore: 0
          },
          responseTime: 0,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    setCurrentTest(null);
    setResults(testResults);
    setIsRunning(false);
  };

  const calculateOverallMetrics = () => {
    if (!results) return null;
    
    const successRate = results.filter(r => r.evaluation.isSuccess).length / results.length;
    const avgKeywordPrecision = results.reduce((sum, r) => sum + r.evaluation.keywordPrecision, 0) / results.length;
    const avgCitationScore = results.reduce((sum, r) => sum + r.evaluation.citationScore, 0) / results.length;
    const avgRelevanceScore = results.reduce((sum, r) => sum + r.evaluation.relevanceScore, 0) / results.length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const avgOverallScore = results.reduce((sum, r) => sum + r.evaluation.overallScore, 0) / results.length;
    
    return {
      successRate,
      avgKeywordPrecision,
      avgCitationScore,
      avgRelevanceScore,
      avgResponseTime,
      avgOverallScore,
      totalTests: results.length
    };
  };

  const metrics = calculateOverallMetrics();

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Target className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">RAG System Evaluation</h2>
          </div>
          <button
            onClick={runEvaluation}
            disabled={isRunning}
            className="btn-primary flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>{isRunning ? 'Running...' : 'Run Evaluation'}</span>
          </button>
        </div>

        {/* Current Test Status */}
        {isRunning && currentTest && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium text-blue-800">
                Testing Question {currentTest.id} of {goldStandard.length}
              </span>
            </div>
            <p className="text-sm text-blue-700">{currentTest.question}</p>
          </div>
        )}

        {/* Overall Metrics */}
        {metrics && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Overall Performance Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(metrics.successRate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(metrics.avgKeywordPrecision * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Keyword Precision</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(metrics.avgCitationScore * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Citation Quality</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {metrics.avgResponseTime.toFixed(0)}ms
                </div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-lg font-semibold text-gray-800">
                Overall Score: {(metrics.avgOverallScore * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">
                Based on {metrics.totalTests} test cases
              </div>
            </div>
          </div>
        )}

        {/* Gold Standard Questions */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Gold Standard Test Cases</h3>
          <div className="space-y-3">
            {goldStandard.map((testCase) => (
              <div key={testCase.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{testCase.question}</p>
                    <div className="mt-1 text-xs text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded mr-2">{testCase.category}</span>
                      <span>Expected keywords: {testCase.expectedKeywords.join(', ')}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Min citations: {testCase.expectedCitations}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      {results && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Test Results</h3>
          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {result.evaluation.isSuccess ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">Test {result.id}: {result.category}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        Score: {(result.evaluation.overallScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{result.question}</p>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {result.responseTime}ms
                  </div>
                </div>

                {result.error ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    Error: {result.error}
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Generated Answer:</div>
                      <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded line-clamp-2">
                        {result.response.answer}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700">Keyword Match</div>
                        <div className="text-gray-600">
                          {(result.evaluation.keywordPrecision * 100).toFixed(1)}% 
                          ({result.evaluation.foundKeywords.length}/{result.expectedKeywords.length})
                        </div>
                        <div className="text-xs text-gray-500">
                          Found: {result.evaluation.foundKeywords.join(', ') || 'None'}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Citations</div>
                        <div className="text-gray-600">
                          {result.response.citations.length} citations
                        </div>
                        <div className="text-xs text-gray-500">
                          {result.evaluation.citationScore === 1 ? '✓ Meets requirement' : '✗ Below requirement'}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Relevance</div>
                        <div className="text-gray-600">
                          {result.evaluation.relevanceScore === 1 ? 'Relevant' : 'Poor'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {result.response.answer.length} chars
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Evaluation;
