const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const manifestPath = path.join(root,
	'src/main/webapp/electric/shapes/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const library = manifest.libraries.find((item) => item.id == 'electric-ekf-ut');

assert(library, 'Electric UT terminal library must exist');

const offenders = [];

for (const item of library.items) {
	const xmlPath = path.join(root, 'src/main/webapp/electric/shapes',
		item.original);
	const xml = fs.readFileSync(xmlPath, 'utf8');

	if (/\b id="[^"]*_marking"/.test(xml)) {
		offenders.push(item.original);
	}
}

assert.deepStrictEqual(offenders, [],
	'Electric UT original XML files must not contain bottom marking cells');
