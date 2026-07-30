# IEK Signalling Devices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add compact image-based IEK LS-47 red signal lamp and ZD-47 DIN-rail bell shapes to a separate Electric library.

**Architecture:** `tools/electric_shapes/source/base.drawio.gz` remains the catalog source. A new IEK source page will contain device cards whose root is an `image` cell carrying an original PNG illustration; the generator maps this page into `electric-iek-signalling`, creates smaller PNG previews, and emits standard on-demand XML originals. The browser retains the existing async original loading.

**Tech Stack:** draw.io `mxGraphModel` XML, Python 3 catalog generator/validator, Node built-in test runner, and macOS/Python image tooling only to create the two source PNGs.

## Global Constraints

- Work only on `codex/electric-iek-devices`; do not fold in unfinished startup-performance work.
- Scope is exclusive to the Electric theme and its existing Shapes pipeline.
- Add exactly two IEK devices: LS-47 red 230 V (`MLS10-230-K04`) and ZD-47 230 V (`MZD10-230`).
- Use original simplified artwork, not supplier photographs, while preserving product proportions and identifiable front panels.
- Canvas geometry is 18×65 mm for the lamp and 18×68.5 mm for the bell.
- Change generated `src/main/webapp/electric/shapes/**` files only through `tools/electric_shapes/update_catalog.sh`.
- Existing devices and non-Electric themes remain unchanged.

---

## File Structure

- `tools/electric_shapes/generate_electric_shapes.py`: IEK page mapping, library ordering, source metadata and light previews.
- `tools/electric_shapes/verify_electric_shapes.py`: expected count, part-number and preview validation.
- `tools/electric_shapes/source/base.drawio.gz`: two device cards with embedded original PNGs.
- `src/main/webapp/electric/shapes/{manifest.json,catalog.js,items/**,previews/**}`: generated catalog and assets.
- `test/electric-catalog-integrity.test.js`: static catalog assertions.
- `test/electric-iek-signalling.test.js`: IEK geometry and image-original assertions.

### Task 1: Establish the IEK image-library contract

**Files:**
- Modify: `test/electric-catalog-integrity.test.js`
- Create: `test/electric-iek-signalling.test.js`
- Modify: `tools/electric_shapes/verify_electric_shapes.py`

**Interfaces:**
- Consumes: `manifest.json` with `libraries: Array<{id,title,items}>`.
- Produces: validation contract for `electric-iek-signalling`.

- [ ] **Step 1: Write a failing catalog test**

Add this assertion after `const items = ...`:

```js
const iekLibrary = manifest.libraries.find((library) =>
	library.id === 'electric-iek-signalling');

assert(iekLibrary, 'IEK signalling library must be present');
assert.deepStrictEqual(
	iekLibrary.items.map((item) => item.id).sort(),
	[
		'electric-iek-signalling-mls10-230-k04',
		'electric-iek-signalling-mzd10-230',
	],
	'IEK signalling library must expose the lamp and bell',
);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test test/electric-catalog-integrity.test.js`

Expected: FAIL with `IEK signalling library must be present`.

- [ ] **Step 3: Write a failing original-image and geometry test**

Create `test/electric-iek-signalling.test.js`. Load the generated manifest and original XML with Node `fs`/`path`. Assert:

```js
assert.strictEqual(lamp.width, 18);
assert.strictEqual(lamp.height, 65);
assert.strictEqual(bell.width, 18);
assert.strictEqual(bell.height, 68.5);
assert.strictEqual(lamp.kind, 'signalling');
assert.strictEqual(bell.kind, 'signalling');
assert.match(readOriginal(lamp), /shape=image/);
assert.match(readOriginal(bell), /shape=image/);
assert(lamp.preview && bell.preview, 'image devices must have previews');
```

- [ ] **Step 4: Run the new test to verify it fails**

Run: `node --test test/electric-iek-signalling.test.js`

Expected: FAIL because `electric-iek-signalling` does not exist.

- [ ] **Step 5: Extend the validator contract**

Add the expected library count:

```py
"electric-iek-signalling": 2,
```

Require a PNG preview for `kind in ("wb", "signalling")`, preserving the existing preview-is-lighter-than-original check.

- [ ] **Step 6: Run the validator to verify the expected red state**

Run: `python3 tools/electric_shapes/verify_electric_shapes.py src/main/webapp/electric/shapes`

Expected: FAIL because the manifest does not contain `electric-iek-signalling`.

- [ ] **Step 7: Commit the contract**

```sh
git add test/electric-catalog-integrity.test.js test/electric-iek-signalling.test.js \
  tools/electric_shapes/verify_electric_shapes.py
git commit -m "Define IEK signalling shape catalog contract"
```

### Task 2: Generate the image devices and catalog entries

**Files:**
- Modify: `tools/electric_shapes/generate_electric_shapes.py`
- Modify: `tools/electric_shapes/source/base.drawio.gz`
- Modify: `src/main/webapp/electric/shapes/manifest.json` (generated)
- Modify: `src/main/webapp/electric/shapes/catalog.js` (generated)
- Create: `src/main/webapp/electric/shapes/items/electric-iek-signalling-mls10-230-k04.xml` (generated)
- Create: `src/main/webapp/electric/shapes/items/electric-iek-signalling-mzd10-230.xml` (generated)
- Create: `src/main/webapp/electric/shapes/previews/electric-iek-signalling-*.png` (generated)

**Interfaces:**
- Consumes: cards on `IEK — сигнализация`, root image cells ending in `_image`, source metadata and embedded PNGs.
- Produces: `kind: "signalling"` items with real geometry, previews, source URLs and image XML.

- [ ] **Step 1: Add the source-page red assertion**

Extend `test/electric-iek-signalling.test.js` to gunzip the catalog source and assert:

```js
assert.match(source, /<diagram name="IEK — сигнализация"/);
assert.match(source, /MLS10-230-K04/);
assert.match(source, /MZD10-230/);
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node --test test/electric-iek-signalling.test.js`

Expected: FAIL because the source page does not exist.

- [ ] **Step 3: Add generator support**

Add these mappings:

```py
PAGES["IEK — сигнализация"] = "iek_signalling"
PAGE_VENDOR["iek_signalling"] = "IEK"
SOURCE_URLS["iek_signalling"] = "https://www.iek.ru/products/catalog/modulnoe_oborudovanie/modulnoe_oborudovanie_karat/dopolnitelnye_ustroystva_karat/"
```

Map `iek_signalling` to `kind: "signalling"` and library `electric-iek-signalling` titled `IEK сигнализация`. Add this library immediately before the Wiren Board library in deterministic ordering and include an official IEK source record for LS-47/ZD-47.

- [ ] **Step 4: Create the two source cards**

On the new source page embed original compact PNG illustration cells ending `_image`, with table metadata using the respective part numbers.

```text
LS-47: 18×65 units; white case, IEK wordmark, yellow LS-47 band,
       “230 V~” legend and red square lens.
ZD-47: 18×68.5 units; white case, IEK wordmark, yellow ZD-47 band,
       bell glyph and three horizontal sound slots.
```

The artwork must be newly drawn from the product references, not copied supplier photography.

- [ ] **Step 5: Regenerate the catalog**

Run:

```sh
tools/electric_shapes/update_catalog.sh \
  "/Users/aleksandersk/Library/CloudStorage/GoogleDrive-kornouhovas@gmail.com/My Drive/Офис/Проекты/Умный дом/draw.io/base.drawio"
```

Expected: generator reports 299 items and the validator executes successfully.

- [ ] **Step 6: Verify the green state**

Run:

```sh
node --test test/electric-catalog-integrity.test.js test/electric-iek-signalling.test.js
python3 tools/electric_shapes/verify_electric_shapes.py src/main/webapp/electric/shapes
```

Expected: both tests and the validator pass, reporting 299 items and 19 libraries.

- [ ] **Step 7: Commit generated source and assets**

```sh
git diff --check
git add tools/electric_shapes/generate_electric_shapes.py \
  tools/electric_shapes/source/base.drawio.gz \
  src/main/webapp/electric/shapes
git commit -m "Add IEK signalling devices"
```

### Task 3: Full regression verification

**Files:**
- Verify: `test/electric-*.test.js`
- Verify: `tools/electric_shapes/verify_electric_shapes.py`

**Interfaces:**
- Consumes: generated source and catalog from Task 2.
- Produces: a clean, verified feature branch.

- [ ] **Step 1: Run the complete Electric suite**

Run: `node --test test/electric-*.test.js`

Expected: all theme, startup, layer and catalog tests PASS.

- [ ] **Step 2: Verify generator determinism**

Run:

```sh
python3 tools/electric_shapes/generate_electric_shapes.py \
  tools/electric_shapes/source/base.drawio.gz /private/tmp/electric-iek-determinism
diff -qr src/main/webapp/electric/shapes /private/tmp/electric-iek-determinism
```

Expected: `diff` produces no output.

- [ ] **Step 3: Check asset size and source consistency**

Run:

```sh
python3 tools/electric_shapes/verify_electric_shapes.py src/main/webapp/electric/shapes
du -h src/main/webapp/electric/shapes/items/electric-iek-signalling-*.xml \
  src/main/webapp/electric/shapes/previews/electric-iek-signalling-*.png
```

Expected: validator passes and each preview is smaller than its matching XML original.

- [ ] **Step 4: Verify the branch is clean**

Run:

```sh
git status --short
git log --oneline -3
```

Expected: no uncommitted changes; commits contain the contract and device-catalog work.

## Self-Review

- Spec coverage: Tasks 1–2 add the isolated library, two IEK devices, original compact image art, exact dimensions, previews, source metadata and native lazy loading. Task 3 protects existing Electric behaviour.
- Placeholder scan: source page, IDs, product names, dimensions, item kind, validation and commands are all explicit.
- Type consistency: every task uses `electric-iek-signalling`, `signalling`, `MLS10-230-K04`, `MZD10-230` and `IEK — сигнализация`.

