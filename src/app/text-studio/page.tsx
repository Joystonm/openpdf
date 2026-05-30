"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PRESETS, CATEGORIES, GOOGLE_FONTS, type StylePreset } from "./presets";

const BG_OPTIONS = [
  { label: "Transparent", value: "transparent" },
  { label: "White", value: "#ffffff" },
  { label: "Black", value: "#000000" },
  { label: "Dark", value: "#1a1714" },
  { label: "Cream", value: "#faf7f0" },
];

const CANVAS_W = 800;
const CANVAS_H = 400;

export default function TextStudioPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);

  const [text, setText] = useState("Your Text");
  const [preset, setPreset] = useState<StylePreset>(PRESETS[0]);
  const [font, setFont] = useState("Bebas Neue");
  const [fontSize, setFontSize] = useState(120);
  const [bg, setBg] = useState("transparent");
  const [activeCategory, setActiveCategory] = useState("All");

  // Draggable text position
  const [pos, setPos] = useState({ x: CANVAS_W / 2, y: CANVAS_H / 2 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Load Google Fonts
  useEffect(() => {
    const families = GOOGLE_FONTS.map((f) => f.value.replace(/ /g, "+")).join("&family=");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    if (bg !== "transparent") {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    // Draw preset
    preset.draw(ctx, text || "Your Text", pos.x, pos.y, fontSize, font, frameRef.current);
  }, [text, preset, font, fontSize, bg, pos]);

  // Animation loop
  useEffect(() => {
    const loop = () => {
      frameRef.current++;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // Drag handlers
  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const p = getCanvasPos(e);
    dragging.current = true;
    dragOffset.current = { x: p.x - pos.x, y: p.y - pos.y };
  };
  const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging.current) return;
    const p = getCanvasPos(e);
    setPos({ x: p.x - dragOffset.current.x, y: p.y - dragOffset.current.y });
  };
  const onMouseUp = () => { dragging.current = false; };

  // Export
  const exportPNG = (transparent: boolean) => {
    const canvas = canvasRef.current!;
    const offscreen = document.createElement("canvas");
    offscreen.width = CANVAS_W * 2; // 2× HD
    offscreen.height = CANVAS_H * 2;
    const ctx = offscreen.getContext("2d")!;
    ctx.scale(2, 2);
    if (!transparent && bg !== "transparent") {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
    preset.draw(ctx, text || "Your Text", pos.x, pos.y, fontSize, font, frameRef.current);
    const url = offscreen.toDataURL("image/png");
    Object.assign(document.createElement("a"), { href: url, download: "text-studio.png" }).click();
  };

  const exportSVG = () => {
    const svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}">
  ${bg !== "transparent" ? `<rect width="${CANVAS_W}" height="${CANVAS_H}" fill="${bg}"/>` : ""}
  <text x="${pos.x}" y="${pos.y}" font-family="${font}" font-size="${fontSize}" font-weight="bold"
    text-anchor="middle" dominant-baseline="middle" fill="#1a1714">${text || "Your Text"}</text>
</svg>`;
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: "text-studio.svg" }).click();
    URL.revokeObjectURL(url);
  };

  const filteredPresets = activeCategory === "All" ? PRESETS : PRESETS.filter((p) => p.category === activeCategory);

  return (
    <main className="min-h-screen pt-14 bg-warm-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-warm-400 hover:text-cream-200 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <span className="text-lg">✍️</span>
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-cream-100">Text Studio</h1>
              <p className="text-xs text-warm-400">Typography playground — drag text, pick a style, export</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          {/* Left: Canvas + controls */}
          <div className="space-y-4">
            {/* Canvas */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              style={{ background: "repeating-conic-gradient(#2a2520 0% 25%, #1a1714 0% 50%) 0 0 / 20px 20px" }}>
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="w-full cursor-move block"
                style={{ background: bg === "transparent" ? "transparent" : bg }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onTouchStart={onMouseDown}
                onTouchMove={onMouseMove}
                onTouchEnd={onMouseUp}
              />
              <div className="absolute bottom-3 right-3 text-xs text-white/40 pointer-events-none">Drag to reposition</div>
            </div>

            {/* Text input */}
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your text…"
              className="w-full bg-warm-800 border border-white/10 rounded-xl px-4 py-3 text-cream-100 text-lg font-semibold placeholder:text-warm-500 focus:outline-none focus:border-purple-500 transition-colors"
            />

            {/* Controls row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-warm-400 block mb-1">Font</label>
                <select value={font} onChange={(e) => setFont(e.target.value)}
                  className="w-full bg-warm-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-100 focus:outline-none focus:border-purple-500">
                  {GOOGLE_FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-warm-400 block mb-1">Size — {fontSize}px</label>
                <input type="range" min={24} max={240} value={fontSize} onChange={(e) => setFontSize(+e.target.value)}
                  className="w-full accent-purple-500 mt-2" />
              </div>
              <div>
                <label className="text-xs text-warm-400 block mb-1">Background</label>
                <select value={bg} onChange={(e) => setBg(e.target.value)}
                  className="w-full bg-warm-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-100 focus:outline-none focus:border-purple-500">
                  {BG_OPTIONS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-warm-400 block mb-1">Export</label>
                <button onClick={() => exportPNG(bg === "transparent")}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2 rounded-xl transition-colors">
                  PNG
                </button>
              </div>
            </div>
          </div>

          {/* Right: Style presets */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-warm-400 mb-2">Style Presets</p>
              {/* Category filter */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {["All", ...CATEGORIES].map((cat) => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${activeCategory === cat ? "bg-purple-600 text-white" : "bg-warm-800 text-warm-400 hover:text-cream-200 border border-white/10"}`}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Preset grid */}
              <div className="grid grid-cols-2 gap-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredPresets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p)}
                    className={`relative p-3 rounded-xl border text-left transition-all ${
                      preset.id === p.id
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-white/10 bg-warm-800 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{p.emoji}</span>
                      <span className="text-xs font-semibold text-cream-200 leading-tight">{p.label}</span>
                    </div>
                    {p.animated && (
                      <span className="absolute top-1.5 right-1.5 text-[9px] bg-purple-500/80 text-white px-1 py-0.5 rounded font-bold">LIVE</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
