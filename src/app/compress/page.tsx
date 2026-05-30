"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDocument } from "pdf-lib";
import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import CompressionStats from "@/components/CompressionStats";
import { formatBytes, pdfBlob } from "@/lib/utils";

type Quality = "high" | "balanced" | "small";

const qualityOptions: { value: Quality; label: string; desc: string; scale: number; jpeg: number }[] = [
  { value: "high",     label: "High Quality",  desc: "Minimal compression, best fidelity",  scale: 1.5, jpeg: 0.85 },
  { value: "balanced", label: "Balanced",       desc: "Good quality, significant savings",   scale: 1.2, jpeg: 0.65 },
  { value: "small",    label: "Smallest Size",  desc: "Maximum compression",                 scale: 0.9, jpeg: 0.40 },
];

type State =
  | { status: "idle" }
  | { status: "ready"; file: File }
  | { status: "processing"; file: File; progress: number }
  | { status: "done"; file: File; result: Uint8Array; time: number };

export default function CompressPage() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [quality, setQuality] = useState<Quality>("balanced");

  const handleFiles = useCallback((files: File[]) => {
    setState({ status: "ready", file: files[0] });
  }, []);

  const compress = useCallback(async () => {
    if (state.status !== "ready") return;
    const { file } = state;
    const start = Date.now();
    const opt = qualityOptions.find((o) => o.value === quality)!;

    setState({ status: "processing", file, progress: 0 });

    try {
      // Load pdfjs with local worker
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const buf = await file.arrayBuffer();
      const pdfJs = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
      const totalPages = pdfJs.numPages;

      // New pdf-lib document to receive re-rendered pages
      const outDoc = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdfJs.getPage(i);
        const viewport = page.getViewport({ scale: opt.scale });

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);

        await page.render({ canvas, viewport }).promise;

        // Convert to JPEG blob at target quality
        const jpegDataUrl = canvas.toDataURL("image/jpeg", opt.jpeg);
        const base64 = jpegDataUrl.split(",")[1];
        const jpegBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

        const img = await outDoc.embedJpg(jpegBytes);
        // Use original page dimensions (points) not pixel dimensions
        const origViewport = page.getViewport({ scale: 1 });
        const pdfPage = outDoc.addPage([origViewport.width, origViewport.height]);
        pdfPage.drawImage(img, { x: 0, y: 0, width: origViewport.width, height: origViewport.height });

        setState((s) =>
          s.status === "processing"
            ? { ...s, progress: Math.round((i / totalPages) * 90) }
            : s
        );
      }

      const compressed = await outDoc.save();
      const time = (Date.now() - start) / 1000;
      setState({ status: "done", file, result: compressed, time });
    } catch (e) {
      console.error(e);
      setState({ status: "ready", file });
      alert("Could not process this PDF. It may be encrypted or corrupted.");
    }
  }, [state, quality]);

  const download = useCallback(() => {
    if (state.status !== "done") return;
    const blob = pdfBlob(state.result);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = state.file.name.replace(".pdf", "_compressed.pdf");
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const reset = () => setState({ status: "idle" });

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-coral shadow-warm mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Compress PDF</h1>
          <p className="text-warm-500 text-lg">
            Reduce file size while preserving quality. Processed entirely in your browser.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {state.status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFiles} className="min-h-[220px]" />
            </motion.div>
          )}

          {(state.status === "ready" || state.status === "processing") && (
            <motion.div key="ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="bg-white border border-warm rounded-2xl p-4 flex items-center gap-3 shadow-warm">
                <div className="w-10 h-12 rounded-lg gradient-coral flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                    <path d="M2 2h7l3 3v9H2V2z" fill="white" fillOpacity="0.9" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-warm-800 text-sm truncate">{state.file.name}</p>
                  <p className="text-xs text-warm-400 mt-0.5">{formatBytes(state.file.size)}</p>
                </div>
                {state.status === "ready" && (
                  <button onClick={reset} className="text-warm-400 hover:text-warm-600 transition-colors p-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              {state.status === "ready" && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-warm-700">Compression level</p>
                  <div className="grid grid-cols-3 gap-2">
                    {qualityOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setQuality(opt.value)}
                        className={`p-3 rounded-xl border text-left transition-all duration-150 ${
                          quality === opt.value
                            ? "border-coral-400 bg-coral-50 shadow-warm"
                            : "border-warm bg-white hover:border-coral-200"
                        }`}
                      >
                        <p className="text-xs font-semibold text-warm-800">{opt.label}</p>
                        <p className="text-[10px] text-warm-400 mt-0.5 leading-tight">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {state.status === "processing" && (
                <div className="space-y-2">
                  <ProgressBar value={state.progress} />
                  <p className="text-xs text-warm-400 text-center">Re-rendering pages at optimized quality…</p>
                </div>
              )}

              {state.status === "ready" && (
                <button
                  onClick={compress}
                  className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all duration-200"
                >
                  Compress PDF
                </button>
              )}
            </motion.div>
          )}

          {state.status === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-sm font-semibold">Compression complete</span>
              </div>

              <CompressionStats
                originalSize={state.file.size}
                compressedSize={state.result.byteLength}
                processingTime={state.time}
              />

              <div className="flex gap-3">
                <button
                  onClick={download}
                  className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
                <button onClick={reset} className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  New file
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-warm-400 mt-8 flex items-center justify-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Your files are processed locally and never uploaded to any server.
        </motion.p>
      </div>
    </main>
  );
}
