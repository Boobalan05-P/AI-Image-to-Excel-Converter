import React, { useState, useEffect } from 'react';
import { Search, Filter, Trash2, Download, ExternalLink, Calendar, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react';
import { fetchHistoryApi, deleteHistoryItemApi, clearHistoryApi, getDownloadUrl } from '../services/api';
import { formatBytes, formatDate, getConfidenceBadgeColor } from '../utils/helpers';

export default function HistoryView({ onLoadResultIntoEditor, onShowToast, historyList, setHistoryList }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadHistoryData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchHistoryApi(searchQuery, fileTypeFilter, dateFilter);
      setHistoryList(data.history || []);
    } catch (err) {
      onShowToast('Failed to fetch history', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistoryData();
  }, [searchQuery, fileTypeFilter, dateFilter]);

  const handleDeleteItem = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteHistoryItemApi(id);
      setHistoryList((prev) => prev.filter((item) => item.id !== id));
      onShowToast('History record deleted', 'info');
    } catch (err) {
      onShowToast('Could not delete history record', 'error');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all conversion history?')) return;
    try {
      await clearHistoryApi();
      setHistoryList([]);
      onShowToast('History cleared completely', 'info');
    } catch (err) {
      onShowToast('Could not clear history', 'error');
    }
  };

  // Stats calculation
  const totalConversions = historyList.length;
  const totalRows = historyList.reduce((acc, item) => acc + (item.row_count || 0), 0);
  const avgConfidenceOverall = totalConversions > 0
    ? Math.round((historyList.reduce((acc, item) => acc + (item.avg_confidence || 0), 0) / totalConversions) * 100)
    : 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in">
      
      {/* Summary Statistics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500 font-bold">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Conversions</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{totalConversions}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Extracted Table Rows</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{totalRows}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500 font-bold">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Average OCR Accuracy</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{avgConfidenceOverall}%</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search filename or text inside tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
          >
            <option value="all">All Formats</option>
            <option value="PNG">PNG</option>
            <option value="JPG">JPG / JPEG</option>
            <option value="PDF">PDF</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
          />

          {historyList.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold flex items-center space-x-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

      </div>

      {/* History List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {historyList.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              No conversion history found
            </p>
            <p className="text-xs text-slate-400">
              Uploaded and processed tables will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold">
                <tr>
                  <th className="p-3.5">Filename</th>
                  <th className="p-3.5">Dimensions</th>
                  <th className="p-3.5">Accuracy</th>
                  <th className="p-3.5">Date Processed</th>
                  <th className="p-3.5 text-right">Downloads & Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {historyList.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onLoadResultIntoEditor(item)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500 font-bold text-[10px]">
                          {item.file_type}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 hover:text-sky-600 transition-colors truncate max-w-xs">
                            {item.filename}
                          </p>
                          <p className="text-[11px] text-slate-400">{formatBytes(item.file_size)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                      {item.row_count} rows × {item.col_count} cols
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full font-semibold border text-[11px] ${getConfidenceBadgeColor(item.avg_confidence)}`}>
                        {Math.round((item.avg_confidence || 0.95) * 100)}%
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-500 dark:text-slate-400">
                      {formatDate(item.upload_date)}
                    </td>

                    <td className="p-3.5 text-right space-x-2">
                      <a
                        href={getDownloadUrl(item.excel_filename)}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors"
                        title="Download Excel file"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.XLSX</span>
                      </a>

                      <a
                        href={getDownloadUrl(item.csv_filename)}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                        title="Download CSV file"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.CSV</span>
                      </a>

                      <button
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>

    </div>
  );
}
