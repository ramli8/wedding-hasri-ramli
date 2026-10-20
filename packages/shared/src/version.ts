/**
 * Versi kontrak sinkronisasi perangkat (lihat docs/rancangan.md §6.7).
 * Naikkan hanya untuk perubahan yang merusak; perubahan aditif tidak menaikkan versi.
 */
export const SYNC_PROTOCOL_VERSION = 1;

/** Header yang dikirim perangkat pada setiap request /device/* dan /sync/*. */
export const SYNC_VERSION_HEADER = "x-sync-version";

/** Versi protokol terendah yang masih diterima server. Perangkat di bawah ini harus memperbarui aplikasi. */
export const MIN_SUPPORTED_SYNC_VERSION = 1;
