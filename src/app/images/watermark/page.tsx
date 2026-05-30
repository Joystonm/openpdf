"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import { formatBytes } from "@/lib/utils";

type State = "idle" | "ready" | "done";
type Position = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

const POSITIONS: Position[] = ["center", "top-left", "top-right", "bottom-left", "bottom-right"];

export default function WatermarkImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [text, setText] = useState("© My Brand");
  const [opacity, setOpacity] = useState(0.4);
  const [fontSize, setFontSize] = useState(5); // % of image width
  const [position, setPosition] = useState<Position>("center");
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
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const size = Math.round(img.naturalWidth * fontSize / 100);
    ctx.font = `bold ${size}px Arial`;
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const tw = ctx.measureText(text).width;
    const pad = size;
    const positions: Record<Position, [number, number]> = {
      "center":       [img.naturalWidth / 2, img.naturalHeight / 2],
      "top-left":     [pad + tw / 2, pad + size / 2],
      "top-right":    [img.naturalWidth - pad - tw / 2, pad + size / 2],
      "bottom-left":  [pad + tw / 2, img.naturalHeight - pad - size / 2],
      "bottom-right": [img.naturalWidth - pad - tw / 2, img.naturalHeight - pad - size / 2],
    };
    const [x, y] = positions[position];
    ctx.fillText(text, x, y);

    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.95));
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(URL.createObjectURL(blob));
    setResultSize(blob.size);
    setStatus("done");
  }, [file, preview, text, opacity, fontSize, position, color, resultUrl]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setPreview(""); setStatus("idle"); setResultUrl("");
  };

  // CSS preview filter
  const previewStyle = {
    position: "relative" as const,
  };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-100 border border-purple-200 shadow-warm mb-5">
            <span className="text-2xl">💧</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Watermark Image</h1>
          <p className="text-warm-500 text-lg">Add a text watermark with full control over style and position.</p>
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
              <div className="relative bg-cream-100 border border-warm rounded-2xl overflow-hidden flex items-center justify-center min-h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={status === "done" ? resultUrl : preview} alt="preview" className="max-w-full max-h-64 object-contain" />
                {status === "ready" && (
                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none
                    ${position === "top-left" ? "items-start justify-start p-4" :
                      position === "top-right" ? "items-start justify-end p-4" :
                      position === "bottom-left" ? "items-end justify-start p-4" :
                      position === "bottom-right" ? "items-end justify-end p-4" : ""}`}>
                    <span className="font-bold text-sm select-none" style={{ color, opacity, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                      {text || "Watermark"}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white border border-warm rounded-2xl p-5 shadow-warm space-y-4">
                <div>
                  <label className="text-xs font-medium text-warm-600 block mb-1.5">Text</label>
                  <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Your watermark text"
                    className="w-full border border-warm rounded-lg px-3 py-2 text-sm bg-cream-50 focus:outline-none focus:border-coral-400" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between mb-1"><label className="text-xs font-medium text-warm-600">Opacity</label><span className="text-xs text-warm-400">{Math.round(opacity * 100)}%</span></div>
                    <input type="range" min={0.05} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(+e.target.value)} className="w-full accent-coral-500" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1"><label className="text-xs font-medium text-warm-600">Size</label><span className="text-xs text-warm-400">{fontSize}%</span></div>
                    <input type="range" min={2} max={15} step={1} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} className="w-full accent-coral-500" />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-xs font-medium text-warm-600 block mb-1.5">Color</label>
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                      className="w-10 h-8 rounded border border-warm cursor-pointer" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-warm-600 block mb-1.5">Position</label>
                    <select value={position} onChange={(e) => setPosition(e.target.value as Position)}
                      className="w-full border border-warm rounded-lg px-3 py-2 text-sm bg-cream-50 focus:outline-none focus:border-coral-400">
                      {POSITIONS.map((p) => <option key={p} value={p}>{p.replace("-", " ")}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={apply} className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                  Apply Watermark
                </button>
                {status === "done" && (
                  <a href={resultUrl} download={file.name.replace(/\.[^.]+$/, "_watermarked.jpg")}
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
