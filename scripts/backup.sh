#!/bin/bash
# Full backup of Core Creator: code, environment, database, nginx and certificates.
#
# Run ON THE SERVER. Produces /root/cc-backup.tar.gz, which you then copy to a
# machine that is not the server - a backup that only exists on the thing it is
# backing up is not a backup.
#
# The database is MongoDB Atlas, not local, so it is dumped over the network
# using a throwaway container. Nothing is installed on the host.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/corecreator}"
B=/root/cc-backup
cd "$APP_DIR"

rm -rf "$B"; mkdir -p "$B"/{db,config,meta}

echo "==> Dumping Atlas"
# Read the URI without printing it. The quote-stripping matters: a URI left
# wrapped in quotes produces an empty dump and mongodump still exits 0, so the
# failure looks exactly like a success until you count the files.
URI=$(sed -n 's/^MONGODB_URI=//p' .env.production | sed 's/^["'\'']//; s/["'\'']$//')
[ -n "$URI" ] || { echo "MONGODB_URI not found in .env.production"; exit 1; }
docker run --rm -e U="$URI" -v "$B/db:/dump" mongo:7 \
    sh -c 'mongodump --uri="$U" --out=/dump --quiet'

COUNT=$(find "$B/db" -name '*.bson' | wc -l)
[ "$COUNT" -gt 0 ] || { echo "Dump produced no collections - refusing to continue"; exit 1; }
echo "    $COUNT collections"

echo "==> Code and environment"
tar czf "$B/corecreator-app.tar.gz" \
    --exclude=node_modules --exclude=.next --exclude=.git -C "$(dirname "$APP_DIR")" "$(basename "$APP_DIR")"

echo "==> nginx and certificates"
cp /etc/nginx/sites-available/corecreator "$B/config/" 2>/dev/null || true
tar czf "$B/config/letsencrypt-corecreator.tar.gz" -C /etc/letsencrypt \
    live/corecreator.online archive/corecreator.online \
    renewal/corecreator.online.conf options-ssl-nginx.conf ssl-dhparams.pem 2>/dev/null || true

git log --oneline -1 > "$B/meta/deployed-commit.txt"
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$B/meta/taken-at.txt"

echo "==> Checksums"
cd "$B" && find . -type f ! -name SHA256SUMS -exec sha256sum {} \; > SHA256SUMS

cd /root && tar czf cc-backup.tar.gz cc-backup
echo "==> Done: /root/cc-backup.tar.gz ($(du -h /root/cc-backup.tar.gz | cut -f1))"
echo "    Now copy it off this machine:"
echo "      scp root@$(curl -4 -s --max-time 5 ifconfig.me):/root/cc-backup.tar.gz ."
