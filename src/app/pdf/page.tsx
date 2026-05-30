"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const groups = [
  {
    category: "Optimize",
    items: [
      { name: "Compress PDF", desc: "Reduce file size while preserving quality", href: "/compress", icon: "⚡", accent: "coral" },
      { name: "Repair PDF", desc: "Fix corrupted or malformed PDF structure", href: "/repair-pdf", icon: "🔧", accent: "coral" },
      { name: "Flatten PDF", desc: "Bake annotations and form fields permanently", href: "/flatten-pdf", icon: "🗜️", accent: "coral" },
    ],
  },
  {
    category: "Organize",
    items: [
      { name: "Merge PDF", desc: "Combine multiple PDFs into one", href: "/merge", icon: "🔗", accent: "indigo" },
      { name: "Split PDF", desc: "Extract pages or split by range", href: "/split", icon: "✂️", accent: "indigo" },
      { name: "Organize Pages", desc: "Drag, rotate, and reorder pages", href: "/organize", icon: "🗂️", accent: "purple" },
      { name: "Rotate PDF", desc: "Rotate all, odd, or even pages", href: "/rotate-pdf", icon: "🔃", accent: "indigo" },
      { name: "Crop PDF", desc: "Trim margins from all pages", href: "/crop-pdf", icon: "✂️", accent: "purple" },
    ],
  },
  {
    category: "Convert",
    items: [
      { name: "Word to PDF", desc: "Convert .docx Word documents to PDF", href: "/word-to-pdf", icon: "📝", accent: "indigo" },
      { name: "PDF to Word", desc: "Export PDF text as an editable .docx", href: "/pdf-to-word", icon: "📄", accent: "indigo" },
      { name: "JPG to PDF", desc: "Turn images into a PDF document", href: "/jpg-to-pdf", icon: "🖼️", accent: "emerald" },
      { name: "PDF to Image", desc: "Export pages as high-quality images", href: "/pdf-to-image", icon: "📸", accent: "emerald" },
      { name: "PDF to Text", desc: "Extract all text content from a PDF", href: "/pdf-to-text", icon: "📃", accent: "emerald" },
    ],
  },
  {
    category: "Analyze & Metadata",
    items: [
      { name: "PDF Word Count", desc: "Count words and characters per page", href: "/pdf-word-count", icon: "📊", accent: "purple" },
      { name: "PDF Metadata", desc: "View and edit title, author, keywords", href: "/pdf-metadata", icon: "🏷️", accent: "purple" },
    ],
  },
  {
    category: "Security",
    items: [
      { name: "Protect / Unlock PDF", desc: "Add or remove password protection", href: "/protect", icon: "🔒", accent: "warm" },
      { name: "Watermark PDF", desc: "Add text or image watermarks", href: "/watermark", icon: "💧", accent: "warm" },
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

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function PdfToolsPage() {
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
            <div className="w-12 h-12 rounded-2xl gradient-coral flex items-center justify-center shadow-warm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div>
              <h1 className="font-serif text-4xl font-bold text-warm-900">PDF Tools</h1>
              <p className="text-warm-500 mt-1">All processing happens in your browser. No uploads, no limits.</p>
            </div>
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
                        <div>
                          <p className="font-semibold text-warm-900 text-[15px] group-hover:text-coral-600 transition-colors">{tool.name}</p>
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
