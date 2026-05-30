"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import QRCode from "qrcode";

const W = 420;

const SHAPES = [
  { label: "Square", value: "square" },
  { label: "Rounded", value: "rounded" },
  { label: "Dots", value: "dots" },
];

const GRADIENTS = [
  { label: "None", from: "", to: "" },
  { label: "Sunset", from: "#f97316", to: "#ec4899" },
  { label: "Ocean", from: "#0ea5e9", to: "#6366f1" },
  { label: "Forest", from: "#22c55e", to: "#14b8a6" },
  { label: "Purple", from: "#8b5cf6", to: "#ec4899" },
  { label: "Gold", from: "#f59e0b", to: "#ef4444" },
  { label: "Fire", from: "#ef4444", to: "#f97316" },
  { label: "Aqua", from: "#06b6d4", to: "#10b981" },
];

const EC_LEVELS = [
  { label: "L — 7%", value: "L" },
  { label: "M — 15%", value: "M" },
  { label: "Q — 25%", value: "Q" },
  { label: "H — 30%", value: "H" },
];

const BG_PRESETS = ["#ffffff", "#000000", "#1e293b", "#fef3c7", "#f0fdf4", "#fdf4ff"];

export default function QRStudioPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState("https://example.com");
  const [fgColor, setFgColor] = useState("#1a1714");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [transparentBg, setTransparentBg] = useState(false);
  const [gradient, setGradient] = useState(GRADIENTS[0]);
  const [shape, setShape] = useState(SHAPES[0].value);
  const [ecLevel, setEcLevel] = useState("M");
  const [quietZone, setQuietZone] = useState(20);
  const [moduleSize, setModuleSize] = useState(90); // % of cell

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim()) return;
    const ctx = canvas.getContext("2d")!;

    let matrix: boolean[][];
    try {
      const qr = QRCode.create(text, { errorCorrectionLevel: ecLevel as "L"|"M"|"Q"|"H" });
      const size = qr.modules.size;
      matrix = Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => qr.modules.get(r, c) === 1)
      );
    } catch { return; }

    const modules = matrix.length;
    const cellSize = (W - quietZone * 2) / modules;
    canvas.width = W;
    canvas.height = W;

    // Background
    if (transparentBg) {
      ctx.clearRect(0, 0, W, W);
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, W);
    }

    // Fill
    let fill: string | CanvasGradient = fgColor;
    if (gradient.from) {
      const g = ctx.createLinearGradient(0, 0, W, W);
      g.addColorStop(0, gradient.from);
      g.addColorStop(1, gradient.to);
      fill = g;
    }
    ctx.fillStyle = fill;

    const ms = cellSize * (moduleSize / 100);
    const mpad = (cellSize - ms) / 2;

    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        if (!matrix[row][col]) continue;
        const x = quietZone + col * cellSize;
        const y = quietZone + row * cellSize;

        if (shape === "dots") {
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, ms / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape === "rounded") {
          ctx.beginPath();
          ctx.roundRect(x + mpad, y + mpad, ms, ms, ms * 0.28);
          ctx.fill();
        } else {
          ctx.fillRect(x + mpad, y + mpad, ms, ms);
        }
      }
    }
  }, [text, fgColor, bgColor, transparentBg, gradient, shape, ecLevel, quietZone, moduleSize]);

  useEffect(() => {
    const t = setTimeout(render, 250);
    return () => clearTimeout(t);
  }, [render]);

  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "qr-code.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100 pt-14">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href="/design-studio" className="text-sm text-warm-400 hover:text-coral-500 transition-colors mb-4 inline-flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Design Studio
          </Link>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mt-2">QR Studio</h1>
          <p className="text-warm-500 mt-1">Design custom QR codes with gradients and shapes. Export as PNG.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border-2 border-warm shadow-warm p-4 flex items-center justify-center aspect-square"
              style={{ background: transparentBg ? "repeating-conic-gradient(#e5e7eb 0% 25%, white 0% 50%) 0 0 / 16px 16px" : "white" }}>
              <canvas ref={canvasRef} width={W} height={W} className="w-full rounded-xl" />
            </div>
            <button onClick={exportPNG} className="w-full gradient-coral text-white font-semibold py-3 rounded-2xl shadow-warm hover:opacity-90 transition-opacity">
              Download PNG
            </button>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-1.5">URL or Text</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                className="w-full border border-warm rounded-xl px-4 py-2.5 text-warm-800 bg-white focus:outline-none focus:border-coral-400 resize-none text-sm"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-2">Module Shape</label>
              <div className="flex gap-2">
                {SHAPES.map((s) => (
                  <button key={s.value} onClick={() => setShape(s.value)}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${shape === s.value ? "border-coral-400 bg-coral-50 text-coral-700" : "border-warm bg-white text-warm-600 hover:border-coral-300"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-2">Gradient</label>
              <div className="grid grid-cols-4 gap-1.5">
                {GRADIENTS.map((g) => (
                  <button key={g.label} onClick={() => setGradient(g)}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-medium transition-all ${gradient.label === g.label ? "border-coral-400 ring-1 ring-coral-400" : "border-warm hover:border-coral-300"}`}
                    style={g.from ? { background: `linear-gradient(135deg, ${g.from}, ${g.to})`, color: "white", borderColor: "transparent" } : { background: "white", color: "#6b7280" }}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {!gradient.from && (
              <div className="flex gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-warm-600 mb-1">Foreground</label>
                  <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-10 h-10 rounded-lg border border-warm cursor-pointer" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-warm-600 mb-1">Background</label>
                  <div className="flex gap-1.5 items-center">
                    <input type="color" value={bgColor} onChange={(e) => { setBgColor(e.target.value); setTransparentBg(false); }} className="w-10 h-10 rounded-lg border border-warm cursor-pointer" disabled={transparentBg} />
                    <div className="flex flex-wrap gap-1">
                      {BG_PRESETS.map((c) => (
                        <button key={c} onClick={() => { setBgColor(c); setTransparentBg(false); }}
                          className={`w-5 h-5 rounded border transition-all ${bgColor === c && !transparentBg ? "border-coral-500 scale-110" : "border-warm"}`}
                          style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-warm-600 cursor-pointer pb-1">
                  <input type="checkbox" checked={transparentBg} onChange={(e) => setTransparentBg(e.target.checked)} className="accent-coral-500" />
                  Transparent
                </label>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-2">Error Correction</label>
              <div className="grid grid-cols-2 gap-1.5">
                {EC_LEVELS.map((l) => (
                  <button key={l.value} onClick={() => setEcLevel(l.value)}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-medium transition-all ${ecLevel === l.value ? "border-coral-400 bg-coral-50 text-coral-700" : "border-warm bg-white text-warm-600 hover:border-coral-300"}`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-warm-600 mb-1">Quiet zone: {quietZone}px</label>
                <input type="range" min={4} max={40} value={quietZone} onChange={(e) => setQuietZone(+e.target.value)} className="w-full accent-coral-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-warm-600 mb-1">Module size: {moduleSize}%</label>
                <input type="range" min={50} max={100} value={moduleSize} onChange={(e) => setModuleSize(+e.target.value)} className="w-full accent-coral-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
