const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.join(__dirname, '..');
const shapesRoot = path.join(root, 'src/main/webapp/electric/shapes');
const manifest = JSON.parse(fs.readFileSync(
	path.join(shapesRoot, 'manifest.json'), 'utf8'));
const source = zlib.gunzipSync(fs.readFileSync(
	path.join(root, 'tools/electric_shapes/source/base.drawio.gz'))).toString('utf8');
const library = manifest.libraries.find((entry) =>
	entry.id === 'electric-iek-signalling');

assert(library, 'IEK signalling library must be present');
assert.strictEqual(library.title, 'IEK сигнализация');
assert.strictEqual(library.items.length, 2);
assert.match(source, /<diagram name="IEK — сигнализация"/);
assert.match(source, /MLS10-230-K04/);
assert.match(source, /MZD10-230/);

const itemsById = new Map(library.items.map((item) => [item.id, item]));
const lamp = itemsById.get('electric-iek-signalling-mls10-230-k04');
const bell = itemsById.get('electric-iek-signalling-mzd10-230');

assert(lamp, 'IEK LS-47 red indicator must be present');
assert(bell, 'IEK ZD-47 bell must be present');

function readOriginal(item)
{
	return fs.readFileSync(path.join(shapesRoot, item.original), 'utf8');
}

for (const [item, dimensions] of [
	[lamp, [18, 65]],
	[bell, [18, 68.5]],
])
{
	assert.strictEqual(item.kind, 'signalling');
	assert.strictEqual(item.width, dimensions[0]);
	assert.strictEqual(item.height, dimensions[1]);
	assert(item.preview, `${item.id} must have a lightweight PNG preview`);
	assert(fs.existsSync(path.join(shapesRoot, item.preview)),
		`${item.id} preview must exist`);
	assert.match(readOriginal(item), /shape=image/,
		`${item.id} original must be an image-backed device`);
}

assert.strictEqual(lamp.data['Артикул'], 'MLS10-230-K04');
assert.strictEqual(bell.data['Артикул'], 'MZD10-230');
assert.match(lamp.sourceUrl, /iek\.ru/);
assert.match(bell.sourceUrl, /iek\.ru/);
