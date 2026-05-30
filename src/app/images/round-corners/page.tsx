"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import { formatBytes } from "@/lib/utils";

type State = "idle" | "ready" | "done";
type Mode = "rounded" | "circle";

const CORNER_KEYS = ["tl", "tr", "br", "bl"] as const;
type CornerKey = typeof CORNER_KEYS[number];
const CORNER_LABELS: Record<CornerKey, string> = { tl: "Top Left", tr: "Top Right", br: "Bottom Right", bl: "Bottom Left" };

// Visual positions in a 2×2 grid
const CORNER_GRID: Record<CornerKey, { row: number; col: number }> = {
  tl: { row: 0, col: 0 }, tr: { row: 0, col: 1 },
  bl: { row: 1, col: 0 }, br: { row: 1, col: 1 },
};

export default function RoundCornersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [radius, setRadius] = useState(40);
  const [mode, setMode] = useState<Mode>("rounded");
  const [corners, setCorners] = useState<Record<CornerKey, boolean>>({ tl: true, tr: true, br: true, bl: true });
  // circle crop center as % of image (0–100)
  const [circlePos, setCirclePos] = useState({ x: 50, y: 50 });
  const [status, setStatus] = useState<State>("idle");
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const previewImgRef = useRef<HTMLImageElement>(null);
  const dragging = useRef(false);

  const toggleCorner = (k: CornerKey) => setCorners((c) => ({ ...c, [k]: !c[k] }));
  const allOn = CORNER_KEYS.every((k) => corners[k]);
  const toggleAll = () => setCorners({ tl: !allOn, tr: !allOn, br: !allOn, bl: !allOn });

  const handleFile = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    setCirclePos({ x: 50, y: 50 });
    setStatus("ready");
  }, [preview]);

  const getPosFromEvent = (e: React.MouseEvent | React.TouchEvent, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100)),
    };
  };

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    dragging.current = true;
    const el = (e.currentTarget as HTMLElement);
    setCirclePos(getPosFromEvent(e, el));
  };
  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging.current) return;
    setCirclePos(getPosFromEvent(e, e.currentTarget as HTMLElement));
  };
  const onPointerUp = () => { dragging.current = false; };

  // CSS border-radius preview string
  const previewRadius = mode === "circle" ? "50%" :
    `${corners.tl ? radius * 0.4 : 0}px ${corners.tr ? radius * 0.4 : 0}px ${corners.br ? radius * 0.4 : 0}px ${corners.bl ? radius * 0.4 : 0}px`;

  const apply = useCallback(async () => {
    if (!file || !preview) return;
    const img = new Image();
    await new Promise<void>((res) => { img.onload = () => res(); img.src = preview; });
    const { naturalWidth: w, naturalHeight: h } = img;
    const r = Math.min(w, h) / 2;
    const canvas = document.createElement("canvas");

    if (mode === "circle") {
      const size = r * 2;
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.beginPath();
      ctx.arc(r, r, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const cx = (circlePos.x / 100) * w;
      const cy = (circlePos.y / 100) * h;
      ctx.drawImage(img, cx - r, cy - r, size, size, 0, 0, size, size);
    } else {
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      const rv = (radius / 100) * Math.min(w, h);
      const tl = corners.tl ? rv : 0;
      const tr = corners.tr ? rv : 0;
      const br = corners.br ? rv : 0;
      const bl = corners.bl ? rv : 0;
      ctx.beginPath();
      ctx.moveTo(tl, 0);
      ctx.lineTo(w - tr, 0); ctx.arcTo(w, 0, w, tr, tr);
      ctx.lineTo(w, h - br); ctx.arcTo(w, h, w - br, h, br);
      ctx.lineTo(bl, h); ctx.arcTo(0, h, 0, h - bl, bl);
      ctx.lineTo(0, tl); ctx.arcTo(0, 0, tl, 0, tl);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0);
    }

    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(URL.createObjectURL(blob));
    setResultSize(blob.size);
    setStatus("done");
  }, [file, preview, radius, mode, corners, circlePos, resultUrl]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setPreview(""); setStatus("idle"); setResultUrl("");
  };

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 shadow-warm mb-5">
            <span className="text-2xl">⬜</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Round Corners</h1>
          <p className="text-warm-500 text-lg">Add rounded corners or make your image a perfect circle.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFile} accept="image/*" className="min-h-[220px]" label="Drop an image here" sublabel="JPG, PNG, WebP supported" />
            </motion.div>
          )}

          {(status === "ready" || status === "done") && file && (
            <motion.div key="edit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Preview */}
              {mode === "circle" && status !== "done" ? (
                <div
                  className="relative flex items-center justify-center min-h-48 rounded-2xl overflow-hidden border border-warm bg-[#e5e5e5] cursor-crosshair select-none"
                  onMouseDown={onPointerDown}
                  onMouseMove={onPointerMove}
                  onMouseUp={onPointerUp}
                  onMouseLeave={onPointerUp}
                  onTouchStart={onPointerDown}
                  onTouchMove={onPointerMove}
                  onTouchEnd={onPointerUp}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img ref={previewImgRef} src={preview} alt="preview" className="block max-h-64 max-w-full object-contain" draggable={false} />
                  {/* Circle overlay */}
                  <div
                    className="absolute pointer-events-none border-4 border-white shadow-lg"
                    style={{
                      borderRadius: "50%",
                      width: "50%",
                      aspectRatio: "1",
                      left: `${circlePos.x}%`,
                      top: `${circlePos.y}%`,
                      transform: "translate(-50%, -50%)",
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                    }}
                  />
                  <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white font-medium pointer-events-none drop-shadow">
                    Click or drag to reposition
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-48 rounded-2xl overflow-hidden border border-warm bg-[#e5e5e5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={status === "done" ? resultUrl : preview}
                    alt="preview"
                    className="block max-h-48 max-w-full object-contain"
                    style={{ borderRadius: previewRadius }}
                  />
                </div>
              )}

              <div className="bg-white border border-warm rounded-2xl p-5 shadow-warm space-y-4">
                {/* Mode toggle */}
                <div className="flex items-center gap-3">
                  {(["rounded", "circle"] as Mode[]).map((m) => (
                    <button key={m} onClick={() => setMode(m)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 capitalize transition-all ${mode === m ? "border-coral-500 bg-coral-50 text-coral-700" : "border-warm text-warm-600"}`}>
                      {m}
                    </button>
                  ))}
                </div>

                {mode === "rounded" && (
                  <>
                    {/* Radius slider */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-medium text-warm-600">Corner radius</label>
                        <span className="text-xs text-warm-400">{radius}%</span>
                      </div>
                      <input type="range" min={5} max={50} step={5} value={radius} onChange={(e) => setRadius(+e.target.value)} className="w-full accent-coral-500" />
                    </div>

                    {/* Corner selector */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-warm-600">Which corners</label>
                        <button onClick={toggleAll} className="text-xs text-coral-500 hover:text-coral-700 font-semibold transition-colors">
                          {allOn ? "Deselect all" : "Select all"}
                        </button>
                      </div>

                      {/* 2×2 grid matching image corners */}
                      <div className="grid grid-cols-2 gap-2 max-w-[200px]">
                        {CORNER_KEYS.map((k) => {
                          const { row, col } = CORNER_GRID[k];
                          const borderRadius =
                            k === "tl" ? "rounded-tl-xl" :
                            k === "tr" ? "rounded-tr-xl" :
                            k === "br" ? "rounded-br-xl" : "rounded-bl-xl";
                          return (
                            <button
                              key={k}
                              onClick={() => toggleCorner(k)}
                              style={{ gridRow: row + 1, gridColumn: col + 1 }}
                              className={`py-2 px-3 text-xs font-semibold border-2 transition-all ${borderRadius} ${
                                corners[k]
                                  ? "border-coral-500 bg-coral-50 text-coral-700"
                                  : "border-warm text-warm-500 bg-white hover:bg-cream-100"
                              }`}
                            >
                              {CORNER_LABELS[k]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={apply} className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                  Apply
                </button>
                {status === "done" && (
                  <a href={resultUrl} download={file.name.replace(/\.[^.]+$/, "_rounded.png")}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-warm transition-all text-center text-sm flex items-center justify-center">
                    Download PNG
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
