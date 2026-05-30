"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  color?: "coral" | "emerald" | "indigo";
}

const colorMap = {
  coral: "from-coral-400 to-coral-600",
  emerald: "from-emerald-400 to-emerald-600",
  indigo: "from-indigo-400 to-indigo-600",
};

export default function ProgressBar({
  value,
  className,
  showLabel = true,
  color = "coral",
}: ProgressBarProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-1.5">
        {showLabel && (
          <span className="text-xs text-warm-500">Processing…</span>
        )}
        {showLabel && (
          <span className="text-xs font-medium text-warm-700">{Math.round(value)}%</span>
        )}
      </div>
      <div className="h-1.5 bg-cream-300 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", colorMap[color])}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
