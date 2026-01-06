import { NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const CLOUDINARY_BACKOFF_MS = 5 * 60 * 1000; // 5 minutes

let cloudinaryDisabledUntil = 0;

function guessExtension(file: File) {
  const extFromName = path.extname(file.name || "").toLowerCase();
  const allowed = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".ico"]);
  if (allowed.has(extFromName)) return extFromName;

  const byMime: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
    "image/x-icon": ".ico",
    "image/vnd.microsoft.icon": ".ico",
  };

  return byMime[file.type] ?? ".jpg";
}

async function saveToPublicUploads(file: File, buffer: Buffer) {
  const ext = guessExtension(file);
  const filename = `${randomUUID()}${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "only images are supported" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "file too large (max 10MB)" },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (Date.now() < cloudinaryDisabledUntil) {
      const url = await saveToPublicUploads(file, buffer);
      return NextResponse.json({ url, publicId: null, storage: "local" });
    }

    try {
      const cloudinary = getCloudinary();
      const uploaded = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "auto-market",
            resource_type: "image",
            filename: file.name,
            timeout: 120000,
            disable_promises: true,
          },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );

        stream.end(buffer);
      });

      return NextResponse.json({
        url: uploaded.secure_url ?? uploaded.url,
        publicId: uploaded.public_id ?? null,
        width: uploaded.width ?? null,
        height: uploaded.height ?? null,
        storage: "cloudinary",
      });
    } catch (e: any) {
      // Если Cloudinary недоступен (таймаут/сеть), сохраним локально для dev.
      console.error("CLOUDINARY UPLOAD FAILED, fallback to local:", e);
      cloudinaryDisabledUntil = Date.now() + CLOUDINARY_BACKOFF_MS;
      const url = await saveToPublicUploads(file, buffer);
      return NextResponse.json({ url, publicId: null, storage: "local" });
    }
  } catch (e: any) {
    console.error("UPLOAD IMAGE ERROR:", e);
    const message =
      e?.message ??
      e?.error?.message ??
      (typeof e === "string" ? e : "Internal error");

    const status =
      e?.name === "TimeoutError" || message === "Request Timeout" ? 504 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
