import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8080";

const IMAGE_MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const AUDIO_MIME_EXT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

const ALLOWED_FOLDERS = new Set([
  "cover",
  "music",
  "couples",
  "dresscode",
  "gallery",
  "story",
  "wishlist",
  "wedding",
]);

async function verifyToken(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  try {
    const res = await fetch(`${BACKEND_URL}/v1/auth/profile`, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyToken(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Body harus multipart/form-data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  const folder = String(formData.get("folder") || "cover");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Field 'file' wajib diisi" }, { status: 400 });
  }
  if (!ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json(
      { error: `Folder tidak dikenal. Gunakan salah satu dari: ${[...ALLOWED_FOLDERS].join(", ")}` },
      { status: 400 }
    );
  }

  const ext = IMAGE_MIME_EXT[file.type] ?? AUDIO_MIME_EXT[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: `Tipe file ${file.type || "tidak dikenal"} tidak didukung` },
      { status: 400 }
    );
  }

  const isImage = file.type in IMAGE_MIME_EXT;
  const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return NextResponse.json(
      { error: `Ukuran file melebihi batas ${maxMb}MB` },
      { status: 400 }
    );
  }

  const now = new Date();
  const yyyyMm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const fileName = `${randomUUID()}.${ext}`;
  const relativeDir = path.join("uploads", yyyyMm);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);

  try {
    await mkdir(absoluteDir, { recursive: true });
    await writeFile(path.join(absoluteDir, fileName), Buffer.from(await file.arrayBuffer()));
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan file" }, { status: 500 });
  }

  return NextResponse.json({ path: `/${relativeDir}/${fileName}` }, { status: 201 });
}

// Hapus file hasil upload (dipakai saat admin mengganti/mengosongkan slot media
// agar folder public/uploads tidak membengkak).
export async function DELETE(request: NextRequest) {
  if (!(await verifyToken(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url).searchParams.get("url") ?? "";
  if (!url.startsWith("/uploads/") || url.includes("..")) {
    return NextResponse.json(
      { error: "URL file tidak valid — harus diawali /uploads/" },
      { status: 400 }
    );
  }

  const absolute = path.join(process.cwd(), "public", url.slice(1));
  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  if (!absolute.startsWith(uploadsRoot + path.sep)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  try {
    await unlink(absolute);
  } catch {
    // File memang sudah tidak ada — anggap berhasil.
  }

  return NextResponse.json({ ok: true });
}
