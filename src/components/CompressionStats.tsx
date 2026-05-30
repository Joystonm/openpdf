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
  const isCompressed = saved > 0;
  const percentageChange = originalSize > 0 ? Math.round((Math.abs(saved) / originalSize) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-warm bg-white shadow-warm p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-warm-700">Compression Result</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          isCompressed
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-orange-50 text-orange-700 border border-orange-200"
        }`}>
          {isCompressed ? `${percentageChange}% smaller` : `${percentageChange}% larger`}
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
            <span className={`font-medium ${isCompressed ? "text-emerald-600" : "text-orange-600"}`}>
              {formatBytes(compressedSize)}
            </span>
          </div>
          <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                isCompressed
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                  : "bg-gradient-to-r from-orange-400 to-orange-500"
              }`}
              initial={{ width: "100%" }}
              animate={{ width: `${Math.min(100, (compressedSize / originalSize) * 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-1 border-t border-warm">
        <div className="text-center">
          <p className={`text-2xl font-bold ${isCompressed ? "text-emerald-600" : "text-orange-600"}`}>
            {percentageChange}%
          </p>
          <p className="text-xs text-warm-500">{isCompressed ? "size reduction" : "size increase"}</p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${isCompressed ? "text-warm-800" : "text-orange-600"}`}>
            {formatBytes(Math.abs(saved))}
          </p>
          <p className="text-xs text-warm-500">{isCompressed ? "saved" : "added"}</p>
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
