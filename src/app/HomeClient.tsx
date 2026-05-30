"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const categories = [
  {
    href: "/pdf",
    label: "PDF Tools",
    desc: "Compress, merge, split, organize, convert and secure PDF files — all in your browser.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    tools: ["Compress", "Merge", "Split", "Organize Pages", "JPG→PDF", "PDF→Image", "Watermark"],
    accent: "coral",
    bg: "from-coral-50 to-cream-100",
    border: "border-coral-200 hover:border-coral-400",
    iconBg: "gradient-coral text-white",
    cta: "Explore PDF Tools",
  },
  {
    href: "/images",
    label: "Image Tools",
    desc: "Compress, resize, convert and enhance images. Powered by browser canvas and Cloudinary AI.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
    tools: ["Compress Image", "Resize", "Convert Format", "Remove Background", "Upscale AI"],
    accent: "indigo",
    bg: "from-indigo-50 to-cream-100",
    border: "border-indigo-200 hover:border-indigo-400",
    iconBg: "bg-indigo-600 text-white",
    cta: "Explore Image Tools",
  },
  {
    href: "/design-studio",
    label: "Design Studio",
    desc: "Certificate Studio, signatures, QR codes, icons, and animated typography — all in one place.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r="2.5"/>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    tools: ["Certificate Studio", "Text Studio", "Signature Studio", "QR Studio", "Icon Studio"],
    accent: "purple",
    bg: "from-purple-50 to-cream-100",
    border: "border-purple-200 hover:border-purple-400",
    iconBg: "bg-gradient-to-br from-purple-500 to-pink-500 text-white",
    cta: "Open Design Studio",
  },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-14 overflow-hidden">
        <div className="absolute inset-0 noise-bg pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream-100 via-cream-50 to-cream-100 pointer-events-none" />

        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 right-[15%] w-64 h-64 rounded-full bg-coral-200/20 blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -15, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-32 left-[10%] w-80 h-80 rounded-full bg-indigo-200/15 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-white border border-warm shadow-warm rounded-full px-4 py-1.5 mb-8 text-sm text-warm-600"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow" />
            No signup · No ads · No limits · Files stay in your browser
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-warm-900 leading-[1.1] tracking-tight mb-6"
          >
            PDF, Image & Design Tools.{" "}
            <span className="text-coral-500">100% Free.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-warm-500 max-w-2xl mx-auto mb-14 leading-relaxed"
          >
            A modern toolkit for PDFs, images, and design. Fast, privacy-first processing with premium UX.
            No watermarks. No paywalls. Forever free.
          </motion.p>

          {/* Category cards */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 text-left"
          >
            {categories.map((cat) => (
              <motion.div key={cat.href} variants={item}>
                <Link
                  href={cat.href}
                  className={`group block bg-gradient-to-br ${cat.bg} border-2 ${cat.border} rounded-3xl p-7 transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-1`}
                >
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-warm ${cat.iconBg}`}>
                      {cat.icon}
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-warm-900">{cat.label}</h2>
                      <p className="text-sm text-warm-500 mt-1 leading-relaxed">{cat.desc}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {cat.tools.map((t) => (
                      <span key={t} className="text-xs bg-white/70 border border-warm text-warm-600 px-2.5 py-1 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 text-sm font-semibold text-coral-600 group-hover:gap-2.5 transition-all">
                    {cat.cta}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-warm-400"
        >
          <span className="text-xs">Scroll to learn more</span>
          <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 bg-warm-900">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-cream-100 mb-3">
              Your files never leave your browser.
            </h2>
            <p className="text-cream-400 max-w-lg mx-auto">
              All processing happens locally. Zero server uploads. Zero data collection.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "∞", label: "File size limit" },
              { value: "0", label: "Ads, ever" },
              { value: "100%", label: "Browser-local" },
              { value: "Free", label: "Forever" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center p-6 rounded-2xl bg-warm-800 border border-warm-700"
              >
                <p className="font-serif text-4xl font-bold text-coral-400 mb-1">{s.value}</p>
                <p className="text-sm text-cream-400">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-warm bg-cream-50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg gradient-coral flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="6" rx="1" fill="white" fillOpacity="0.9"/>
                <rect x="9" y="2" width="5" height="6" rx="1" fill="white" fillOpacity="0.6"/>
                <rect x="2" y="10" width="5" height="4" rx="1" fill="white" fillOpacity="0.6"/>
                <rect x="9" y="10" width="5" height="4" rx="1" fill="white" fillOpacity="0.9"/>
              </svg>
            </div>
            <span className="font-semibold text-warm-800 text-sm">File<span className="text-coral-500">ify</span></span>
          </div>
          <p className="text-xs text-warm-400 text-center">PDF & Image Tools — 100% Free. No Ads. No Limits. No Signup.</p>
          <p className="text-xs text-warm-400">Built with ❤️ for the open web</p>
        </div>
      </footer>
    </main>
  );
}
