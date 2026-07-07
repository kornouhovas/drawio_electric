const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const shapesRoot = path.join(root, 'src/main/webapp/electric/shapes');
const manifest = JSON.parse(fs.readFileSync(
	path.join(shapesRoot, 'manifest.json'), 'utf8'));

function attrs(text)
{
	const result = {};
	text.replace(/([A-Za-z0-9:_-]+)="([^"]*)"/g, (_, key, value) =>
	{
		result[key] = value;
		return '';
	});

	return result;
}

function parseStyle(style)
{
	return String(style || '').split(';').reduce((result, item) =>
	{
		const index = item.indexOf('=');

		if (index > 0)
		{
			result[item.substring(0, index)] = item.substring(index + 1);
		}

		return result;
	}, {});
}

function parseCells(xml)
{
	const cells = [];
	const re = /<mxCell\b([^>]*?)>\s*<mxGeometry\b([^>]*?)\s*\/>\s*<\/mxCell>/g;
	let match;

	while ((match = re.exec(xml)) != null)
	{
		const cellAttrs = attrs(match[1]);
		cellAttrs.geometry = attrs(match[2]);
		cells.push(cellAttrs);
	}

	return cells;
}

function isConnectionTerminal(cell)
{
	return /_device_(?:top_term|bottom_term|screw|copper)_\d+$/.test(cell.id || '');
}

function terminalCenter(cell, device)
{
	const g = cell.geometry;
	const d = device.geometry;
	const x = (Number(g.x || 0) + Number(g.width || 0) / 2 -
		Number(d.x || 0)) / Number(d.width);
	const y = (Number(g.y || 0) + Number(g.height || 0) / 2 -
		Number(d.y || 0)) / Number(d.height);

	return {
		x: Number(x.toFixed(3)),
		y: Number(y.toFixed(3))
	};
}

function perimeterPoint(cell, device)
{
	const center = terminalCenter(cell, device);
	const distances = [
		{edge: 'top', value: center.y},
		{edge: 'bottom', value: 1 - center.y},
		{edge: 'left', value: center.x},
		{edge: 'right', value: 1 - center.x}
	].sort((a, b) => a.value - b.value);
	const point = {x: center.x, y: center.y};

	if (distances[0].edge == 'top')
	{
		point.y = 0;
	}
	else if (distances[0].edge == 'bottom')
	{
		point.y = 1;
	}
	else if (distances[0].edge == 'left')
	{
		point.x = 0;
	}
	else
	{
		point.x = 1;
	}

	return [
		Number(point.x.toFixed(3)),
		Number(point.y.toFixed(3)),
		1
	];
}

function sortPoints(points)
{
	return points.slice().sort((a, b) =>
		a[1] - b[1] || a[0] - b[0] || a[2] - b[2]);
}

const items = manifest.libraries.flatMap((library) => library.items);
let checked = 0;

for (const item of items)
{
	const xml = fs.readFileSync(path.join(shapesRoot, item.original), 'utf8');
	const cells = parseCells(xml);
	const device = cells.find((cell) => /_device$/.test(cell.id || ''));

	assert(device && device.geometry, `Missing device geometry for ${item.original}`);

	const terminalCells = cells.filter(isConnectionTerminal);
	const style = parseStyle(device.style);

	if (terminalCells.length == 0)
	{
		assert.strictEqual(style.outlineConnect, '0',
			`${item.original} without terminals must disable outline connections`);
		assert.strictEqual(style.points, '[]',
			`${item.original} without terminals must not expose default connection points`);
		continue;
	}

	checked++;

	const expected = sortPoints(terminalCells.map((cell) =>
		perimeterPoint(cell, device)));

	assert.strictEqual(style.outlineConnect, '0',
		`${item.original} must disable outline connections`);
	assert.notStrictEqual(device.connectable, '0',
		`${item.original} device root must be connectable so terminal points are visible`);
	assert(style.points,
		`${item.original} must define connection points`);

	const actual = sortPoints(JSON.parse(style.points));

	assert.deepStrictEqual(actual, expected,
		`${item.original} connection points must sit on device perimeter opposite terminals`);
}

assert(checked > 200, 'Expected connection point assertions for Electric devices');

const electricJs = fs.readFileSync(path.join(root,
	'src/main/webapp/js/diagramly/Electric.js'), 'utf8');

assert(/getElectricConnectionPointCells/.test(electricJs),
	'Electric.js must expose a runtime connection point fallback');
assert(/Graph\.prototype\.getAllConnectionConstraints/.test(electricJs),
	'Electric.js must hook Graph.getAllConnectionConstraints for legacy Electric devices');
assert(!/hasExplicitPoints/.test(electricJs),
	'Electric.js must recalculate Electric device constraints even when old explicit points style exists');
assert(/Graph\.prototype\.isCellConnectable/.test(electricJs),
	'Electric.js must make legacy Electric device roots connectable when terminal points exist');
assert(/setConnectable\(true\)/.test(electricJs),
	'Electric.js must mark newly dropped Electric device roots as connectable');
