"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import { formatBytes } from "@/lib/utils";

interface PageImage {
  pageNum: number;
  dataUrl: string;
  blob: Blob;
}

type State = "idle" | "ready" | "processing" | "done";

export default function PdfToImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState<PageImage[]>([]);

  const handleFile = useCallback((files: File[]) => {
    setFile(files[0]);
    setStatus("ready");
  }, []);

  const convert = useCallback(async () => {
    if (!file) return;
    setStatus("processing");
    setProgress(0);

    try {
      // Dynamically import pdfjs to avoid SSR issues
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const total = pdf.numPages;
      const out: PageImage[] = [];

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, viewport }).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.92));
        out.push({ pageNum: i, dataUrl, blob });
        setProgress(Math.round((i / total) * 100));
      }

      setPages(out);
      setStatus("done");
    } catch (e) {
      console.error(e);
      setStatus("ready");
      alert("Failed to convert PDF to images.");
    }
  }, [file]);

  const downloadAll = async () => {
    if (pages.length === 1) {
      const url = URL.createObjectURL(pages[0].blob);
      const a = document.createElement("a");
      a.href = url; a.download = `page_1.jpg`; a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    pages.forEach((p) => zip.file(`page_${p.pageNum}.jpg`, p.blob));
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url; a.download = "pages.zip"; a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setFile(null); setStatus("idle"); setPages([]); };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-warm mb-5">
            <span className="text-2xl">📸</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">PDF to Image</h1>
          <p className="text-warm-500 text-lg">Export every page as a high-quality JPEG. Download as ZIP.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFile} className="min-h-[220px]" />
            </motion.div>
          )}

          {status === "ready" && file && (
            <motion.div key="ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="bg-white border border-warm rounded-2xl p-4 flex items-center gap-3 shadow-warm">
                <div className="w-10 h-12 rounded-lg gradient-coral flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                    <path d="M2 2h7l3 3v9H2V2z" fill="white" fillOpacity="0.9" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-warm-800 text-sm truncate">{file.name}</p>
                  <p className="text-xs text-warm-400">{formatBytes(file.size)}</p>
                </div>
                <button onClick={reset} className="text-warm-400 hover:text-warm-600 p-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <button onClick={convert} className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                Convert to Images
              </button>
            </motion.div>
          )}

          {status === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="bg-white border border-warm rounded-2xl p-6 shadow-warm">
                <p className="text-sm font-medium text-warm-700 mb-4">Rendering pages…</p>
                <ProgressBar value={progress} />
              </div>
            </motion.div>
          )}

          {status === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-sm font-semibold">{pages.length} page{pages.length > 1 ? "s" : ""} rendered</span>
              </div>

              {/* Thumbnail grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {pages.map((p) => (
                  <motion.div
                    key={p.pageNum}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: p.pageNum * 0.05 }}
                    className="relative group rounded-xl overflow-hidden border border-warm shadow-warm aspect-[3/4] bg-cream-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.dataUrl} alt={`Page ${p.pageNum}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-warm-900/0 group-hover:bg-warm-900/30 transition-colors flex items-center justify-center">
                      <button
                        onClick={() => {
                          const url = URL.createObjectURL(p.blob);
                          const a = document.createElement("a");
                          a.href = url; a.download = `page_${p.pageNum}.jpg`; a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-warm-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-warm"
                      >
                        Download
                      </button>
                    </div>
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-warm-900/60 text-white px-1.5 py-0.5 rounded">
                      {p.pageNum}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={downloadAll} className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                  {pages.length > 1 ? "Download all as ZIP" : "Download image"}
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
