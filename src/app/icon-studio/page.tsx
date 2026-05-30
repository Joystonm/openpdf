"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ICONS } from "./icons";

const CATEGORIES = ["All", ...Array.from(new Set(ICONS.map((i) => i.category)))];
const SIZE_OPTIONS = [16, 24, 32, 48, 64, 128, 256, 512];
const BG_PRESETS = ["transparent", "#ffffff", "#000000", "#f97316", "#6366f1", "#10b981", "#ec4899", "#1e293b"];

export default function IconStudioPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState(ICONS[0]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [color, setColor] = useState("#1a1714");
  const [fillMode, setFillMode] = useState<"stroke" | "fill" | "both">("stroke");
  const [bg, setBg] = useState("transparent");
  const [bgRadius, setBgRadius] = useState(20);
  const [padding, setPadding] = useState(20);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [exportSize, setExportSize] = useState(256);

  const filtered = ICONS.filter(
    (i) => (category === "All" || i.category === category) &&
      i.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderIcon = useCallback((icon: typeof ICONS[0], size: number, target: HTMLCanvasElement) => {
    target.width = size;
    target.height = size;
    const ctx = target.getContext("2d")!;
    ctx.clearRect(0, 0, size, size);

    if (bg !== "transparent") {
      ctx.fillStyle = bg;
      if (bgRadius > 0) {
        ctx.beginPath();
        ctx.roundRect(0, 0, size, size, (bgRadius / 256) * size);
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, size, size);
      }
    }

    const pad = (padding / 256) * size;
    const drawSize = size - pad * 2;
    const scale = drawSize / 24;

    ctx.save();
    ctx.translate(pad, pad);
    ctx.scale(scale, scale);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = strokeWidth / scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const segments = icon.path.split(/(?= M )/);
    for (const seg of segments) {
      try {
        const p = new Path2D(seg.trim());
        if (fillMode === "fill" || fillMode === "both") ctx.fill(p);
        if (fillMode === "stroke" || fillMode === "both") ctx.stroke(p);
      } catch {}
    }
    ctx.restore();
  }, [bg, bgRadius, padding, color, strokeWidth, fillMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) renderIcon(selected, 256, canvas);
  }, [selected, renderIcon]);

  const exportPNG = () => {
    const off = document.createElement("canvas");
    renderIcon(selected, exportSize, off);
    setTimeout(() => {
      const link = document.createElement("a");
      link.download = `${selected.name.toLowerCase().replace(/ /g, "-")}-${exportSize}.png`;
      link.href = off.toDataURL("image/png");
      link.click();
    }, 50);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100 pt-14">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href="/design-studio" className="text-sm text-warm-400 hover:text-coral-500 transition-colors mb-4 inline-flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Design Studio
          </Link>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mt-2">Icon Studio</h1>
          <p className="text-warm-500 mt-1">60+ icons — recolor, fill, resize, add backgrounds. Export PNG.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Icon picker */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${category === c ? "gradient-coral text-white" : "bg-white border border-warm text-warm-600 hover:border-coral-300"}`}>
                  {c}
                </button>
              ))}
            </div>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search icons…"
              className="w-full border border-warm rounded-xl px-4 py-2 text-warm-800 bg-white focus:outline-none focus:border-coral-400 text-sm" />
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 max-h-64 overflow-y-auto pr-1">
              {filtered.map((icon) => (
                <button key={icon.name} onClick={() => setSelected(icon)} title={icon.name}
                  className={`aspect-square rounded-xl border flex items-center justify-center transition-all hover:border-coral-300 ${selected.name === icon.name ? "border-coral-400 bg-coral-50" : "border-warm bg-white"}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke={selected.name === icon.name ? "#f97316" : "#6b7280"}
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {icon.path.split(/(?= M )/).map((seg, i) => <path key={i} d={seg.trim()} />)}
                  </svg>
                </button>
              ))}
            </div>
            <p className="text-xs text-warm-400">{filtered.length} icons</p>
          </div>

          {/* Controls + Preview */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border-2 border-warm shadow-warm p-4 flex items-center justify-center aspect-square"
              style={{ background: bg === "transparent" ? "repeating-conic-gradient(#f0ece4 0% 25%, white 0% 50%) 0 0 / 16px 16px" : "white" }}>
              <canvas ref={canvasRef} width={256} height={256} className="w-full rounded-xl" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-warm-600 mb-1.5">Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-9 h-9 rounded-lg border border-warm cursor-pointer" />
                <div className="flex gap-1">
                  {["stroke","fill","both"].map((m) => (
                    <button key={m} onClick={() => setFillMode(m as typeof fillMode)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all capitalize ${fillMode === m ? "border-coral-400 bg-coral-50 text-coral-700" : "border-warm bg-white text-warm-600"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-warm-600 mb-1">Stroke: {strokeWidth}px</label>
              <input type="range" min={0.5} max={4} step={0.5} value={strokeWidth} onChange={(e) => setStrokeWidth(+e.target.value)} className="w-full accent-coral-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-warm-600 mb-1.5">Background</label>
              <div className="flex flex-wrap gap-1.5">
                {BG_PRESETS.map((b) => (
                  <button key={b} onClick={() => setBg(b)}
                    className={`w-7 h-7 rounded-lg border-2 transition-all ${bg === b ? "border-coral-500 scale-110" : "border-warm"}`}
                    style={{ background: b === "transparent" ? "repeating-conic-gradient(#e5e7eb 0% 25%, white 0% 50%) 0 0 / 10px 10px" : b }} />
                ))}
                <input type="color" value={bg === "transparent" ? "#ffffff" : bg} onChange={(e) => setBg(e.target.value)} className="w-7 h-7 rounded-lg border border-warm cursor-pointer" />
              </div>
            </div>

            {bg !== "transparent" && (
              <div>
                <label className="block text-xs font-semibold text-warm-600 mb-1">Radius: {bgRadius}px</label>
                <input type="range" min={0} max={128} value={bgRadius} onChange={(e) => setBgRadius(+e.target.value)} className="w-full accent-coral-500" />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-warm-600 mb-1">Padding: {padding}px</label>
              <input type="range" min={0} max={80} value={padding} onChange={(e) => setPadding(+e.target.value)} className="w-full accent-coral-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-warm-600 mb-1.5">Export Size</label>
              <div className="flex flex-wrap gap-1">
                {SIZE_OPTIONS.map((s) => (
                  <button key={s} onClick={() => setExportSize(s)}
                    className={`px-2 py-1 rounded-lg border text-xs font-medium transition-all ${exportSize === s ? "border-coral-400 bg-coral-50 text-coral-700" : "border-warm bg-white text-warm-600"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={exportPNG} className="w-full gradient-coral text-white font-semibold py-3 rounded-2xl shadow-warm hover:opacity-90 transition-opacity">
              Download {exportSize}×{exportSize} PNG
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
