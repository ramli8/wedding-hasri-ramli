#!/bin/sh
# Memulihkan database dari satu berkas dump:
#   restore.sh <berkas.dump> <DATABASE_URL tujuan>
# Menimpa objek yang ada (--clean --if-exists). Hentikan API sebelum memulihkan ke database yang dipakai.
set -eu
DUMP="${1:?pemakaian: restore.sh <berkas.dump> <DATABASE_URL>}"
TARGET="${2:?pemakaian: restore.sh <berkas.dump> <DATABASE_URL>}"
pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$TARGET" "$DUMP"
echo "pemulihan selesai"
