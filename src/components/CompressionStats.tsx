"use client";

import { motion } from "framer-motion";
import { formatBytes } from "@/lib/utils";

interface CompressionStatsProps {
  originalSize: number;
  compressedSize: number;
  processingTime?: number;
}

export default function CompressionStats({
  originalSize,
  compressedSize,
  processingTime,
}: CompressionStatsProps) {
  const saved = originalSize - compressedSize;
  const reduction = originalSize > 0 ? Math.round((saved / originalSize) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-warm bg-white shadow-warm p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-warm-700">Compression Result</span>
        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
          {reduction}% smaller
        </span>
      </div>

      {/* Visual bars */}
      <div className="space-y-2.5">
        <div>
          <div className="flex justify-between text-xs text-warm-500 mb-1">
            <span>Original</span>
            <span className="font-medium text-warm-700">{formatBytes(originalSize)}</span>
          </div>
          <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
            <div className="h-full bg-warm-400 rounded-full w-full" />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-warm-500 mb-1">
            <span>Compressed</span>
            <span className="font-medium text-emerald-600">{formatBytes(compressedSize)}</span>
          </div>
          <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
              initial={{ width: "100%" }}
              animate={{ width: `${Math.min(100, Math.max(0, 100 - reduction))}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-1 border-t border-warm">
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600">{reduction}%</p>
          <p className="text-xs text-warm-500">size reduction</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-warm-800">{saved > 0 ? formatBytes(saved) : "0 B"}</p>
          <p className="text-xs text-warm-500">saved</p>
        </div>
        {processingTime && (
          <div className="text-center">
            <p className="text-2xl font-bold text-warm-800">{processingTime.toFixed(1)}s</p>
            <p className="text-xs text-warm-500">processed in</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
