const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('production and development builds do not load the custom interface', () => {
	const build = read('etc/build/build.xml');
	const devel = read('src/main/webapp/js/diagramly/Devel.js');
	assert(!build.includes('<file name="Electric.js" />'));
	assert(!devel.includes('js/diagramly/Electric.js'));
	assert(build.includes('<file name="ElectricShapes.js" />'));
	assert(devel.includes('js/diagramly/ElectricShapes.js'));
});

test('startup does not force Electric or disable native custom libraries', () => {
	const context = {window: {location: {origin: 'https://example.test'}},
		urlParams: {}, localStorage: {getItem() { return null; }, setItem() {}}};
	vm.runInNewContext(read('deploy/PreConfig.js'), context);
	assert.notEqual(context.urlParams.ui, 'electric');
	assert.notEqual(context.window.uiTheme, 'electric');
	assert.notEqual(context.window.DRAWIO_CONFIG?.enableCustomLibraries, false);
});

test('device catalogue installs in native themes without downloading originals', () => {
	const catalog = JSON.parse(read('src/main/webapp/electric/shapes/manifest.json'));
	const palettes = [];
	function Sidebar() {}
	Sidebar.prototype = {
		configuration: [], defaultEntries: 'general;basic',
		updateEntries() { this.entries = [{title: 'Standard'}]; },
		initPalettes() {}, createTooltip() {}, createDropHandler() {},
		setCurrentSearchEntryLibrary() {}, addEntry(tags, factory) { return factory; },
		addPaletteFunctions(id, title, expanded, entries) { palettes.push({id, entries}); }
	};
	const Editor = {electricShapeCatalog: catalog};
	const context = {Editor, Sidebar, window: {},
		fetch() { throw Error('Startup must not fetch original XML'); },
		mxUtils: {bind: (scope, fn) => fn.bind(scope),
			setStyle: (style, key, value) => (style || '') + key + '=' + value + ';'}};
	vm.runInNewContext(read('src/main/webapp/js/diagramly/ElectricShapes.js'), context);
	const sidebar = new Sidebar();
	sidebar.updateEntries();
	sidebar.initPalettes();
	assert.equal(palettes.length, 19);
	assert.equal(palettes.reduce((n, p) => n + p.entries.length, 0), 300);
	assert.equal(sidebar.entries[1].title, 'Standard');
	const entry = catalog.libraries.flatMap(l => l.items).find(e => e.title.includes('3P C6'));
	assert(entry);
	const cell = {style: 'group;', setConnectable(value) { this.connectable = value; }};
	Editor.markElectricShapeCells([cell], entry);
	assert(cell.style.includes('electricDevice=1;'));
	assert(cell.style.includes('electricShapeId=' + entry.id));
	assert.equal(cell.connectable, true);
});
