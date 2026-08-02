const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.join(__dirname, '..');
const shapesRoot = path.join(root, 'src/main/webapp/electric/shapes');
const manifest = JSON.parse(fs.readFileSync(
	path.join(shapesRoot, 'manifest.json'), 'utf8'));
const catalogText = fs.readFileSync(path.join(shapesRoot, 'catalog.js'), 'utf8').trim();
const prefix = 'Editor.electricShapeCatalog = ';

assert(catalogText.startsWith(prefix) && catalogText.endsWith(';'),
	'catalog.js must assign the embedded Electric catalog');
assert.deepStrictEqual(JSON.parse(catalogText.slice(prefix.length, -1)), manifest,
	'catalog.js and manifest.json must contain identical data');

const sourcePath = path.join(root, manifest.source);
const source = zlib.gunzipSync(fs.readFileSync(sourcePath));
const sourceHash = crypto.createHash('sha256').update(source).digest('hex');

assert.strictEqual(manifest.version, 2);
assert.strictEqual(manifest.sourceSha256, sourceHash);
assert.strictEqual(manifest.assetVersion, sourceHash.slice(0, 16));

const items = manifest.libraries.flatMap((library) => library.items);
const titles = new Set();
const iekLibrary = manifest.libraries.find((library) =>
	library.id === 'electric-iek-signalling');
const ekf3pCharacteristicCLibrary = manifest.libraries.find((library) =>
	library.id === 'electric-ekf-breakers-3p-c');

assert(iekLibrary, 'IEK signalling library must be present');
assert.deepStrictEqual(
	iekLibrary.items.map((item) => item.id).sort(),
	[
		'electric-iek-signalling-mls10-230-k04',
		'electric-iek-signalling-mzd10-230',
	],
	'IEK signalling library must expose the lamp and bell',
);

assert(ekf3pCharacteristicCLibrary,
	'EKF 3P characteristic C library must be present');
const ekf3pC6 = ekf3pCharacteristicCLibrary.items.find((item) =>
	item.id === 'electric-ekf-breakers-3p-c-mcb4763-6-3-06c-pro');
assert(ekf3pC6, 'EKF 3P C6 breaker must be present');
assert.strictEqual(ekf3pC6.title, 'ВА 47-63 3P C6');
assert.strictEqual(ekf3pC6.data['Артикул'], 'mcb4763-6-3-06C-pro');
assert.strictEqual(ekf3pC6.data['Модульность'], '54 мм / 3M');

for (const item of items)
{
	assert(!titles.has(item.title), `Duplicate Electric title: ${item.title}`);
	titles.add(item.title);
	assert(item.data['Производитель'], `Missing manufacturer: ${item.id}`);
	assert(/^https:\/\//.test(item.sourceUrl), `Missing source URL: ${item.id}`);
	assert(item.sourceKey, `Missing source key: ${item.id}`);
}
