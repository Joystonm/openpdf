"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const tools = [
  {
    name: "Certificate Studio",
    desc: "Design, customize, and generate professional certificates. Upload templates, place dynamic fields, bulk-generate from CSV. Free forever.",
    href: "/certificate-studio",
    icon: "🏆",
    accent: "gold",
    badge: "NEW",
  },
  {
    name: "Text Studio",
    desc: "Neon, flame, chrome, holographic and 15+ animated typography styles. Export PNG or SVG.",
    href: "/text-studio",
    icon: "✏️",
    accent: "purple",
  },
  {
    name: "Signature Studio",
    desc: "Draw or generate handwritten signatures with font styles and color themes. Export PNG.",
    href: "/signature-studio",
    icon: "✍️",
    accent: "emerald",
  },
  {
    name: "QR Studio",
    desc: "Custom QR codes with gradients, shapes, and logo overlays. Export PNG.",
    href: "/qr-studio",
    icon: "⬛",
    accent: "indigo",
  },
  {
    name: "Icon Studio",
    desc: "Customize icons — recolor, adjust stroke, add backgrounds. Export PNG at any size.",
    href: "/icon-studio",
    icon: "🎨",
    accent: "warm",
  },
];

const accentMap: Record<string, string> = {
  gold:    "bg-amber-50 border-amber-200 hover:border-amber-400",
  purple:  "bg-purple-50 border-purple-200 hover:border-purple-400",
  emerald: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
  indigo:  "bg-indigo-50 border-indigo-200 hover:border-indigo-400",
  coral:   "bg-coral-50 border-coral-200 hover:border-coral-400",
  warm:    "bg-cream-100 border-cream-400 hover:border-cream-500",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function DesignStudioPage() {
  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-warm-400 hover:text-warm-700 transition-colors mb-6">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-warm text-2xl">
              🎨
            </div>
            <div>
              <h1 className="font-serif text-4xl font-bold text-warm-900">Design Studio</h1>
              <p className="text-warm-500 mt-1">Premium design tools — all free, all in your browser.</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {tools.map((tool) => (
            <motion.div key={tool.href} variants={item}>
              <Link
                href={tool.href}
                className={`group block p-6 rounded-2xl border-2 transition-all duration-200 hover:shadow-warm hover:-translate-y-0.5 ${accentMap[tool.accent]}`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{tool.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-warm-900 text-lg group-hover:text-coral-600 transition-colors">{tool.name}</p>
                      {"badge" in tool && tool.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 uppercase tracking-wide">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-warm-500 mt-1 leading-relaxed">{tool.desc}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
