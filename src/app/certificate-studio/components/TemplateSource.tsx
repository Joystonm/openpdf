"use client";

interface Props {
  onUpload: (dataUrl: string) => void;
}

export default function TemplateSource({ onUpload }: Props) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpload(ev.target!.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-xl mx-auto py-12">
      <label className="group flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/10 hover:border-purple-500/60 rounded-2xl p-16 cursor-pointer transition-all bg-warm-800/40 hover:bg-purple-500/5">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
          🖼️
        </div>
        <div className="text-center">
          <p className="text-cream-200 font-semibold text-lg">Upload your certificate design</p>
          <p className="text-warm-400 text-sm mt-1">PNG, JPG, JPEG — any size</p>
        </div>
        <input type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleFile} />
      </label>
    </div>
  );
}
