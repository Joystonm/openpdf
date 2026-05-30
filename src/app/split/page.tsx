"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDocument } from "pdf-lib";
import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import { formatBytes, pdfBlob } from "@/lib/utils";

type SplitMode = "range" | "every" | "extract";
type State = "idle" | "ready" | "processing" | "done";

export default function SplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [status, setStatus] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<SplitMode>("range");
  const [rangeInput, setRangeInput] = useState("1-3, 4-6");
  const [everyN, setEveryN] = useState(1);
  const [extractPages, setExtractPages] = useState("1, 3, 5");
  const [results, setResults] = useState<{ name: string; bytes: Uint8Array }[]>([]);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    try {
      const buf = await f.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
      setStatus("ready");
    } catch {
      alert("Could not read this PDF.");
    }
  }, []);

  const parseRanges = (input: string, max: number): number[][] => {
    return input.split(",").map((s) => {
      const [a, b] = s.trim().split("-").map(Number);
      const start = Math.max(1, a || 1);
      const end = Math.min(max, b || start);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i - 1);
    }).filter((r) => r.length > 0);
  };

  const split = useCallback(async () => {
    if (!file) return;
    setStatus("processing");
    setProgress(0);

    try {
      const buf = await file.arrayBuffer();
      const src = await PDFDocument.load(buf, { ignoreEncryption: true });
      const total = src.getPageCount();
      const parts: number[][] = [];

      if (mode === "range") {
        parseRanges(rangeInput, total).forEach((r) => parts.push(r));
      } else if (mode === "every") {
        for (let i = 0; i < total; i += everyN) {
          parts.push(Array.from({ length: Math.min(everyN, total - i) }, (_, j) => i + j));
        }
      } else {
        const pages = extractPages.split(",").map((s) => parseInt(s.trim()) - 1).filter((n) => n >= 0 && n < total);
        parts.push(pages);
      }

      const out: { name: string; bytes: Uint8Array }[] = [];
      for (let i = 0; i < parts.length; i++) {
        const doc = await PDFDocument.create();
        const copied = await doc.copyPages(src, parts[i]);
        copied.forEach((p) => doc.addPage(p));
        const bytes = await doc.save();
        out.push({ name: `split_part_${i + 1}.pdf`, bytes });
        setProgress(Math.round(((i + 1) / parts.length) * 100));
      }

      setResults(out);
      setStatus("done");
    } catch {
      setStatus("ready");
      alert("Failed to split PDF.");
    }
  }, [file, mode, rangeInput, everyN, extractPages]);

  const downloadAll = () => {
    results.forEach(({ name, bytes }) => {
      const blob = pdfBlob(bytes);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const reset = () => { setFile(null); setStatus("idle"); setResults([]); setPageCount(0); };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-warm mb-5">
            <span className="text-2xl">✂️</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Split PDF</h1>
          <p className="text-warm-500 text-lg">Extract pages or split by range. Fully local.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFile} className="min-h-[220px]" />
            </motion.div>
          )}

          {(status === "ready" || status === "processing") && file && (
            <motion.div key="ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* File info */}
              <div className="bg-white border border-warm rounded-2xl p-4 flex items-center gap-3 shadow-warm">
                <div className="w-10 h-12 rounded-lg gradient-coral flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                    <path d="M2 2h7l3 3v9H2V2z" fill="white" fillOpacity="0.9" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-warm-800 text-sm truncate">{file.name}</p>
                  <p className="text-xs text-warm-400">{formatBytes(file.size)} · {pageCount} pages</p>
                </div>
                {status === "ready" && (
                  <button onClick={reset} className="text-warm-400 hover:text-warm-600 p-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Mode selector */}
              {status === "ready" && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: "range", label: "By Range", desc: "e.g. 1-3, 4-6" },
                      { value: "every", label: "Every N Pages", desc: "Split evenly" },
                      { value: "extract", label: "Extract Pages", desc: "Pick specific pages" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setMode(opt.value)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          mode === opt.value ? "border-coral-400 bg-coral-50 shadow-warm" : "border-warm bg-white hover:border-coral-200"
                        }`}
                      >
                        <p className="text-xs font-semibold text-warm-800">{opt.label}</p>
                        <p className="text-[10px] text-warm-400 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>

                  <div className="bg-white border border-warm rounded-xl p-4">
                    {mode === "range" && (
                      <div>
                        <label className="text-sm font-medium text-warm-700 block mb-2">Page ranges</label>
                        <input
                          value={rangeInput}
                          onChange={(e) => setRangeInput(e.target.value)}
                          placeholder="e.g. 1-3, 4-6, 7-10"
                          className="w-full border border-warm rounded-lg px-3 py-2 text-sm text-warm-800 bg-cream-50 focus:outline-none focus:border-coral-400 transition-colors"
                        />
                        <p className="text-xs text-warm-400 mt-1.5">Separate ranges with commas. Each range becomes a separate PDF.</p>
                      </div>
                    )}
                    {mode === "every" && (
                      <div>
                        <label className="text-sm font-medium text-warm-700 block mb-2">Split every</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min={1}
                            max={pageCount}
                            value={everyN}
                            onChange={(e) => setEveryN(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 border border-warm rounded-lg px-3 py-2 text-sm text-warm-800 bg-cream-50 focus:outline-none focus:border-coral-400"
                          />
                          <span className="text-sm text-warm-500">pages → {Math.ceil(pageCount / everyN)} files</span>
                        </div>
                      </div>
                    )}
                    {mode === "extract" && (
                      <div>
                        <label className="text-sm font-medium text-warm-700 block mb-2">Pages to extract</label>
                        <input
                          value={extractPages}
                          onChange={(e) => setExtractPages(e.target.value)}
                          placeholder="e.g. 1, 3, 5, 7"
                          className="w-full border border-warm rounded-lg px-3 py-2 text-sm text-warm-800 bg-cream-50 focus:outline-none focus:border-coral-400"
                        />
                        <p className="text-xs text-warm-400 mt-1.5">Comma-separated page numbers. Creates one PDF with selected pages.</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={split}
                    className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all"
                  >
                    Split PDF
                  </button>
                </>
              )}

              {status === "processing" && <ProgressBar value={progress} />}
            </motion.div>
          )}

          {status === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-sm font-semibold">Split into {results.length} file{results.length > 1 ? "s" : ""}</span>
              </div>

              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="bg-white border border-warm rounded-xl p-3 flex items-center gap-3 shadow-warm">
                    <div className="w-8 h-9 rounded gradient-coral flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="12" viewBox="0 0 14 16" fill="none">
                        <path d="M2 2h7l3 3v9H2V2z" fill="white" fillOpacity="0.9" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warm-800">{r.name}</p>
                      <p className="text-xs text-warm-400">{formatBytes(r.bytes.byteLength)}</p>
                    </div>
                    <button
                      onClick={() => {
                        const blob = pdfBlob(r.bytes);
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url; a.download = r.name; a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-xs text-coral-500 hover:text-coral-700 font-medium transition-colors"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                {results.length > 1 && (
                  <button onClick={downloadAll} className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                    Download all
                  </button>
                )}
                <button onClick={reset} className="flex-1 px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  Start over
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-warm-400 mt-8 flex items-center justify-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Your files are processed locally and never uploaded to any server.
        </p>
      </div>
    </main>
  );
}
