import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadEventImage } from "../api/admin";
import type { MediaAsset } from "../types/api";

interface ImageUploadProps {
  label: string;
  value?: MediaAsset;
  onChange: (value: MediaAsset | undefined) => void;
  aspect?: "banner" | "square";
}

const maxSizeBytes = 5 * 1024 * 1024;

export const ImageUpload = ({ label, value, onChange, aspect = "square" }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > maxSizeBytes) {
      toast.error("Image must be 5MB or smaller");
      return;
    }
    setUploading(true);
    try {
      onChange(await uploadEventImage(file));
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</p>
      <div
        className={`relative mt-2 overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-white/15 dark:bg-white/5 ${
          aspect === "banner" ? "aspect-[21/9] w-full" : "size-20"
        }`}
      >
        {value?.url ? (
          <>
            <img src={value.url} alt={label} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="grid size-full place-items-center gap-1 text-slate-400 hover:text-slate-600 disabled:opacity-60 dark:hover:text-slate-300"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
            <span className="text-[10px] font-semibold">{uploading ? "Uploading…" : "Upload image"}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void pick(event.target.files?.[0])}
      />
    </div>
  );
};
