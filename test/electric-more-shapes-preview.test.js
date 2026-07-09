const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root,
	'src/main/webapp/js/diagramly/ElectricShapes.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root,
	'src/main/webapp/electric/shapes/manifest.json'), 'utf8'));
const htmlEntities = (value) => String(value || '')
	.replace(/&/g, '&amp;').replace(/</g, '&lt;')
	.replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function Sidebar() {}
function EditorUi() {}

Sidebar.prototype = {
	configuration: [],
	updateEntries() { this.entries = []; },
	initPalettes() {},
	createTooltip() {},
	createDropHandler() {}
};
EditorUi.prototype = {};

const context = {
	console,
	encodeURIComponent,
	fetch: () => Promise.reject(new Error('not used')),
	window: {
		DRAWIO_BASE_URL: 'https://example.test',
		location: {origin: 'https://example.test'},
		requestIdleCallback() {},
		setTimeout() {}
	},
	Editor: {
		electricShapeCatalog: manifest,
		isElectricTheme: () => true
	},
	Sidebar,
	EditorUi,
	mxUtils: {htmlEntities, bind: (scope, fn) => fn.bind(scope)},
	mxResources: {get: () => null},
	document: {}
};

vm.createContext(context);
vm.runInContext(source, context, {filename: 'ElectricShapes.js'});

const libraries = new Map(manifest.libraries.map((library) => [library.id, library]));
const wb = decodeURIComponent(context.Editor.getElectricLibraryPreview(
	libraries.get('electric-wb-devices')).slice('data:image/svg+xml,'.length));
const mw = decodeURIComponent(context.Editor.getElectricLibraryPreview(
	libraries.get('electric-mw-hdr-12v')).slice('data:image/svg+xml,'.length));
const ekf = decodeURIComponent(context.Editor.getElectricLibraryPreview(
	libraries.get('electric-ekf-rcbo-2m-300ma')).slice('data:image/svg+xml,'.length));

assert(!wb.includes('<image'), 'More Shapes WB preview must be self-contained SVG');
assert(!/INPUT:|OUTPUT:|85-264VAC|MEAN WELL/.test(mw),
	'More Shapes MW preview must omit unreadable detail text');
assert(!/1P\+N|300mA|АВДТ|BA 47-63|6000/.test(ekf),
	'More Shapes EKF preview must omit unreadable detail text');
assert.strictEqual(context.Editor.getElectricLibraryPreview(
	libraries.get('electric-wb-devices')),
	context.Editor.electricLibraryPreviewCache['electric-wb-devices']);
assert(source.includes('imageCallback: function(preview)'),
	'More Shapes must render the selected Electric library on demand');
assert(!source.includes('getElectricLibraryPreviewPlaceholder'),
	'More Shapes must not leave selected libraries on a placeholder');
