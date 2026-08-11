#!/bin/bash
# Deploy Core Creator on the production VPS.
#
# `set -e` matters here: without it a failed `docker compose build` still fell
# through to the success message, so a broken build looked like a good deploy
# while the old container kept serving. The image is only swapped if the build
# actually succeeds, which is why the site stays up on failure - but you have to
# be told, or you spend an hour testing the previous release.
set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> Building (this takes a few minutes)"
$COMPOSE build

echo "==> Starting the new container"
$COMPOSE up -d --force-recreate

echo "==> Waiting for the health check"
for i in $(seq 1 12); do
    status=$(docker inspect --format='{{.State.Health.Status}}' corecreator_app 2>/dev/null || echo "unknown")
    if [ "$status" = "healthy" ]; then
        echo "    healthy after $((i * 10))s"
        break
    fi
    if [ "$status" = "unhealthy" ]; then
        # Docker's flag and reality have disagreed before (the check used to
        # hit ::1 while the server binds IPv4), so say what the site is
        # actually returning rather than only what Docker thinks.
        code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://127.0.0.1:3002/api/health || echo "no-response")
        echo "    Docker reports UNHEALTHY; /api/health returns: $code"
        echo "    if that is 200 the app is fine and the check is misconfigured:"
        echo "      docker inspect --format='{{json .State.Health}}' corecreator_app | head -c 400"
        break
    fi
    printf "    %s...\r" "$status"
    sleep 10
done

echo "==> Pruning unused images"
docker image prune -f >/dev/null

echo "==> Deployed: $(git log --oneline -1)"
