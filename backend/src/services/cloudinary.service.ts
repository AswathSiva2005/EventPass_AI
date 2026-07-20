import { Readable } from "node:stream";
import type { UploadApiOptions, UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary.js";
import { AppError } from "../utils/app-error.js";

export const uploadBuffer = (
  buffer: Buffer,
  options: UploadApiOptions = {}
): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        reject(new AppError("Media upload failed", 502, "MEDIA_UPLOAD_FAILED", error));
        return;
      }
      resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });

export const deleteAsset = async (publicId: string): Promise<void> => {
  const result: unknown = await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    resource_type: "image"
  });

  const deletionStatus =
    typeof result === "object" && result !== null && "result" in result
      ? String(result.result)
      : "unknown";

  if (!["ok", "not found"].includes(deletionStatus)) {
    throw new AppError("Media deletion failed", 502, "MEDIA_DELETE_FAILED");
  }
};
