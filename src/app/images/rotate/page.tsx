"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import { formatBytes } from "@/lib/utils";

type State = "idle" | "ready" | "done";

export default function RotatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [angle, setAngle] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
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

    const rad = (angle * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * cos + img.naturalHeight * sin);
    canvas.height = Math.round(img.naturalWidth * sin + img.naturalHeight * cos);

    const ctx = canvas.getContext("2d")!;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.95));
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(URL.createObjectURL(blob));
    setResultSize(blob.size);
    setStatus("done");
  }, [file, preview, angle, flipH, flipV, resultUrl]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setPreview(""); setStatus("idle"); setResultUrl(""); setAngle(0); setFlipH(false); setFlipV(false);
  };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 border border-indigo-200 shadow-warm mb-5">
            <span className="text-2xl">🔃</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Rotate & Flip</h1>
          <p className="text-warm-500 text-lg">Rotate by any angle, flip horizontally or vertically.</p>
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
              <div className="bg-cream-100 border border-warm rounded-2xl overflow-hidden flex items-center justify-center min-h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={status === "done" ? resultUrl : preview}
                  alt="preview"
                  className="max-w-full max-h-64 object-contain transition-transform duration-300"
                  style={{ transform: `rotate(${angle}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})` }}
                />
              </div>

              <div className="bg-white border border-warm rounded-2xl p-5 shadow-warm space-y-4">
                {/* Quick rotate */}
                <div>
                  <p className="text-xs font-medium text-warm-600 mb-2">Quick rotate</p>
                  <div className="flex gap-2">
                    {[-90, 90, 180].map((a) => (
                      <button key={a} onClick={() => setAngle((v) => (v + a + 360) % 360)}
                        className="flex-1 py-2 text-sm border border-warm rounded-lg bg-cream-50 hover:border-coral-300 text-warm-700 font-medium transition-colors">
                        {a > 0 ? `+${a}°` : `${a}°`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom angle */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-warm-600">Custom angle</label>
                    <span className="text-xs text-warm-500">{angle}°</span>
                  </div>
                  <input type="range" min={0} max={359} value={angle} onChange={(e) => setAngle(+e.target.value)}
                    className="w-full accent-coral-500" />
                </div>

                {/* Flip */}
                <div>
                  <p className="text-xs font-medium text-warm-600 mb-2">Flip</p>
                  <div className="flex gap-2">
                    <button onClick={() => setFlipH((v) => !v)}
                      className={`flex-1 py-2 text-sm border-2 rounded-lg font-medium transition-all ${flipH ? "border-coral-400 bg-coral-50 text-coral-700" : "border-warm bg-cream-50 text-warm-600 hover:border-coral-200"}`}>
                      ↔ Horizontal
                    </button>
                    <button onClick={() => setFlipV((v) => !v)}
                      className={`flex-1 py-2 text-sm border-2 rounded-lg font-medium transition-all ${flipV ? "border-coral-400 bg-coral-50 text-coral-700" : "border-warm bg-cream-50 text-warm-600 hover:border-coral-200"}`}>
                      ↕ Vertical
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={apply} className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                  Apply
                </button>
                {status === "done" && (
                  <a href={resultUrl} download={file.name.replace(/\.[^.]+$/, "_rotated.jpg")}
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
