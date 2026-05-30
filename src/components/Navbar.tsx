"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-warm"
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg gradient-coral flex items-center justify-center shadow-sm">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="6" rx="1" fill="white" fillOpacity="0.9"/>
              <rect x="9" y="2" width="5" height="6" rx="1" fill="white" fillOpacity="0.6"/>
              <rect x="2" y="10" width="5" height="4" rx="1" fill="white" fillOpacity="0.6"/>
              <rect x="9" y="10" width="5" height="4" rx="1" fill="white" fillOpacity="0.9"/>
            </svg>
          </div>
          <span className="font-semibold text-warm-900 text-[15px] tracking-tight">
            File<span className="text-coral-500">ify</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link href="/pdf" className="px-3 py-1.5 text-sm text-warm-600 hover:text-warm-900 rounded-md hover:bg-cream-200 transition-colors">
            PDF Tools
          </Link>
          <Link href="/images" className="px-3 py-1.5 text-sm text-warm-600 hover:text-warm-900 rounded-md hover:bg-cream-200 transition-colors">
            Image Tools
          </Link>
          <Link href="/design-studio" className="px-3 py-1.5 text-sm text-warm-600 hover:text-warm-900 rounded-md hover:bg-cream-200 transition-colors">
            Design Studio
          </Link>
        </nav>

        <span className="hidden sm:flex items-center gap-1.5 text-xs text-warm-500 bg-cream-200 px-2.5 py-1 rounded-full border border-warm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-slow" />
          100% Free · No Signup
        </span>
      </div>
    </motion.header>
  );
}
