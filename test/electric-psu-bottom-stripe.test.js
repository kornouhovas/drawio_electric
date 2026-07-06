const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const manifestPath = path.join(root,
	'src/main/webapp/electric/shapes/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const psuItems = manifest.libraries
	.flatMap((library) => library.items)
	.filter((item) => item.kind == 'psu');

assert(psuItems.length > 0, 'Electric MW/HDR power supply items must exist');

const originalOffenders = [];

for (const item of psuItems)
{
	const xmlPath = path.join(root, 'src/main/webapp/electric/shapes',
		item.original);
	const xml = fs.readFileSync(xmlPath, 'utf8');

	if (/_device_din_slot"/.test(xml) ||
		/fillColor=#f0f0f0;strokeColor=#222;strokeWidth=0\.5/.test(xml))
	{
		originalOffenders.push(item.original);
	}
}

assert.deepStrictEqual(originalOffenders, [],
	'Electric MW/HDR original XML files must not contain bottom white DIN slot stripes');

const sourcePath = path.join(root,
	'src/main/webapp/js/diagramly/ElectricShapes.js');
const source = fs.readFileSync(sourcePath, 'utf8');

assert(!/faceH \* 0\.972/.test(source),
	'Electric MW/HDR SVG preview must not draw the bottom white DIN slot stripe');
assert(!/h \* 0\.972/.test(source),
	'Electric MW/HDR sidebar preview must not draw the bottom white DIN slot stripe');
