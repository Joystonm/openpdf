"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import { formatBytes } from "@/lib/utils";

type State = "idle" | "ready" | "done";

const PRESETS = [
  { label: "Free", ratio: null },
  { label: "1:1", ratio: 1 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "16:9", ratio: 16 / 9 },
  { label: "3:4", ratio: 3 / 4 },
  { label: "9:16", ratio: 9 / 16 },
];

interface Rect { x: number; y: number; w: number; h: number; }

export default function CropPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState("");
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [status, setStatus] = useState<State>("idle");
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const [preset, setPreset] = useState<number | null>(null); // aspect ratio or null=free

  // Crop rect in display-space (0..1 fractions of displayed image)
  const [crop, setCrop] = useState<Rect>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragState = useRef<{
    type: "move" | "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r";
    startX: number; startY: number;
    startCrop: Rect;
  } | null>(null);

  const handleFile = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    const url = URL.createObjectURL(f);
    setImgSrc(url);
    const img = new Image();
    img.onload = () => { setNaturalW(img.naturalWidth); setNaturalH(img.naturalHeight); };
    img.src = url;
    setCrop({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
    setPreset(null);
    setStatus("ready");
  }, [imgSrc]);

  // Apply aspect ratio preset to current crop
  const applyPreset = (ratio: number | null) => {
    setPreset(ratio);
    if (!ratio) return;
    const cx = crop.x + crop.w / 2;
    const cy = crop.y + crop.h / 2;
    const maxW = Math.min(crop.w, crop.h * ratio);
    const maxH = maxW / ratio;
    setCrop({
      x: Math.max(0, cx - maxW / 2),
      y: Math.max(0, cy - maxH / 2),
      w: maxW,
      h: maxH,
    });
  };

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const getRelativePos = (e: MouseEvent | TouchEvent) => {
    const el = containerRef.current;
    if (!el) return { rx: 0, ry: 0 };
    const rect = el.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { rx: (clientX - rect.left) / rect.width, ry: (clientY - rect.top) / rect.height };
  };

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent, type: typeof dragState.current extends null ? never : NonNullable<typeof dragState.current>["type"]) => {
    e.preventDefault();
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragState.current = {
      type,
      startX: (clientX - rect.left) / rect.width,
      startY: (clientY - rect.top) / rect.height,
      startCrop: { ...crop },
    };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragState.current) return;
      const { rx, ry } = getRelativePos(e);
      const { type, startX, startY, startCrop: sc } = dragState.current;
      const dx = rx - startX;
      const dy = ry - startY;
      const MIN = 0.05;

      let { x, y, w, h } = sc;

      if (type === "move") {
        x = clamp(sc.x + dx, 0, 1 - sc.w);
        y = clamp(sc.y + dy, 0, 1 - sc.h);
      } else if (type === "tl") {
        const nx = clamp(sc.x + dx, 0, sc.x + sc.w - MIN);
        const ny = clamp(sc.y + dy, 0, sc.y + sc.h - MIN);
        w = sc.w - (nx - sc.x); h = sc.h - (ny - sc.y); x = nx; y = ny;
      } else if (type === "tr") {
        const ny = clamp(sc.y + dy, 0, sc.y + sc.h - MIN);
        w = clamp(sc.w + dx, MIN, 1 - sc.x); h = sc.h - (ny - sc.y); y = ny;
      } else if (type === "bl") {
        const nx = clamp(sc.x + dx, 0, sc.x + sc.w - MIN);
        w = sc.w - (nx - sc.x); h = clamp(sc.h + dy, MIN, 1 - sc.y); x = nx;
      } else if (type === "br") {
        w = clamp(sc.w + dx, MIN, 1 - sc.x);
        h = clamp(sc.h + dy, MIN, 1 - sc.y);
      } else if (type === "t") {
        const ny = clamp(sc.y + dy, 0, sc.y + sc.h - MIN);
        h = sc.h - (ny - sc.y); y = ny;
      } else if (type === "b") {
        h = clamp(sc.h + dy, MIN, 1 - sc.y);
      } else if (type === "l") {
        const nx = clamp(sc.x + dx, 0, sc.x + sc.w - MIN);
        w = sc.w - (nx - sc.x); x = nx;
      } else if (type === "r") {
        w = clamp(sc.w + dx, MIN, 1 - sc.x);
      }

      // Enforce aspect ratio if preset
      if (preset && type !== "move") {
        if (["tl","tr","bl","br","r","l"].includes(type)) h = w / preset;
        else w = h * preset;
        // Re-clamp after ratio enforcement
        w = Math.min(w, 1 - x); h = Math.min(h, 1 - y);
      }

      setCrop({ x, y, w, h });
    };

    const onUp = () => { dragState.current = null; };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [crop, preset]);

  // Start new crop by clicking on the backdrop
  const onBackdropDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;
    setCrop({ x: rx, y: ry, w: 0.001, h: 0.001 });
    dragState.current = { type: "br", startX: rx, startY: ry, startCrop: { x: rx, y: ry, w: 0.001, h: 0.001 } };
  };

  const doCrop = useCallback(async () => {
    if (!file || !imgSrc) return;
    const img = new Image();
    await new Promise<void>((res) => { img.onload = () => res(); img.src = imgSrc; });
    const px = Math.round(crop.x * naturalW);
    const py = Math.round(crop.y * naturalH);
    const pw = Math.round(crop.w * naturalW);
    const ph = Math.round(crop.h * naturalH);
    const canvas = document.createElement("canvas");
    canvas.width = pw; canvas.height = ph;
    canvas.getContext("2d")!.drawImage(img, px, py, pw, ph, 0, 0, pw, ph);
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.95));
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(URL.createObjectURL(blob));
    setResultSize(blob.size);
    setStatus("done");
  }, [file, imgSrc, crop, naturalW, naturalH, resultUrl]);

  const reset = () => {
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setImgSrc(""); setStatus("idle"); setResultUrl("");
  };

  const HANDLE = "absolute w-3 h-3 bg-white border-2 border-coral-500 rounded-sm";

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 border border-indigo-200 shadow-warm mb-5">
            <span className="text-2xl">✂️</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Crop Image</h1>
          <p className="text-warm-500 text-lg">Drag to select your crop area. Resize handles on all sides.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFile} accept="image/*" className="min-h-[220px]" label="Drop an image here" sublabel="JPG, PNG, WebP supported" />
            </motion.div>
          )}

          {status === "ready" && file && (
            <motion.div key="ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Aspect ratio presets */}
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button key={p.label} onClick={() => applyPreset(p.ratio)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      preset === p.ratio ? "border-coral-400 bg-coral-50 text-coral-700 font-semibold" : "border-warm bg-white text-warm-600 hover:border-coral-300"
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Crop canvas */}
              <div
                ref={containerRef}
                className="relative select-none overflow-hidden rounded-2xl border border-warm bg-black cursor-crosshair"
                onMouseDown={onBackdropDown}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img ref={imgRef} src={imgSrc} alt="crop" className="w-full block pointer-events-none" draggable={false} />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/50 pointer-events-none" />

                {/* Crop window — clears the overlay */}
                <div
                  className="absolute border-2 border-coral-400 cursor-move"
                  style={{
                    left: `${crop.x * 100}%`,
                    top: `${crop.y * 100}%`,
                    width: `${crop.w * 100}%`,
                    height: `${crop.h * 100}%`,
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                    background: "transparent",
                  }}
                  onMouseDown={(e) => onMouseDown(e, "move")}
                  onTouchStart={(e) => onMouseDown(e, "move")}
                >
                  {/* Rule of thirds grid */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
                    backgroundSize: "33.33% 33.33%",
                  }} />

                  {/* Edge handles */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-2 bg-white border border-coral-400 rounded cursor-n-resize" onMouseDown={(e) => onMouseDown(e, "t")} onTouchStart={(e) => onMouseDown(e, "t")} />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-2 bg-white border border-coral-400 rounded cursor-s-resize" onMouseDown={(e) => onMouseDown(e, "b")} onTouchStart={(e) => onMouseDown(e, "b")} />
                  <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-6 bg-white border border-coral-400 rounded cursor-w-resize" onMouseDown={(e) => onMouseDown(e, "l")} onTouchStart={(e) => onMouseDown(e, "l")} />
                  <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-6 bg-white border border-coral-400 rounded cursor-e-resize" onMouseDown={(e) => onMouseDown(e, "r")} onTouchStart={(e) => onMouseDown(e, "r")} />

                  {/* Corner handles */}
                  {(["tl","tr","bl","br"] as const).map((c) => (
                    <div key={c}
                      className={`${HANDLE} ${c === "tl" ? "-top-1.5 -left-1.5 cursor-nw-resize" : c === "tr" ? "-top-1.5 -right-1.5 cursor-ne-resize" : c === "bl" ? "-bottom-1.5 -left-1.5 cursor-sw-resize" : "-bottom-1.5 -right-1.5 cursor-se-resize"}`}
                      onMouseDown={(e) => onMouseDown(e, c)}
                      onTouchStart={(e) => onMouseDown(e, c)}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-warm-400 text-center">
                {Math.round(crop.w * naturalW)} × {Math.round(crop.h * naturalH)}px
                {" · "}drag corners/edges to resize · drag inside to move
              </p>

              <button onClick={doCrop} className="w-full gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                Crop Image
              </button>
            </motion.div>
          )}

          {status === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-sm font-semibold">Cropped to {Math.round(crop.w * naturalW)} × {Math.round(crop.h * naturalH)}px</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultUrl} alt="result" className="w-full rounded-2xl border border-warm shadow-warm object-contain max-h-64" />
              <p className="text-center text-xs text-warm-400">{formatBytes(resultSize)}</p>
              <div className="flex gap-3">
                <a href={resultUrl} download={file?.name.replace(/\.[^.]+$/, "_cropped.jpg")}
                  className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all text-center">
                  Download
                </a>
                <button onClick={() => setStatus("ready")} className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  Re-crop
                </button>
                <button onClick={reset} className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  New
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
