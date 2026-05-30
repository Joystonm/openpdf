"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { PDFDocument } from "pdf-lib";
import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import { formatBytes, pdfBlob } from "@/lib/utils";

interface ImageItem {
  id: string;
  file: File;
  preview: string;
}

type State = "idle" | "ready" | "processing" | "done";

export default function JpgToPdfPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [status, setStatus] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);

  const addImages = useCallback((files: File[]) => {
    const items = files
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        file: f,
        preview: URL.createObjectURL(f),
      }));
    setImages((prev) => [...prev, ...items]);
    setStatus("ready");
  }, []);

  const remove = (id: string) => {
    setImages((prev) => {
      const next = prev.filter((i) => i.id !== id);
      if (next.length === 0) setStatus("idle");
      return next;
    });
  };

  const convert = useCallback(async () => {
    if (images.length === 0) return;
    setStatus("processing");
    setProgress(0);

    try {
      const pdf = await PDFDocument.create();

      for (let i = 0; i < images.length; i++) {
        const buf = await images[i].file.arrayBuffer();
        const type = images[i].file.type;
        let img;
        if (type === "image/jpeg" || type === "image/jpg") {
          img = await pdf.embedJpg(buf);
        } else {
          img = await pdf.embedPng(buf);
        }
        const page = pdf.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        setProgress(Math.round(((i + 1) / images.length) * 90));
      }

      const bytes = await pdf.save();
      setProgress(100);
      setResult(bytes);
      setStatus("done");
    } catch {
      setStatus("ready");
      alert("Failed to convert images.");
    }
  }, [images]);

  const download = () => {
    if (!result) return;
    const blob = pdfBlob(result);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "images.pdf"; a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    images.forEach((i) => URL.revokeObjectURL(i.preview));
    setImages([]); setStatus("idle"); setResult(null);
  };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-warm mb-5">
            <span className="text-2xl">🖼️</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">JPG to PDF</h1>
          <p className="text-warm-500 text-lg">Turn images into a PDF. Drag to reorder pages.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "done" ? (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-sm font-semibold">{images.length} image{images.length > 1 ? "s" : ""} converted to PDF</span>
              </div>
              {result && (
                <div className="bg-white border border-warm rounded-2xl p-5 shadow-warm text-center">
                  <p className="font-semibold text-warm-800">images.pdf</p>
                  <p className="text-xs text-warm-400 mt-1">{formatBytes(result.byteLength)}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={download} className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF
                </button>
                <button onClick={reset} className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  Start over
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <DropZone
                onFiles={addImages}
                accept="image/*"
                multiple
                className="min-h-[140px]"
                label={images.length > 0 ? "Add more images" : "Drop images here"}
                sublabel="JPG, PNG, WebP supported · multiple files"
              />

              {images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-warm-700">{images.length} image{images.length > 1 ? "s" : ""} · drag to reorder</p>
                  <Reorder.Group axis="y" values={images} onReorder={setImages} className="space-y-2">
                    {images.map((item, i) => (
                      <Reorder.Item key={item.id} value={item} className="cursor-grab active:cursor-grabbing">
                        <motion.div layout className="bg-white border border-warm rounded-xl p-3 flex items-center gap-3 shadow-warm">
                          <span className="text-xs text-warm-300 font-mono w-4 text-center">{i + 1}</span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.preview} alt={item.file.name} className="w-10 h-10 object-cover rounded-lg border border-warm flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-warm-800 truncate">{item.file.name}</p>
                            <p className="text-xs text-warm-400">{formatBytes(item.file.size)}</p>
                          </div>
                          <button onClick={() => remove(item.id)} className="text-warm-300 hover:text-warm-600 p-1">
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

              {images.length > 0 && status !== "processing" && (
                <button onClick={convert} className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                  Convert to PDF
                </button>
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
