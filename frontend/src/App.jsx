import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FileUploader from './components/FileUploader';
import PreprocessModal from './components/PreprocessModal';
import TableEditor from './components/TableEditor';
import BatchMergeModal from './components/BatchMergeModal';
import HistoryView from './components/HistoryView';
import ApiDocsModal from './components/ApiDocsModal';
import Toast from './components/Toast';

import { convertFileApi, fetchHistoryApi } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('converter');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resultData, setResultData] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  
  const [preprocessOpts, setPreprocessOpts] = useState({
    grayscale: true,
    deskew: true,
    contrast: true,
    denoise: true,
    threshold_mode: 'adaptive',
    engine: 'easyocr'
  });

  const [isPreprocessModalOpen, setIsPreprocessModalOpen] = useState(false);
  const [isBatchMergeModalOpen, setIsBatchMergeModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Sync dark mode class on HTML body element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Initial history load
  const loadHistory = async () => {
    try {
      const data = await fetchHistoryApi();
      setHistoryList(data.history || []);
    } catch (err) {
      console.warn('Could not fetch history on startup.');
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleProcessFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setUploadProgress(10);

    try {
      // Process first file (or queue)
      const primaryFile = files[0];
      const data = await convertFileApi(
        primaryFile,
        preprocessOpts,
        (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(Math.min(percent, 90));
        }
      );

      setUploadProgress(100);
      console.debug('Conversion response:', data);
      setResultData(data);
      showToast('Table successfully extracted and converted to Excel!', 'success');
      loadHistory(); // Refresh history counter

      // Smooth scroll to table editor
      setTimeout(() => {
        window.scrollTo({ top: 400, behavior: 'smooth' });
      }, 200);

    } catch (error) {
      console.error('File conversion error:', error);
      const errMsg = error.response?.data?.error
        || (error.code === 'ECONNABORTED'
          ? 'The OCR request timed out. Please try again with a smaller file.'
          : error.message === 'Network Error'
            ? 'Could not reach the conversion service. It may be starting up; wait a minute and try again.'
            : 'Failed to process file. Please try again.');
      showToast(errMsg, 'error');
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleLoadResultFromHistory = (historyItem) => {
    setResultData({
      entry: historyItem,
      table_data: historyItem.table_data,
      excel_url: historyItem.excel_filename,
      csv_url: historyItem.csv_filename,
      preview_url: historyItem.preview_filename
    });
    setActiveTab('converter');
    showToast(`Loaded ${historyItem.filename} into editor`, 'info');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenBatchMerge={() => setIsBatchMergeModalOpen(true)}
        historyCount={historyList.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {activeTab === 'converter' && (
          <div className="space-y-10">
            
            {/* Hero Title Section */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-sky-900 to-slate-800 dark:from-slate-100 dark:via-sky-300 dark:to-slate-200 bg-clip-text text-transparent">
                Transform Table Images & PDFs into Excel Workbooks
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                OpenCV morphological table grid detection paired with EasyOCR AI text recognition. High precision extraction, inline editing, and styled <code className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono text-xs">.xlsx</code> exports.
              </p>
            </div>

            {/* File Uploader Component */}
            <FileUploader
              onProcessFiles={handleProcessFiles}
              isProcessing={isProcessing}
              uploadProgress={uploadProgress}
              onOpenPreprocessModal={() => setIsPreprocessModalOpen(true)}
              preprocessOpts={preprocessOpts}
            />

            {/* Resulting Interactive Table Grid */}
            <TableEditor
              resultData={resultData}
              onShowToast={showToast}
            />

          </div>
        )}

        {activeTab === 'history' && (
          <HistoryView
            onLoadResultIntoEditor={handleLoadResultFromHistory}
            onShowToast={showToast}
            historyList={historyList}
            setHistoryList={setHistoryList}
          />
        )}

        {activeTab === 'apidocs' && (
          <ApiDocsModal />
        )}

      </main>

      {/* Modals & Overlays */}
      <PreprocessModal
        isOpen={isPreprocessModalOpen}
        onClose={() => setIsPreprocessModalOpen(false)}
        opts={preprocessOpts}
        setOpts={setPreprocessOpts}
      />

      <BatchMergeModal
        isOpen={isBatchMergeModalOpen}
        onClose={() => setIsBatchMergeModalOpen(false)}
        historyList={historyList}
        onShowToast={showToast}
      />

      <Toast
        toast={toast}
        onClose={() => setToast(null)}
      />

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 GridExtract AI. Built with OpenCV, EasyOCR, React, Vite & Tailwind CSS.</p>
          <p className="font-semibold text-slate-700 dark:text-slate-300">Production-Ready & Deployable to Render + Vercel</p>
        </div>
      </footer>

    </div>
  );
}
