import React, { useState } from 'react';
import { X, Layers, Check, FileSpreadsheet, Loader2 } from 'lucide-react';
import { mergeTablesApi, getDownloadUrl } from '../services/api';

export default function BatchMergeModal({ isOpen, onClose, historyList, onShowToast }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [mergeMode, setMergeMode] = useState('sheets'); // 'sheets' or 'merged'
  const [isMerging, setIsMerging] = useState(false);

  if (!isOpen) return null;

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === historyList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(historyList.map((item) => item.id));
    }
  };

  const handleExecuteMerge = async () => {
    if (selectedIds.length < 2) {
      onShowToast('Please select at least 2 tables to merge', 'error');
      return;
    }

    setIsMerging(true);
    try {
      const itemsToMerge = historyList
        .filter((item) => selectedIds.includes(item.id))
        .map((item) => ({
          filename: item.filename,
          table_data: item.table_data
        }));

      const res = await mergeTablesApi(itemsToMerge, mergeMode);
      window.open(getDownloadUrl(res.excel_url), '_blank');
      onShowToast('Workbook merged & downloaded successfully!', 'success');
      onClose();
    } catch (err) {
      onShowToast('Failed to merge tables', 'error');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                Batch Workbook Merge
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Combine multiple extracted tables into a single Excel file
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

        {/* Merge Mode Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Merge Layout Strategy
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMergeMode('sheets')}
              className={`p-3 rounded-xl border text-left transition-all ${
                mergeMode === 'sheets'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="text-xs font-bold">Multi-Sheet Workbook</div>
              <div className="text-[11px] text-slate-500 font-normal mt-0.5">Separate tab for each table</div>
            </button>

            <button
              type="button"
              onClick={() => setMergeMode('merged')}
              className={`p-3 rounded-xl border text-left transition-all ${
                mergeMode === 'merged'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="text-xs font-bold">Single Combined Sheet</div>
              <div className="text-[11px] text-slate-500 font-normal mt-0.5">Stacked tables with headers</div>
            </button>
          </div>
        </div>

        {/* Table Selection List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Select Tables ({selectedIds.length} of {historyList.length} selected)
            </span>
            <button
              onClick={handleSelectAll}
              className="text-sky-600 dark:text-sky-400 hover:underline font-semibold"
            >
              {selectedIds.length === historyList.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/50">
            {historyList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No past conversions found in history. Process some images first!
              </p>
            ) : (
              historyList.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/40'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent div onClick
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                      <div className="truncate text-xs">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {item.filename}
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          {item.row_count} rows × {item.col_count} cols • {Math.round(item.avg_confidence * 100)}% accuracy
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteMerge}
            disabled={isMerging || selectedIds.length < 2}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition-colors"
          >
            {isMerging ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Merging...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                <span>Merge Selected ({selectedIds.length})</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
