#!/bin/sh
# Satu putaran cadangan: dump database -> verifikasi -> unggah, lalu salin foto dan bersihkan yang lama.
#
# Variabel:
#   DATABASE_URL            koneksi Postgres (wajib)
#   BACKUP_DEST             tujuan rclone, mis. r2:nama-bucket/prod, atau folder lokal (wajib)
#   MEDIA_DIR               folder foto (bawaan /data/media)
#   BACKUP_RETENTION_DAYS   umur maksimal dump (bawaan 30); 10 dump terbaru selalu disimpan
#   BACKUP_PING_URL         opsional: dipanggil (GET) saat berhasil, dan ${URL}/fail saat gagal
set -eu

: "${DATABASE_URL:?isi DATABASE_URL}"
: "${BACKUP_DEST:?isi BACKUP_DEST}"
MEDIA_DIR="${MEDIA_DIR:-/data/media}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
KEEP_LATEST=10

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

log() { echo "[$(date -u +%FT%TZ)] $*"; }
ping() { [ -n "${BACKUP_PING_URL:-}" ] && wget -q -O /dev/null -T 10 "$BACKUP_PING_URL$1" || true; }
fail() { log "GAGAL: $*"; ping /fail; exit 1; }

DUMP="$WORK/db-$STAMP.dump"
log "dump database"
pg_dump --format=custom --no-owner --no-privileges --file="$DUMP" "$DATABASE_URL" \
  || fail "pg_dump"
# Dump yang tidak bisa dibaca kembali tidak berguna: periksa sebelum diunggah.
[ -s "$DUMP" ] || fail "dump kosong"
pg_restore --list "$DUMP" > /dev/null || fail "dump tidak bisa dibaca (pg_restore --list)"
log "dump $(wc -c < "$DUMP") byte, terverifikasi"

rclone copyto "$DUMP" "$BACKUP_DEST/db/db-$STAMP.dump" || fail "unggah dump"
log "dump diunggah: $BACKUP_DEST/db/db-$STAMP.dump"

if [ -d "$MEDIA_DIR" ]; then
  # `copy`, bukan `sync`: foto yang terhapus di server tidak ikut terhapus dari cadangan.
  rclone copy "$MEDIA_DIR" "$BACKUP_DEST/media" --transfers 4 || fail "salin foto"
  log "foto disalin dari $MEDIA_DIR"
else
  log "folder foto $MEDIA_DIR tidak ada, dilewati"
fi

# Retensi: hapus dump yang lebih tua dari batas, tetapi 10 terbaru selalu aman
# (jika cadangan sempat berhenti lama, jangan sampai semuanya terhapus).
# Daftar hapus disusun sendiri karena --files-from tidak bisa digabung dengan --min-age.
rclone lsf "$BACKUP_DEST/db" --files-only --min-age "${RETENTION_DAYS}d" 2>/dev/null | sort > "$WORK/old.txt" || true
rclone lsf "$BACKUP_DEST/db" --files-only 2>/dev/null | sort -r | head -n "$KEEP_LATEST" | sort > "$WORK/keep.txt" || true
comm -23 "$WORK/old.txt" "$WORK/keep.txt" > "$WORK/delete.txt"
if [ -s "$WORK/delete.txt" ]; then
  rclone delete "$BACKUP_DEST/db" --files-from "$WORK/delete.txt" \
    && log "dump lama dihapus: $(wc -l < "$WORK/delete.txt")" \
    || log "peringatan: pembersihan dump lama gagal"
fi

touch /tmp/backup-ok
ping ""
log "selesai"
