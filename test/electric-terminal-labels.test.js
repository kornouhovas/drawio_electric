const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function noop() {}

function createContext() {
	function Sidebar() {}
	Sidebar.prototype.updateEntries = noop;
	Sidebar.prototype.initPalettes = noop;
	Sidebar.prototype.createTooltip = noop;
	Sidebar.prototype.createDropHandler = noop;

	const context = {
		console,
		window: {
			DRAWIO_BASE_URL: 'https://example.test',
			location: { origin: 'https://example.test' },
			innerHeight: 900,
			innerWidth: 1200
		},
		Editor: {},
		Sidebar,
		mxUtils: {
			bind: (scope, fn) => fn.bind(scope),
			getValue: (style, key, defaultValue) =>
				style != null && style[key] != null ? style[key] : defaultValue,
			htmlEntities: (value) => String(value)
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
		},
		mxCell: function(value, geometry, style) {
			this.value = value;
			this.geometry = geometry;
			this.style = style;
			this.children = [];
			this.vertex = false;
			this.setConnectable = noop;
			this.insert = function(child) {
				this.children.push(child);
				child.parent = this;
			};
			this.getChildCount = function() {
				return this.children.length;
			};
			this.getChildAt = function(index) {
				return this.children[index];
			};
			this.getIndex = function(child) {
				return this.children.indexOf(child);
			};
			this.remove = function(index) {
				const removed = this.children.splice(index, 1)[0];

				if (removed != null) {
					removed.parent = null;
				}

				return removed;
			};
		},
		mxGeometry: function(x, y, width, height) {
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
		}
	};

	context.global = context;
	return vm.createContext(context);
}

function createCell(id, x, y, width, height, value, style) {
	return {
		id,
		value,
		style: style || '',
		geometry: { x, y, width, height },
		children: [],
		getChildCount() {
			return this.children.length;
		},
		getChildAt(index) {
			return this.children[index];
		},
		getIndex(child) {
			return this.children.indexOf(child);
		},
		remove(index) {
			const removed = this.children.splice(index, 1)[0];

			if (removed != null) {
				removed.parent = null;
			}

			return removed;
		}
	};
}

function addChild(parent, child) {
	parent.children.push(child);
	child.parent = parent;

	return child;
}

const context = createContext();
const source = fs.readFileSync(path.join(__dirname, '..',
	'src/main/webapp/js/diagramly/ElectricShapes.js'), 'utf8');

vm.runInContext(source, context, { filename: 'ElectricShapes.js' });

assert.strictEqual(typeof context.Editor.removeElectricTerminalCanvasLabels,
	'function', 'Electric terminal canvas label helper must be registered');

{
	const device = createCell('ekf_ut_scr_ut_16_g_device', 0, 0, 47, 165,
		'', 'group;html=1;');
	const marking = addChild(device, createCell(
		'ekf_ut_scr_ut_16_g_device_marking', -8, 169, 63, 24,
		'UT 16<br>Проходная', 'text;html=1;'
	));
	const size = addChild(device, createCell(
		'ekf_ut_scr_ut_16_g_device_size_text', 2, 79, 43, 15,
		'16', 'text;html=1;'
	));
	const lineTag = addChild(device, createCell(
		'ekf_ut_scr_ut_16_g_device_line_tag', 5, 37, 36, 13,
		'XT', 'rounded=1;html=1;'
	));

	context.Editor.removeElectricTerminalCanvasLabels([device],
		{ id: 'electric-ekf-ut-scr-ut-16-g', kind: 'terminal' });

	assert.strictEqual(device.children.includes(marking), false,
		'UT terminal bottom marking should be removed before canvas drop');
	assert.strictEqual(marking.parent, null,
		'removed marking should be detached from the terminal group');
	assert.strictEqual(device.children.includes(size), true,
		'internal size text should remain on the terminal device');
	assert.strictEqual(device.children.includes(lineTag), true,
		'internal XT tag should remain on the terminal device');
}

{
	const breaker = createCell('ekf_breaker_device', 0, 0, 54, 165,
		'', 'group;html=1;');
	const marking = addChild(breaker, createCell(
		'ekf_breaker_device_marking', -4, 169, 62, 24,
		'BA 47-63<br>1P C10', 'text;html=1;'
	));

	context.Editor.removeElectricTerminalCanvasLabels([breaker],
		{ id: 'electric-ekf-mcb-1p-c10', kind: 'breaker' });

	assert.strictEqual(breaker.children.includes(marking), true,
		'non-terminal bottom markings should not be changed');
}
