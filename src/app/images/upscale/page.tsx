"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import { formatBytes } from "@/lib/utils";

type Scale = 2 | 3 | 4;
type State = "idle" | "ready" | "processing" | "done";

// Multi-step canvas upscale — avoids pixelation vs single-step
async function upscaleCanvas(src: string, scale: Scale): Promise<Blob> {
  const img = new Image();
  await new Promise<void>((res) => { img.onload = () => res(); img.src = src; });

  let current: HTMLCanvasElement | null = null;
  let cw = img.naturalWidth;
  let ch = img.naturalHeight;

  // Step up in 1.5× increments to reduce aliasing
  const steps = Math.ceil(Math.log(scale) / Math.log(1.5));
  const stepScale = Math.pow(scale, 1 / steps);

  for (let i = 0; i < steps; i++) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(cw * stepScale);
    canvas.height = Math.round(ch * stepScale);
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    if (current) ctx.drawImage(current, 0, 0, canvas.width, canvas.height);
    else ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    cw = canvas.width;
    ch = canvas.height;
    current = canvas;
  }

  return new Promise<Blob>((res) => current!.toBlob((b) => res(b!), "image/png"));
}

export default function UpscalePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [scale, setScale] = useState<Scale>(2);
  const [status, setStatus] = useState<State>("idle");
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const handleFile = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(f);
    setPreview(url);
    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    setStatus("ready");
  }, [preview]);

  const process = useCallback(async () => {
    if (!file || !preview) return;
    setStatus("processing");
    try {
      const blob = await upscaleCanvas(preview, scale);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      setStatus("done");
    } catch {
      setStatus("ready");
    }
  }, [file, preview, scale, resultUrl]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setPreview(""); setStatus("idle"); setResultUrl("");
  };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-100 border border-purple-200 shadow-warm mb-5">
            <span className="text-2xl">🔍</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Upscale Image</h1>
          <p className="text-warm-500 text-lg">Increase image resolution using high-quality multi-step upscaling.</p>
          <div className="inline-flex items-center gap-1.5 mt-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Instant · 100% local · No model download
          </div>
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
                  <p className="text-xs text-warm-400">{dims.w} × {dims.h}px · {formatBytes(file.size)}</p>
                </div>
                <button onClick={reset} className="text-warm-400 hover:text-warm-600 p-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="bg-white border border-warm rounded-2xl p-5 shadow-warm">
                <p className="text-sm font-medium text-warm-700 mb-3">Scale factor</p>
                <div className="grid grid-cols-3 gap-2">
                  {([2, 3, 4] as Scale[]).map((s) => (
                    <button key={s} onClick={() => setScale(s)}
                      className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${scale === s ? "border-purple-400 bg-purple-50 text-purple-700" : "border-warm bg-cream-50 text-warm-600 hover:border-purple-200"}`}>
                      <span className="block text-lg">{s}×</span>
                      <span className="text-xs font-normal opacity-70">{dims.w ? `${dims.w * s} × ${dims.h * s}` : ""}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={process} className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                Upscale {scale}×
              </button>
            </motion.div>
          )}

          {status === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-4">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-500 mx-auto" />
              <p className="text-sm text-warm-500">Upscaling…</p>
            </motion.div>
          )}

          {status === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-sm font-semibold">Upscaled to {dims.w * scale} × {dims.h * scale}px</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-warm-400 text-center">Original</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="original" className="w-full rounded-xl border border-warm object-contain max-h-52" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-warm-400 text-center">Upscaled {scale}×</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resultUrl} alt="result" className="w-full rounded-xl border border-warm object-contain max-h-52" />
                </div>
              </div>
              <p className="text-center text-xs text-warm-400">{formatBytes(resultSize)}</p>
              <div className="flex gap-3">
                <a href={resultUrl} download={file?.name.replace(/\.[^.]+$/, `_${scale}x.png`)}
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
          Processed locally. Never uploaded.
        </p>
      </div>
    </main>
  );
}
