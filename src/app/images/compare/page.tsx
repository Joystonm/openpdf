"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";

type Slot = "before" | "after";

export default function CompareImagesPage() {
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [slot, setSlot] = useState<Slot>("before");
  const [sliderX, setSliderX] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleFile = useCallback((files: File[], target: Slot) => {
    const url = URL.createObjectURL(files[0]);
    if (target === "before") { if (before) URL.revokeObjectURL(before); setBefore(url); }
    else { if (after) URL.revokeObjectURL(after); setAfter(url); }
  }, [before, after]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setSliderX(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)));
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setSliderX(Math.min(100, Math.max(0, ((e.touches[0].clientX - rect.left) / rect.width) * 100)));
  }, []);

  const reset = () => {
    if (before) URL.revokeObjectURL(before);
    if (after) URL.revokeObjectURL(after);
    setBefore(""); setAfter(""); setSliderX(50);
  };

  const ready = before && after;

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-warm mb-5">
            <span className="text-2xl">⚖️</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">Compare Images</h1>
          <p className="text-warm-500 text-lg">Drag the slider to compare two images side by side.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!ready && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {(["before", "after"] as Slot[]).map((s) => (
                  <div key={s}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-warm-400 mb-2">{s}</p>
                    {(s === "before" ? before : after) ? (
                      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 bg-[#e5e5e5] min-h-[140px] flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s === "before" ? before : after} alt={s} className="max-h-36 max-w-full object-contain" />
                        <button onClick={() => s === "before" ? setBefore("") : setAfter("")}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center hover:bg-black/70">✕</button>
                      </div>
                    ) : (
                      <DropZone onFiles={(f) => handleFile(f, s)} accept="image/*" className="min-h-[140px]" label={`Drop ${s} image`} sublabel="" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {ready && (
            <motion.div key="compare" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div
                ref={containerRef}
                className="relative rounded-2xl overflow-hidden border border-warm select-none cursor-col-resize"
                style={{ userSelect: "none" }}
                onMouseMove={onMouseMove}
                onMouseDown={() => { dragging.current = true; }}
                onMouseUp={() => { dragging.current = false; }}
                onMouseLeave={() => { dragging.current = false; }}
                onTouchMove={onTouchMove}
              >
                {/* After (full width, behind) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={after} alt="after" className="block w-full object-contain" draggable={false} />

                {/* Before (clipped to left of slider) */}
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderX}%` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={before} alt="before" className="block w-full object-contain" style={{ width: `${10000 / sliderX}%`, maxWidth: "none" }} draggable={false} />
                </div>

                {/* Divider */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${sliderX}%` }}>
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-warm border border-warm flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"/><polyline points="9 18 3 12 9 6" transform="translate(6,0)"/>
                    </svg>
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute top-3 left-3 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-lg">Before</div>
                <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-lg">After</div>
              </div>

              <input type="range" min={0} max={100} value={sliderX} onChange={(e) => setSliderX(+e.target.value)} className="w-full accent-coral-500" />

              <button onClick={reset} className="w-full py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                Compare New Images
              </button>
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
