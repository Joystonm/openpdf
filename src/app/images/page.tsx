"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const groups = [
  {
    category: "Optimize",
    items: [
      { name: "Compress Image", desc: "Reduce file size with quality control", href: "/images/compress", icon: "⚡", accent: "coral" },
      { name: "Resize Image", desc: "Change dimensions, lock aspect ratio", href: "/images/resize", icon: "↔️", accent: "coral" },
    ],
  },
  {
    category: "Edit",
    items: [
      { name: "Crop Image", desc: "Crop to custom dimensions or presets", href: "/images/crop", icon: "✂️", accent: "indigo" },
      { name: "Rotate & Flip", desc: "Rotate by any angle, flip horizontally or vertically", href: "/images/rotate", icon: "🔃", accent: "indigo" },
      { name: "Filters", desc: "Grayscale, sepia, blur, brightness, contrast", href: "/images/filters", icon: "🎨", accent: "purple" },
      { name: "Watermark Image", desc: "Add text or image watermark with opacity control", href: "/images/watermark", icon: "💧", accent: "purple" },
      { name: "Add Border", desc: "Add padding and colored borders to images", href: "/images/border", icon: "🖼️", accent: "warm" },
      { name: "Merge Images", desc: "Combine images side-by-side or stacked", href: "/images/merge", icon: "🔗", accent: "warm" },
      { name: "Round Corners", desc: "Add rounded corners or crop to a circle", href: "/images/round-corners", icon: "⬜", accent: "purple" },
      { name: "Meme Generator", desc: "Add top/bottom text with custom font and color", href: "/images/meme", icon: "😂", accent: "coral" },
    ],
  },
  {
    category: "Convert",
    items: [
      { name: "Convert Format", desc: "JPG, PNG, WebP — any to any, batch supported", href: "/images/convert", icon: "🔄", accent: "emerald" },
      { name: "Images to PDF", desc: "Combine images into a single PDF document", href: "/jpg-to-pdf", icon: "📄", accent: "emerald" },
    ],
  },
  {
    category: "Analyze",
    items: [
      { name: "Compare Images", desc: "Drag a slider to compare two images side by side", href: "/images/compare", icon: "⚖️", accent: "indigo" },
      { name: "EXIF Viewer", desc: "Read camera metadata embedded in image files", href: "/images/exif", icon: "🔎", accent: "indigo" },
    ],
  },
  {
    category: "AI — Runs In Browser",
    items: [
      { name: "Remove Background", desc: "AI background removal via WASM — no uploads", href: "/images/remove-bg", icon: "✨", accent: "indigo", ai: true },
      { name: "Upscale 2×", desc: "AI super-resolution with Swin2SR — runs locally", href: "/images/upscale", icon: "🔍", accent: "purple", ai: true },
    ],
  },
];

const accentMap: Record<string, string> = {
  coral:   "bg-coral-50 border-coral-200 hover:border-coral-400",
  indigo:  "bg-indigo-50 border-indigo-200 hover:border-indigo-400",
  purple:  "bg-purple-50 border-purple-200 hover:border-purple-400",
  emerald: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
  warm:    "bg-cream-100 border-cream-400 hover:border-cream-500",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function ImageToolsPage() {
  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-warm-400 hover:text-warm-700 transition-colors mb-6">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-warm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div>
              <h1 className="font-serif text-4xl font-bold text-warm-900">Image Tools</h1>
              <p className="text-warm-500 mt-1">All tools run entirely in your browser. No uploads. No limits.</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3"
        >
          <span className="text-lg mt-0.5">🔒</span>
          <div>
            <p className="text-sm font-semibold text-emerald-800">100% local — no uploads, no API keys</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              All tools run in your browser using Canvas API. AI features use WASM + ONNX models downloaded once and cached locally.
            </p>
          </div>
        </motion.div>

        <div className="space-y-10">
          {groups.map((group) => (
            <div key={group.category}>
              <p className="text-xs font-semibold uppercase tracking-widest text-warm-400 mb-3">{group.category}</p>
              <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                {group.items.map((tool) => (
                  <motion.div key={tool.href} variants={item}>
                    <Link
                      href={tool.href}
                      className={`group block p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-warm hover:-translate-y-0.5 ${accentMap[tool.accent]}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{tool.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-warm-900 text-[15px] group-hover:text-coral-600 transition-colors">{tool.name}</p>
                            {"ai" in tool && tool.ai && (
                              <span className="text-[10px] bg-indigo-100 text-indigo-600 border border-indigo-200 px-1.5 py-0.5 rounded-full font-semibold">AI</span>
                            )}
                          </div>
                          <p className="text-sm text-warm-500 mt-0.5">{tool.desc}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
