import { AlertCircle, Camera, CheckCircle2, ImagePlus, Loader2, RefreshCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 5 * 1024 * 1024;
const maxAnalysisDimension = 720;

type UploadKind = "selfie" | "id-card";

interface VerificationOutcome {
  ok: boolean;
  message: string;
}

const loadImage = async (file: File): Promise<HTMLImageElement> => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read the selected image."));
    };
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the selected image."));
    image.src = dataUrl;
  });
};

const createAnalysisCanvas = (image: HTMLImageElement) => {
  const scale = Math.min(1, maxAnalysisDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Image analysis is unavailable in this browser.");
  }

  context.drawImage(image, 0, 0, width, height);
  return { canvas, context };
};

const analyzeLuma = (data: Uint8ClampedArray) => {
  let sum = 0;
  let sumSquares = 0;

  for (let index = 0; index < data.length; index += 4) {
    const luma = data[index]! * 0.299 + data[index + 1]! * 0.587 + data[index + 2]! * 0.114;
    sum += luma;
    sumSquares += luma * luma;
  }

  const pixelCount = data.length / 4;
  const mean = sum / pixelCount;
  const variance = sumSquares / pixelCount - mean * mean;
  return { mean, variance };
};

const analyzeRegionTexture = (data: Uint8ClampedArray, width: number, height: number, left: number, top: number, right: number, bottom: number) => {
  let edgePixels = 0;
  let graySum = 0;
  let graySumSquares = 0;
  let sampleCount = 0;

  for (let y = Math.max(1, top); y < Math.min(height, bottom + 1); y += 1) {
    for (let x = Math.max(1, left); x < Math.min(width, right + 1); x += 1) {
      const pixel = (y * width + x) * 4;
      const gray = data[pixel]! * 0.299 + data[pixel + 1]! * 0.587 + data[pixel + 2]! * 0.114;
      const leftGray = data[pixel - 4]! * 0.299 + data[pixel - 3]! * 0.587 + data[pixel - 2]! * 0.114;
      const topPixel = ((y - 1) * width + x) * 4;
      const topGray = data[topPixel]! * 0.299 + data[topPixel + 1]! * 0.587 + data[topPixel + 2]! * 0.114;

      graySum += gray;
      graySumSquares += gray * gray;
      sampleCount += 1;

      const delta = Math.abs(gray - leftGray) + Math.abs(gray - topGray);
      if (delta > 40) {
        edgePixels += 1;
      }
    }
  }

  const mean = graySum / Math.max(1, sampleCount);
  const variance = graySumSquares / Math.max(1, sampleCount) - mean * mean;
  const edgeDensity = edgePixels / Math.max(1, sampleCount);

  return { mean, variance, edgeDensity, sampleCount };
};

const analyzeDocumentLikeImage = (data: Uint8ClampedArray, width: number, height: number) => {
  const grayscale = new Float32Array(width * height);
  let sum = 0;
  let sumSquares = 0;

  for (let index = 0, pixel = 0; index < data.length; index += 4, pixel += 1) {
    const luma = data[index]! * 0.299 + data[index + 1]! * 0.587 + data[index + 2]! * 0.114;
    grayscale[pixel] = luma;
    sum += luma;
    sumSquares += luma * luma;
  }

  let strongEdges = 0;

  for (let y = 1; y < height; y += 1) {
    for (let x = 1; x < width; x += 1) {
      const pixel = y * width + x;
      const current = grayscale[pixel]!;
      const left = grayscale[pixel - 1]!;
      const top = grayscale[pixel - width]!;
      const delta = Math.abs(current - left) + Math.abs(current - top);
      if (delta > 42) {
        strongEdges += 1;
      }
    }
  }

  const border = Math.max(8, Math.round(Math.min(width, height) * 0.05));
  let borderSum = 0;
  let borderCount = 0;
  let centerSum = 0;
  let centerCount = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = y * width + x;
      const value = grayscale[pixel]!;
      const isBorder = x < border || y < border || x >= width - border || y >= height - border;

      if (isBorder) {
        borderSum += value;
        borderCount += 1;
      } else {
        centerSum += value;
        centerCount += 1;
      }
    }
  }

  const pixelCount = width * height;
  const mean = sum / pixelCount;
  const variance = sumSquares / pixelCount - mean * mean;
  const edgeDensity = strongEdges / pixelCount;
  const borderContrast = Math.abs(borderSum / Math.max(1, borderCount) - centerSum / Math.max(1, centerCount));

  return { mean, variance, edgeDensity, borderContrast };
};

const analyzeRegionPattern = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  left: number,
  top: number,
  right: number,
  bottom: number
) => {
  let sum = 0;
  let sumSquares = 0;
  let edgePixels = 0;
  let darkPixels = 0;
  let transitions = 0;
  let sampleCount = 0;

  const startY = Math.max(1, top);
  const endY = Math.min(height - 1, bottom);
  const startX = Math.max(1, left);
  const endX = Math.min(width - 1, right);

  for (let y = startY; y <= endY; y += 1) {
    let previousIsDark: boolean | undefined;

    for (let x = startX; x <= endX; x += 1) {
      const pixel = (y * width + x) * 4;
      const gray = data[pixel]! * 0.299 + data[pixel + 1]! * 0.587 + data[pixel + 2]! * 0.114;
      const leftGray = data[pixel - 4]! * 0.299 + data[pixel - 3]! * 0.587 + data[pixel - 2]! * 0.114;
      const topPixel = ((y - 1) * width + x) * 4;
      const topGray = data[topPixel]! * 0.299 + data[topPixel + 1]! * 0.587 + data[topPixel + 2]! * 0.114;

      sum += gray;
      sumSquares += gray * gray;
      sampleCount += 1;

      const delta = Math.abs(gray - leftGray) + Math.abs(gray - topGray);
      if (delta > 40) {
        edgePixels += 1;
      }

      if (gray < 120) {
        darkPixels += 1;
      }

      const isDark = gray < 120;
      if (previousIsDark !== undefined && previousIsDark !== isDark) {
        transitions += 1;
      }
      previousIsDark = isDark;
    }
  }

  const mean = sum / Math.max(1, sampleCount);
  const variance = sumSquares / Math.max(1, sampleCount) - mean * mean;
  const edgeDensity = edgePixels / Math.max(1, sampleCount);
  const darkRatio = darkPixels / Math.max(1, sampleCount);
  const transitionDensity = transitions / Math.max(1, sampleCount);

  return { mean, variance, edgeDensity, darkRatio, transitionDensity, sampleCount };
};

const detectQrLikeRegion = (data: Uint8ClampedArray, width: number, height: number) => {
  const size = Math.max(56, Math.round(Math.min(width, height) * 0.18));
  const step = Math.max(20, Math.round(size * 0.35));

  for (let top = 0; top + size <= height; top += step) {
    for (let left = 0; left + size <= width; left += step) {
      const metrics = analyzeRegionPattern(data, width, height, left, top, left + size - 1, top + size - 1);
      if (
        metrics.sampleCount > 0 &&
        metrics.variance > 550 &&
        metrics.edgeDensity > 0.08 &&
        metrics.darkRatio > 0.18 &&
        metrics.darkRatio < 0.72 &&
        metrics.transitionDensity > 0.04
      ) {
        return true;
      }
    }
  }

  return false;
};

const detectTextBands = (data: Uint8ClampedArray, width: number, height: number) => {
  const bands = [
    { top: Math.round(height * 0.14), bottom: Math.round(height * 0.34) },
    { top: Math.round(height * 0.38), bottom: Math.round(height * 0.58) },
    { top: Math.round(height * 0.62), bottom: Math.round(height * 0.82) }
  ];

  return bands.map((band) =>
    analyzeRegionPattern(data, width, height, Math.round(width * 0.08), band.top, Math.round(width * 0.92), band.bottom)
  );
};

const analyzeSelfieLikeImage = (data: Uint8ClampedArray, width: number, height: number) => {
  const centerLeft = Math.round(width * 0.25);
  const centerRight = Math.round(width * 0.75);
  const centerTop = Math.round(height * 0.08);
  const centerBottom = Math.round(height * 0.82);

  let skinCount = 0;
  let skinLeft = width;
  let skinRight = 0;
  let skinTop = height;
  let skinBottom = 0;
  let centerSkinCount = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = (y * width + x) * 4;
      const red = data[pixel]!;
      const green = data[pixel + 1]!;
      const blue = data[pixel + 2]!;
      const isSkinLike =
        red > 95 &&
        green > 40 &&
        blue > 20 &&
        Math.max(red, green, blue) - Math.min(red, green, blue) > 15 &&
        Math.abs(red - green) > 15 &&
        red > green &&
        red > blue;

      if (!isSkinLike) {
        continue;
      }

      skinCount += 1;
      if (x < skinLeft) skinLeft = x;
      if (x > skinRight) skinRight = x;
      if (y < skinTop) skinTop = y;
      if (y > skinBottom) skinBottom = y;

      if (x >= centerLeft && x <= centerRight && y >= centerTop && y <= centerBottom) {
        centerSkinCount += 1;
      }
    }
  }

  if (skinCount === 0) {
    return {
      ok: false,
      message: "No face was detected. Keep your face centered, well lit, and fully visible."
    };
  }

  const faceWidth = skinRight - skinLeft + 1;
  const faceHeight = skinBottom - skinTop + 1;
  const faceRatio = faceWidth / faceHeight;
  const widthRatio = faceWidth / width;
  const heightRatio = faceHeight / height;
  const leftMargin = skinLeft / width;
  const rightMargin = (width - skinRight - 1) / width;
  const centerCoverage = centerSkinCount / skinCount;
  const centerOffset = Math.abs((skinLeft + skinRight) / 2 / width - 0.5);
  const horizontalGap = Math.min(leftMargin, rightMargin);
  const horizontalImbalance = Math.abs(leftMargin - rightMargin);
  const skinCoverage = skinCount / (faceWidth * faceHeight);
  const faceTexture = analyzeRegionTexture(data, width, height, skinLeft, skinTop, skinRight, skinBottom);

  if (skinCount < width * height * 0.01) {
    return {
      ok: false,
      message: "The selfie is too empty. Move closer so your face fills the frame."
    };
  }

  if (faceRatio < 0.55 || faceRatio > 1.45) {
    return {
      ok: false,
      message: "The image does not look like a centered face. Turn toward the camera and try again."
    };
  }

  if (widthRatio < 0.18 || heightRatio < 0.22) {
    return {
      ok: false,
      message: "Move closer so the face is clear enough for verification."
    };
  }

  if (widthRatio > 0.72 || heightRatio > 0.88) {
    return {
      ok: false,
      message: "Step back slightly so the full face and both sides stay in frame."
    };
  }

  if (horizontalGap < 0.035 && horizontalImbalance > 0.12) {
    return {
      ok: false,
      message: "Reframe the selfie so the face is centered with visible space on both sides."
    };
  }

  if (centerOffset > 0.18 || centerCoverage < 0.5) {
    return {
      ok: false,
      message: "Center your face in the camera before capturing."
    };
  }

  if (skinCoverage > 0.9 && faceTexture.edgeDensity < 0.018) {
    return {
      ok: false,
      message: "Keep your face visible and avoid covering it with your hand."
    };
  }

  return { ok: true, message: "Selfie approved." };
};

const verifySelfie = async (file: File): Promise<VerificationOutcome> => {
  const image = await loadImage(file);
  const { canvas, context } = createAnalysisCanvas(image);
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const { mean, variance } = analyzeLuma(data);

  if (mean < 45 || mean > 235) {
    return { ok: false, message: "The selfie is too dark or too bright. Try again in even lighting." };
  }

  if (variance < 900) {
    return { ok: false, message: "The selfie is too flat or blurry. Keep the camera steady and try again." };
  }

  return analyzeSelfieLikeImage(data, canvas.width, canvas.height);
};

const verifyIdCard = async (file: File): Promise<VerificationOutcome> => {
  const image = await loadImage(file);
  const { canvas, context } = createAnalysisCanvas(image);
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const { mean, variance, edgeDensity, borderContrast } = analyzeDocumentLikeImage(
    data,
    canvas.width,
    canvas.height
  );
  const textBands = detectTextBands(data, canvas.width, canvas.height);
  const qrLikeRegion = detectQrLikeRegion(data, canvas.width, canvas.height);
  const readableBands = textBands.filter(
    (band) =>
      band.variance > 250 &&
      band.edgeDensity > 0.03 &&
      band.darkRatio > 0.06 &&
      band.darkRatio < 0.7 &&
      band.transitionDensity > 0.02
  ).length;

  const aspectRatio = image.width / image.height;
  const portraitRatio = image.height / image.width;

  if (!(aspectRatio > 1.15 && aspectRatio < 1.85) && !(portraitRatio > 1.15 && portraitRatio < 1.85)) {
    return { ok: false, message: "The upload does not look like a full ID card. Keep the card flat and fill more of the frame." };
  }

  if (mean < 40 || mean > 240) {
    return { ok: false, message: "The ID image is too dark or too bright. Retake it in better light." };
  }

  if (variance < 700) {
    return { ok: false, message: "The ID image looks too blurry or low contrast. Hold the camera steady and retry." };
  }

  if (edgeDensity < 0.018 && borderContrast < 4.5) {
    return { ok: false, message: "The ID card edges are not clear enough. Make sure the entire card is visible and readable." };
  }

  if (!qrLikeRegion && readableBands < 2) {
    return {
      ok: false,
      message: "The ID card does not show enough printed detail. Make sure the name, roll number, and QR or barcode are visible."
    };
  }

  return { ok: true, message: "ID card approved." };
};

export const FileUpload = ({
  label,
  hint,
  capture,
  error,
  kind = "id-card",
  validateSelection,
  onFile
}: {
  label: string;
  hint: string;
  capture?: "user" | "environment";
  error?: string;
  kind?: UploadKind;
  validateSelection?: (file: File) => Promise<string | void> | string | void;
  onFile: (file: File | undefined) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestIdRef = useRef(0);
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [status, setStatus] = useState<"idle" | "verifying" | "approved">("idle");
  const [statusMessage, setStatusMessage] = useState<string>(hint);
  const [cameraState, setCameraState] = useState<"idle" | "starting" | "ready">("idle");
  const [cameraError, setCameraError] = useState<string>();

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setCameraState("idle");
  };

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      stopCamera();
    };
  }, [preview]);

  const acceptFile = async (selected: File) => {
    if (!allowedTypes.has(selected.type)) {
      toast.error("Choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (selected.size > maxBytes) {
      toast.error("Image size must be 5 MB or less.");
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setStatus("verifying");
    setStatusMessage("Checking the image before it is accepted...");

    try {
      const outcome = kind === "selfie" ? await verifySelfie(selected) : await verifyIdCard(selected);

      if (requestIdRef.current !== requestId) {
        return;
      }

      if (!outcome.ok) {
        setStatus("idle");
        setStatusMessage(outcome.message);
        setFile(undefined);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(undefined);
        onFile(undefined);
        if (kind === "selfie") {
          setCameraState("ready");
        } else if (inputRef.current) {
          inputRef.current.value = "";
        }
        toast.error(outcome.message);
        return;
      }

      if (validateSelection) {
        const validationMessage = await validateSelection(selected);

        if (requestIdRef.current !== requestId) {
          return;
        }

        if (validationMessage) {
          setStatus("idle");
          setStatusMessage(validationMessage);
          setFile(undefined);
          if (preview) URL.revokeObjectURL(preview);
          setPreview(undefined);
          onFile(undefined);
          if (kind === "selfie") {
            setCameraState("ready");
          } else if (inputRef.current) {
            inputRef.current.value = "";
          }
          toast.error(validationMessage);
          return;
        }
      }

      const nextPreview = URL.createObjectURL(selected);
      if (preview) URL.revokeObjectURL(preview);
      setFile(selected);
      setPreview(nextPreview);
      setStatus("approved");
      setStatusMessage(outcome.message);
      onFile(selected);

      if (kind === "selfie") {
        stopCamera();
      }
    } catch (verificationError) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      const message = verificationError instanceof Error ? verificationError.message : "Image verification failed.";
      setStatus("idle");
      setStatusMessage(message);
      setFile(undefined);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(undefined);
      onFile(undefined);
      if (kind === "selfie") {
        setCameraState("ready");
      } else if (inputRef.current) {
        inputRef.current.value = "";
      }
      toast.error(message);
    }
  };

  const selectFile = async (selected?: File) => {
    if (!selected) return;
    await acceptFile(selected);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser does not support camera access.");
      toast.error("This browser does not support camera access.");
      return;
    }

    setCameraError(undefined);
    setCameraState("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        throw new Error("Camera preview is not available.");
      }

      video.srcObject = stream;
      await video.play();
      setCameraState("ready");
      setStatusMessage("Keep your face centered, then capture the selfie.");
    } catch (cameraAccessError) {
      stopCamera();
      const message = cameraAccessError instanceof Error ? cameraAccessError.message : "Unable to open the camera.";
      setCameraError(message);
      toast.error(message);
    }
  };

  const captureSelfie = async () => {
    if (kind !== "selfie") {
      return;
    }

    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error("Open the camera first.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      toast.error("Unable to capture the selfie.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) {
      toast.error("Unable to capture the selfie.");
      return;
    }

    const captureFile = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
    await acceptFile(captureFile);
  };

  const clear = () => {
    setFile(undefined);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(undefined);
    setStatus("idle");
    setStatusMessage(hint);
    onFile(undefined);
    if (kind === "selfie") {
      startCamera().catch(() => undefined);
    } else if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const currentStatusIcon =
    status === "verifying" ? (
      <Loader2 size={14} className="mt-0.5 shrink-0 animate-spin text-emerald-600 dark:text-mint-300" />
    ) : status === "approved" ? (
      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600 dark:text-mint-300" />
    ) : (
      <AlertCircle size={14} className="mt-0.5 shrink-0 text-slate-400" />
    );

  const statusClass = error
    ? "text-rose-600 dark:text-rose-300"
    : status === "approved"
      ? "text-emerald-700 dark:text-mint-300"
      : "text-slate-500 dark:text-slate-400";

  const selfieMode = kind === "selfie";

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
        {selfieMode ? (
          preview ? (
            <div className="relative h-44">
              <img src={preview} alt={`${label} preview`} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink-950/75 p-3 text-xs text-white backdrop-blur">
                <span className="flex min-w-0 items-center gap-2 truncate">
                  {status === "approved" ? (
                    <CheckCircle2 size={15} className="shrink-0 text-mint-300" />
                  ) : (
                    <Loader2 size={15} className="shrink-0 animate-spin text-mint-300" />
                  )}
                  {file?.name}
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={clear} className="rounded-lg p-1 hover:bg-white/10" aria-label={`Retake ${label}`}>
                    <RefreshCcw size={16} />
                  </button>
                  <button type="button" onClick={clear} className="rounded-lg p-1 hover:bg-white/10" aria-label={`Remove ${label}`}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="overflow-hidden rounded-2xl bg-ink-950/90">
                <video ref={videoRef} className="h-56 w-full object-cover" playsInline muted autoPlay />
                <div className="border-t border-white/10 px-4 py-3 text-xs text-white/80">
                  {cameraState === "starting" ? "Opening camera..." : "Use the live camera, center your face, then capture."}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="focus-ring inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <Camera size={16} />
                  {cameraState === "idle" ? "Open selfie camera" : cameraState === "starting" ? "Opening..." : "Restart camera"}
                </button>
                <button
                  type="button"
                  onClick={() => void captureSelfie()}
                  disabled={cameraState !== "ready"}
                  className="focus-ring inline-flex items-center gap-2 rounded-xl border border-emerald-600 px-4 py-2 text-sm font-bold text-emerald-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 dark:border-mint-300 dark:text-mint-300"
                >
                  <Camera size={16} />
                  Capture selfie
                </button>
              </div>
            </div>
          )
        ) : preview ? (
          <div className="relative h-44">
            <img src={preview} alt={`${label} preview`} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink-950/75 p-3 text-xs text-white backdrop-blur">
              <span className="flex min-w-0 items-center gap-2 truncate">
                {status === "approved" ? (
                  <CheckCircle2 size={15} className="shrink-0 text-mint-300" />
                ) : (
                  <Loader2 size={15} className="shrink-0 animate-spin text-mint-300" />
                )}
                {file?.name}
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
              <ImagePlus size={21} />
            </span>
            <span className="mt-3 text-sm font-bold text-ink-950 dark:text-white">Choose image</span>
            <span className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</span>
          </button>
        )}
        {!selfieMode && (
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture={capture}
            className="sr-only"
            onChange={(event) => void selectFile(event.target.files?.[0])}
          />
        )}
      </div>
      {selfieMode && cameraError ? <p className="mt-1.5 text-xs font-semibold text-rose-600 dark:text-rose-300">{cameraError}</p> : null}
      <div className="mt-1.5 flex items-start gap-2 text-xs font-semibold">
        {currentStatusIcon}
        <span className={statusClass}>{error ?? statusMessage}</span>
      </div>
    </div>
  );
};
