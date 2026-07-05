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
