const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function noop() {}

function createContext() {
	function EditorUi() {}
	EditorUi.prototype.switchCssForTheme = noop;
	EditorUi.prototype.createUi = noop;
	EditorUi.prototype.refresh = noop;
	EditorUi.prototype.destroy = noop;

	function mxGraphHandler() {}
	mxGraphHandler.prototype.mouseMove = noop;
	mxGraphHandler.prototype.updatePreview = noop;

	function Graph() {}
	Graph.prototype.getEventState = (state) => state;
	Graph.prototype.isCellSelectable = () => true;
	Graph.prototype.selectCellForEvent = noop;
	Graph.prototype.dblClick = noop;

	class mxRectangle {
		constructor(x, y, width, height) {
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
		}

		clone() {
			return new mxRectangle(this.x, this.y, this.width, this.height);
		}

		getCenterX() {
			return this.x + this.width / 2;
		}

		getCenterY() {
			return this.y + this.height / 2;
		}
	}

	class mxPoint {
		constructor(x, y) {
			this.x = x;
			this.y = y;
		}
	}

	const context = {
		console,
		Date,
		encodeURIComponent,
		setTimeout: noop,
		window: {
			setTimeout: noop,
			requestAnimationFrame: noop
		},
		document: {
			body: {},
			head: { appendChild: noop },
			getElementById: () => null,
			createTextNode: (value) => value,
			createElement: () => ({
				appendChild: noop,
				setAttribute: noop,
				removeAttribute: noop,
				classList: { add: noop, remove: noop },
				style: {}
			})
		},
		Editor: {
			currentTheme: 'electric',
			themes: []
		},
		EditorUi,
		Graph,
		mxClient: {},
		mxConstants: {},
		mxEvent: {
			addListener: noop,
			consume: noop,
			isAltDown: (evt) => !!(evt && evt.altKey)
		},
		mxEventObject: function() {},
		mxGraphHandler,
		mxPoint,
		mxRectangle,
		mxUtils: {
			bind: (scope, fn) => fn.bind(scope),
			indexOf: (items, item) => items.indexOf(item),
			isAncestorNode: () => false,
			getValue: (style, key, defaultValue) =>
				style != null && style[key] != null ? style[key] : defaultValue
		}
	};

	context.global = context;
	return vm.createContext(context);
}

const context = createContext();
const source = fs.readFileSync(path.join(__dirname, '..',
	'src/main/webapp/js/diagramly/Electric.js'), 'utf8');

vm.runInContext(source, context, { filename: 'Electric.js' });

assert.strictEqual(typeof context.Editor.getElectricDeviceSideSnapDelta,
	'function', 'Electric side snap helper must be registered');

const helper = context.Editor.getElectricDeviceSideSnapDelta;
const moving = { x: 100, y: 80, width: 60, height: 40 };

function assertDelta(actual, expected, message) {
	assert.strictEqual(actual.x, expected.x, message + ' (x)');
	assert.strictEqual(actual.y, expected.y, message + ' (y)');
}

assertDelta(
	helper(moving, { x: 37, y: 0 }, [
		{ x: 200, y: 70, width: 80, height: 60 }
	], 6),
	{ x: 40, y: 0 },
	'moving right side should snap to target left side'
);

assertDelta(
	helper(moving, { x: -17, y: 0 }, [
		{ x: 20, y: 70, width: 60, height: 60 }
	], 6),
	{ x: -20, y: 0 },
	'moving left side should snap to target right side'
);

assertDelta(
	helper(moving, { x: 0, y: 18 }, [
		{ x: 90, y: 140, width: 90, height: 50 }
	], 6),
	{ x: 0, y: 20 },
	'moving bottom side should snap to target top side'
);

assertDelta(
	helper(moving, { x: 37, y: 0 }, [
		{ x: 200, y: 300, width: 80, height: 60 }
	], 6),
	{ x: 37, y: 0 },
	'horizontal side snap should require vertical overlap'
);

assert.strictEqual(typeof context.Editor.getElectricDeviceRootForCell,
	'function', 'Electric device root helper must be registered');
assert.strictEqual(typeof context.Editor.resolveElectricDeviceCellForInteraction,
	'function', 'Electric interaction resolver must be registered');
assert.strictEqual(typeof context.Editor.openElectricDeviceForEditing,
	'function', 'Electric device edit-mode helper must be registered');

function createMockGraph() {
	const layer = { id: 'layer', vertex: false };
	const device = {
		id: 'device',
		vertex: true,
		style: { electricDevice: '1' },
		parent: layer
	};
	const child = {
		id: 'child',
		vertex: true,
		style: {},
		parent: device
	};
	const grandchild = {
		id: 'grandchild',
		vertex: true,
		style: {},
		parent: child
	};
	const other = {
		id: 'other',
		vertex: true,
		style: {},
		parent: layer
	};

	device.children = [child];
	child.children = [grandchild];
	grandchild.children = [];
	other.children = [];
	layer.children = [device, other];

	const model = {
		getParent: (cell) => cell != null ? cell.parent || null : null,
		isVertex: (cell) => !!(cell && cell.vertex),
		getChildCount: (cell) => cell != null && cell.children != null ?
			cell.children.length : 0,
		getChildAt: (cell, index) => cell.children[index],
		getValue: (cell) => cell != null ? cell.value || '' : '',
		isAncestor: (ancestor, cell) => {
			let current = cell;

			while (current != null) {
				if (current === ancestor) {
					return true;
				}

				current = current.parent || null;
			}

			return false;
		}
	};

	const graph = {
		model,
		view: {
			getState: (cell) => cell != null ? { cell } : null
		},
		getModel: () => model,
		getCellStyle: (cell) => cell != null ? cell.style || {} : {}
	};

	return { graph, device, child, grandchild, other };
}

{
	const { graph, device, child, grandchild, other } = createMockGraph();
	const electricGraph = Object.assign(new context.Graph(), graph);
	let selected = null;
	electricGraph.setSelectionCell = (cell) => {
		selected = cell;
	};

	assert.strictEqual(context.Editor.getElectricDeviceRootForCell(graph, child),
		device, 'child should resolve to Electric device root');
	assert.strictEqual(context.Editor.getElectricDeviceRootForCell(graph, grandchild),
		device, 'nested child should resolve to Electric device root');
	assert.strictEqual(context.Editor.resolveElectricDeviceCellForInteraction(graph, child),
		device, 'closed device should expose only the root for child hit-tests');
	assert.strictEqual(context.Editor.resolveElectricDeviceCellForInteraction(graph, device),
		device, 'device root should stay selectable');
	assert.strictEqual(electricGraph.getEventState({ cell: child }).cell,
		device, 'closed device hover state should resolve to root state');
	assert.strictEqual(electricGraph.isCellSelectable(child), false,
		'closed device child should not be selectable');

	electricGraph.dblClick({}, child);
	assert.strictEqual(electricGraph.electricOpenDeviceCell, device,
		'double-click should open Electric device children');
	assert.strictEqual(selected, device,
		'double-click should keep the device root selected');
	assert.strictEqual(context.Editor.resolveElectricDeviceCellForInteraction(electricGraph, child),
		child, 'opened device should expose direct children');
	assert.strictEqual(context.Editor.resolveElectricDeviceCellForInteraction(electricGraph, grandchild),
		grandchild, 'opened device should expose nested children');
	assert.strictEqual(electricGraph.getEventState({ cell: child }).cell,
		child, 'opened device hover state should stay on child state');
	assert.strictEqual(electricGraph.isCellSelectable(child), true,
		'opened device child should be selectable');

	context.Editor.clearElectricDeviceEditingIfOutside(electricGraph, child);
	assert.strictEqual(electricGraph.electricOpenDeviceCell, device,
		'click inside opened device should keep edit mode');

	context.Editor.clearElectricDeviceEditingIfOutside(electricGraph, other);
	assert.strictEqual(electricGraph.electricOpenDeviceCell, null,
		'click outside opened device should close edit mode');
}
