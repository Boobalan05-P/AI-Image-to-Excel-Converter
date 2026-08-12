import React, { useState, useRef } from 'react';
import { UploadCloud, File, Image as ImageIcon, FileText, CheckCircle2, AlertCircle, Settings2, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { formatBytes } from '../utils/helpers';

export default function FileUploader({
  onProcessFiles,
  isProcessing,
  uploadProgress,
  onOpenPreprocessModal,
  preprocessOpts
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/bmp', 'application/pdf'];
  const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.bmp', '.pdf'];
  const MAX_SIZE_BYTES = 16 * 1024 * 1024; // 16 MB

  const validateAndAddFiles = (files) => {
    setValidationError(null);
    const valid = [];
    const errors = [];

    Array.from(files).forEach((file) => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        errors.push(`${file.name}: Unsupported file format.`);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        errors.push(`${file.name}: Exceeds 16MB file limit.`);
        return;
      }
      valid.push(file);
    });

    if (errors.length > 0) {
      setValidationError(errors.join(' '));
    }

    if (valid.length > 0) {
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndAddFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartProcessing = () => {
    if (selectedFiles.length > 0) {
      onProcessFiles(selectedFiles);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Preprocessing Settings Quick Bar */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm">
        <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-400">
          <Settings2 className="w-4 h-4 text-sky-500" />
          <span>
            Pipeline: <strong className="text-slate-800 dark:text-slate-200">
              {preprocessOpts.engine === 'easyocr' ? 'EasyOCR (Default)' : 'PyTesseract'}
            </strong> 
            {preprocessOpts.deskew && ' • Deskew'}
            {preprocessOpts.grayscale && ' • Grayscale'}
            {preprocessOpts.contrast && ' • CLAHE'}
          </span>
        </div>
        <button
          onClick={onOpenPreprocessModal}
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline flex items-center space-x-1"
        >
          <span>Configure Preprocessing</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Drag & Drop Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-sky-500 bg-sky-500/10 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 bg-white/50 dark:bg-slate-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.bmp,.pdf"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-inner">
            <UploadCloud className="w-9 h-9" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Drag & Drop your table image or PDF here
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Supports <span className="font-semibold text-slate-700 dark:text-slate-300">JPG, JPEG, PNG, BMP, PDF</span> up to 16MB per file
            </p>
          </div>

          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm shadow-md shadow-sky-600/20 transition-all transform hover:-translate-y-0.5"
          >
            Browse Files
          </button>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="flex items-center space-x-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Selected File Queue */}
      {selectedFiles.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              Upload Queue ({selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''})
            </h4>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs text-rose-500 hover:underline flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {selectedFiles.map((file, idx) => {
              const isPdf = file.name.toLowerCase().endsWith('.pdf');
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
                      {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFile(idx)}
                    disabled={isProcessing}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Progress Bar during Processing */}
          {isProcessing && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center space-x-2 font-medium">
                  <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
                  <span>Running OpenCV table detection & OCR engine...</span>
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Process Submit Button */}
          {!isProcessing && (
            <button
              onClick={handleStartProcessing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white font-semibold text-sm shadow-lg shadow-sky-600/20 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Extract Tables & Convert to Excel</span>
            </button>
          )}
        </div>
      )}

    </div>
  );
}
