"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import { formatBytes } from "@/lib/utils";

interface ImageFile { file: File; preview: string; }
type State = "idle" | "ready" | "processing" | "done";

interface Result { name: string; url: string; originalSize: number; compressedSize: number; }

export default function CompressImagePage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [quality, setQuality] = useState(80);
  const [status, setStatus] = useState<State>("idle");
  const [results, setResults] = useState<Result[]>([]);
  const [progress, setProgress] = useState(0);

  const addImages = useCallback((files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/")).map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
    }));
    setImages((p) => [...p, ...imgs]);
    setStatus("ready");
  }, []);

  const compress = useCallback(async () => {
    if (!images.length) return;
    setStatus("processing");
    setProgress(0);
    const out: Result[] = [];

    for (let i = 0; i < images.length; i++) {
      const { file, preview } = images[i];
      const img = new Image();
      await new Promise<void>((res) => { img.onload = () => res(); img.src = preview; });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.drawImage(img, 0, 0);

      const blob = await new Promise<Blob>((res) =>
        canvas.toBlob((b) => res(b!), "image/jpeg", quality / 100)
      );
      const url = URL.createObjectURL(blob);
      out.push({ name: file.name.replace(/\.[^.]+$/, "_compressed.jpg"), url, originalSize: file.size, compressedSize: blob.size });
      setProgress(Math.round(((i + 1) / images.length) * 100));
    }

    setResults(out);
    setStatus("done");
  }, [images, quality]);

  const downloadAll = () => {
    results.forEach(({ name, url }) => {
      const a = document.createElement("a");
      a.href = url; a.download = name; a.click();
    });
  };

  const reset = () => {
    images.forEach((i) => URL.revokeObjectURL(i.preview));
    results.forEach((r) => URL.revokeObjectURL(r.url));
    setImages([]); setResults([]); setStatus("idle");
  };

  const totalSaved = results.reduce((a, r) => a + (r.originalSize - r.compressedSize), 0);
  const avgReduction = results.length
    ? Math.round(results.reduce((a, r) => a + ((r.originalSize - r.compressedSize) / r.originalSize) * 100, 0) / results.length)
    : 0;

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-coral shadow-warm mb-5">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Compress Image</h1>
          <p className="text-warm-500 text-lg">Reduce image file size. Batch supported. 100% local.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={addImages} accept="image/*" multiple className="min-h-[220px]" label="Drop images here" sublabel="JPG, PNG, WebP · multiple files supported" />
            </motion.div>
          )}

          {(status === "ready" || status === "processing") && (
            <motion.div key="ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <DropZone onFiles={addImages} accept="image/*" multiple className="min-h-[80px]" label="Add more images" sublabel={`${images.length} image${images.length > 1 ? "s" : ""} ready`} />

              {status === "ready" && (
                <div className="bg-white border border-warm rounded-2xl p-5 shadow-warm space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-warm-700">Quality: {quality}%</label>
                    <span className="text-xs text-warm-400">{quality >= 80 ? "High" : quality >= 60 ? "Balanced" : "Small"}</span>
                  </div>
                  <input type="range" min={20} max={95} step={5} value={quality} onChange={(e) => setQuality(+e.target.value)} className="w-full accent-coral-500" />
                  <div className="flex justify-between text-xs text-warm-400">
                    <span>Smallest</span><span>Best quality</span>
                  </div>
                </div>
              )}

              {status === "processing" && <ProgressBar value={progress} />}

              {status === "ready" && (
                <button onClick={compress} className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                  Compress {images.length} image{images.length > 1 ? "s" : ""}
                </button>
              )}
            </motion.div>
          )}

          {status === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-warm">
                <div className="flex items-center gap-2 text-emerald-700 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="font-semibold text-sm">Compression complete</span>
                </div>
                <div className="flex gap-6">
                  <div><p className="text-2xl font-bold text-emerald-600 font-serif">{avgReduction}%</p><p className="text-xs text-warm-500">avg reduction</p></div>
                  <div><p className="text-2xl font-bold text-warm-800 font-serif">{formatBytes(totalSaved)}</p><p className="text-xs text-warm-500">total saved</p></div>
                </div>
              </div>

              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="bg-white border border-warm rounded-xl p-3 flex items-center gap-3 shadow-warm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.url} alt={r.name} className="w-10 h-10 object-cover rounded-lg border border-warm flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warm-800 truncate">{r.name}</p>
                      <p className="text-xs text-warm-400">{formatBytes(r.originalSize)} → <span className="text-emerald-600 font-medium">{formatBytes(r.compressedSize)}</span></p>
                    </div>
                    <a href={r.url} download={r.name} className="text-xs text-coral-500 hover:text-coral-700 font-medium">Download</a>
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
                  New images
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-warm-400 mt-8 flex items-center justify-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Processed locally in your browser. Never uploaded.
        </p>
      </div>
    </main>
  );
}
