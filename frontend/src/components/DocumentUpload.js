import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, AlertCircle, CheckCircle, X } from './Icons';
import apiService from '../services/api';

const DocumentUpload = ({ onUploadSuccess, setIsLoading }) => {
  const [textInput, setTextInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setUploadStatus('uploading');

    try {
      const response = await apiService.uploadDocument(
        file, 
        null, 
        titleInput || file.name
      );
      
      setUploadStatus('success');
      onUploadSuccess(response);
      setTitleInput('');
      
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
      setUploadStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [titleInput, onUploadSuccess, setIsLoading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'text/html': ['.html'],
      'text/xml': ['.xml'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError('File is too large. Maximum size is 10MB.');
      } else if (rejection.errors[0].code === 'file-invalid-type') {
        setError('Invalid file type. Please upload text files (.txt, .md, .csv, .json, .html, .xml) or PDF files (.pdf)');
      } else {
        setError('File upload failed. Please try again.');
      }
    }
  });

  const handleTextUpload = async () => {
    if (!textInput.trim()) {
      setError('Please enter some text to upload');
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadStatus('uploading');

    try {
      const response = await apiService.uploadDocument(
        null,
        textInput,
        titleInput || 'Text Input'
      );
      
      setUploadStatus('success');
      onUploadSuccess(response);
      setTextInput('');
      setTitleInput('');
      
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
      setUploadStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
    setUploadStatus(null);
  };

  return (
    <div className="space-y-4">
      {/* Title Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Title (Optional)
        </label>
        <input
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          placeholder="Enter document title..."
          className="input-field"
        />
      </div>

      {/* File Upload Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload File
        </label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          {isDragActive ? (
            <p className="text-primary-600">Drop the file here...</p>
          ) : (
            <div className="space-y-1">
              <p className="text-gray-600">
                Drag & drop a file here, or click to select
              </p>
              <p className="text-xs text-gray-400">
                Supports: TXT, MD, CSV, JSON, HTML, XML, PDF (max 10MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">OR</span>
        </div>
      </div>

      {/* Text Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste Text
        </label>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Paste your text content here..."
          rows={6}
          className="textarea-field"
        />
        <button
          onClick={handleTextUpload}
          disabled={!textInput.trim() || uploadStatus === 'uploading'}
          className="btn-primary mt-3 w-full"
        >
          {uploadStatus === 'uploading' ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Uploading...</span>
            </div>
          ) : (
            <>
              <File className="h-4 w-4 mr-2" />
              Upload Text
            </>
          )}
        </button>
      </div>

      {/* Status Messages */}
      {uploadStatus === 'success' && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800 text-sm">
            Document uploaded and processed successfully!
          </span>
        </div>
      )}

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

export default DocumentUpload;
