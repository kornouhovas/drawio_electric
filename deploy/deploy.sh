#!/bin/sh
set -eu

ROOT=${ROOT:-/opt/drawio-standard}
COMPOSE_FILE=${COMPOSE_FILE:-$ROOT/deploy/docker-compose.yml}
PUBLIC_URL=${PUBLIC_URL:-https://draw-dev.109.235.118.132.nip.io}
REGRESSION_URL=${REGRESSION_URL:-https://draw-electric-dev.109.235.118.132.nip.io}
GENERATED_DIR=/tmp/drawio-standard-shapes-check.$$

cleanup()
{
    rm -rf "$GENERATED_DIR"
}

wait_for_health()
{
    container=$1
    attempts=0

    while [ "$attempts" -lt 30 ]; do
        status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container")

        if [ "$status" = healthy ]; then
            return 0
        fi

        if [ "$status" = unhealthy ]; then
            docker logs --tail 100 "$container"
            return 1
        fi

        attempts=$((attempts + 1))
        sleep 2
    done

    docker logs --tail 100 "$container"
    return 1
}

trap cleanup EXIT INT TERM
cd "$ROOT"

if [ "$(id -u)" -eq 0 ] && [ -d /etc/sysctl.d ]; then
    install -m 0644 deploy/99-caddy-quic.conf /etc/sysctl.d/99-caddy-quic.conf
    sysctl -p /etc/sysctl.d/99-caddy-quic.conf
fi

node --check src/main/webapp/js/diagramly/ElectricShapes.js
node --check src/main/webapp/js/diagramly/App.js
node --check src/main/webapp/js/diagramly/Menus.js
node --check src/main/webapp/js/bootstrap.js
node --check deploy/PreConfig.js
node --test test/electric-*.test.js test/standard-ui.test.js
python3 tools/electric_shapes/verify_electric_shapes.py src/main/webapp/electric/shapes
python3 tools/electric_shapes/generate_electric_shapes.py \
    tools/electric_shapes/source/base.drawio.gz "$GENERATED_DIR"
diff -qr src/main/webapp/electric/shapes "$GENERATED_DIR"

DRAWIO_STANDARD_TAG=${DRAWIO_STANDARD_TAG:-$(git rev-parse --short=12 HEAD)}
export DRAWIO_STANDARD_TAG

docker compose -f "$COMPOSE_FILE" build
docker compose -f "$COMPOSE_FILE" up -d
wait_for_health drawio-standard-export
wait_for_health drawio-standard

docker exec drawio-standard grep -q 'DRAWIO_ASSET_VERSION' \
    /usr/local/tomcat/webapps/draw/js/PreConfig.js
curl -fsS "$PUBLIC_URL" -o /dev/null
curl -fsS "$PUBLIC_URL/js/PreConfig.js" | grep -q "\"$DRAWIO_STANDARD_TAG\""
curl -fsSI -H 'Accept-Encoding: gzip' \
    "$PUBLIC_URL/js/app.min.js?v=$DRAWIO_STANDARD_TAG" | \
    grep -qi '^content-encoding: gzip'
curl -fsSI "$PUBLIC_URL/js/app.min.js?v=$DRAWIO_STANDARD_TAG" | \
    grep -qi '^cache-control: public, max-age=31536000, immutable'
curl -fsS "$REGRESSION_URL" -o /dev/null

if [ "${PRUNE_AFTER_DEPLOY:-0}" = 1 ]; then
    docker builder prune --filter until=168h -f
fi

printf 'Deployed drawio-standard image tag %s\n' "$DRAWIO_STANDARD_TAG"
