# Layanan cadangan: pg_dump (versi sama dengan server) + rclone ke R2 atau folder lokal.
FROM postgres:17-alpine
RUN apk add --no-cache rclone tzdata ca-certificates
COPY deploy/backup/backup.sh deploy/backup/restore.sh deploy/backup/entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/restore.sh /usr/local/bin/entrypoint.sh
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
