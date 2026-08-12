import React from 'react';
import { X, Sliders, Check } from 'lucide-react';

export default function PreprocessModal({ isOpen, onClose, opts, setOpts }) {
  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setOpts((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                OpenCV Image Preprocessing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Optimize image quality before table extraction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 text-sm">
          
          {/* Engine Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Primary OCR Engine
            </label>
            <select
              value={opts.engine || 'easyocr'}
              onChange={(e) => handleChange('engine', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="easyocr">EasyOCR (Recommended - Deep Learning)</option>
              <option value="pytesseract">PyTesseract (Fast Line Engine)</option>
            </select>
          </div>

          {/* Thresholding Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Image Binarization / Thresholding Mode
            </label>
            <select
              value={opts.threshold_mode || 'adaptive'}
              onChange={(e) => handleChange('threshold_mode', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="adaptive">Adaptive Gaussian Thresholding (Best for uneven light)</option>
              <option value="otsu">Otsu Global Binarization (Best for high contrast scans)</option>
              <option value="none">None (Keep raw grayscale image)</option>
            </select>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Auto Deskewing</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Rotates tilted table images back to 0° alignment</p>
              </div>
              <input
                type="checkbox"
                checked={opts.deskew ?? true}
                onChange={(e) => handleChange('deskew', e.target.checked)}
                className="w-5 h-5 accent-sky-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Grayscale Conversion</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Removes background color noise</p>
              </div>
              <input
                type="checkbox"
                checked={opts.grayscale ?? true}
                onChange={(e) => handleChange('grayscale', e.target.checked)}
                className="w-5 h-5 accent-sky-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Contrast Enhancement (CLAHE)</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Boosts faint text and line visibility</p>
              </div>
              <input
                type="checkbox"
                checked={opts.contrast ?? true}
                onChange={(e) => handleChange('contrast', e.target.checked)}
                className="w-5 h-5 accent-sky-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Median Denoising</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Filters pepper noise and small specks</p>
              </div>
              <input
                type="checkbox"
                checked={opts.denoise ?? true}
                onChange={(e) => handleChange('denoise', e.target.checked)}
                className="w-5 h-5 accent-sky-600 rounded"
              />
            </label>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition-colors flex items-center space-x-1"
          >
            <Check className="w-4 h-4" />
            <span>Apply Settings</span>
          </button>
        </div>

      </div>
    </div>
  );
}
