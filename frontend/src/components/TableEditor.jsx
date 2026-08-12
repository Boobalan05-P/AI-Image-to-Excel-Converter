import React, { useState, useEffect } from 'react';
import { Download, Plus, Trash2, Wand2, Eye, FileSpreadsheet, FileText, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { getConfidenceBadgeColor, getDownloadUrl, getPreviewUrl } from '../utils/helpers';
import { exportTableApi } from '../services/api';

export default function TableEditor({ resultData, onShowToast }) {
  const [matrix, setMatrix] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [currentExcelUrl, setCurrentExcelUrl] = useState('');
  const [currentCsvUrl, setCurrentCsvUrl] = useState('');

  useEffect(() => {
    if (resultData && resultData.table_data) {
      // Normalize table_data structure into editable string array
      const rawMatrix = resultData.table_data.map((row) =>
        row.map((cell) => (typeof cell === 'object' ? cell : { text: String(cell), confidence: 0.95 }))
      );
      setMatrix(rawMatrix);
      setCurrentExcelUrl(resultData.excel_url || '');
      setCurrentCsvUrl(resultData.csv_url || '');
    }
  }, [resultData]);

  if (!resultData || matrix.length === 0) return null;

  const handleCellChange = (rIdx, cIdx, val) => {
    setMatrix((prev) => {
      const copy = prev.map((row) => [...row]);
      copy[rIdx][cIdx] = {
        ...copy[rIdx][cIdx],
        text: val,
        is_low_confidence: false // Manual edit clears low confidence flag
      };
      return copy;
    });
  };

  const addRow = () => {
    setMatrix((prev) => {
      const colCount = prev[0]?.length || 1;
      const newRow = Array(colCount).fill({ text: '', confidence: 1.0 });
      return [...prev, newRow];
    });
    onShowToast('New row added', 'info');
  };

  const deleteRow = (rIdx) => {
    if (matrix.length <= 1) {
      onShowToast('Cannot delete the last remaining row', 'error');
      return;
    }
    setMatrix((prev) => prev.filter((_, idx) => idx !== rIdx));
    onShowToast('Row removed', 'info');
  };

  const addColumn = () => {
    setMatrix((prev) => prev.map((row) => [...row, { text: '', confidence: 1.0 }]));
    onShowToast('New column added', 'info');
  };

  const deleteColumn = (cIdx) => {
    if (matrix[0]?.length <= 1) {
      onShowToast('Cannot delete the last remaining column', 'error');
      return;
    }
    setMatrix((prev) => prev.map((row) => row.filter((_, idx) => idx !== cIdx)));
    onShowToast('Column removed', 'info');
  };

  const handleAiAutoFix = () => {
    setMatrix((prev) =>
      prev.map((row) =>
        row.map((cell) => {
          let text = cell.text.trim();
          // Auto fix common OCR digit confusion (e.g. 'O' -> '0' in numbers)
          if (/^\$?\d+[O|o]\d+$/.test(text)) {
            text = text.replace(/[O|o]/g, '0');
          }
          return { ...cell, text, is_low_confidence: false };
        })
      )
    );
    onShowToast('AI Table Formatting Applied!', 'success');
  };

  const handleExport = async (type) => {
    setIsExporting(true);
    try {
      const cleanData = matrix.map((row) => row.map((cell) => cell.text));
      const res = await exportTableApi(cleanData, resultData.entry?.filename || 'table.xlsx', resultData.entry?.id);
      if (type === 'excel') {
        window.open(getDownloadUrl(res.excel_url), '_blank');
      } else {
        window.open(getDownloadUrl(res.csv_url), '_blank');
      }
      onShowToast(`Exported as ${type.toUpperCase()}`, 'success');
    } catch (err) {
      onShowToast('Failed to export table', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const avgConfidence = resultData.entry?.avg_confidence || 0.95;
  const sharpness = resultData.sharpness;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header Info & Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Extracted Table Grid
              </h2>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getConfidenceBadgeColor(avgConfidence)}`}>
                {Math.round(avgConfidence * 100)}% OCR Accuracy
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Source: <strong className="text-slate-700 dark:text-slate-300">{resultData.entry?.filename}</strong> • {matrix.length} Rows × {matrix[0]?.length || 0} Columns
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowImagePreview(!showImagePreview)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Eye className="w-4 h-4 text-sky-500" />
              <span>{showImagePreview ? 'Hide Image' : 'View Source Image'}</span>
            </button>

            <button
              onClick={handleAiAutoFix}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Wand2 className="w-4 h-4 text-indigo-500" />
              <span>AI Correct</span>
            </button>

            <button
              onClick={() => handleExport('excel')}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-all transform hover:-translate-y-0.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Sharpness / Blur Warning Banner if applicable */}
        {sharpness?.is_blurry && (
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
            <span>{sharpness.warning} (Blurriness Score: {sharpness.score})</span>
          </div>
        )}

        {/* Source Image Drawer Preview */}
        {showImagePreview && resultData.preview_url && (
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Original Upload Preview
            </h4>
            <div className="max-h-72 overflow-auto rounded-lg border border-slate-300 dark:border-slate-700 flex justify-center bg-black/5 p-2">
              <img
                src={getPreviewUrl(resultData.preview_url)}
                alt="Source Image"
                className="max-w-full h-auto object-contain rounded"
              />
            </div>
          </div>
        )}

      </div>

      {/* Grid Controls (Add Row / Column) */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={addRow}
            className="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold flex items-center space-x-1 hover:bg-sky-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
          <button
            onClick={addColumn}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1 hover:bg-emerald-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Column</span>
          </button>
        </div>
        <p className="text-slate-400 italic">
          💡 Double-click any cell to edit extracted text inline.
        </p>
      </div>

      {/* Editable Interactive Table Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            
            {/* Header Controls */}
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                <th className="p-3 w-10 text-center font-bold border-r border-slate-200 dark:border-slate-700 bg-slate-200/60 dark:bg-slate-800">
                  #
                </th>
                {matrix[0]?.map((_, cIdx) => (
                  <th key={cIdx} className="p-2 border-r border-slate-200 dark:border-slate-700 min-w-[120px]">
                    <div className="flex items-center justify-between font-bold">
                      <span>Col {cIdx + 1}</span>
                      <button
                        onClick={() => deleteColumn(cIdx)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded"
                        title="Delete Column"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="p-2 w-10 text-center">Actions</th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {matrix.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-2 text-center font-semibold text-slate-400 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                    {rIdx + 1}
                  </td>

                  {row.map((cell, cIdx) => {
                    const isLowConf = cell.is_low_confidence || (cell.confidence && cell.confidence < 0.5);
                    return (
                      <td
                        key={cIdx}
                        className={`p-1.5 border-r border-slate-200 dark:border-slate-800 ${
                          isLowConf ? 'bg-amber-100/60 dark:bg-amber-950/40' : ''
                        }`}
                      >
                        <input
                          type="text"
                          value={cell.text || ''}
                          onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                          className={`w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 outline-none bg-transparent text-slate-800 dark:text-slate-200 ${
                            rIdx === 0 ? 'font-bold' : ''
                          }`}
                          placeholder="Empty cell"
                        />
                      </td>
                    );
                  })}

                  <td className="p-2 text-center">
                    <button
                      onClick={() => deleteRow(rIdx)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded"
                      title="Delete Row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
}
