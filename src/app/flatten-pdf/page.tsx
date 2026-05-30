"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import { formatBytes, pdfBlob } from "@/lib/utils";

type State = "idle" | "ready" | "processing" | "done";

export default function FlattenPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0]); setStatus("ready"); setResult(null);
  }, []);

  // Flatten by re-rendering each page via pdfjs → canvas → pdf-lib
  // This bakes in all annotations, form fields, and overlays
  const flatten = useCallback(async () => {
    if (!file) return;
    setStatus("processing"); setProgress(0);

    try {
      const [pdfjsLib, { PDFDocument }] = await Promise.all([
        import("pdfjs-dist"),
        import("pdf-lib"),
      ]);
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const buf = await file.arrayBuffer();
      const srcPdf = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
      const total = srcPdf.numPages;
      setPageCount(total);

      const outDoc = await PDFDocument.create();

      for (let i = 1; i <= total; i++) {
        const page = await srcPdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 }); // 2× for quality
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        await page.render({ canvas, viewport }).promise;

        const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const base64 = jpegDataUrl.split(",")[1];
        const jpegBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const img = await outDoc.embedJpg(jpegBytes);

        const origVp = page.getViewport({ scale: 1 });
        const outPage = outDoc.addPage([origVp.width, origVp.height]);
        outPage.drawImage(img, { x: 0, y: 0, width: origVp.width, height: origVp.height });

        setProgress(Math.round((i / total) * 95));
      }

      setResult(await outDoc.save());
      setProgress(100);
      setStatus("done");
    } catch (e) {
      console.error(e);
      alert("Could not flatten this PDF. It may be encrypted or corrupted.");
      setStatus("ready");
    }
  }, [file]);

  const download = () => {
    if (!result || !file) return;
    const url = URL.createObjectURL(pdfBlob(result));
    Object.assign(document.createElement("a"), { href: url, download: file.name.replace(".pdf", "_flattened.pdf") }).click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setFile(null); setStatus("idle"); setResult(null); setProgress(0); };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-warm-100 border border-warm shadow-warm mb-5">
            <span className="text-2xl">🗜️</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Flatten PDF</h1>
          <p className="text-warm-500 text-lg">Bake annotations and form fields into the page permanently.</p>
        </motion.div>

        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-lg mt-0.5">ℹ️</span>
          <p className="text-sm text-amber-800">
            Flattening re-renders each page as an image. Form fields, annotations, and signatures become permanent and non-editable. File size may increase.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFiles} className="min-h-[220px]" />
            </motion.div>
          )}

          {(status === "ready" || status === "processing") && file && (
            <motion.div key="ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="bg-white border border-warm rounded-2xl p-4 flex items-center gap-3 shadow-warm">
                <div className="w-10 h-12 rounded-lg gradient-coral flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="16" viewBox="0 0 14 16" fill="none"><path d="M2 2h7l3 3v9H2V2z" fill="white" fillOpacity="0.9"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-warm-800 text-sm truncate">{file.name}</p>
                  <p className="text-xs text-warm-400 mt-0.5">{formatBytes(file.size)}</p>
                </div>
              </div>

              {status === "processing" && (
                <div className="space-y-2">
                  <ProgressBar value={progress} />
                  <p className="text-xs text-warm-400 text-center">Rendering pages…</p>
                </div>
              )}

              {status === "ready" && (
                <button onClick={flatten}
                  className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                  Flatten PDF
                </button>
              )}
              <button onClick={reset} className="w-full py-3 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors text-sm">
                Choose different file
              </button>
            </motion.div>
          )}

          {status === "done" && result && file && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-3 px-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-sm font-semibold">Flattened {pageCount} page{pageCount !== 1 ? "s" : ""} successfully</span>
              </div>
              <div className="flex gap-3">
                <button onClick={download} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-warm transition-all">
                  Download Flattened PDF
                </button>
                <button onClick={reset} className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  New
                </button>
              </div>
              <p className="text-center text-xs text-warm-400">{formatBytes(result.byteLength)}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-warm-400 mt-8 flex items-center justify-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Processed locally. Never uploaded.
        </p>
      </div>
    </main>
  );
}
