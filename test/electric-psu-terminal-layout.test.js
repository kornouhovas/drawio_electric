const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const shapesRoot = path.join(root, 'src/main/webapp/electric/shapes');
const manifest = JSON.parse(fs.readFileSync(
	path.join(shapesRoot, 'manifest.json'), 'utf8'));

const expectedBySeries = {
	'HDR-15': {
		top: {labels: ['+V', '-V'], x: [0.44, 0.60]},
		bottom: {labels: ['N', 'L'], x: [0.44, 0.60]}
	},
	'HDR-30': {
		top: {labels: ['-V', '+V'], x: [0.62, 0.76]},
		bottom: {labels: ['N', 'L'], x: [0.40, 0.68]}
	},
	'HDR-60': {
		top: {labels: ['-V', '-V', '+V', '+V'], x: [0.28, 0.38, 0.48, 0.58]},
		bottom: {labels: ['L', 'N'], x: [0.22, 0.38]}
	},
	'HDR-100': {
		top: {labels: ['-V', '-V', '+V', '+V'], x: [0.43, 0.50, 0.57, 0.64]},
		bottom: {labels: ['L', 'N'], x: [0.12, 0.28]}
	},
	'HDR-150': {
		top: {labels: ['-V', '-V', '+V', '+V'], x: [0.12, 0.17, 0.22, 0.27]},
		bottom: {labels: ['N', 'L'], x: [0.82, 0.91]}
	}
};

function getSeries(item)
{
	const model = item.data && item.data['Модель'] || item.title || '';
	const match = /HDR-(150|100|60|30|15)/.exec(model);
	assert(match, `Cannot detect HDR series for ${item.id}`);

	return `HDR-${match[1]}`;
}

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

function terminalCells(cells, kind, part)
{
	return cells
		.filter((cell) => new RegExp(`_device_${part}_${kind}_\\d+$`).test(cell.id || ''))
		.sort((a, b) => Number((a.id.match(/_(\d+)$/) || [])[1]) -
			Number((b.id.match(/_(\d+)$/) || [])[1]));
}

function relativeX(cell, width)
{
	const g = cell.geometry || {};
	return (Number(g.x) + Number(g.width) / 2) / width;
}

function assertLayout(item, part, expected)
{
	const xml = fs.readFileSync(path.join(shapesRoot, item.original), 'utf8');
	const cells = parseCells(xml);
	const device = cells.find((cell) => /_device$/.test(cell.id || ''));

	assert(device && device.geometry, `Missing device geometry for ${item.original}`);

	const width = Number(device.geometry.width);
	const terms = terminalCells(cells, 'term', part);
	const labels = terminalCells(cells, 'lab', part);

	assert.strictEqual(terms.length, expected.labels.length,
		`${item.original} ${part} terminal count`);
	assert.deepStrictEqual(labels.map((cell) => cell.value), expected.labels,
		`${item.original} ${part} terminal labels`);

	const actualX = terms.map((cell) => relativeX(cell, width));

	for (let i = 0; i < expected.x.length; i++)
	{
		assert(Math.abs(actualX[i] - expected.x[i]) <= 0.015,
			`${item.original} ${part} terminal ${i} x=${actualX[i].toFixed(3)}, expected ${expected.x[i]}`);
	}
}

const psuItems = manifest.libraries
	.flatMap((library) => library.items)
	.filter((item) => item.kind == 'psu');

assert(psuItems.length > 0, 'Electric MW/HDR power supply items must exist');

for (const item of psuItems)
{
	const expected = expectedBySeries[getSeries(item)];

	assertLayout(item, 'top', expected.top);
	assertLayout(item, 'bottom', expected.bottom);
}

const source = fs.readFileSync(path.join(root,
	'src/main/webapp/js/diagramly/ElectricShapes.js'), 'utf8');

assert(/getElectricPsuTerminalLayout/.test(source),
	'ElectricShapes.js must keep MW/HDR terminal layout data in one helper');
