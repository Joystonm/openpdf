"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  children?: React.ReactNode;
  label?: string;
  sublabel?: string;
}

export default function DropZone({
  onFiles,
  accept = ".pdf",
  multiple = false,
  className,
  children,
  label = "Drop your PDF here",
  sublabel = "or click to browse",
}: DropZoneProps) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        accept === ".pdf" ? f.type === "application/pdf" : true
      );
      if (files.length) onFiles(files);
    },
    [onFiles, accept]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length) onFiles(files);
      e.target.value = "";
    },
    [onFiles]
  );

  return (
    <label
      className={cn(
        "relative flex flex-col items-center justify-center cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 select-none",
        dragging
          ? "border-coral-400 bg-coral-50 shadow-warm-lg scale-[1.01]"
          : "border-cream-400 bg-cream-50 hover:border-coral-300 hover:bg-cream-100",
        className
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={handleChange}
      />

      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-2xl bg-coral-500/5 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {children || (
        <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
          <motion.div
            animate={dragging ? { scale: 1.15, rotate: -3 } : { scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-14 h-14 rounded-2xl gradient-coral flex items-center justify-center shadow-warm"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </motion.div>
          <div>
            <p className="font-semibold text-warm-800 text-lg">{label}</p>
            <p className="text-sm text-warm-500 mt-0.5">{sublabel}</p>
          </div>
          <p className="text-xs text-warm-400">Files processed locally · Never uploaded to servers</p>
        </div>
      )}
    </label>
  );
}
