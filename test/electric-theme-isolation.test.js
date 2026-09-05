const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root,
	'src/main/webapp/js/diagramly/ElectricShapes.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root,
	'src/main/webapp/electric/shapes/manifest.json'), 'utf8'));

function Sidebar() {}
function EditorUi() {}

Sidebar.prototype = {
	configuration: [{id: 'general', libs: ['general']}],
	defaultEntries: 'general;basic',
	updateEntries() { this.entries = [{title: 'Standard', entries: []}]; },
	initPalettes() {},
	createTooltip() {},
	createDropHandler() {}
};
EditorUi.prototype = {};

const Editor = {
	currentTheme: 'electric',
	electricShapeCatalog: manifest,
	isElectricTheme() { return this.currentTheme == 'electric'; }
};
const context = {
	console,
	encodeURIComponent,
	fetch: () => Promise.reject(new Error('not used')),
	window: {
		location: {origin: 'https://example.test'},
		requestIdleCallback() {},
		setTimeout() {}
	},
	Editor,
	Sidebar,
	EditorUi,
	mxUtils: {
		htmlEntities: (value) => String(value || ''),
		bind: (scope, fn) => fn.bind(scope)
	},
	mxResources: {get: () => null},
	document: {}
};

vm.createContext(context);
vm.runInContext(source, context, {filename: 'ElectricShapes.js'});

const electricSidebar = new Sidebar();
electricSidebar.updateEntries();
assert.strictEqual(electricSidebar.entries[0].title, 'Electric');
assert(Sidebar.prototype.configuration.some((entry) =>
	String(entry.id).startsWith('electric-')));

Editor.currentTheme = 'kennedy';
const standardSidebar = new Sidebar();
standardSidebar.updateEntries();
assert(standardSidebar.entries.some((entry) => entry.title == 'Electric'));
assert(Sidebar.prototype.configuration.some((entry) =>
	String(entry.id).startsWith('electric-')),
	'Device libraries must be available in the standard interface');
for (const library of manifest.libraries)
{
	assert(Sidebar.prototype.defaultEntries.split(';').includes(library.id),
		'Device libraries must be visible on a fresh installation');
}
assert.strictEqual(typeof Editor.markElectricShapeCells, 'function',
	'Original device insertion must not depend on the custom Electric interface');
