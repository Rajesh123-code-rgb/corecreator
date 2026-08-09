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
for i in $(seq 1 30); do
    status=$(docker inspect --format='{{.State.Health.Status}}' corecreator_app 2>/dev/null || echo "unknown")
    case "$status" in
        healthy) echo "    healthy after ${i}0s"; break ;;
        unhealthy) echo "    UNHEALTHY - check: docker logs --tail=50 corecreator_app"; break ;;
        *) printf "    %s...\r" "$status"; sleep 10 ;;
    esac
done

echo "==> Pruning unused images"
docker image prune -f >/dev/null

echo "==> Deployed: $(git log --oneline -1)"
