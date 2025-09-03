import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Upload document or text
  uploadDocument: async (file = null, text = null, title = 'Untitled Document') => {
    const formData = new FormData();
    
    if (file) {
      formData.append('file', file);
    }
    
    if (text) {
      formData.append('text', text);
    }
    
    formData.append('title', title);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Query the RAG system
  queryDocuments: async (query, topK = 10, rerankTopK = 5) => {
    const response = await api.post('/query', {
      query,
      top_k: topK,
      rerank_top_k: rerankTopK,
    });
    
    return response.data;
  },

  // Get root info
  getInfo: async () => {
    const response = await api.get('/');
    return response.data;
  }
};

export default apiService;
