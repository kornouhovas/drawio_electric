# Electric shape catalog

`source/base.drawio.gz` is the versioned source of truth. Files under
`src/main/webapp/electric/shapes` are generated and must not be edited manually.

Update the catalog from an edited draw.io source file:

```sh
tools/electric_shapes/update_catalog.sh /path/to/base.drawio
```

The generator performs the product transformations that must survive every
regeneration: outer card removal, UT canvas-label removal, MW terminal layout,
MW DIN-slot removal, library grouping, unique display titles, source metadata,
and lightweight Wiren Board previews.

Run the complete local validation before committing:

```sh
node --test test/electric-*.test.js
python3 tools/electric_shapes/verify_electric_shapes.py \
  src/main/webapp/electric/shapes
```

`manifest.json` is the tooling/API representation. `catalog.js` contains the
same data and is bundled into the application so startup does not block on a
catalog request. Original XML is fetched asynchronously only when a user is
about to insert a device.
