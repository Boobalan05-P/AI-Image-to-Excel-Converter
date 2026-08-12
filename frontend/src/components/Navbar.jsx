import React from 'react';
import { FileSpreadsheet, History, Moon, Sun, Code2, Sparkles, Layers } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, darkMode, setDarkMode, onOpenBatchMerge, historyCount }) {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('converter')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-sky-600 via-emerald-600 to-indigo-600 dark:from-sky-400 dark:via-emerald-400 dark:to-indigo-400 bg-clip-text text-transparent">
                GridExtract AI
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                PRO v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Image & PDF to Excel OCR Platform
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setActiveTab('converter')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === 'converter'
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span>Converter</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative ${
              activeTab === 'history'
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4 text-indigo-500" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[11px] font-semibold bg-indigo-500 text-white rounded-full">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenBatchMerge}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150"
            title="Merge multiple converted tables into one workbook"
          >
            <Layers className="w-4 h-4 text-emerald-500" />
            <span className="hidden md:inline">Batch Merge</span>
          </button>

          <button
            onClick={() => setActiveTab('apidocs')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === 'apidocs'
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">API Docs</span>
          </button>
        </nav>

        {/* Right Side Actions: Theme Toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Dark Mode"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>
        </div>

      </div>
    </header>
  );
}
