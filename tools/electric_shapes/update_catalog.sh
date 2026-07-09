#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
    printf 'Usage: %s /path/to/base.drawio\n' "$0" >&2
    exit 2
fi

ROOT=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
SOURCE=$ROOT/tools/electric_shapes/source/base.drawio.gz
OUTPUT=$ROOT/src/main/webapp/electric/shapes
TEMP_SOURCE=$SOURCE.tmp.$$

cleanup()
{
    rm -f "$TEMP_SOURCE"
}

trap cleanup EXIT INT TERM
gzip -c "$1" > "$TEMP_SOURCE"
mv "$TEMP_SOURCE" "$SOURCE"

python3 "$ROOT/tools/electric_shapes/generate_electric_shapes.py" "$SOURCE" "$OUTPUT"
python3 "$ROOT/tools/electric_shapes/verify_electric_shapes.py" "$OUTPUT"
node --test "$ROOT"/test/electric-*.test.js
