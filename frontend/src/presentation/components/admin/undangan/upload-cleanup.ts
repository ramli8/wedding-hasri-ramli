import { useAuthStore } from "@/src/infrastructure/stores/auth-store";

/**
 * Hapus file hasil upload dari public/uploads lewat DELETE /api/upload.
 * Fire-and-forget: kegagalan diabaikan (file mungkin sudah terhapus).
 */
export function deleteUploadedFiles(urls: (string | null | undefined)[]): void {
  const stale = urls.filter(
    (url): url is string => typeof url === "string" && url.startsWith("/uploads/")
  );
  for (const url of stale) {
    const { accessToken } = useAuthStore.getState();
    fetch(`/api/upload?url=${encodeURIComponent(url)}`, {
      method: "DELETE",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    }).catch(() => undefined);
  }
}
