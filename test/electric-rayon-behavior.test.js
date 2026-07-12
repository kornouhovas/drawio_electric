const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..',
	'src/main/webapp/js/diagramly/Electric.js'), 'utf8');

function getMethod(name)
{
	const marker = `\tEditorUi.prototype.${name} = function`;
	const start = source.indexOf(marker);
	assert(start >= 0, `Missing Electric method: ${name}`);
	const end = source.indexOf('\n\tEditorUi.prototype.', start + marker.length);
	return source.slice(start, end >= 0 ? end : source.length);
}

function createStyle(initial = {})
{
	const values = new Map(Object.entries(initial));

	return {
		getPropertyValue(name) { return values.get(name) || ''; },
		getPropertyPriority() { return ''; },
		setProperty(name, value) { values.set(name, String(value)); },
		removeProperty(name) { values.delete(name); },
		value(name) { return values.get(name) || ''; }
	};
}

function createClassList()
{
	const values = new Set();

	return {
		toggle(name, enabled)
		{
			if (enabled) values.add(name); else values.delete(name);
		},
		contains(name) { return values.has(name); }
	};
}

function EditorUi() {}
EditorUi.prototype.hsplitPosition = 232;

const document = {
	documentElement: {clientWidth: 0},
	fullscreenElement: null
};
const Editor = {
	inlineFullscreen: false,
	fullscreenImage: 'enter-fullscreen',
	fullscreenExitImage: 'exit-fullscreen'
};
const context = vm.createContext({
	EditorUi,
	Editor,
	document,
	window: {innerWidth: 0},
	screen: {width: 1440}
});

for (const name of [
	'getElectricShellViewportWidth',
	'getElectricDefaultLeftPanelWidth',
	'ensureElectricLeftPanelWidth',
	'captureElectricInlineProperty',
	'restoreElectricInlineProperty',
	'captureElectricRulerInlineState',
	'captureElectricShellInlineState',
	'restoreElectricShellInlineState',
	'isElectricFullscreenActive',
	'updateElectricBottomToolbar'
])
{
	vm.runInContext(getMethod(name), context, {filename: 'Electric.js'});
}

const responsiveUi = new EditorUi();
responsiveUi.container = {clientWidth: 800};
responsiveUi.hsplitPosition = 0;
responsiveUi.ensureElectricLeftPanelWidth();
assert.strictEqual(responsiveUi.hsplitPosition, 320,
	'An open compact panel must never keep a zero width');

responsiveUi.container.clientWidth = 1400;
responsiveUi.hsplitPosition = EditorUi.prototype.hsplitPosition;
responsiveUi.ensureElectricLeftPanelWidth();
assert.strictEqual(responsiveUi.hsplitPosition, 360,
	'A fresh desktop Electric panel must use the Rayon target width');

responsiveUi.hsplitPosition = 300;
responsiveUi.ensureElectricLeftPanelWidth();
assert.strictEqual(responsiveUi.hsplitPosition, 300,
	'A user-resized panel width must be preserved');

const hiddenButton = {
	style: {},
	classList: createClassList(),
	attributes: {},
	setAttribute(name, value) { this.attributes[name] = value; },
	removeAttribute(name) { delete this.attributes[name]; }
};
const fullscreenButton = {
	style: {},
	classList: createClassList(),
	attributes: {},
	setAttribute(name, value) { this.attributes[name] = value; },
	removeAttribute(name) { delete this.attributes[name]; }
};
const actions = {
	hidden: {
		isEnabled: () => true,
		isVisible: () => false,
		toggleAction: false
	},
	fullscreen: {
		isEnabled: () => true,
		isVisible: () => true,
		toggleAction: true,
		selectedCallback: () => true,
		isSelected: () => true
	}
};
const toolbarUi = new EditorUi();
toolbarUi.actions = {get(name) { return actions[name]; }};
toolbarUi.electricBottomToolbarButtons = [
	{actionName: 'hidden', button: hiddenButton},
	{actionName: 'fullscreen', button: fullscreenButton}
];
toolbarUi.updateElectricBottomToolbar();
assert.strictEqual(hiddenButton.style.display, 'none',
	'Invisible native actions must not appear in the Electric toolbar');
assert.strictEqual(hiddenButton.attributes['aria-hidden'], 'true');
assert.strictEqual(fullscreenButton.style.backgroundImage,
	'url("exit-fullscreen")',
	'Native fullscreen selection must not be overwritten by browser state');
assert(fullscreenButton.classList.contains('geActive'));

const shellUi = new EditorUi();
shellUi.hsplitPosition = 280;
shellUi.sidebarContainer = {style: createStyle({width: '280px'})};
shellUi.formatContainer = {style: createStyle({width: '240px'})};
shellUi.hsplit = {style: createStyle({left: '280px'})};
shellUi.container = {style: createStyle({
	'--ge-electric-sidebar-width': '280px',
	'--ge-electric-visible-format-width': '240px'
})};
shellUi.ruler = null;
shellUi.captureElectricShellInlineState();
shellUi.hsplitPosition = 360;
shellUi.sidebarContainer.style.setProperty('width', '360px');
shellUi.formatContainer.style.setProperty('width', 'var(--ge-electric-format-width)');
shellUi.restoreElectricShellInlineState();
assert.strictEqual(shellUi.hsplitPosition, 280);
assert.strictEqual(shellUi.sidebarContainer.style.value('width'), '280px');
assert.strictEqual(shellUi.formatContainer.style.value('width'), '240px');
assert.strictEqual(shellUi.hsplit.style.value('left'), '280px');

