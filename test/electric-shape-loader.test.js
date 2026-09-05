const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..',
	'src/main/webapp/js/diagramly/ElectricShapes.js'), 'utf8');

assert(!/new\s+XMLHttpRequest\s*\(/.test(source),
	'Electric shape loading must not use synchronous XMLHttpRequest');
assert(/fetch\(Editor\.getElectricShapeAssetUrl\(path\)/.test(source),
	'Electric originals must load with fetch');
assert(/Editor\.getElectricShapeTemplate/.test(source),
	'Electric originals must cache decoded templates');
assert(/electricShapeTemplateCacheLimit\s*=\s*24/.test(source),
	'Electric decoded template cache must be bounded');
assert(!/addEventListener\('(pointerenter|focus|touchstart)', prefetchOriginal/.test(source),
	'Browsing device previews must not download original XML');
assert(!/addEventListener\('pointerdown', ensureOriginal/.test(source),
	'Electric pointerdown must not synchronously replace preview cells');
assert(/getElectricShapeCells\(entry, graph\)\.then/.test(source),
	'Electric drop must wait asynchronously for original cells');
