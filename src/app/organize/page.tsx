"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDocument, degrees } from "pdf-lib";
import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import { formatBytes, pdfBlob } from "@/lib/utils";

interface PageThumb {
  index: number;
  dataUrl: string;
  rotation: number; // 0, 90, 180, 270
  deleted: boolean;
}

type State = "idle" | "loading" | "ready" | "processing" | "done";

export default function OrganizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState<PageThumb[]>([]);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setStatus("loading");

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const buf = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const total = pdf.numPages;
      const thumbs: PageThumb[] = [];

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, viewport }).promise;
        thumbs.push({ index: i - 1, dataUrl: canvas.toDataURL("image/jpeg", 0.7), rotation: 0, deleted: false });
      }

      setPages(thumbs);
      setStatus("ready");
    } catch {
      setStatus("idle");
      alert("Could not load PDF pages.");
    }
  }, []);

  const rotate = (index: number) => {
    setPages((prev) =>
      prev.map((p) => p.index === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p)
    );
  };

  const toggleDelete = (index: number) => {
    setPages((prev) => prev.map((p) => p.index === index ? { ...p, deleted: !p.deleted } : p));
  };

  const handleDragStart = (index: number) => setDragging(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragOver(index); };
  const handleDrop = (targetIndex: number) => {
    if (dragging === null || dragging === targetIndex) { setDragging(null); setDragOver(null); return; }
    setPages((prev) => {
      const arr = [...prev];
      const fromPos = arr.findIndex((p) => p.index === dragging);
      const toPos = arr.findIndex((p) => p.index === targetIndex);
      const [moved] = arr.splice(fromPos, 1);
      arr.splice(toPos, 0, moved);
      return arr;
    });
    setDragging(null);
    setDragOver(null);
  };

  const save = useCallback(async () => {
    if (!file) return;
    setStatus("processing");
    setProgress(0);

    try {
      const buf = await file.arrayBuffer();
      const src = await PDFDocument.load(buf, { ignoreEncryption: true });
      const out = await PDFDocument.create();

      const activePages = pages.filter((p) => !p.deleted);
      for (let i = 0; i < activePages.length; i++) {
        const p = activePages[i];
        const [copied] = await out.copyPages(src, [p.index]);
        if (p.rotation !== 0) {
          copied.setRotation(degrees(p.rotation));
        }
        out.addPage(copied);
        setProgress(Math.round(((i + 1) / activePages.length) * 100));
      }

      const bytes = await out.save();
      setResult(bytes);
      setStatus("done");
    } catch {
      setStatus("ready");
      alert("Failed to save PDF.");
    }
  }, [file, pages]);

  const download = () => {
    if (!result) return;
    const blob = pdfBlob(result);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "organized.pdf"; a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setFile(null); setStatus("idle"); setPages([]); setResult(null); };

  const activeCount = pages.filter((p) => !p.deleted).length;

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 shadow-warm mb-5">
            <span className="text-2xl">🗂️</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Organize Pages</h1>
          <p className="text-warm-500 text-lg">Drag to reorder · rotate · delete pages. Like Figma for PDFs.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
              <DropZone onFiles={handleFile} className="min-h-[220px]" />
            </motion.div>
          )}

          {status === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
              <div className="bg-white border border-warm rounded-2xl p-8 shadow-warm text-center">
                <p className="text-sm text-warm-500 mb-4">Loading page thumbnails…</p>
                <ProgressBar value={50} showLabel={false} />
              </div>
            </motion.div>
          )}

          {status === "ready" && (
            <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Toolbar */}
              <div className="flex items-center justify-between bg-white border border-warm rounded-xl px-4 py-3 shadow-warm">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-warm-700">{file?.name}</span>
                  <span className="text-xs text-warm-400">{activeCount} of {pages.length} pages</span>
                </div>
                <button
                  onClick={save}
                  disabled={activeCount === 0}
                  className="gradient-coral text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-warm hover:shadow-warm-lg hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  Save PDF
                </button>
              </div>

              {/* Page grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {pages.map((page) => (
                  <motion.div
                    key={page.index}
                    layout
                    draggable
                    onDragStart={() => handleDragStart(page.index)}
                    onDragOver={(e) => handleDragOver(e, page.index)}
                    onDrop={() => handleDrop(page.index)}
                    onDragEnd={() => { setDragging(null); setDragOver(null); }}
                    className={`relative group rounded-xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${
                      page.deleted
                        ? "border-red-200 opacity-40"
                        : dragOver === page.index
                        ? "border-coral-400 scale-105"
                        : "border-warm hover:border-coral-300"
                    }`}
                  >
                    <div
                      className="aspect-[3/4] bg-cream-100 overflow-hidden"
                      style={{ transform: `rotate(${page.rotation}deg)` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={page.dataUrl} alt={`Page ${page.index + 1}`} className="w-full h-full object-cover" />
                    </div>

                    {/* Overlay controls */}
                    <div className="absolute inset-0 bg-warm-900/0 group-hover:bg-warm-900/20 transition-colors" />
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => rotate(page.index)}
                        className="w-6 h-6 bg-white rounded-md shadow flex items-center justify-center text-warm-600 hover:text-coral-500 transition-colors"
                        title="Rotate"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                      </button>
                      <button
                        onClick={() => toggleDelete(page.index)}
                        className={`w-6 h-6 rounded-md shadow flex items-center justify-center transition-colors ${
                          page.deleted ? "bg-red-500 text-white" : "bg-white text-warm-600 hover:text-red-500"
                        }`}
                        title={page.deleted ? "Restore" : "Delete"}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>

                    <span className="absolute bottom-1 left-1 text-[9px] bg-warm-900/50 text-white px-1 py-0.5 rounded">
                      {page.index + 1}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {status === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
              <div className="bg-white border border-warm rounded-2xl p-8 shadow-warm">
                <ProgressBar value={progress} />
              </div>
            </motion.div>
          )}

          {status === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-5">
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-sm font-semibold">PDF organized successfully</span>
              </div>
              {result && (
                <div className="bg-white border border-warm rounded-2xl p-5 shadow-warm text-center">
                  <p className="font-semibold text-warm-800">organized.pdf</p>
                  <p className="text-xs text-warm-400 mt-1">{formatBytes(result.byteLength)} · {activeCount} pages</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={download} className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                  Download PDF
                </button>
                <button onClick={reset} className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  New file
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
