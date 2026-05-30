"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import { formatBytes } from "@/lib/utils";

type State = "idle" | "ready" | "done";

export default function ResizeImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [status, setStatus] = useState<State>("idle");
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      setOrigW(img.naturalWidth); setOrigH(img.naturalHeight);
      setWidth(img.naturalWidth); setHeight(img.naturalHeight);
      setStatus("ready");
    };
    img.src = url;
  }, []);

  const onWidthChange = (v: number) => {
    setWidth(v);
    if (lockAspect && origW) setHeight(Math.round(v * origH / origW));
  };
  const onHeightChange = (v: number) => {
    setHeight(v);
    if (lockAspect && origH) setWidth(Math.round(v * origW / origH));
  };

  const resize = useCallback(async () => {
    if (!file || !preview) return;
    const img = new Image();
    await new Promise<void>((res) => { img.onload = () => res(); img.src = preview; });
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), file.type || "image/jpeg", 0.92));
    setResultUrl(URL.createObjectURL(blob));
    setResultSize(blob.size);
    setStatus("done");
  }, [file, preview, width, height]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setPreview(""); setStatus("idle"); setResultUrl("");
  };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-coral shadow-warm mb-5">
            <span className="text-2xl">↔️</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Resize Image</h1>
          <p className="text-warm-500 text-lg">Change dimensions with optional aspect ratio lock. 100% local.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFile} accept="image/*" className="min-h-[220px]" label="Drop an image here" sublabel="JPG, PNG, WebP supported" />
            </motion.div>
          )}

          {status === "ready" && file && (
            <motion.div key="ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="bg-white border border-warm rounded-2xl p-4 flex items-center gap-3 shadow-warm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="preview" className="w-12 h-12 object-cover rounded-xl border border-warm flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-warm-800 text-sm truncate">{file.name}</p>
                  <p className="text-xs text-warm-400">{origW} × {origH}px · {formatBytes(file.size)}</p>
                </div>
                <button onClick={reset} className="text-warm-400 hover:text-warm-600 p-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="bg-white border border-warm rounded-2xl p-5 shadow-warm space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-warm-700">Dimensions</p>
                  <button
                    onClick={() => setLockAspect((v) => !v)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${lockAspect ? "bg-coral-50 border-coral-300 text-coral-600" : "bg-cream-100 border-warm text-warm-500"}`}
                  >
                    {lockAspect ? "🔒 Locked" : "🔓 Free"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-warm-500 block mb-1">Width (px)</label>
                    <input type="number" value={width} onChange={(e) => onWidthChange(+e.target.value)} min={1}
                      className="w-full border border-warm rounded-lg px-3 py-2 text-sm text-warm-800 bg-cream-50 focus:outline-none focus:border-coral-400" />
                  </div>
                  <div>
                    <label className="text-xs text-warm-500 block mb-1">Height (px)</label>
                    <input type="number" value={height} onChange={(e) => onHeightChange(+e.target.value)} min={1}
                      className="w-full border border-warm rounded-lg px-3 py-2 text-sm text-warm-800 bg-cream-50 focus:outline-none focus:border-coral-400" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[[1920,1080],[1280,720],[800,600],[400,400]].map(([w,h]) => (
                    <button key={`${w}x${h}`} onClick={() => { setWidth(w); setHeight(h); setLockAspect(false); }}
                      className="text-xs bg-cream-100 border border-warm text-warm-600 px-2.5 py-1 rounded-full hover:border-coral-300 transition-colors">
                      {w}×{h}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={resize} className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                Resize Image
              </button>
            </motion.div>
          )}

          {status === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-sm font-semibold">Resized to {width} × {height}px</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultUrl} alt="result" className="w-full rounded-2xl border border-warm shadow-warm object-contain max-h-64" />
              <p className="text-center text-xs text-warm-400">{formatBytes(resultSize)}</p>
              <div className="flex gap-3">
                <a href={resultUrl} download={file?.name.replace(/\.[^.]+$/, `_${width}x${height}.jpg`)}
                  className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all text-center">
                  Download
                </a>
                <button onClick={reset} className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  New image
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
