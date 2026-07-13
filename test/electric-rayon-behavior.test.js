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
		add(name) { values.add(name); },
		remove(name) { values.delete(name); },
		toggle(name, enabled)
		{
			if (enabled) values.add(name); else values.delete(name);
		},
		contains(name) { return values.has(name); }
	};
}

function createElement(tagName = 'div')
{
		const element = {
			tagName: tagName.toUpperCase(),
			nodeName: tagName.toUpperCase(),
		children: [],
		parentNode: null,
		attributes: {},
		listeners: {},
		style: createStyle(),
		classList: createClassList(),
		scrollTop: 0,
		scrollLeft: 0,
		appendChild(child)
		{
			child.parentNode = this;
			this.children.push(child);
			return child;
		},
		removeChild(child)
		{
			this.children.splice(this.children.indexOf(child), 1);
			child.parentNode = null;
		},
		contains(node)
		{
			return node === this || this.children.some((child) => child.contains(node));
		},
		setAttribute(name, value) { this.attributes[name] = String(value); },
		getAttribute(name) { return this.attributes[name] ?? null; },
		hasAttribute(name) { return Object.hasOwn(this.attributes, name); },
			removeAttribute(name) { delete this.attributes[name]; },
			focus() { document.activeElement = this; },
			scrollIntoView() {}
	};

	Object.defineProperty(element, 'firstChild', {
		get() { return this.children[0] || null; }
	});

	return element;
}

function EditorUi() {}
EditorUi.prototype.hsplitPosition = 232;

let nativeRefreshCalls = 0;

const document = {
	documentElement: {clientWidth: 0},
	fullscreenElement: null,
	activeElement: null,
	createElement
};
const Editor = {
	inlineFullscreen: false,
	fullscreenImage: 'enter-fullscreen',
	fullscreenExitImage: 'exit-fullscreen',
	getElectricResource: (key, fallback) => fallback,
	isElectricTheme: () => true
};
const context = vm.createContext({
	EditorUi,
	Editor,
	document,
	window: {innerWidth: 0},
	screen: {width: 1440},
	mxUtils: {
		indexOf: (items, item) => items.indexOf(item),
		write: (node, text) => { node.textContent = text; }
	},
	mxResources: {get: (key) => key === 'page' ? 'Page' : null},
	mxEvent: {
		addListener: (node, name, fn) => { node.listeners[name] = fn; },
		consume: () => {}
	},
	refresh: () => { nativeRefreshCalls++; }
});

for (const name of [
	'getElectricShellViewportWidth',
	'getElectricFormatPanelWidth',
	'getElectricAvailableLeftPanelWidth',
	'getElectricLeftPanelWidth',
	'getElectricDefaultLeftPanelWidth',
	'getElectricBottomToolbarWidth',
	'ensureElectricLeftPanelWidth',
	'isElectricShellActive',
	'hideElectricNativePageTabsForCanvases',
	'captureElectricInlineProperty',
	'restoreElectricInlineProperty',
	'captureElectricNativePageTabsState',
	'setElectricNativePageTabsVisible',
	'restoreElectricNativePageTabsState',
	'captureElectricRulerInlineState',
	'captureElectricShellInlineState',
	'restoreElectricShellInlineState',
	'updateElectricLeftOverlayGeometry',
	'isElectricFullscreenActive',
	'updateElectricBottomToolbar',
	'updateElectricCursorStatus',
	'updateElectricPageStatus',
	'updateElectricCanvases',
	'moveElectricCanvasFocus',
	'handleElectricCanvasKeyDown',
	'getElectricCanvasMenuItems',
	'focusElectricCanvasMenuItem',
	'handleElectricCanvasMenuKeyDown',
	'updateElectricLibraryTabs',
	'activateElectricLibraryTab',
	'moveElectricLibraryTabFocus',
	'decorateElectricLibraryPalettes'
])
{
	vm.runInContext(getMethod(name), context, {filename: 'Electric.js'});
}

vm.runInContext(getMethod('refresh'), context, {filename: 'Electric.js'});

const chromelessUi = new EditorUi();
chromelessUi.editor = {chromeless: true};
chromelessUi.container = createElement();
chromelessUi.container.classList.add('geElectricModes');
chromelessUi.electricModePanel = createElement();
chromelessUi.electricLayersPanel = createElement();
chromelessUi.electricCanvasList = createElement();
let electricRefreshMutations = 0;
chromelessUi.captureElectricNativePageTabsState = () =>
{
	electricRefreshMutations++;
};
chromelessUi.setElectricNativePageTabsVisible = () =>
{
	electricRefreshMutations++;
};
chromelessUi.attachElectricCursorLeaveHandler = () =>
{
	electricRefreshMutations++;
};
chromelessUi.installElectricToolbarViewButton = () =>
{
	electricRefreshMutations++;
};
chromelessUi.installElectricConnectorToolbar = () =>
{
	electricRefreshMutations++;
};
chromelessUi.updateElectricBottomToolbar = () =>
{
	electricRefreshMutations++;
};
chromelessUi.updateElectricModePanel = () =>
{
	electricRefreshMutations++;
};
chromelessUi.updateElectricLeftPanelState = () =>
{
	electricRefreshMutations++;
};
chromelessUi.updateElectricLeftOverlayGeometry = () =>
{
	electricRefreshMutations++;
};
chromelessUi.refresh(true);
assert.strictEqual(nativeRefreshCalls, 1,
	'Chromeless Electric views must keep the native refresh path');
assert.strictEqual(electricRefreshMutations, 0,
	'Chromeless Electric views must not receive shell mutations');

const surfaceUi = new EditorUi();
surfaceUi.tabContainer = createElement();
surfaceUi.tabContainer.style = createStyle({display: 'flex'});
surfaceUi.tabContainer.setAttribute('aria-hidden', 'mixed');
assert.strictEqual(surfaceUi.hideElectricNativePageTabsForCanvases(), false,
	'Native page tabs must remain untouched before Canvases exists');
assert.strictEqual(surfaceUi.electricNativePageTabsState, undefined);
assert.strictEqual(surfaceUi.tabContainer.style.value('display'), 'flex');
assert.strictEqual(surfaceUi.tabContainer.getAttribute('aria-hidden'), 'mixed');
surfaceUi.electricLayersPanel = createElement();
surfaceUi.electricCanvasList = createElement();
const surfaceParent = createElement();
surfaceParent.appendChild(surfaceUi.electricLayersPanel);
assert.strictEqual(surfaceUi.hideElectricNativePageTabsForCanvases(), false,
	'Detached Canvases must not replace native page navigation');
assert.strictEqual(surfaceUi.electricNativePageTabsState, undefined);
assert.strictEqual(surfaceUi.tabContainer.style.value('display'), 'flex');
assert.strictEqual(surfaceUi.tabContainer.getAttribute('aria-hidden'), 'mixed');
surfaceUi.electricLayersPanel.appendChild(surfaceUi.electricCanvasList);
assert.strictEqual(surfaceUi.hideElectricNativePageTabsForCanvases(), true,
	'Native page tabs may be hidden only after Canvases is attached');
assert.notStrictEqual(surfaceUi.electricNativePageTabsState, undefined);
assert.strictEqual(surfaceUi.tabContainer.style.value('display'), 'none');
assert.strictEqual(surfaceUi.tabContainer.getAttribute('aria-hidden'), 'true');

const responsiveUi = new EditorUi();
responsiveUi.container = {clientWidth: 800};
responsiveUi.hsplitPosition = 0;
responsiveUi.ensureElectricLeftPanelWidth();
assert.strictEqual(responsiveUi.hsplitPosition, 232,
	'An open compact panel must never keep a zero width');

responsiveUi.container.clientWidth = 1400;
responsiveUi.hsplitPosition = EditorUi.prototype.hsplitPosition;
responsiveUi.ensureElectricLeftPanelWidth();
assert.strictEqual(responsiveUi.hsplitPosition, 264,
	'A fresh desktop Electric panel must use the Rayon target width');

responsiveUi.hsplitPosition = 300;
responsiveUi.ensureElectricLeftPanelWidth();
assert.strictEqual(responsiveUi.hsplitPosition, 300,
	'A user-resized panel width must be preserved');

const narrowUi = new EditorUi();
narrowUi.container = {clientWidth: 700};
narrowUi.hsplitPosition = 652;
narrowUi.format = {};
narrowUi.formatWidth = 240;
assert.strictEqual(narrowUi.getElectricFormatPanelWidth(), 248);
assert.strictEqual(narrowUi.getElectricAvailableLeftPanelWidth(), 312);
assert.strictEqual(narrowUi.getElectricLeftPanelWidth(), 312,
	'The left overlay must preserve the inspector and a usable canvas gap');
narrowUi.format = null;
assert.strictEqual(narrowUi.getElectricLeftPanelWidth(), 560,
	'A closed inspector must release width while preserving the canvas gap');

const toolbarWidths = new Map([
	[1510, 620], [1280, 560], [1040, 480], [1039, 479],
	[1000, 440], [961, 401], [960, 420], [700, 132]
]);

for (const [width, expected] of toolbarWidths)
{
	const ui = new EditorUi();
	ui.container = {clientWidth: width};
	ui.hsplitPosition = 264;
	ui.format = {};
	ui.formatWidth = 240;
	ui.electricLeftPanelCollapsed = false;
	assert.strictEqual(ui.getElectricBottomToolbarWidth(), expected,
		`Toolbar must stay inside the visible canvas at ${width}px`);
}

const toolbarTransitionWidths = new Map([
	[1039, {collapsed: 560, fullscreen: 560}],
	[960, {collapsed: 560, fullscreen: 560}],
	[700, {collapsed: 396, fullscreen: 440}]
]);

for (const [width, expected] of toolbarTransitionWidths)
{
	const ui = new EditorUi();
	ui.container = createElement();
	ui.container.clientWidth = width;
	ui.hsplitPosition = 264;
	ui.format = {};
	ui.formatWidth = 240;
	ui.electricLeftPanelCollapsed = true;
	assert.strictEqual(ui.getElectricBottomToolbarWidth(), expected.collapsed,
		`Collapsed toolbar must expand into released canvas space at ${width}px`);
	ui.electricLeftPanelCollapsed = false;
	ui.container.classList.add('geElectricFullscreen');
	assert.strictEqual(ui.getElectricBottomToolbarWidth(), expected.fullscreen,
		`Fullscreen toolbar must ignore hidden Electric left surfaces at ${width}px`);
}

const toolbarTransitionUi = new EditorUi();
toolbarTransitionUi.container = createElement();
toolbarTransitionUi.sidebarContainer = createElement();
toolbarTransitionUi.hsplit = createElement();
toolbarTransitionUi.format = {};
toolbarTransitionUi.formatWidth = 240;
toolbarTransitionUi.getElectricLeftPanelWidth = () => 264;
toolbarTransitionUi.updateElectricRulerPosition = () => {};
let toolbarTransitionUpdates = 0;
toolbarTransitionUi.updateElectricBottomToolbar = () => { toolbarTransitionUpdates++; };
toolbarTransitionUi.updateElectricLeftOverlayGeometry(false);
assert.strictEqual(toolbarTransitionUpdates, 1,
	'Every left-surface geometry transition must recompute the inline toolbar width');

const tabsUi = new EditorUi();
tabsUi.tabContainer = createElement();
tabsUi.tabContainer.style = createStyle({
	display: 'flex', visibility: 'visible', height: '32px'
});
tabsUi.tabContainer.setAttribute('aria-hidden', 'mixed');
tabsUi.captureElectricNativePageTabsState();
tabsUi.setElectricNativePageTabsVisible(false);
assert.strictEqual(tabsUi.tabContainer.style.value('display'), 'none');
assert.strictEqual(tabsUi.tabContainer.getAttribute('aria-hidden'), 'true');
tabsUi.restoreElectricNativePageTabsState();
assert.strictEqual(tabsUi.tabContainer.style.value('display'), 'flex');
assert.strictEqual(tabsUi.tabContainer.style.value('visibility'), 'visible');
assert.strictEqual(tabsUi.tabContainer.style.value('height'), '32px');
assert.strictEqual(tabsUi.tabContainer.getAttribute('aria-hidden'), 'mixed');

const pageA = {getId: () => 'a', getName: () => 'Page A'};
const pageB = {getId: () => 'b', getName: () => 'Page B'};
const canvasesUi = new EditorUi();
canvasesUi.electricCanvasList = createElement();
canvasesUi.electricCanvasList.scrollTop = 47;
canvasesUi.electricCanvasList.scrollLeft = 3;
const oldFocusedRow = createElement('button');
oldFocusedRow.setAttribute('data-page-id', 'b');
canvasesUi.electricCanvasList.appendChild(oldFocusedRow);
document.activeElement = oldFocusedRow;
canvasesUi.pages = [pageA, pageB];
canvasesUi.currentPage = pageA;
canvasesUi.updateElectricPageStatus = () => {};
canvasesUi.selectPage = () => {};
canvasesUi.renamePage = () => {};
canvasesUi.updateElectricCanvases();
assert.strictEqual(canvasesUi.electricCanvasList.scrollTop, 47);
assert.strictEqual(canvasesUi.electricCanvasList.scrollLeft, 3);
assert.strictEqual(document.activeElement.getAttribute('data-page-id'), 'b',
	'Canvases refresh must return focus to the same native page row');
canvasesUi.pages = [pageA];
canvasesUi.currentPage = pageA;
canvasesUi.updateElectricCanvases();
assert.strictEqual(document.activeElement.getAttribute('data-page-id'), 'a',
	'Canvases refresh must focus the current page when the focused page was removed');

const canvasKeyboardUi = new EditorUi();
const canvasRows = [pageA, pageB, {getId: () => 'c', getName: () => 'Page C'}]
	.map((page) =>
	{
		const row = createElement('button');
		row.electricPage = page;
		return row;
	});
canvasKeyboardUi.electricCanvasList = {
	querySelectorAll: () => canvasRows
};
let selectedCanvas = null;
let renamedCanvas = null;
let menuCanvas = null;
canvasKeyboardUi.selectPage = (page) => { selectedCanvas = page; };
canvasKeyboardUi.renamePage = (page) => { renamedCanvas = page; };
canvasKeyboardUi.showElectricCanvasMenu = (evt, page) => { menuCanvas = page; };
assert.strictEqual(canvasKeyboardUi.moveElectricCanvasFocus(canvasRows[1], 38), true);
assert.strictEqual(document.activeElement, canvasRows[0]);
assert.strictEqual(selectedCanvas, pageA,
	'ArrowUp must select and focus the previous native page');
canvasKeyboardUi.moveElectricCanvasFocus(canvasRows[0], 40);
assert.strictEqual(document.activeElement, canvasRows[1]);
assert.strictEqual(selectedCanvas, pageB,
	'ArrowDown must select and focus the next native page');
canvasKeyboardUi.moveElectricCanvasFocus(canvasRows[1], 36);
assert.strictEqual(document.activeElement, canvasRows[0]);
assert.strictEqual(selectedCanvas, pageA,
	'Home must select and focus the first native page');
canvasKeyboardUi.moveElectricCanvasFocus(canvasRows[0], 35);
assert.strictEqual(document.activeElement, canvasRows[2],
	'End must select and focus the last native page');
canvasKeyboardUi.handleElectricCanvasKeyDown(canvasRows[1], pageB,
	{keyCode: 113, shiftKey: false});
assert.strictEqual(renamedCanvas, pageB,
	'F2 must expose native page rename from Canvases');
canvasKeyboardUi.handleElectricCanvasKeyDown(canvasRows[1], pageB,
	{keyCode: 93, shiftKey: false});
assert.strictEqual(menuCanvas, pageB,
	'The keyboard context-menu key must expose native page operations');

const canvasMenuUi = new EditorUi();
const canvasMenu = {
	tbody: createElement('tbody'),
	hideCalls: 0,
	showSubmenuCalls: 0,
	hideMenu()
	{
		this.hideCalls++;
		canvasRows[1].focus();
	},
	showSubmenu(parent, row)
	{
		this.showSubmenuCalls++;
		parent.activeRow = row;
	},
	hideSubmenu(parent)
	{
		parent.activeRow = null;
	}
};
let firstCanvasMenuActions = 0;
let submenuCanvasMenuActions = 0;
const firstCanvasMenuItem = createElement('tr');
firstCanvasMenuItem.className = 'mxPopupMenuItem';
firstCanvasMenuItem._electricAction = () => { firstCanvasMenuActions++; };
firstCanvasMenuItem._electricEnabled = true;
firstCanvasMenuItem._electricParent = canvasMenu;
const moveCanvasMenuItem = createElement('tr');
moveCanvasMenuItem.className = 'mxPopupMenuItem';
moveCanvasMenuItem._electricAction = null;
moveCanvasMenuItem._electricEnabled = true;
moveCanvasMenuItem._electricParent = canvasMenu;
moveCanvasMenuItem.div = createElement();
moveCanvasMenuItem.tbody = createElement('tbody');
const submenuCanvasMenuItem = createElement('tr');
submenuCanvasMenuItem.className = 'mxPopupMenuItem';
submenuCanvasMenuItem._electricAction = () => { submenuCanvasMenuActions++; };
submenuCanvasMenuItem._electricEnabled = true;
submenuCanvasMenuItem._electricParent = moveCanvasMenuItem;
moveCanvasMenuItem.tbody.appendChild(submenuCanvasMenuItem);
const lastCanvasMenuItem = createElement('tr');
lastCanvasMenuItem.className = 'mxPopupMenuItem';
lastCanvasMenuItem._electricAction = () => {};
lastCanvasMenuItem._electricEnabled = true;
lastCanvasMenuItem._electricParent = canvasMenu;
canvasMenu.tbody.appendChild(firstCanvasMenuItem);
canvasMenu.tbody.appendChild(moveCanvasMenuItem);
canvasMenu.tbody.appendChild(lastCanvasMenuItem);
canvasMenuUi.focusElectricCanvasMenuItem(canvasMenu, firstCanvasMenuItem);
assert.strictEqual(document.activeElement, firstCanvasMenuItem,
	'Page menu must move focus into its first operation');
canvasMenuUi.handleElectricCanvasMenuKeyDown(canvasMenu, {keyCode: 40});
assert.strictEqual(document.activeElement, moveCanvasMenuItem,
	'ArrowDown must traverse native page menu operations');
canvasMenuUi.handleElectricCanvasMenuKeyDown(canvasMenu, {keyCode: 13});
assert.strictEqual(canvasMenu.showSubmenuCalls, 1);
assert.strictEqual(document.activeElement, submenuCanvasMenuItem,
	'Enter on Move must open and focus its native submenu');
canvasMenuUi.handleElectricCanvasMenuKeyDown(canvasMenu, {keyCode: 37});
assert.strictEqual(document.activeElement, moveCanvasMenuItem,
	'ArrowLeft must return from a page submenu to its parent operation');
canvasMenuUi.handleElectricCanvasMenuKeyDown(canvasMenu, {keyCode: 36});
assert.strictEqual(document.activeElement, firstCanvasMenuItem,
	'Home must focus the first page operation');
canvasMenuUi.handleElectricCanvasMenuKeyDown(canvasMenu, {keyCode: 32});
assert.strictEqual(firstCanvasMenuActions, 1,
	'Space must activate the focused page operation');
assert.strictEqual(canvasMenu.hideCalls, 1,
	'Activating a page operation must dismiss the menu');
canvasMenuUi.focusElectricCanvasMenuItem(canvasMenu, lastCanvasMenuItem);
canvasMenuUi.handleElectricCanvasMenuKeyDown(canvasMenu, {keyCode: 27});
assert.strictEqual(canvasMenu.hideCalls, 2,
	'Escape must dismiss the page menu');
assert.strictEqual(document.activeElement, canvasRows[1],
	'Dismissing the page menu must return focus to its Canvas row');
assert.strictEqual(submenuCanvasMenuActions, 0);

const statusUi = new EditorUi();
statusUi.electricCursorStatus = {textContent: ''};
statusUi.electricPageStatus = {textContent: ''};
statusUi.editor = {graph: {view: {scale: 2, translate: {x: 10, y: 20}}}};
statusUi.pages = [pageA, pageB];
statusUi.currentPage = pageB;
statusUi.updateElectricCursorStatus({
	getGraphX: () => 40,
	getGraphY: () => 60
});
assert.strictEqual(statusUi.electricCursorStatus.textContent, 'X 10  Y 10');
statusUi.updateElectricCursorStatus(null);
assert.strictEqual(statusUi.electricCursorStatus.textContent, 'X -  Y -');
statusUi.updateElectricPageStatus();
assert.strictEqual(statusUi.electricPageStatus.textContent, '2 / 2  Page B');

const palette = createElement();
const paletteItem = createElement('a');
paletteItem.classList.add('geItem');
palette.appendChild(paletteItem);
const libraryUi = new EditorUi();
libraryUi.sidebarContainer = {
	querySelectorAll(selector)
	{
		return selector === '.geSidebar' ? [palette] : [];
	}
};
libraryUi.decorateElectricLibraryPalettes();
assert(palette.classList.contains('geElectricLibraryGrid'),
	'Electric must decorate an existing native palette without replacing its items');
assert.strictEqual(palette.children[0], paletteItem,
	'Library layout must preserve native shape nodes and drag handlers');

const modelTab = createElement('button');
modelTab.setAttribute('data-electric-library-tab', 'model');
const findTab = createElement('button');
findTab.setAttribute('data-electric-library-tab', 'find');
libraryUi.electricLibraryTabs = [modelTab, findTab];
libraryUi.updateElectricLibraryTabs('find');
assert.strictEqual(modelTab.getAttribute('aria-selected'), 'false');
assert.strictEqual(findTab.getAttribute('aria-selected'), 'true');
assert(findTab.classList.contains('geActive'),
	'The selected Library tab must expose a visible and accessible active state');

const omniSearch = createElement('input');
let omniSearchSelections = 0;
omniSearch.select = () => { omniSearchSelections++; };
libraryUi.sidebarContainer.querySelector = (selector) =>
	selector === '#geOmniSearch' ? omniSearch : null;
libraryUi.updateElectricLibraryTabs('model');
modelTab.focus();
libraryUi.moveElectricLibraryTabFocus(modelTab, 39);
assert.strictEqual(document.activeElement, findTab,
	'ArrowRight must move roving focus to the next Library tab');
assert.strictEqual(findTab.getAttribute('aria-selected'), 'true');
libraryUi.moveElectricLibraryTabFocus(findTab, 36);
assert.strictEqual(document.activeElement, modelTab,
	'Home must move focus and selection to the first Library tab');
libraryUi.moveElectricLibraryTabFocus(modelTab, 35);
assert.strictEqual(document.activeElement, findTab,
	'End must move focus and selection to the last Library tab');
libraryUi.moveElectricLibraryTabFocus(findTab, 37);
assert.strictEqual(document.activeElement, modelTab,
	'ArrowLeft must move roving focus to the previous Library tab');
libraryUi.activateElectricLibraryTab('find');
assert.strictEqual(document.activeElement, omniSearch,
	'Activating Find shapes must move focus into the native search field');
assert.strictEqual(omniSearchSelections, 1);

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
shellUi.hsplitPosition = 264;
shellUi.sidebarContainer.style.setProperty('width', '264px');
shellUi.formatContainer.style.setProperty('width', 'var(--ge-electric-format-width)');
shellUi.restoreElectricShellInlineState();
assert.strictEqual(shellUi.hsplitPosition, 280);
assert.strictEqual(shellUi.sidebarContainer.style.value('width'), '280px');
assert.strictEqual(shellUi.formatContainer.style.value('width'), '240px');
assert.strictEqual(shellUi.hsplit.style.value('left'), '280px');
