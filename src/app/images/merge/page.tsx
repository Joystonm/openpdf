"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import { formatBytes } from "@/lib/utils";

type Layout = "horizontal" | "vertical" | "grid";
type State = "idle" | "ready" | "done";

interface ImgItem { file: File; preview: string; }

export default function MergeImagesPage() {
  const [images, setImages] = useState<ImgItem[]>([]);
  const [layout, setLayout] = useState<Layout>("horizontal");
  const [gap, setGap] = useState(0);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [status, setStatus] = useState<State>("idle");
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);

  const addImages = useCallback((files: File[]) => {
    const items = files.filter((f) => f.type.startsWith("image/")).map((f) => ({
      file: f, preview: URL.createObjectURL(f),
    }));
    setImages((p) => [...p, ...items]);
    setStatus("ready");
  }, []);

  const remove = (i: number) => {
    URL.revokeObjectURL(images[i].preview);
    setImages((p) => { const n = [...p]; n.splice(i, 1); return n; });
  };

  const merge = useCallback(async () => {
    if (images.length < 2) return;

    const loaded = await Promise.all(images.map((item) => new Promise<HTMLImageElement>((res) => {
      const img = new Image();
      img.onload = () => res(img);
      img.src = item.preview;
    })));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    if (layout === "horizontal") {
      const h = Math.max(...loaded.map((i) => i.naturalHeight));
      const w = loaded.reduce((a, i) => a + i.naturalWidth, 0) + gap * (loaded.length - 1);
      canvas.width = w; canvas.height = h;
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, w, h);
      let x = 0;
      loaded.forEach((img) => {
        ctx.drawImage(img, x, Math.round((h - img.naturalHeight) / 2));
        x += img.naturalWidth + gap;
      });
    } else if (layout === "vertical") {
      const w = Math.max(...loaded.map((i) => i.naturalWidth));
      const h = loaded.reduce((a, i) => a + i.naturalHeight, 0) + gap * (loaded.length - 1);
      canvas.width = w; canvas.height = h;
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, w, h);
      let y = 0;
      loaded.forEach((img) => {
        ctx.drawImage(img, Math.round((w - img.naturalWidth) / 2), y);
        y += img.naturalHeight + gap;
      });
    } else {
      // Grid: 2 columns
      const cols = 2;
      const rows = Math.ceil(loaded.length / cols);
      const cellW = Math.max(...loaded.map((i) => i.naturalWidth));
      const cellH = Math.max(...loaded.map((i) => i.naturalHeight));
      canvas.width = cellW * cols + gap * (cols - 1);
      canvas.height = cellH * rows + gap * (rows - 1);
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
      loaded.forEach((img, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        ctx.drawImage(img, col * (cellW + gap), row * (cellH + gap));
      });
    }

    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.95));
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(URL.createObjectURL(blob));
    setResultSize(blob.size);
    setStatus("done");
  }, [images, layout, gap, bgColor, resultUrl]);

  const reset = () => {
    images.forEach((i) => URL.revokeObjectURL(i.preview));
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setImages([]); setStatus("idle"); setResultUrl("");
  };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cream-200 border border-cream-400 shadow-warm mb-5">
            <span className="text-2xl">🔗</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Merge Images</h1>
          <p className="text-warm-500 text-lg">Combine images side-by-side, stacked, or in a grid.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "done" ? (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-sm font-semibold">{images.length} images merged</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultUrl} alt="result" className="w-full rounded-2xl border border-warm shadow-warm object-contain max-h-64" />
              <p className="text-center text-xs text-warm-400">{formatBytes(resultSize)}</p>
              <div className="flex gap-3">
                <a href={resultUrl} download="merged.jpg"
                  className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all text-center">
                  Download
                </a>
                <button onClick={reset} className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  Start over
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <DropZone onFiles={addImages} accept="image/*" multiple className="min-h-[140px]"
                label={images.length > 0 ? "Add more images" : "Drop images here"}
                sublabel={images.length > 0 ? `${images.length} image${images.length > 1 ? "s" : ""} added` : "JPG, PNG, WebP · multiple files"} />

              {images.length > 0 && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {images.map((item, i) => (
                      <div key={i} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.preview} alt={item.file.name} className="w-16 h-16 object-cover rounded-xl border border-warm" />
                        <button onClick={() => remove(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white border border-warm rounded-2xl p-5 shadow-warm space-y-4">
                    <div>
                      <p className="text-xs font-medium text-warm-600 mb-2">Layout</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(["horizontal","vertical","grid"] as Layout[]).map((l) => (
                          <button key={l} onClick={() => setLayout(l)}
                            className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all capitalize ${layout === l ? "border-coral-400 bg-coral-50 text-coral-700" : "border-warm bg-cream-50 text-warm-600 hover:border-coral-200"}`}>
                            {l === "horizontal" ? "↔ Side by side" : l === "vertical" ? "↕ Stacked" : "⊞ Grid"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between mb-1"><label className="text-xs font-medium text-warm-600">Gap</label><span className="text-xs text-warm-400">{gap}px</span></div>
                        <input type="range" min={0} max={40} step={4} value={gap} onChange={(e) => setGap(+e.target.value)} className="w-full accent-coral-500" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-warm-600 block mb-1.5">Background</label>
                        <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                          className="w-10 h-8 rounded border border-warm cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {images.length >= 2 && (
                    <button onClick={merge} className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                      Merge {images.length} images
                    </button>
                  )}
                  {images.length < 2 && (
                    <p className="text-center text-sm text-warm-400">Add at least 2 images to merge</p>
                  )}
                </>
              )}
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
