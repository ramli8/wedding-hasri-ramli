#!/bin/sh
# Menjalankan backup.sh sekarang lalu berulang tiap BACKUP_INTERVAL_HOURS (bawaan 6).
# BACKUP_ONCE=1: sekali saja lalu keluar dengan kode hasil cadangan (untuk uji atau cron luar).
set -u
INTERVAL_HOURS="${BACKUP_INTERVAL_HOURS:-6}"

while true; do
  /usr/local/bin/backup.sh
  status=$?
  [ "${BACKUP_ONCE:-}" = "1" ] && exit "$status"
  [ "$status" -ne 0 ] && echo "putaran cadangan gagal; mencoba lagi pada putaran berikutnya"
  sleep "$((INTERVAL_HOURS * 3600))"
done
