import { Camera, CheckCircle2, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 5 * 1024 * 1024;

export const FileUpload = ({
  label,
  hint,
  capture,
  error,
  onFile
}: {
  label: string;
  hint: string;
  capture?: "user" | "environment";
  error?: string;
  onFile: (file: File | undefined) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string>();

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const selectFile = (selected?: File) => {
    if (!selected) return;
    if (!allowedTypes.has(selected.type)) {
      toast.error("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (selected.size > maxBytes) {
      toast.error("Image size must be 5 MB or less.");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    onFile(selected);
  };

  const clear = () => {
    setFile(undefined);
    setPreview(undefined);
    onFile(undefined);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-bold text-ink-950 dark:text-white">{label}</label>
        <span className="text-[11px] font-bold text-slate-400">MAX 5 MB</span>
      </div>
      <div
        className={`relative overflow-hidden rounded-2xl border border-dashed transition ${
          error
            ? "border-rose-400 bg-rose-50/60 dark:bg-rose-400/5"
            : "border-slate-300 bg-slate-50 hover:border-emerald-500 dark:border-white/15 dark:bg-white/[0.03]"
        }`}
      >
        {preview ? (
          <div className="relative h-44">
            <img src={preview} alt={`${label} preview`} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink-950/75 p-3 text-xs text-white backdrop-blur">
              <span className="flex min-w-0 items-center gap-2 truncate">
                <CheckCircle2 size={15} className="shrink-0 text-mint-300" /> {file?.name}
              </span>
              <button type="button" onClick={clear} className="rounded-lg p-1 hover:bg-white/10" aria-label={`Remove ${label}`}>
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="focus-ring flex h-44 w-full flex-col items-center justify-center px-5 text-center"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-mint-300/10 dark:text-mint-300">
              {capture ? <Camera size={21} /> : <ImagePlus size={21} />}
            </span>
            <span className="mt-3 text-sm font-bold text-ink-950 dark:text-white">Choose image</span>
            <span className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture={capture}
          className="sr-only"
          onChange={(event) => selectFile(event.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-1.5 text-xs font-semibold text-rose-600 dark:text-rose-300">{error}</p>}
    </div>
  );
};
