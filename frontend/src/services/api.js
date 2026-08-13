import axios from 'axios';

// If `VITE_API_BASE_URL` is not provided at build time, default to the
// same origin the frontend is served from so deployments don't need an
// environment-specific URL hardcoded. This allows the frontend to work
// with Render preview URLs like `https://...-1.onrender.com` automatically.
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '');
const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '').endsWith('/api')
  ? configuredBaseUrl.replace(/\/$/, '')
  : `${configuredBaseUrl.replace(/\/$/, '')}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json'
  }
});

export const convertFileApi = async (file, preprocessOpts = {}, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('grayscale', preprocessOpts.grayscale ?? true);
  formData.append('deskew', preprocessOpts.deskew ?? true);
  formData.append('contrast', preprocessOpts.contrast ?? true);
  formData.append('denoise', preprocessOpts.denoise ?? true);
  formData.append('threshold_mode', preprocessOpts.threshold_mode || 'adaptive');
  formData.append('engine', preprocessOpts.engine || 'easyocr');

  const response = await apiClient.post('/convert', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  });
  return response.data;
};

export const exportTableApi = async (tableData, filename, id) => {
  const response = await apiClient.post('/export', {
    table_data: tableData,
    filename,
    id
  });
  return response.data;
};

export const mergeTablesApi = async (items, mode = 'sheets') => {
  const response = await apiClient.post('/merge', {
    items,
    mode
  });
  return response.data;
};

export const fetchHistoryApi = async (searchQuery = '', fileType = '', dateFilter = '') => {
  const params = {};
  if (searchQuery) params.q = searchQuery;
  if (fileType) params.type = fileType;
  if (dateFilter) params.date = dateFilter;

  const response = await apiClient.get('/history', { params });
  return response.data;
};

export const deleteHistoryItemApi = async (entryId) => {
  const response = await apiClient.delete(`/history/${entryId}`);
  return response.data;
};

export const clearHistoryApi = async () => {
  const response = await apiClient.delete('/history');
  return response.data;
};

export const getDownloadUrl = (filename) => {
  if (!filename) return '#';
  if (filename.startsWith('http')) return filename;
  const path = filename.startsWith('/api/download/')
    ? filename.replace('/api', '')
    : filename.startsWith('/download/')
      ? filename
      : `/download/${filename}`;
  return `${API_BASE_URL}${path}`;
};

export const getPreviewUrl = (filename) => {
  if (!filename) return '#';
  if (filename.startsWith('http')) return filename;
  const path = filename.startsWith('/api/preview/')
    ? filename.replace('/api', '')
    : filename.startsWith('/preview/')
      ? filename
      : `/preview/${filename}`;
  return `${API_BASE_URL}${path}`;
};
