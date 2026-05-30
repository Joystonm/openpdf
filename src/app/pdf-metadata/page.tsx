"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDocument } from "pdf-lib";
import DropZone from "@/components/DropZone";
import { formatBytes, pdfBlob } from "@/lib/utils";

type State = "idle" | "loaded" | "done";

interface Meta {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}

export default function PdfMetadataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<State>("idle");
  const [meta, setMeta] = useState<Meta>({ title: "", author: "", subject: "", keywords: "", creator: "", producer: "" });
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [docRef, setDocRef] = useState<PDFDocument | null>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    const buf = await f.arrayBuffer();
    const doc = await PDFDocument.load(buf);
    setDocRef(doc);
    setMeta({
      title:    doc.getTitle()    ?? "",
      author:   doc.getAuthor()   ?? "",
      subject:  doc.getSubject()  ?? "",
      keywords: doc.getKeywords() ?? "",
      creator:  doc.getCreator()  ?? "",
      producer: doc.getProducer() ?? "",
    });
    setStatus("loaded");
    setResult(null);
  }, []);

  const apply = useCallback(async () => {
    if (!docRef) return;
    docRef.setTitle(meta.title);
    docRef.setAuthor(meta.author);
    docRef.setSubject(meta.subject);
    docRef.setKeywords(meta.keywords ? [meta.keywords] : []);
    docRef.setCreator(meta.creator);
    docRef.setProducer(meta.producer);
    setResult(await docRef.save());
    setStatus("done");
  }, [docRef, meta]);

  const download = () => {
    if (!result || !file) return;
    const url = URL.createObjectURL(pdfBlob(result));
    Object.assign(document.createElement("a"), { href: url, download: file.name.replace(".pdf", "_meta.pdf") }).click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setFile(null); setStatus("idle"); setResult(null); setDocRef(null); };

  const FIELDS: { key: keyof Meta; label: string; placeholder: string }[] = [
    { key: "title",    label: "Title",    placeholder: "Document title" },
    { key: "author",   label: "Author",   placeholder: "Author name" },
    { key: "subject",  label: "Subject",  placeholder: "Subject or description" },
    { key: "keywords", label: "Keywords", placeholder: "keyword1, keyword2" },
    { key: "creator",  label: "Creator",  placeholder: "Application that created it" },
    { key: "producer", label: "Producer", placeholder: "PDF producer" },
  ];

  return (
    <main className="min-h-screen pt-14">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-warm mb-5">
            <span className="text-2xl">🏷️</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 mb-3">PDF Metadata</h1>
          <p className="text-warm-500 text-lg">View and edit the title, author, and other metadata of a PDF.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFiles={handleFiles} className="min-h-[220px]" />
            </motion.div>
          )}

          {(status === "loaded" || status === "done") && file && (
            <motion.div key="edit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="bg-white border border-warm rounded-2xl p-4 flex items-center gap-3 shadow-warm">
                <div className="w-10 h-12 rounded-lg gradient-coral flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="16" viewBox="0 0 14 16" fill="none"><path d="M2 2h7l3 3v9H2V2z" fill="white" fillOpacity="0.9"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-warm-800 text-sm truncate">{file.name}</p>
                  <p className="text-xs text-warm-400 mt-0.5">{formatBytes(file.size)}</p>
                </div>
              </div>

              <div className="bg-white border border-warm rounded-2xl p-5 shadow-warm space-y-3">
                {FIELDS.map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-warm-600 block mb-1">{label}</label>
                    <input
                      value={meta[key]}
                      onChange={(e) => setMeta((m) => ({ ...m, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full border border-warm rounded-xl px-3 py-2 text-sm text-warm-900 focus:outline-none focus:border-coral-400 bg-white"
                    />
                  </div>
                ))}
              </div>

              {status === "done" && (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl py-2.5 px-4">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="text-sm font-semibold">Metadata saved</span>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={apply} className="flex-1 gradient-coral text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.01] transition-all">
                  Save Metadata
                </button>
                {status === "done" && (
                  <button onClick={download} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-warm transition-all">
                    Download
                  </button>
                )}
                <button onClick={reset} className="px-5 py-3.5 rounded-xl border border-warm bg-white text-warm-700 font-semibold hover:bg-cream-100 transition-colors">
                  New
                </button>
              </div>
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
