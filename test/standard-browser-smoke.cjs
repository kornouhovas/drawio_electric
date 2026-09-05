// Run with Playwright available via NODE_PATH, against an already built deployment.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const url = process.env.DRAWIO_TEST_URL || 'https://draw-dev.109.235.118.132.nip.io';
const out = process.env.DRAWIO_TEST_OUTPUT || '/tmp/drawio-standard-browser';
fs.mkdirSync(out, {recursive: true});

(async () => {
	const browser = await chromium.launch({channel: 'chrome', headless: true});
	const errors = [];
	let debugPage;
	try {
		const context = await browser.newContext({viewport: {width: 1600, height: 1000}, serviceWorkers: 'block'});
		const page = await context.newPage();
		debugPage = page;
		const originals = [];
		page.on('pageerror', e => errors.push(e.message));
		page.on('request', r => {
			if (r.url().includes('/electric/shapes/items/')) originals.push(r.url());
		});
		const start = Date.now();
		await page.goto(url, {waitUntil: 'domcontentloaded'});
		await page.locator('.geDiagramContainer').waitFor({timeout: 90000});
		await page.locator('.geMenubar').waitFor();
		assert.equal(await page.locator('.geElectricBottomToolbar, .geElectricModePanel').count(), 0);
		assert.equal(await page.evaluate(() => Editor.currentTheme), 'kennedy');
		assert.equal(originals.length, 0);
		const coldReadyMs = Date.now() - start;
		await page.screenshot({path: path.join(out, 'native-startup.png')});
		console.log(JSON.stringify({coldReadyMs, startupOriginalRequests: originals.length,
			bodyText: (await page.locator('body').innerText()).slice(0, 2000)}));

		// Capture the native App instance without modifying its implementation.
		await page.route('**/js/app.min.js*', async route => {
			const response = await route.fetch();
			await route.fulfill({response, body: (await response.text()) + '\n' +
				'var smokeMain=App.main;App.main=function(cb,create){return smokeMain(function(ui){window.smokeUi=ui;if(cb)cb(ui);},create);};'});
		});
		await page.reload({waitUntil: 'domcontentloaded'});
		await page.waitForFunction(() => window.smokeUi?.getCurrentFile() &&
			smokeUi.editor.graph.isEnabled(), null, {timeout: 90000});
		const library = await page.evaluate(() => {
			const ui = window.smokeUi;
			return {libraries: Editor.electricShapeCatalog.libraries.length,
				count: Editor.electricShapeCatalog.libraries.reduce((n,l) => n + l.items.length,0),
				palettes: Object.keys(ui.sidebar.palettes).filter(id => id.startsWith('electric-')),
				file: !!ui.getCurrentFile()};
		});
		console.log(JSON.stringify(library));
		assert.equal(library.libraries, 19);
		assert.equal(library.count, 300);
		assert.equal(library.palettes.length, 19);

		await page.evaluate(() => smokeUi.actions.get('shapes').funct());
		await page.getByText('Remember this Setting', {exact: true}).waitFor();
		await page.getByText('Wiren Board устройства', {exact: true}).last().click();
		await page.waitForFunction(() => Array.from(document.querySelectorAll('.geMoreShapesPreview img')).
			every(img => img.complete && img.naturalWidth > 0));
		await page.screenshot({path: path.join(out, 'more-shapes.png')});
		await page.evaluate(() => smokeUi.hideDialog());
		assert.equal(originals.length, 0, 'More Shapes must use previews only');

		const ids = await page.evaluate(() => {
			const entries = Editor.electricShapeCatalog.libraries.flatMap(l => l.items);
			return [entries.find(e => e.title.includes('3P C6')),
				entries.find(e => e.kind == 'wb'), entries.find(e => e.id.startsWith('electric-iek-')),
				entries.find(e => e.id.startsWith('electric-mw-')),
				entries.find(e => e.id.startsWith('electric-ekf-ut-'))].map(e => e.id);
		});
		for (const [i, id] of ids.entries()) {
			// Open the native palette, hover, then click the actual sidebar template.
			await page.evaluate(id => {
				const entry = Editor.getElectricShapeEntry(id);
				const palette = smokeUi.sidebar.palettes[entry.libraryId];
				if (palette[1].querySelector('.geSidebar').style.display == 'none') palette[0].click();
			}, id);
			const item = page.locator('[data-electric-shape-id="' + id + '"]').first();
			await item.scrollIntoViewIfNeeded();
			await item.hover();
			await page.waitForTimeout(700);
			assert.equal(originals.length, i, 'Hover must not fetch original XML');
			await item.click();
			await page.waitForFunction(id => {
				const g = smokeUi.editor.graph;
				return g.getChildVertices(g.getDefaultParent()).some(c => g.getCellStyle(c).electricShapeId == id);
			}, id, {timeout: 15000});
		}
		const inserted = await page.evaluate(ids => {
			const g = smokeUi.editor.graph;
			const model = g.getModel();
			const cells = g.getChildVertices(g.getDefaultParent());
			model.beginUpdate();
			try {
				let x = 20;
				for (const cell of cells) {
					const geo = cell.geometry.clone();
					geo.x = x; geo.y = 30; x += geo.width + 20;
					model.setGeometry(cell, geo);
				}
			} finally { model.endUpdate(); }
			g.clearSelection();
			g.fit(30);
			return ids.map(id => {
				const c = cells.find(c => g.getCellStyle(c).electricShapeId == id);
				const e = Editor.getElectricShapeEntry(id);
				return {id, width: c.geometry.width, height: c.geometry.height,
					expectedWidth: e.width, expectedHeight: e.height,
					descendants: model.getDescendants(c).length,
					embeddedImage: c.style.includes('image=data:image/') && c.style.length > 10000};
			});
		}, ids);
		for (const c of inserted) {
			assert(Math.abs(c.width - c.expectedWidth) < 0.1, JSON.stringify(c));
			assert(Math.abs(c.height - c.expectedHeight) < 0.1, JSON.stringify(c));
			assert(c.descendants > 1 || c.embeddedImage, 'The original must replace the thumbnail');
		}
		await page.mouse.move(900, 80);
		await page.waitForTimeout(700);
		await page.screenshot({path: path.join(out, 'original-devices.png')});
		const saved = await page.evaluate(() => smokeUi.getFileData());
		fs.writeFileSync(path.join(out, 'smoke.drawio'), saved);
		const exported = await context.request.post(url + '/service/0', {
			form: {format: 'png', xml: saved, embedXml: '0', scale: '1', border: '10'}, timeout: 60000
		});
		const png = await exported.body();
		assert.equal(exported.status(), 200, png.toString().slice(0, 500));
		assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
		fs.writeFileSync(path.join(out, 'export-smoke.png'), png);
		const countBeforeReopen = originals.length;
		await page.evaluate(saved => smokeUi.fileLoaded(new LocalFile(smokeUi, saved, 'smoke.drawio')), saved);
		await page.waitForTimeout(1000);
		const reopened = await page.evaluate(() => {
			const g = smokeUi.editor.graph;
			return g.getChildVertices(g.getDefaultParent()).map(c =>
				({id:g.getCellStyle(c).electricShapeId, descendants:g.getModel().getDescendants(c).length,
					embeddedImage:c.style.includes('image=data:image/') && c.style.length > 10000}));
		});
		assert.equal(reopened.length, ids.length);
		assert(reopened.every(c => c.descendants > 1 || c.embeddedImage));
		assert.equal(originals.length, countBeforeReopen, 'Saved originals must reopen without library downloads');
		await page.setViewportSize({width: 1024, height: 768});
		await page.screenshot({path: path.join(out, 'native-compact.png')});
		await page.setViewportSize({width: 390, height: 844});
		await page.screenshot({path: path.join(out, 'native-mobile.png')});
		assert.deepEqual(errors, []);
		const report = {coldReadyMs, library, originalRequests: originals.length, inserted,
			reopened, savedBytes: Buffer.byteLength(saved), exportBytes: png.length, errors};
		fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
		console.log(JSON.stringify(report, null, 2));
	} catch (e) {
		console.error(JSON.stringify({errors, bodyText: await debugPage?.locator('body').innerText()}));
		await debugPage?.screenshot({path: path.join(out, 'failure.png')});
		throw e;
	} finally {
		await browser.close();
	}
})().catch(e => { console.error(e); process.exitCode = 1; });
