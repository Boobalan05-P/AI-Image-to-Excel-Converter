import React from 'react';
import { Code2, Terminal, Copy, Check, Server } from 'lucide-react';

export default function ApiDocsModal() {
  const [copiedIndex, setCopiedIndex] = React.useState(null);

  const handleCopy = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const endpoints = [
    {
      title: "Convert File to Excel",
      method: "POST",
      path: "/api/convert",
      desc: "Uploads an image (JPG, PNG, BMP) or PDF, runs OpenCV morphological grid extraction + EasyOCR, and returns structured table data and Excel/CSV download links.",
      curl: `curl -X POST http://localhost:5000/api/convert \\\n  -F "file=@invoice_sample.png" \\\n  -F "grayscale=true" \\\n  -F "deskew=true" \\\n  -F "threshold_mode=adaptive" \\\n  -F "engine=easyocr"`
    },
    {
      title: "Export Modified Table",
      method: "POST",
      path: "/api/export",
      desc: "Generates new .xlsx and .csv files from user-edited grid data.",
      curl: `curl -X POST http://localhost:5000/api/export \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "filename": "table.xlsx",\n    "table_data": [["Header1", "Header2"], ["Val1", "Val2"]]\n  }'`
    },
    {
      title: "Get Processing History",
      method: "GET",
      path: "/api/history",
      desc: "Lists past conversion records with optional search query and file format filters.",
      curl: `curl -X GET "http://localhost:5000/api/history?q=invoice&type=PNG"`
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 font-bold">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Developer REST API Reference
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Integrate GridExtract OCR engine directly into your backend services & webhooks
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <Server className="w-4 h-4 text-emerald-500" />
          <span>Base URL: http://localhost:5000/api</span>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="space-y-4">
        {endpoints.map((ep, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                  ep.method === 'POST' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                }`}>
                  {ep.method}
                </span>
                <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                  {ep.path}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-400">{ep.title}</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {ep.desc}
            </p>

            {/* Curl Box */}
            <div className="relative rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-sky-300 overflow-x-auto">
              <button
                onClick={() => handleCopy(ep.curl, idx)}
                className="absolute right-3 top-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Copy Curl Command"
              >
                {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre className="pr-10">{ep.curl}</pre>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
