"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { PDFDocument } from "pdf-lib";
import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import { formatBytes, pdfBlob } from "@/lib/utils";

interface FileItem {
  id: string;
  file: File;
}

type State = "idle" | "ready" | "processing" | "done";

export default function MergePage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [status, setStatus] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);

  const addFiles = useCallback((newFiles: File[]) => {
    const items = newFiles.map((f) => ({ id: `${f.name}-${Date.now()}-${Math.random()}`, file: f }));
    setFiles((prev) => [...prev, ...items]);
    setStatus("ready");
  }, []);

  const remove = (id: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (next.length === 0) setStatus("idle");
      return next;
    });
  };

  const merge = useCallback(async () => {
    if (files.length < 2) return;
    setStatus("processing");
    setProgress(0);

    try {
      const merged = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        const buf = await files[i].file.arrayBuffer();
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
        setProgress(Math.round(((i + 1) / files.length) * 90));
      }
      const bytes = await merged.save();
      setProgress(100);
      await new Promise((r) => setTimeout(r, 200));
      setResult(bytes);
      setStatus("done");
    } catch {
      setStatus("ready");
      alert("Failed to merge. Some files may be encrypted.");
    }
  }, [files]);

  const download = () => {
    if (!result) return;
    const blob = pdfBlob(result);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merged.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setFiles([]); setStatus("idle"); setResult(null); };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 border border-indigo-200 shadow-warm mb-5">
            <span className="text-2xl">🔗</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Merge PDF</h1>
          <p className="text-warm-500 text-lg">Combine multiple PDFs into one. Drag to reorder.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "done" ? (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-sm font-semibold">Merged {files.length} files successfully</span>
              </div>
              <div className="bg-white border border-warm rounded-2xl p-5 shadow-warm text-center">
                <p className="text-sm text-warm-500 mb-1">Output file</p>
                <p className="font-semibold text-warm-800">merged.pdf</p>
                {result && <p className="text-xs text-warm-400 mt-1">{formatBytes(result.byteLength)}</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={download} className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download merged PDF
                </button>
                <button onClick={reset} className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  Start over
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Drop zone */}
              <DropZone
                onFiles={addFiles}
                multiple
                className="min-h-[140px]"
                label={files.length > 0 ? "Add more PDFs" : "Drop PDFs here"}
                sublabel={files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""} added` : "or click to browse · multiple files supported"}
              />

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-warm-700">{files.length} file{files.length > 1 ? "s" : ""} · drag to reorder</p>
                    <p className="text-xs text-warm-400">{formatBytes(files.reduce((a, f) => a + f.file.size, 0))} total</p>
                  </div>
                  <Reorder.Group axis="y" values={files} onReorder={setFiles} className="space-y-2">
                    {files.map((item, i) => (
                      <Reorder.Item key={item.id} value={item} className="cursor-grab active:cursor-grabbing">
                        <motion.div
                          layout
                          className="bg-white border border-warm rounded-xl p-3 flex items-center gap-3 shadow-warm"
                        >
                          <span className="text-xs text-warm-300 font-mono w-4 text-center">{i + 1}</span>
                          <div className="w-8 h-9 rounded gradient-coral flex items-center justify-center flex-shrink-0">
                            <svg width="10" height="12" viewBox="0 0 14 16" fill="none">
                              <path d="M2 2h7l3 3v9H2V2z" fill="white" fillOpacity="0.9" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-warm-800 truncate">{item.file.name}</p>
                            <p className="text-xs text-warm-400">{formatBytes(item.file.size)}</p>
                          </div>
                          <button onClick={() => remove(item.id)} className="text-warm-300 hover:text-warm-600 transition-colors p-1">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </motion.div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </div>
              )}

              {status === "processing" && <ProgressBar value={progress} />}

              {files.length >= 2 && status !== "processing" && (
                <button
                  onClick={merge}
                  className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all"
                >
                  Merge {files.length} PDFs
                </button>
              )}

              {files.length === 1 && (
                <p className="text-center text-sm text-warm-400">Add at least one more PDF to merge</p>
              )}
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
