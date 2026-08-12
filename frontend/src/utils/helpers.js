/**
 * Formats byte size into human readable string (e.g. 1.2 MB)
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Formats ISO date string into readable format
 */
export const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Returns Tailwind badge classes based on OCR confidence score
 */
export const getConfidenceBadgeColor = (confidence) => {
  if (confidence >= 0.85) {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  } else if (confidence >= 0.60) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  } else {
    return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  }
};
export const getDownloadUrl = (path) => {
  if (!path) return '';
  // Export responses already include the complete API path (for example,
  // "/api/download/table.xlsx"). Only add the endpoint for a bare filename.
  if (path.startsWith('http') || path.startsWith('/api/download/')) return path;
  return `/api/download/${path}`;
};

export const getPreviewUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('/api/preview/')) return path;
  return `/api/preview/${path}`;
};
