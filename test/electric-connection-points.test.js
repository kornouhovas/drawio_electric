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

	const context = {
		console,
		Date,
		encodeURIComponent,
		isFinite,
		setTimeout: noop,
		JSON,
		Math,
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
				addEventListener: noop,
				removeEventListener: noop,
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

function createCell(id, x, y, width, height, style) {
	return {
		id,
		style: style || 'shape=rect;html=1;',
		geometry: { x, y, width, height },
		children: [],
		connectable: false,
		setConnectable(value) {
			this.connectable = value;
		},
		getChildCount() {
			return this.children.length;
		},
		getChildAt(index) {
			return this.children[index];
		}
	};
}

function addChild(parent, child) {
	parent.children.push(child);
	child.parent = parent;

	return child;
}

function parseStyle(style) {
	return String(style || '').split(';').reduce((result, item) => {
		const index = item.indexOf('=');

		if (index > 0) {
			result[item.substring(0, index)] = item.substring(index + 1);
		}

		return result;
	}, {});
}

const root = path.join(__dirname, '..');
const electricPath = path.join(root,
	'src/main/webapp/js/diagramly/Electric.js');
const source = fs.readFileSync(electricPath, 'utf8');
const shapesSource = fs.readFileSync(path.join(root,
	'src/main/webapp/js/diagramly/ElectricShapes.js'), 'utf8');

assert(!/Graph\.prototype\.getAllConnectionConstraints/.test(source),
	'Electric must not override global graph connection constraints');
assert(!/mxConstraintHandler\.prototype/.test(source),
	'Electric must not override global constraint handler behavior');
assert(!/mxCellMarker\.prototype/.test(source),
	'Electric must not override global marker hit testing');
assert(!/installElectricConnectionFocus/.test(source),
	'Electric must not install runtime focus hacks for connection handles');

const sourceMarkIndex = shapesSource.indexOf(
	'Editor.markElectricShapeCells(model.root.getChildAt(0).children, entry);');
const cloneIndex = shapesSource.indexOf(
	'graph.cloneCells(model.root.getChildAt(0).children)');

assert(sourceMarkIndex >= 0 && cloneIndex >= 0 && sourceMarkIndex < cloneIndex,
	'Electric original cells must be marked before graph.cloneCells clears XML ids');

const context = createContext();
vm.runInContext(source, context, { filename: 'Electric.js' });

assert.strictEqual(typeof context.Editor.applyElectricConnectionPoints,
	'function', 'Electric must expose a helper for shape-local connection points');
assert.strictEqual(typeof context.Editor.getElectricConnectionPointCells,
	'function', 'Electric must find terminal marker cells inside a device');

const device = createCell('sample_device', 0, 0, 200, 400,
	'group;html=1;points=[[0,0,1]];outlineConnect=1;');
addChild(device, createCell('sample_device_top_term_0', 86, 16, 12, 12));
addChild(device, createCell('sample_device_bottom_term_0', 42, 372, 12, 12));
const nested = addChild(device, createCell('sample_device_nested', 120, 100, 40, 40));
addChild(nested, createCell('sample_device_screw_1', 10, 20, 10, 10));

context.Editor.markElectricShapeCells([device], { id: 'electric-sample' });

const style = parseStyle(device.style);

assert.strictEqual(style.electricDevice, '1',
	'Electric device marker should remain on the root group');
assert.strictEqual(style.electricShapeId, 'electric-sample',
	'Electric shape id should remain on the root group');
assert.strictEqual(style.outlineConnect, '0',
	'Electric device outline connection should be disabled');
assert.strictEqual(device.connectable, true,
	'Electric device root should remain connectable');

const points = JSON.parse(style.points);

assert.deepStrictEqual(points, [
	[0.46, 0.055, 0],
	[0.675, 0.313, 0],
	[0.24, 0.945, 0]
], 'Electric connection points should use terminal centers relative to the device frame');

assert(!points.some((point) => point[1] === 0 || point[1] === 1),
	'Electric connection points must not be projected to the outer perimeter');
