"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import { formatBytes } from "@/lib/utils";

type State = "idle" | "ready" | "done";

export default function BorderPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [padding, setPadding] = useState(40);
  const [color, setColor] = useState("#ffffff");
  const [status, setStatus] = useState<State>("idle");
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    setStatus("ready");
  }, [preview]);

  const apply = useCallback(async () => {
    if (!file || !preview) return;
    const img = new Image();
    await new Promise<void>((res) => { img.onload = () => res(); img.src = preview; });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth + padding * 2;
    canvas.height = img.naturalHeight + padding * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, padding, padding);
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.95));
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(URL.createObjectURL(blob));
    setResultSize(blob.size);
    setStatus("done");
  }, [file, preview, padding, color, resultUrl]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setPreview(""); setStatus("idle"); setResultUrl("");
  };

  const COLORS = ["#ffffff", "#000000", "#f5efe3", "#1a1714", "#cc785c", "#6366f1", "#10b981"];

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cream-200 border border-cream-400 shadow-warm mb-5">
            <span className="text-2xl">🖼️</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Add Border</h1>
          <p className="text-warm-500 text-lg">Add padding and a colored border around your image.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFile} accept="image/*" className="min-h-[220px]" label="Drop an image here" sublabel="JPG, PNG, WebP supported" />
            </motion.div>
          )}

          {(status === "ready" || status === "done") && file && (
            <motion.div key="edit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Live preview */}
              <div className="flex items-center justify-center min-h-48 rounded-2xl overflow-hidden border border-warm" style={{ background: "#e5e5e5" }}>
                <div style={{ padding: `${Math.min(padding / 4, 20)}px`, background: color, display: "inline-block" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={status === "done" ? resultUrl : preview} alt="preview" className="block max-h-48 max-w-full object-contain" />
                </div>
              </div>

              <div className="bg-white border border-warm rounded-2xl p-5 shadow-warm space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-warm-600">Border size</label>
                    <span className="text-xs text-warm-400">{padding}px</span>
                  </div>
                  <input type="range" min={10} max={200} step={10} value={padding} onChange={(e) => setPadding(+e.target.value)} className="w-full accent-coral-500" />
                </div>

                <div>
                  <label className="text-xs font-medium text-warm-600 block mb-2">Border color</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button key={c} onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${color === c ? "border-coral-500 scale-110" : "border-warm"}`}
                        style={{ background: c }} />
                    ))}
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-warm cursor-pointer" title="Custom color" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={apply} className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                  Apply Border
                </button>
                {status === "done" && (
                  <a href={resultUrl} download={file.name.replace(/\.[^.]+$/, "_bordered.jpg")}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-warm transition-all text-center text-sm flex items-center justify-center">
                    Download
                  </a>
                )}
                <button onClick={reset} className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  New
                </button>
              </div>
              {status === "done" && <p className="text-center text-xs text-warm-400">{formatBytes(resultSize)}</p>}
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
