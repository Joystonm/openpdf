"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const FONTS = [
  { label: "Dancing Script", value: "Dancing Script" },
  { label: "Pacifico", value: "Pacifico" },
  { label: "Great Vibes", value: "Great Vibes" },
  { label: "Satisfy", value: "Satisfy" },
  { label: "Allura", value: "Allura" },
  { label: "Sacramento", value: "Sacramento" },
  { label: "Pinyon Script", value: "Pinyon Script" },
  { label: "Alex Brush", value: "Alex Brush" },
];

const STYLES = [
  { label: "Classic", color: "#1a1714", shadow: false, slant: 0 },
  { label: "Blue Ink", color: "#1a3a8f", shadow: false, slant: -5 },
  { label: "Red Pen", color: "#c0392b", shadow: false, slant: 0 },
  { label: "Gold", color: "#b8860b", shadow: true, slant: 0 },
  { label: "Elegant Dark", color: "#2c2c2c", shadow: true, slant: -8 },
  { label: "Teal", color: "#0d7377", shadow: false, slant: 0 },
];

const W = 600, H = 200;

export default function SignatureStudioPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"generate" | "draw">("generate");
  const [name, setName] = useState("Your Name");
  const [font, setFont] = useState(FONTS[0].value);
  const [style, setStyle] = useState(STYLES[0]);
  const [fontSize, setFontSize] = useState(72);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [drawColor, setDrawColor] = useState("#1a1714");
  const [drawSize, setDrawSize] = useState(3);

  // Load Google Fonts
  useEffect(() => {
    const families = FONTS.map((f) => f.value.replace(/ /g, "+")).join("&family=");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const renderGenerated = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    if (style.slant !== 0) {
      ctx.transform(1, 0, Math.tan((style.slant * Math.PI) / 180), 1, 0, 0);
    }

    ctx.font = `${fontSize}px "${font}"`;
    ctx.fillStyle = style.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (style.shadow) {
      ctx.shadowColor = style.color + "55";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }

    ctx.fillText(name || "Your Name", W / 2, H / 2);
    ctx.restore();

    // Underline
    ctx.beginPath();
    const metrics = ctx.measureText(name || "Your Name");
    const tw = Math.min(metrics.width, W - 40);
    const ux = (W - tw) / 2;
    const uy = H / 2 + fontSize * 0.45;
    ctx.moveTo(ux, uy);
    ctx.lineTo(ux + tw, uy);
    ctx.strokeStyle = style.color + "88";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [name, font, style, fontSize]);

  useEffect(() => {
    if (mode === "generate") renderGenerated();
  }, [mode, renderGenerated]);

  // Draw mode helpers
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = drawSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
    lastPos.current = pos;
  };

  const endDraw = () => { setIsDrawing(false); lastPos.current = null; };

  const clearDraw = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
  };

  const exportPNG = () => {
    const src = mode === "generate" ? canvasRef.current : drawCanvasRef.current;
    if (!src) return;
    const link = document.createElement("a");
    link.download = "signature.png";
    link.href = src.toDataURL("image/png");
    link.click();
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100 pt-14">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href="/" className="text-sm text-warm-400 hover:text-coral-500 transition-colors mb-4 inline-flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </Link>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mt-2">Signature Studio</h1>
          <p className="text-warm-500 mt-1">Draw or generate a handwritten signature. Export as PNG.</p>
        </motion.div>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-6">
          {(["generate", "draw"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${mode === m ? "gradient-coral text-white shadow-warm" : "bg-white border border-warm text-warm-600 hover:border-coral-300"}`}
            >
              {m === "generate" ? "✍️ Generate" : "🖊️ Draw"}
            </button>
          ))}
        </div>

        {/* Canvas */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl border-2 border-warm shadow-warm p-4 mb-6">
          {mode === "generate" ? (
            <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-xl" style={{ background: "transparent" }} />
          ) : (
            <canvas
              ref={drawCanvasRef}
              width={W}
              height={H}
              className="w-full rounded-xl cursor-crosshair touch-none"
              style={{ background: "transparent", border: "1px dashed #e0d9d0" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          )}
        </motion.div>

        {/* Controls */}
        {mode === "generate" ? (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-1.5">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-warm rounded-xl px-4 py-2.5 text-warm-800 bg-white focus:outline-none focus:border-coral-400"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-2">Font Style</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FONTS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFont(f.value)}
                    className={`py-2 px-3 rounded-xl border text-sm transition-all ${font === f.value ? "border-coral-400 bg-coral-50 text-coral-700" : "border-warm bg-white text-warm-600 hover:border-coral-300"}`}
                    style={{ fontFamily: f.value }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-2">Color & Style</label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setStyle(s)}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${style.label === s.label ? "border-coral-400 bg-coral-50" : "border-warm bg-white hover:border-coral-300"}`}
                    style={{ color: s.color }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-1.5">Size: {fontSize}px</label>
              <input type="range" min={40} max={120} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} className="w-full accent-coral-500" />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-warm-600 mb-1">Color</label>
              <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} className="w-10 h-10 rounded-lg border border-warm cursor-pointer" />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-semibold text-warm-600 mb-1">Pen size: {drawSize}px</label>
              <input type="range" min={1} max={10} value={drawSize} onChange={(e) => setDrawSize(+e.target.value)} className="w-full accent-coral-500" />
            </div>
            <button onClick={clearDraw} className="px-4 py-2 rounded-xl border border-warm bg-white text-warm-600 text-sm hover:border-red-300 hover:text-red-500 transition-all">
              Clear
            </button>
          </div>
        )}

        {/* Export */}
        <div className="mt-8">
          <button
            onClick={exportPNG}
            className="w-full gradient-coral text-white font-semibold py-3.5 rounded-2xl shadow-warm hover:opacity-90 transition-opacity text-base"
          >
            Download PNG
          </button>
        </div>
      </div>
    </main>
  );
}
