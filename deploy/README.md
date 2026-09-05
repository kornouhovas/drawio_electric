# Standard draw.io with the Electric device library

This branch restores the upstream draw.io interface from `1157023` (the
original base of this fork), not the Rayon/Electric shell. The library data
remains unchanged: 300 devices in 19 libraries, including EKF 3P C6.

The native sidebar and More Shapes dialog use lightweight generated previews.
Only dropping/clicking a device into a diagram fetches its full original XML.
The inserted cells are serialized into the `.drawio` file, not replaced with
thumbnails or external links. Saved native library choices take precedence
over the fresh-install defaults. The source generator and metadata are in
`tools/electric_shapes/`; do not load `base.drawio.gz` as a startup library.

## Separate deployment

- Branch: `codex/standard-ui-library`
- Checkout: `/opt/drawio-standard`
- URL: `https://draw-dev.109.235.118.132.nip.io`
- Compose project: `drawio-standard`
- Containers: `drawio-standard`, `drawio-standard-export`
- Shared external proxy network: `drawio_default`

Build the whole application; copying source JS into a running container does
not update `app.min.js`. The Docker build runs the retained library tests and
the new native-interface tests, checks reproducible device generation, compiles
the app and precompresses static assets. Tests for the removed custom shell
were removed with that shell; their history remains on the Electric branch.

Use `deploy/deploy.sh` from the checkout to build and start a release tagged
with its commit. Add the block in `deploy/Caddyfile.draw-dev` to the existing
Caddyfile once, validate it, then reload Caddy. Keep all existing domain blocks,
especially `draw-electric-dev`, unchanged. Never run the old Electric deployment
script against this checkout or use a shared Compose project name.

For rollback, set `DRAWIO_STANDARD_TAG` to the previous tag and run
`docker compose -f deploy/docker-compose.yml up -d --no-build`. This affects
only the new deployment. Do not delete browser-stored diagrams on the old URL;
browser storage is origin-specific. Open saved `.drawio` files on the new URL.

## Verification

```sh
node --test test/electric-*.test.js test/standard-ui.test.js
python3 tools/electric_shapes/verify_electric_shapes.py src/main/webapp/electric/shapes
```

Browser checks must cover fresh startup without original-XML requests, native
menus/panels, More Shapes previews, insertion at catalogue dimensions, save and
reopen with embedded originals, and continued availability of the old URL.
