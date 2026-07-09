/**
 * Copyright (c) 2026, draw.io Electric contributors
 */
/**
 * Electric shape libraries. Metadata and original cells live under
 * /electric/shapes so the editor does not load all original device XML upfront.
 */
(function()
{
	var updateEntries = Sidebar.prototype.updateEntries;
	var initPalettes = Sidebar.prototype.initPalettes;
	var createTooltip = Sidebar.prototype.createTooltip;
	var createDropHandler = Sidebar.prototype.createDropHandler;

	Editor.electricShapesPath = 'electric/shapes/';
	Editor.electricShapeCatalog = Editor.electricShapeCatalog || null;
	Editor.electricShapeEntryIndex = null;
	Editor.electricShapeTemplateCache = {};
	Editor.electricShapeTemplateOrder = [];
	Editor.electricShapeTemplateCacheLimit = 24;
	Editor.electricShapeLoadPromises = {};
	Editor.electricLibraryPreviewCache = {};

	Editor.getElectricShapesBaseUrl = function()
	{
		var base = (window.DRAWIO_BASE_URL != null) ?
			window.DRAWIO_BASE_URL : window.location.origin;

		return base.replace(/\/$/, '') + '/' + Editor.electricShapesPath;
	};

	Editor.getElectricShapeAssetUrl = function(path)
	{
		var url = Editor.getElectricShapesBaseUrl() + path;
		var version = (Editor.electricShapeCatalog != null) ?
			Editor.electricShapeCatalog.assetVersion : null;

		return url + ((version != null) ? '?v=' + encodeURIComponent(version) : '');
	};

	Editor.loadElectricTextResource = function(path)
	{
		return fetch(Editor.getElectricShapeAssetUrl(path), {
			credentials: 'same-origin',
			cache: 'force-cache'
		}).then(function(response)
		{
			if (!response.ok)
			{
				throw new Error('Cannot load Electric shape resource: ' + path +
					' (' + response.status + ')');
			}

			return response.text();
		});
	};

	Editor.loadElectricShapeCatalog = function()
	{
		if (Editor.electricShapeCatalog == null ||
			Editor.electricShapeCatalog.libraries == null)
		{
			throw new Error('Electric shape catalog is not included in the build');
		}

		return Editor.electricShapeCatalog;
	};

	Editor.getElectricShapeEntry = function(id)
	{
		var catalog = Editor.loadElectricShapeCatalog();

		if (Editor.electricShapeEntryIndex == null)
		{
			Editor.electricShapeEntryIndex = {};

			for (var i = 0; i < catalog.libraries.length; i++)
			{
				for (var j = 0; j < catalog.libraries[i].items.length; j++)
				{
					Editor.electricShapeEntryIndex[catalog.libraries[i].items[j].id] =
						catalog.libraries[i].items[j];
				}
			}
		}

		return Editor.electricShapeEntryIndex[id] || null;
	};

	Editor.getElectricShapeIdFromCells = function(graph, cells)
	{
		if (graph != null && cells != null && cells.length > 0)
		{
			var style = graph.getCellStyle(cells[0]);

			return mxUtils.getValue(style, 'electricShapeId', null);
		}

		return null;
	};

	Editor.isElectricUtTerminalShapeId = function(id)
	{
		return String(id || '').indexOf('electric-ekf-ut-') == 0;
	};

	Editor.isElectricUtTerminalShape = function(entry)
	{
		return entry != null && entry.kind == 'terminal' &&
			(entry.libraryId == 'electric-ekf-ut' ||
				Editor.isElectricUtTerminalShapeId(entry.id));
	};

	Editor.isElectricTerminalCanvasLabel = function(parent, cell)
	{
		if (parent == null || cell == null || parent.geometry == null ||
			cell.geometry == null)
		{
			return false;
		}

		var id = String(cell.id || '');
		var parentHeight = parseFloat(parent.geometry.height);
		var cellY = parseFloat(cell.geometry.y);

		return id.indexOf('_marking') >= 0 && !isNaN(parentHeight) &&
			!isNaN(cellY) && cellY >= parentHeight - 0.1;
	};

	Editor.removeElectricTerminalCanvasLabels = function(cells, entry)
	{
		if (!Editor.isElectricUtTerminalShape(entry) || cells == null)
		{
			return cells;
		}

		var removeLabels = function(cell)
		{
			if (cell == null || typeof cell.getChildCount != 'function' ||
				typeof cell.getChildAt != 'function')
			{
				return;
			}

			for (var i = cell.getChildCount() - 1; i >= 0; i--)
			{
				var child = cell.getChildAt(i);

				if (Editor.isElectricTerminalCanvasLabel(cell, child))
				{
					cell.remove(i);
				}
				else
				{
					removeLabels(child);
				}
			}
		};

		for (var i = 0; i < cells.length; i++)
		{
			removeLabels(cells[i]);
		}

		return cells;
	};

	Editor.getElectricCellShapeId = function(graph, cell)
	{
		if (graph != null && cell != null &&
			typeof graph.getCellStyle == 'function')
		{
			return mxUtils.getValue(graph.getCellStyle(cell),
				'electricShapeId', null);
		}

		return null;
	};

	Editor.isElectricUtTerminalCell = function(graph, cell)
	{
		var shapeId = Editor.getElectricCellShapeId(graph, cell);
		var id = String((cell != null) ? cell.id || '' : '');

		return Editor.isElectricUtTerminalShapeId(shapeId) ||
			id.indexOf('ekf_ut_') == 0 || id.indexOf('ekf_hdw_') == 0;
	};

	Editor.cleanupElectricTerminalCanvasLabels = function(graph, cells)
	{
		var model = (graph != null && typeof graph.getModel == 'function') ?
			graph.getModel() : null;

		if (model == null)
		{
			return 0;
		}

		if (cells == null)
		{
			var root = (typeof model.getRoot == 'function') ?
				model.getRoot() : model.root;
			cells = (root != null) ? [root] : [];
		}

		var removed = 0;
		var visit = function(cell)
		{
			if (cell == null)
			{
				return;
			}

			var terminal = Editor.isElectricUtTerminalCell(graph, cell);
			var count = (typeof model.getChildCount == 'function') ?
				model.getChildCount(cell) :
				(typeof cell.getChildCount == 'function' ? cell.getChildCount() : 0);

			for (var i = count - 1; i >= 0; i--)
			{
				var child = (typeof model.getChildAt == 'function') ?
					model.getChildAt(cell, i) : cell.getChildAt(i);

				if (terminal && Editor.isElectricTerminalCanvasLabel(cell, child))
				{
					model.remove(child);
					removed++;
				}
				else
				{
					visit(child);
				}
			}
		};

		if (typeof model.beginUpdate == 'function')
		{
			model.beginUpdate();
		}

		try
		{
			for (var i = 0; i < cells.length; i++)
			{
				visit(cells[i]);
			}
		}
		finally
		{
			if (typeof model.endUpdate == 'function')
			{
				model.endUpdate();
			}
		}

		return removed;
	};

	Editor.rememberElectricShapeTemplate = function(id, cells)
	{
		Editor.electricShapeTemplateCache[id] = cells;

		var index = Editor.electricShapeTemplateOrder.indexOf(id);

		if (index >= 0)
		{
			Editor.electricShapeTemplateOrder.splice(index, 1);
		}

		Editor.electricShapeTemplateOrder.push(id);

		while (Editor.electricShapeTemplateOrder.length >
			Editor.electricShapeTemplateCacheLimit)
		{
			delete Editor.electricShapeTemplateCache[
				Editor.electricShapeTemplateOrder.shift()];
		}
	};

	Editor.getElectricShapeTemplate = function(entry)
	{
		var cached = Editor.electricShapeTemplateCache[entry.id];

		if (cached != null)
		{
			Editor.rememberElectricShapeTemplate(entry.id, cached);
			return Promise.resolve(cached);
		}

		if (Editor.electricShapeLoadPromises[entry.id] == null)
		{
			Editor.electricShapeLoadPromises[entry.id] =
				Editor.loadElectricTextResource(entry.original).then(function(xml)
				{
					var doc = mxUtils.parseXml(xml);
					var codec = new mxCodec(doc);
					var model = new mxGraphModel();
					codec.decode(doc.documentElement, model);

					var layer = model.root.getChildAt(0);
					var cells = (layer != null && layer.children != null) ?
						layer.children : [];
					Editor.rememberElectricShapeTemplate(entry.id, cells);
					delete Editor.electricShapeLoadPromises[entry.id];

					return cells;
				}).catch(function(error)
				{
					delete Editor.electricShapeLoadPromises[entry.id];
					throw error;
				});
		}

		return Editor.electricShapeLoadPromises[entry.id];
	};

	Editor.getElectricShapeCells = function(entry, graph)
	{
		return Editor.getElectricShapeTemplate(entry).then(function(template)
		{
			var cells = graph.cloneCells(template);
			Editor.removeElectricTerminalCanvasLabels(cells, entry);
			Editor.markElectricShapeCells(cells, entry);

			return cells;
		});
	};

	Editor.prefetchElectricShape = function(entry)
	{
		return Editor.getElectricShapeTemplate(entry).catch(function()
		{
			return null;
		});
	};

	Editor.showElectricShapeLoadError = function(sidebar, error)
	{
		if (window.console != null && window.console.error != null)
		{
			window.console.error(error);
		}

		var message = mxResources.get('electricShapesLoadError') ||
			'Could not load Electric device';

		if (sidebar != null && sidebar.editorUi != null &&
			sidebar.editorUi.showError != null)
		{
			sidebar.editorUi.showError(message, (error != null) ? error.message : '');
		}
	};

	Editor.addElectricShapeConfigurations = function(catalog)
	{
		var existing = {};

		for (var i = 0; i < Sidebar.prototype.configuration.length; i++)
		{
			existing[Sidebar.prototype.configuration[i].id] = true;
		}

		for (var i = 0; i < catalog.libraries.length; i++)
		{
			var id = catalog.libraries[i].id;

			if (existing[id] == null)
			{
				Sidebar.prototype.configuration.push({id: id, libs: [id]});
				existing[id] = true;
			}
		}
	};

	Editor.removeElectricShapeConfigurations = function()
	{
		for (var i = Sidebar.prototype.configuration.length - 1; i >= 0; i--)
		{
			if (String(Sidebar.prototype.configuration[i].id).indexOf('electric-') == 0)
			{
				Sidebar.prototype.configuration.splice(i, 1);
			}
		}
	};

	Editor.getElectricSvgText = function(value)
	{
		return mxUtils.htmlEntities(value || '');
	};

	Editor.trimElectricText = function(value, max)
	{
		value = (value != null) ? String(value).replace(/\s+/g, ' ').trim() : '';

		if (max != null && value.length > max)
		{
			return value.substring(0, Math.max(0, max - 1)) + '…';
		}

		return value;
	};

	Editor.getElectricShapeLabel = function(entry)
	{
		var data = entry.data || {};

		return data['Маркировка'] || data['Сечение'] || data['Модель'] ||
			data['Выход'] || entry.title;
	};

	Editor.getElectricTerminalColor = function(entry)
	{
		var color = Editor.getElectricShapeValue(entry, 'Цвет');
		var type = Editor.getElectricShapeValue(entry, 'Тип');
		var section = entry.section || '';

		if (color == 'Синий' || section.indexOf('сини') >= 0)
		{
			return {fill: '#bfdbfe', stroke: '#1d4ed8', accent: '#60a5fa'};
		}
		else if (color == 'PE' || type.indexOf('зазем') >= 0 || section.indexOf('PE') >= 0)
		{
			return {fill: '#d9f99d', stroke: '#15803d', accent: '#facc15'};
		}
		else if (type.indexOf('Заглуш') >= 0 || section.indexOf('заглуш') >= 0)
		{
			return {fill: '#f3f4f6', stroke: '#6b7280', accent: '#d1d5db'};
		}
		else if (section.indexOf('аксесс') >= 0)
		{
			return {fill: '#e5e7eb', stroke: '#4b5563', accent: '#9ca3af'};
		}

		return {fill: '#e5e7eb', stroke: '#374151', accent: '#9ca3af'};
	};

	Editor.electricWbPreviewMaxWidth = 260;
	Editor.electricWbPreviewMaxHeight = 210;

	Editor.getElectricBoundedPreviewSize = function(entry, maxWidth, maxHeight, minWidth, minHeight)
	{
		var width = Math.max(1, Number(entry.width) || 1);
		var height = Math.max(1, Number(entry.height) || 1);
		var scale = Math.min(maxWidth / width, maxHeight / height, 1);

		return {
			width: Math.max(minWidth, Math.round(width * scale)),
			height: Math.max(minHeight, Math.round(height * scale))
		};
	};

	Editor.getElectricPreviewSize = function(entry)
	{
		if (entry.kind == 'terminal')
		{
			return {width: 44, height: 112, thumbWidth: 24, thumbHeight: 50};
		}
		else if (entry.kind == 'wb')
		{
			var wbSize = Editor.getElectricBoundedPreviewSize(entry,
				Editor.electricWbPreviewMaxWidth,
				Editor.electricWbPreviewMaxHeight, 24, 40);
			var wbThumbHeight = 54;
			var wbRatio = (entry.height > 0) ? entry.width / entry.height : 0.55;

			return {
				width: wbSize.width,
				height: wbSize.height,
				thumbWidth: Math.max(26, Math.min(64, Math.round(wbThumbHeight * wbRatio))),
				thumbHeight: wbThumbHeight
			};
		}

		var thumbHeight = 54;
		var ratio = (entry.height > 0) ? entry.width / entry.height : 0.3;

		return {
			width: Math.max(20, entry.width),
			height: Math.max(40, entry.height),
			thumbWidth: Math.max(24, Math.min(52, Math.round(thumbHeight * ratio))),
			thumbHeight: thumbHeight
		};
	};

	Editor.getElectricPoleCount = function(entry)
	{
		var marking = Editor.getElectricShapeValue(entry, 'Маркировка');
		var modularity = Editor.getElectricShapeValue(entry, 'Модульность');

		if (/4P/.test(marking))
		{
			return 4;
		}
		else if (/3P/.test(marking))
		{
			return 3;
		}
		else if (/2P|1P\+N/.test(marking))
		{
			return 2;
		}

		var match = /(\d+)M/.exec(modularity);

		return (match != null) ? Math.max(1, parseInt(match[1], 10)) : 1;
	};

	Editor.getElectricPreviewTextRows = function(entry)
	{
		var data = entry.data || {};

		if (entry.kind == 'terminal')
		{
			return [
				Editor.trimElectricText(data['Серия'] || 'UT', 12),
				Editor.trimElectricText(data['Сечение'] || data['Тип'] || entry.title, 12),
				Editor.trimElectricText(data['Цвет'] || data['Номинал'] || '', 12)
			];
		}
		else if (entry.kind == 'psu')
		{
			return [
				Editor.trimElectricText(data['Модель'] || entry.title, 14),
				Editor.trimElectricText(data['Выход'] || '', 16),
				Editor.trimElectricText(data['Мощность'] || '', 10)
			];
		}
		else if (entry.kind == 'wb')
		{
			return [
				Editor.trimElectricText(data['Модель'] || data['Серия'] || entry.title, 18),
				Editor.trimElectricText(data['Модульность'] || data['Ширина'] || '', 14),
				Editor.trimElectricText(data['Тип'] || 'Wiren Board', 16)
			];
		}

		var marking = data['Маркировка'] || entry.title;
		var rating = Editor.getElectricRating(entry);

		return [
			Editor.trimElectricText(data['Серия'] || 'EKF', 12),
			Editor.trimElectricText(rating, 10),
			Editor.trimElectricText(marking, 16)
		];
	};

	Editor.getElectricSvgTextLine = function(value, x, y, size, weight, anchor, fill)
	{
		return '<text x="' + x + '" y="' + y +
			'" font-family="Arial,sans-serif" font-size="' + size +
			'" font-weight="' + (weight || '400') + '" text-anchor="' +
			(anchor || 'middle') + '" fill="' + (fill || '#111827') + '">' +
			Editor.getElectricSvgText(value) + '</text>';
	};

	Editor.getElectricPsuSeries = function(entry)
	{
		var series = Editor.getElectricShapeValue(entry, 'Серия');
		var model = Editor.getElectricShapeValue(entry, 'Модель') || entry.title;
		var match = /HDR-(150|100|60|30|15)/.exec(series + ' ' + model);

		return match != null ? 'HDR-' + match[1] : 'HDR-30';
	};

	Editor.getElectricPsuTerminalLayout = function(entry)
	{
		var layouts = {
			'HDR-15': {
				top: [{label: '+V', x: 0.44}, {label: '-V', x: 0.60}],
				bottom: [{label: 'N', x: 0.44}, {label: 'L', x: 0.60}]
			},
			'HDR-30': {
				top: [{label: '-V', x: 0.62}, {label: '+V', x: 0.76}],
				bottom: [{label: 'N', x: 0.40}, {label: 'L', x: 0.68}]
			},
			'HDR-60': {
				top: [{label: '-V', x: 0.28}, {label: '-V', x: 0.38},
					{label: '+V', x: 0.48}, {label: '+V', x: 0.58}],
				bottom: [{label: 'L', x: 0.22}, {label: 'N', x: 0.38}]
			},
			'HDR-100': {
				top: [{label: '-V', x: 0.43}, {label: '-V', x: 0.50},
					{label: '+V', x: 0.57}, {label: '+V', x: 0.64}],
				bottom: [{label: 'L', x: 0.12}, {label: 'N', x: 0.28}]
			},
			'HDR-150': {
				top: [{label: '-V', x: 0.12}, {label: '-V', x: 0.17},
					{label: '+V', x: 0.22}, {label: '+V', x: 0.27}],
				bottom: [{label: 'N', x: 0.82}, {label: 'L', x: 0.91}]
			}
		};

		return layouts[Editor.getElectricPsuSeries(entry)] || layouts['HDR-30'];
	};

	Editor.getElectricPsuTopLabels = function(entry)
	{
		return Editor.getElectricPsuTerminalLayout(entry).top.map(function(item)
		{
			return item.label;
		});
	};

	Editor.createElectricBreakerPoleSvg = function(entry, x, y, w, h, compact)
	{
		var poles = Editor.getElectricPoleCount(entry);
		var rows = Editor.getElectricPreviewTextRows(entry);
		var series = Editor.getElectricShapeValue(entry, 'Серия') || rows[0];
		var marking = Editor.getElectricShapeValue(entry, 'Маркировка') || rows[2];
		var moduleW = w / poles;
		var bandH = Math.max(6, h * 0.054);
		var svg = '';

		svg += '<rect data-electric-pole="body" x="' + x + '" y="' + y +
			'" width="' + w + '" height="' + h +
			'" fill="#f8f8f8" stroke="#111827" stroke-width="1.3"/>';
		svg += '<rect x="' + x + '" y="' + y + '" width="' + w +
			'" height="' + bandH + '" fill="#f2f2f2" stroke="#c7c7c7" stroke-width="0.45"/>';
		svg += '<rect x="' + x + '" y="' + (y + h - bandH) +
			'" width="' + w + '" height="' + bandH +
			'" fill="#f2f2f2" stroke="#c7c7c7" stroke-width="0.45"/>';
		svg += '<rect x="' + x + '" y="' + (y + h * 0.057) +
			'" width="' + w + '" height="' + (h * 0.07) +
			'" fill="#eeeeee" stroke="#d6d6d6" stroke-width="0.45"/>';
		svg += '<rect x="' + x + '" y="' + (y + h * 0.815) +
			'" width="' + w + '" height="' + (h * 0.064) +
			'" fill="#eeeeee" stroke="#d6d6d6" stroke-width="0.45"/>';

		for (var i = 0; i < poles; i++)
		{
			var poleX = x + i * moduleW;
			var cx = poleX + moduleW / 2;
			var screwR = Math.max(2.1, Math.min(4.2, moduleW * 0.06));

			svg += '<circle data-electric-pole="terminal" cx="' + cx +
				'" cy="' + (y + bandH * 0.54) + '" r="' + screwR +
				'" fill="#ffffff" stroke="#777777" stroke-width="0.7"/>';
			svg += '<rect x="' + (cx - screwR * 1.25) + '" y="' +
				(y + bandH * 0.78) + '" width="' + (screwR * 2.5) +
				'" height="' + Math.max(2, screwR * 0.75) +
				'" fill="#d8d8d8" stroke="#b5b5b5" stroke-width="0.45"/>';
			svg += '<circle data-electric-pole="terminal" cx="' + cx +
				'" cy="' + (y + h - bandH * 0.54) + '" r="' + screwR +
				'" fill="#ffffff" stroke="#777777" stroke-width="0.7"/>';
			svg += '<rect x="' + (cx - screwR * 1.25) + '" y="' +
				(y + h - bandH * 0.97) + '" width="' + (screwR * 2.5) +
				'" height="' + Math.max(2, screwR * 0.75) +
				'" fill="#d8d8d8" stroke="#b5b5b5" stroke-width="0.45"/>';

			if (i > 0)
			{
				svg += '<path data-electric-pole="divider" d="M' + poleX +
					' ' + y + 'v' + h + '" stroke="#c5c5c5" stroke-width="0.6"/>';
			}

			svg += '<rect data-electric-pole="handle" x="' +
				(poleX + moduleW * 0.03) + '" y="' + (y + h * 0.52) +
				'" width="' + (moduleW * 0.94) + '" height="' + (h * 0.13) +
				'" fill="#a9a49a" stroke="#7c786e" stroke-width="0.45"/>';
		}

		svg += '<rect x="' + (x + w * 0.033) + '" y="' + (y + h * 0.14) +
			'" width="' + Math.max(6, w * 0.047) + '" height="' +
			Math.max(5, h * 0.032) + '" fill="#e41f26"/>';
		svg += Editor.getElectricSvgTextLine('EKF', x + w * 0.15,
			y + h * 0.172, compact ? 6 : 9, '700', 'start');
		svg += '<rect x="' + x + '" y="' + (y + h * 0.222) +
			'" width="' + w + '" height="' + (h * 0.026) +
			'" fill="#3b3b3b"/>';
		svg += '<rect x="' + (x + 1) + '" y="' + (y + h * 0.222) +
			'" width="' + (moduleW * 0.54) + '" height="' + Math.max(2, h * 0.01) +
			'" fill="#16b84e"/>';
		svg += Editor.getElectricSvgTextLine(Editor.trimElectricText(series, 12),
			x + w / 2, y + h * 0.245, compact ? 5.2 : 7, '700');
		svg += Editor.getElectricSvgTextLine(rows[1], x + w * 0.05,
			y + h * 0.335, compact ? 9 : 15, '700', 'start');
		svg += '<rect x="' + (x + w * 0.38) + '" y="' + (y + h * 0.39) +
			'" width="' + (w * 0.24) + '" height="' + (h * 0.095) +
			'" rx="' + Math.max(5, h * 0.025) +
			'" fill="#ffe45c" stroke="#b88900" stroke-width="0.8"/>';
		svg += Editor.getElectricSvgTextLine('QF', x + w / 2,
			y + h * 0.455, compact ? 8 : 15, '700');
		svg += Editor.getElectricSvgTextLine('OFF', x + w / 2,
			y + h * 0.605, compact ? 5 : 8, '700');
		svg += Editor.getElectricSvgTextLine(Editor.trimElectricText(marking, 14),
			x + w / 2, y + h * 0.76, compact ? 6 : 10, '700');

		return svg;
	};

	Editor.createElectricModuleFaceSvg = function(entry, x, y, w, h, compact)
	{
		var ratio = (entry.height > 0) ? entry.width / entry.height : 0.3;
		var minW = (entry.kind == 'terminal') ? 24 : 30;
		var faceW = Math.max(minW, Math.min(w - 6,
			h * Math.max(0.18, Math.min(0.72, ratio))));
		var faceH = h - 4;
		var faceX = x + (w - faceW) / 2;
		var faceY = y + 2;
		var rows = Editor.getElectricPreviewTextRows(entry);
		var svg = '';

		if (entry.kind == 'wb' && entry.preview != null)
		{
			svg += '<rect x="' + faceX + '" y="' + faceY + '" width="' +
				faceW + '" height="' + faceH +
				'" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.5"/>';
			svg += '<image href="' +
				Editor.getElectricSvgText(Editor.getElectricShapeAssetUrl(entry.preview)) +
				'" x="' + faceX + '" y="' + faceY + '" width="' + faceW +
				'" height="' + faceH + '" preserveAspectRatio="xMidYMid meet"/>';
		}
		else if (entry.kind == 'terminal')
		{
			var colors = Editor.getElectricTerminalColor(entry);
			var isPlate = /Заглуш|аксесс/i.test(Editor.getElectricShapeValue(entry, 'Тип') + ' ' + entry.section);

			svg += '<rect x="' + faceX + '" y="' + faceY + '" width="' +
				faceW + '" height="' + faceH + '" rx="3" fill="' + colors.fill +
				'" stroke="' + colors.stroke + '" stroke-width="1.3"/>';
			svg += '<path d="M' + (faceX + faceW * 0.5) + ' ' + (faceY + 6) +
				'v' + (faceH - 12) + '" stroke="' + colors.accent +
				'" stroke-width="' + Math.max(2, faceW * 0.1) +
				'" stroke-linecap="round" opacity="0.9"/>';

			if (!isPlate)
			{
				svg += '<rect x="' + (faceX + faceW * 0.18) + '" y="' +
					(faceY + faceH * 0.11) + '" width="' + (faceW * 0.64) +
					'" height="' + Math.max(8, faceH * 0.16) +
					'" rx="2" fill="#ffffff" stroke="#64748b" stroke-width="0.8"/>';
				svg += '<rect x="' + (faceX + faceW * 0.18) + '" y="' +
					(faceY + faceH * 0.72) + '" width="' + (faceW * 0.64) +
					'" height="' + Math.max(8, faceH * 0.16) +
					'" rx="2" fill="#ffffff" stroke="#64748b" stroke-width="0.8"/>';
			}

		}
		else if (entry.kind == 'psu')
		{
			var model = Editor.getElectricShapeValue(entry, 'Модель') || entry.title;
			var input = Editor.getElectricShapeValue(entry, 'Вход');
			var output = Editor.getElectricShapeValue(entry, 'Выход');
			var power = Editor.getElectricShapeValue(entry, 'Мощность');
			var terminalLayout = Editor.getElectricPsuTerminalLayout(entry);
			var topTerminals = terminalLayout.top;
			var bottomTerminals = terminalLayout.bottom;
			var terminalR = Math.max(2.2, Math.min(4.2, faceW * 0.04));
			var logoW = Math.min(faceW * 0.34, faceH * 0.18);
			var logoX = faceX + faceW * 0.06;
			var contentColor = '#d8d0bb';
			var smallColor = '#d7d7d7';
			var powerColor = '#f7df25';

			svg += '<rect x="' + faceX + '" y="' + faceY + '" width="' +
				faceW + '" height="' + faceH +
				'" fill="#626663" stroke="#222" stroke-width="1.3"/>';
			svg += '<rect x="' + faceX + '" y="' + faceY + '" width="' +
				faceW + '" height="' + (faceH * 0.107) +
				'" fill="#30383a" stroke="none"/>';
			svg += '<rect x="' + faceX + '" y="' + (faceY + faceH * 0.107) +
				'" width="' + faceW + '" height="' + (faceH * 0.048) +
				'" fill="#41484a" stroke="#171b1c" stroke-width="0.6"/>';
			svg += '<rect x="' + faceX + '" y="' + (faceY + faceH * 0.158) +
				'" width="' + faceW + '" height="' + (faceH * 0.706) +
				'" fill="#5e625f" stroke="none"/>';
			svg += '<rect x="' + faceX + '" y="' + (faceY + faceH * 0.791) +
				'" width="' + faceW + '" height="' + (faceH * 0.048) +
				'" fill="#41484a" stroke="#171b1c" stroke-width="0.6"/>';
			svg += '<rect x="' + faceX + '" y="' + (faceY + faceH * 0.839) +
				'" width="' + faceW + '" height="' + (faceH * 0.161) +
				'" fill="#4b504e" stroke="none"/>';

			for (var i = 0; i < topTerminals.length; i++)
			{
				var tx = faceX + faceW * topTerminals[i].x;

				svg += '<circle cx="' + tx + '" cy="' +
					(faceY + faceH * 0.064) + '" r="' + terminalR +
					'" fill="#050606"/>';
				svg += Editor.getElectricSvgTextLine(topTerminals[i].label, tx,
					faceY + faceH * 0.103, compact ? 4.5 : 5.2,
					'400', 'middle', '#d9d0a2');
			}

			for (var j = 0; j < bottomTerminals.length; j++)
			{
				var bx = faceX + faceW * bottomTerminals[j].x;

				svg += '<circle cx="' + bx + '" cy="' +
					(faceY + faceH * 0.949) + '" r="' + terminalR +
					'" fill="#050606"/>';
				svg += Editor.getElectricSvgTextLine(bottomTerminals[j].label, bx,
					faceY + faceH * 0.887, compact ? 5.5 : 7.5,
					'400', 'middle', '#e7e7e7');
			}

			svg += '<rect x="' + logoX + '" y="' + (faceY + faceH * 0.203) +
				'" width="' + logoW + '" height="' + (faceH * 0.071) +
				'" fill="#777b78" stroke="#9b9b86" stroke-width="0.5"/>';
			svg += Editor.getElectricSvgTextLine('MW', logoX + logoW / 2,
				faceY + faceH * 0.236, compact ? 6.5 : 9.2,
				'700', 'middle', contentColor);
			svg += Editor.getElectricSvgTextLine('MEAN WELL', logoX + logoW / 2,
				faceY + faceH * 0.263, compact ? 3.8 : 5.2,
				'700', 'middle', contentColor);
			svg += Editor.getElectricSvgTextLine(Editor.trimElectricText(model, 16),
				logoX + logoW + faceW * 0.04, faceY + faceH * 0.245,
				compact ? 6.2 : 8.8, '700', 'start', contentColor);
			svg += Editor.getElectricSvgTextLine('INPUT: ' + input,
				faceX + faceW * 0.06, faceY + faceH * 0.32,
				compact ? 4.2 : 5.8, '400', 'start', smallColor);
			svg += Editor.getElectricSvgTextLine('OUTPUT: ' + output,
				faceX + faceW * 0.06, faceY + faceH * 0.377,
				compact ? 4.2 : 5.8, '400', 'start', smallColor);
			svg += '<rect x="' + (faceX + faceW * 0.37) + '" y="' +
				(faceY + faceH * 0.401) + '" width="' + (faceW * 0.26) +
				'" height="' + (faceH * 0.085) + '" rx="' +
				Math.max(5, faceH * 0.03) +
				'" fill="#FFE45C" stroke="#B88900" stroke-width="0.8"/>';
			svg += Editor.getElectricSvgTextLine('PS', faceX + faceW / 2,
				faceY + faceH * 0.458, compact ? 6.5 : 9.5,
				'700', 'middle', '#111111');
			svg += Editor.getElectricSvgTextLine(power,
				faceX + faceW * 0.83, faceY + faceH * 0.745,
				compact ? 5.2 : 7.5, '700', 'middle', powerColor);
		}
		else if (entry.kind == 'wb')
		{
			svg += Editor.createElectricWbFaceSvg(entry, faceX, faceY,
				faceW, faceH, compact);
		}
			else
			{
				var isRcbo = entry.kind == 'rcbo';
				var poles = Editor.getElectricPoleCount(entry);
				var bandH = Math.max(6, faceH * 0.11);

				if (!isRcbo && poles > 1)
				{
					return Editor.createElectricBreakerPoleSvg(entry, faceX, faceY,
						faceW, faceH, compact);
				}

				svg += '<rect x="' + faceX + '" y="' + faceY + '" width="' +
					faceW + '" height="' + faceH +
				'" fill="#f8f8f8" stroke="#111827" stroke-width="1.3"/>';
			svg += '<rect x="' + faceX + '" y="' + faceY + '" width="' +
				faceW + '" height="' + bandH + '" fill="#ededed" stroke="#c7c7c7" stroke-width="0.45"/>';
			svg += '<rect x="' + faceX + '" y="' + (faceY + faceH - bandH) +
				'" width="' + faceW + '" height="' + bandH +
				'" fill="#ededed" stroke="#c7c7c7" stroke-width="0.45"/>';

			for (var i = 1; i < poles; i++)
			{
				var px = faceX + faceW * i / poles;
				svg += '<path d="M' + px + ' ' + faceY + 'v' + faceH +
					'" stroke="#9ca3af" stroke-width="0.6"/>';
			}

			svg += '<rect x="' + (faceX + faceW * 0.1) + '" y="' +
				(faceY + faceH * 0.16) + '" width="' + (faceW * 0.25) +
				'" height="' + Math.max(4, faceH * 0.045) +
				'" fill="#e41f26"/>';
			svg += '<rect x="' + (faceX + faceW * 0.16) + '" y="' +
				(faceY + faceH * 0.58) + '" width="' + (faceW * 0.68) +
				'" height="' + (faceH * 0.12) +
				'" fill="#a9a49a" stroke="#7c786e" stroke-width="0.5"/>';
			svg += Editor.getElectricSvgTextLine(rows[0], faceX + faceW / 2,
				faceY + faceH * 0.32, compact ? 6 : 8, '700');
			svg += Editor.getElectricSvgTextLine(rows[1], faceX + faceW / 2,
				faceY + faceH * 0.48, compact ? 8 : 11, '700');
			svg += Editor.getElectricSvgTextLine(rows[2], faceX + faceW / 2,
				faceY + faceH * 0.82, compact ? 5.5 : 7, '700');

			if (isRcbo)
			{
				var rcboTestR = Math.max(3, faceW * 0.045);
				var rcboTestCy = faceY + faceH * 0.27;
				var rcboQfdY = faceY + faceH * 0.40;

				svg += '<circle cx="' + (faceX + faceW * 0.78) + '" cy="' +
					rcboTestCy + '" r="' + rcboTestR +
					'" fill="#ffffff" stroke="#111827" stroke-width="0.8"/>';
				svg += '<rect x="' + (faceX + faceW * 0.2) + '" y="' +
					rcboQfdY + '" width="' + (faceW * 0.6) +
					'" height="' + (faceH * 0.08) +
					'" rx="3" fill="#ffe45c" stroke="#b88900" stroke-width="0.5"/>';
			}
		}

		return svg;
	};

	Editor.createElectricWbFaceSvg = function(entry, x, y, w, h, compact)
	{
		var data = entry.data || {};
		var model = data['Модель'] || data['Серия'] || entry.title;
		var modularity = data['Модульность'] || data['Ширина'] || '';
		var isController = entry.libraryId == 'electric-wb-controllers' ||
			String(model).indexOf('Wiren Board') == 0;
		var terminalCount = Math.max(2, Math.min(8, Math.round(w / 22)));
		var bodyFill = isController ? '#f3f6fa' : '#f8fafc';
		var headerFill = isController ? '#1f5f9f' : '#ffffff';
		var accent = isController ? '#74b843' : '#1f5f9f';
		var svg = '';

		svg += '<rect x="' + x + '" y="' + y + '" width="' + w +
			'" height="' + h + '" rx="' + Math.max(2, Math.min(7, w * 0.035)) +
			'" fill="' + bodyFill + '" stroke="#1f2937" stroke-width="1.2"/>';
		svg += '<rect x="' + x + '" y="' + y + '" width="' + w +
			'" height="' + (h * 0.12) + '" fill="' + headerFill +
			'" stroke="#cbd5e1" stroke-width="0.5"/>';
		svg += '<rect x="' + x + '" y="' + (y + h * 0.88) +
			'" width="' + w + '" height="' + (h * 0.12) +
			'" fill="#e5e7eb" stroke="#cbd5e1" stroke-width="0.5"/>';
		svg += '<rect x="' + (x + w * 0.06) + '" y="' + (y + h * 0.2) +
			'" width="' + (w * 0.18) + '" height="' + (h * 0.1) +
			'" rx="1.5" fill="' + accent + '" stroke="#17466f" stroke-width="0.45"/>';
		svg += Editor.getElectricSvgTextLine('WB', x + w * 0.15,
			y + h * 0.268, compact ? 5.6 : 8.2, '700', 'middle', '#ffffff');
		svg += Editor.getElectricSvgTextLine(Editor.trimElectricText(model,
			isController ? 20 : 16), x + w * 0.52, y + h * 0.255,
			compact ? 6.2 : 8.8, '700', 'middle', '#111827');
		svg += Editor.getElectricSvgTextLine(Editor.trimElectricText(modularity, 16),
			x + w * 0.52, y + h * 0.37, compact ? 4.8 : 6.5,
			'400', 'middle', '#475569');

		for (var i = 0; i < terminalCount; i++)
		{
			var tx = x + w * (0.12 + (0.76 * i / Math.max(1, terminalCount - 1)));
			var r = Math.max(1.8, Math.min(3.4, w * 0.035));

			svg += '<circle cx="' + tx + '" cy="' + (y + h * 0.065) +
				'" r="' + r + '" fill="#111827"/>';
			svg += '<circle cx="' + tx + '" cy="' + (y + h * 0.935) +
				'" r="' + r + '" fill="#111827"/>';
		}

		svg += '<rect x="' + (x + w * 0.08) + '" y="' + (y + h * 0.48) +
			'" width="' + (w * 0.84) + '" height="' + (h * 0.08) +
			'" rx="2" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.45"/>';
		svg += '<rect x="' + (x + w * 0.08) + '" y="' + (y + h * 0.62) +
			'" width="' + (w * 0.84) + '" height="' + (h * 0.08) +
			'" rx="2" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.45"/>';

		if (isController)
		{
			svg += '<rect x="' + (x + w * 0.7) + '" y="' + (y + h * 0.56) +
				'" width="' + (w * 0.16) + '" height="' + (h * 0.16) +
				'" rx="2" fill="#334155" stroke="#0f172a" stroke-width="0.45"/>';
		}

		return svg;
	};

	Editor.getElectricLibraryPreviewTextRows = function(entry)
	{
		var data = entry.data || {};

		if (entry.kind == 'psu')
		{
			return [Editor.trimElectricText(data['Модель'] || entry.title, 12)];
		}
		else if (entry.kind == 'wb')
		{
			return [Editor.trimElectricText(data['Модель'] || data['Серия'] ||
				entry.title, 13)];
		}
		else if (entry.kind == 'terminal')
		{
			return [Editor.trimElectricText(data['Сечение'] || data['Тип'] ||
				entry.title, 12)];
		}

		return [Editor.trimElectricText(Editor.getElectricRating(entry), 12)];
	};

	Editor.createElectricCompactBreakerFaceSvg = function(entry, x, y, w, h)
	{
		var isRcbo = entry.kind == 'rcbo';
		var poles = Math.max(1, Editor.getElectricPoleCount(entry));
		var moduleW = w / poles;
		var bandH = Math.max(5, h * 0.105);
		var rating = Editor.trimElectricText(Editor.getElectricRating(entry), 5);
		var tag = isRcbo ? 'QFD' : 'QF';
		var svg = '';

		svg += '<rect x="' + x + '" y="' + y + '" width="' + w +
			'" height="' + h + '" fill="#f8f8f8" stroke="#111827" stroke-width="1.1"/>';
		svg += '<rect x="' + x + '" y="' + y + '" width="' + w +
			'" height="' + bandH + '" fill="#ededed" stroke="#c7c7c7" stroke-width="0.45"/>';
		svg += '<rect x="' + x + '" y="' + (y + h - bandH) + '" width="' + w +
			'" height="' + bandH + '" fill="#ededed" stroke="#c7c7c7" stroke-width="0.45"/>';
		svg += '<rect x="' + x + '" y="' + (y + h * 0.21) + '" width="' + w +
			'" height="' + Math.max(2, h * 0.028) + '" fill="#3b3b3b"/>';

		for (var i = 0; i < poles; i++)
		{
			var poleX = x + i * moduleW;
			var cx = poleX + moduleW / 2;
			var r = Math.max(1.8, Math.min(3.2, moduleW * 0.1));

			if (i > 0)
			{
				svg += '<path d="M' + poleX + ' ' + y + 'v' + h +
					'" stroke="#9ca3af" stroke-width="0.55"/>';
			}

			svg += '<circle cx="' + cx + '" cy="' + (y + bandH * 0.58) +
				'" r="' + r + '" fill="#ffffff" stroke="#777777" stroke-width="0.6"/>';
			svg += '<circle cx="' + cx + '" cy="' + (y + h - bandH * 0.58) +
				'" r="' + r + '" fill="#ffffff" stroke="#777777" stroke-width="0.6"/>';
		}

		svg += '<rect x="' + (x + w * 0.08) + '" y="' + (y + h * 0.145) +
			'" width="' + Math.max(5, w * 0.12) + '" height="' +
			Math.max(3, h * 0.04) + '" fill="#e41f26"/>';
		svg += Editor.getElectricSvgTextLine(rating, x + w * 0.5,
			y + h * 0.36, 8.2, '700', 'middle', '#111827');
		svg += '<rect x="' + (x + w * 0.18) + '" y="' + (y + h * 0.43) +
			'" width="' + (w * 0.64) + '" height="' + (h * 0.11) +
			'" rx="3" fill="#ffe45c" stroke="#b88900" stroke-width="0.6"/>';
		svg += Editor.getElectricSvgTextLine(tag, x + w * 0.5,
			y + h * 0.512, tag == 'QFD' ? 6.6 : 7.8, '700',
			'middle', '#111111');
		svg += '<rect x="' + (x + w * 0.1) + '" y="' + (y + h * 0.62) +
			'" width="' + (w * 0.8) + '" height="' + (h * 0.12) +
			'" fill="#a9a49a" stroke="#7c786e" stroke-width="0.45"/>';

		if (isRcbo)
		{
			svg += '<circle cx="' + (x + w * 0.78) + '" cy="' +
				(y + h * 0.33) + '" r="' + Math.max(2.2, w * 0.04) +
				'" fill="#ffffff" stroke="#111827" stroke-width="0.65"/>';
		}

		return svg;
	};

	Editor.createElectricCompactPsuFaceSvg = function(entry, x, y, w, h)
	{
		var terminalLayout = Editor.getElectricPsuTerminalLayout(entry);
		var terminalR = Math.max(1.7, Math.min(3.3, w * 0.045));
		var logoW = Math.min(w * 0.34, h * 0.18);
		var logoX = x + w * 0.06;
		var svg = '';

		svg += '<rect x="' + x + '" y="' + y + '" width="' + w +
			'" height="' + h + '" fill="#626663" stroke="#222" stroke-width="1.1"/>';
		svg += '<rect x="' + x + '" y="' + y + '" width="' + w +
			'" height="' + (h * 0.107) + '" fill="#30383a"/>';
		svg += '<rect x="' + x + '" y="' + (y + h * 0.107) +
			'" width="' + w + '" height="' + (h * 0.048) +
			'" fill="#41484a" stroke="#171b1c" stroke-width="0.55"/>';
		svg += '<rect x="' + x + '" y="' + (y + h * 0.79) +
			'" width="' + w + '" height="' + (h * 0.05) +
			'" fill="#41484a" stroke="#171b1c" stroke-width="0.55"/>';
		svg += '<rect x="' + x + '" y="' + (y + h * 0.84) +
			'" width="' + w + '" height="' + (h * 0.16) + '" fill="#4b504e"/>';

		for (var i = 0; i < terminalLayout.top.length; i++)
		{
			svg += '<circle cx="' + (x + w * terminalLayout.top[i].x) +
				'" cy="' + (y + h * 0.064) + '" r="' + terminalR +
				'" fill="#050606"/>';
		}

		for (var j = 0; j < terminalLayout.bottom.length; j++)
		{
			svg += '<circle cx="' + (x + w * terminalLayout.bottom[j].x) +
				'" cy="' + (y + h * 0.949) + '" r="' + terminalR +
				'" fill="#050606"/>';
		}

		svg += '<rect x="' + logoX + '" y="' + (y + h * 0.21) +
			'" width="' + logoW + '" height="' + (h * 0.09) +
			'" fill="#777b78" stroke="#9b9b86" stroke-width="0.45"/>';
		svg += Editor.getElectricSvgTextLine('MW', logoX + logoW / 2,
			y + h * 0.265, 6.5, '700', 'middle', '#d8d0bb');
		svg += '<rect x="' + (x + w * 0.36) + '" y="' + (y + h * 0.42) +
			'" width="' + (w * 0.28) + '" height="' + (h * 0.11) +
			'" rx="4" fill="#ffe45c" stroke="#b88900" stroke-width="0.6"/>';
		svg += Editor.getElectricSvgTextLine('PS', x + w * 0.5,
			y + h * 0.5, 7.4, '700', 'middle', '#111111');

		return svg;
	};

	Editor.createElectricCompactWbFaceSvg = function(entry, x, y, w, h)
	{
		var data = entry.data || {};
		var model = String(data['Модель'] || data['Серия'] || entry.title);
		var isController = model.indexOf('Wiren Board') == 0;
		var terminalCount = Math.max(2, Math.min(8, Math.round(w / 13)));
		var bodyFill = isController ? '#f8fafc' : '#ffffff';
		var accent = isController ? '#74b843' : '#8bd5a8';
		var svg = '';

		svg += '<rect data-electric-library-wb-preview="1" x="' + x +
			'" y="' + y + '" width="' + w + '" height="' + h +
			'" fill="' + bodyFill + '" stroke="#1f2937" stroke-width="1.05"/>';
		svg += '<rect x="' + (x + w * 0.06) + '" y="' + (y + h * 0.03) +
			'" width="' + (w * 0.88) + '" height="' + (h * 0.16) +
			'" fill="' + accent + '" stroke="#6aa77b" stroke-width="0.45"/>';
		svg += '<rect x="' + (x + w * 0.06) + '" y="' + (y + h * 0.81) +
			'" width="' + (w * 0.88) + '" height="' + (h * 0.16) +
			'" fill="' + accent + '" stroke="#6aa77b" stroke-width="0.45"/>';

		for (var i = 0; i < terminalCount; i++)
		{
			var tx = x + w * (0.11 + 0.78 * i / Math.max(1, terminalCount - 1));

			svg += '<circle cx="' + tx + '" cy="' + (y + h * 0.11) +
				'" r="' + Math.max(1.4, w * 0.025) +
				'" fill="#e5e7eb" stroke="#9ca3af" stroke-width="0.35"/>';
			svg += '<circle cx="' + tx + '" cy="' + (y + h * 0.89) +
				'" r="' + Math.max(1.4, w * 0.025) +
				'" fill="#e5e7eb" stroke="#9ca3af" stroke-width="0.35"/>';
		}

		svg += '<rect x="' + (x + w * 0.12) + '" y="' + (y + h * 0.28) +
			'" width="' + (w * 0.76) + '" height="' + (h * 0.18) +
			'" rx="2" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="0.45"/>';
		svg += '<circle cx="' + (x + w * 0.24) + '" cy="' + (y + h * 0.58) +
			'" r="' + Math.max(1.8, w * 0.035) + '" fill="#74b843"/>';
		svg += '<circle cx="' + (x + w * 0.5) + '" cy="' + (y + h * 0.58) +
			'" r="' + Math.max(1.8, w * 0.035) + '" fill="#f59e0b"/>';
		svg += '<circle cx="' + (x + w * 0.76) + '" cy="' + (y + h * 0.58) +
			'" r="' + Math.max(1.8, w * 0.035) + '" fill="#94a3b8"/>';

		if (isController)
		{
			svg += '<rect x="' + (x + w * 0.34) + '" y="' + (y + h * 0.5) +
				'" width="' + (w * 0.32) + '" height="' + (h * 0.22) +
				'" rx="2" fill="#ffffff" stroke="#94a3b8" stroke-width="0.45"/>';
		}

		return svg;
	};

	Editor.createElectricLibraryFaceSvg = function(entry, x, y, w, h)
	{
		var ratio = (entry.height > 0) ? entry.width / entry.height : 0.3;
		var minW = (entry.kind == 'terminal') ? 20 : 26;
		var faceW = Math.max(minW, Math.min(w - 10,
			h * Math.max(0.2, Math.min(0.82, ratio))));
		var faceH = h - 6;
		var faceX = x + (w - faceW) / 2;
		var faceY = y + 3;

		if (entry.kind == 'psu')
		{
			return Editor.createElectricCompactPsuFaceSvg(entry, faceX, faceY,
				faceW, faceH);
		}
		else if (entry.kind == 'wb')
		{
			return Editor.createElectricCompactWbFaceSvg(entry, faceX, faceY,
				faceW, faceH);
		}
		else if (entry.kind == 'terminal')
		{
			return Editor.createElectricModuleFaceSvg(entry, x, y, w, h, true);
		}

		return Editor.createElectricCompactBreakerFaceSvg(entry, faceX, faceY,
			faceW, faceH);
	};

	Editor.getElectricLibraryPreviewTile = function(entry, x, y, w, h)
	{
		var labelRows = Editor.getElectricLibraryPreviewTextRows(entry);
		var body = Editor.createElectricLibraryFaceSvg(entry, x + 4, y + 3,
			w - 8, h - 25);

		body += Editor.getElectricSvgTextLine(
			Editor.trimElectricText(labelRows[0] || '', 13), x + w / 2,
			y + h - 7, 6.6, '700');

		return body;
	};

	Editor.getElectricLibraryPreview = function(library)
	{
		if (Editor.electricLibraryPreviewCache[library.id] != null)
		{
			return Editor.electricLibraryPreviewCache[library.id];
		}

		var items = library.items || [];
		var cols = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(items.length * 1.25))));
		var tileW = 82;
		var tileH = 104;
		var pad = 24;
		var headerH = 40;
		var rows = Math.ceil(items.length / cols);
		var width = cols * tileW + pad * 2;
		var height = rows * tileH + headerH + pad;
		var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width +
			'" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">' +
			'<rect width="' + width + '" height="' + height + '" fill="#ffffff"/>' +
			'<text x="' + pad + '" y="27" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#374151">' +
			Editor.getElectricSvgText(library.title) + '</text>';

		for (var i = 0; i < items.length; i++)
		{
			var col = i % cols;
			var row = Math.floor(i / cols);
			svg += Editor.getElectricLibraryPreviewTile(items[i],
				pad + col * tileW, headerH + row * tileH, tileW, tileH);
		}

		svg += '</svg>';

		var result = 'data:image/svg+xml,' + encodeURIComponent(svg);
		Editor.electricLibraryPreviewCache[library.id] = result;

		return result;
	};

	Editor.getElectricLibraryPreviewPlaceholder = function(library)
	{
		var title = Editor.getElectricSvgText(library.title);
		var count = (library.items || []).length;
		var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">' +
			'<rect width="640" height="360" fill="#ffffff"/>' +
			'<rect x="28" y="28" width="584" height="304" rx="6" fill="#f8fafc" stroke="#cbd5e1"/>' +
			'<text x="320" y="170" font-family="Arial,sans-serif" font-size="24" font-weight="700" text-anchor="middle" fill="#374151">' +
			title + '</text><text x="320" y="208" font-family="Arial,sans-serif" font-size="16" text-anchor="middle" fill="#64748b">' +
			count + ' shapes</text></svg>';

		return 'data:image/svg+xml,' + encodeURIComponent(svg);
	};

	Editor.scheduleElectricLibraryPreviews = function(entries)
	{
		var index = 0;
		var schedule = (window.requestIdleCallback != null) ?
			function(callback)
			{
				window.requestIdleCallback(callback, {timeout: 1500});
			} : function(callback)
			{
				window.setTimeout(callback, 32);
			};
		var renderNext = function()
		{
			if (index < entries.length)
			{
				var entry = entries[index++];
				entry.image = Editor.getElectricLibraryPreview(entry.electricLibrary);
				delete entry.electricLibrary;
				schedule(renderNext);
			}
		};

		schedule(renderNext);
	};

	Editor.createElectricCell = function(parent, value, x, y, w, h, style)
	{
		var cell = new mxCell(value || '', new mxGeometry(x, y, w, h), style);
		cell.vertex = true;
		cell.setConnectable(false);
		parent.insert(cell);

		return cell;
	};

	Editor.createElectricText = function(parent, value, x, y, w, h, size, bold, align)
	{
		return Editor.createElectricCell(parent, value, x, y, w, h,
			'text;html=1;strokeColor=none;fillColor=none;align=' +
			(align || 'center') + ';verticalAlign=middle;whiteSpace=wrap;' +
			'overflow=hidden;fontSize=' + size + ';fontStyle=' +
			(bold ? '1' : '0') + ';fontColor=#111827;');
	};

	Editor.getElectricShapeValue = function(entry, key)
	{
		return (entry.data != null && entry.data[key] != null) ?
			entry.data[key] : '';
	};

	Editor.getElectricRating = function(entry)
	{
		var marking = Editor.getElectricShapeValue(entry, 'Маркировка');
		var parts = marking.split(' ');

		for (var i = 0; i < parts.length; i++)
		{
			if (/^[BCD]\d+/.test(parts[i]))
			{
				return parts[i];
			}
		}

		return marking || Editor.getElectricShapeValue(entry, 'Сечение') ||
			Editor.getElectricShapeValue(entry, 'Выход');
	};

	Editor.createElectricBreakerPreview = function(entry, group, w, h)
	{
		var isRcbo = entry.kind == 'rcbo';
		var tag = isRcbo ? 'QFD' : 'QF';
		var series = Editor.getElectricShapeValue(entry, 'Серия');
		var marking = Editor.getElectricShapeValue(entry, 'Маркировка');
		var rating = Editor.getElectricRating(entry);
		var bandH = Math.max(16, h * 0.055);
		var pad = Math.max(5, w * 0.08);
		var poles = Editor.getElectricPoleCount(entry);

		if (!isRcbo && poles > 1)
		{
			Editor.createElectricBreakerPolePreview(entry, group, w, h, poles);

			return;
		}

		Editor.createElectricCell(group, '', 0, 0, w, h,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#f8f8f8;' +
			'gradientColor=#d9d9d9;gradientDirection=south;strokeColor=#111827;strokeWidth=0.8;');
		Editor.createElectricCell(group, '', 0, 0, w, bandH,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#f2f2f2;strokeColor=#c7c7c7;strokeWidth=0.45;');
		Editor.createElectricCell(group, '', 0, h - bandH, w, bandH,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#f2f2f2;strokeColor=#c7c7c7;strokeWidth=0.45;');
		Editor.createElectricCell(group, '', pad, h * 0.14, Math.max(10, w * 0.16), Math.max(10, h * 0.035),
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#e41f26;strokeColor=none;');
		Editor.createElectricText(group, 'EKF', pad + w * 0.2, h * 0.13, w * 0.5, h * 0.045, Math.max(6, w * 0.1), true, 'left');
		Editor.createElectricCell(group, series, 0, h * 0.22, w, h * 0.04,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#3b3b3b;strokeColor=none;' +
			'fontSize=' + Math.max(5, w * 0.075) + ';fontColor=#ffffff;fontStyle=1;align=center;verticalAlign=middle;');
		Editor.createElectricText(group, rating, pad, h * 0.29, w * 0.48, h * 0.09, Math.max(10, w * 0.16), true, 'left');
		Editor.createElectricCell(group, tag, w * 0.18, h * 0.39, w * 0.64, h * 0.09,
			'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFE45C;strokeColor=#B88900;strokeWidth=0.8;' +
			'fontColor=#111827;fontSize=' + Math.max(8, w * 0.12) + ';fontStyle=1;align=center;verticalAlign=middle;arcSize=35;');

		if (isRcbo)
		{
			Editor.createElectricText(group, (marking.indexOf(' A') >= 0) ? 'IΔn A' : 'IΔn AC',
				pad, h * 0.5, w - 2 * pad, h * 0.055, Math.max(6, w * 0.08), false, 'center');
			Editor.createElectricCell(group, 'T', w * 0.74, h * 0.29, w * 0.14, h * 0.055,
				'ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#ffffff;strokeColor=#111827;' +
				'fontSize=' + Math.max(6, w * 0.09) + ';fontStyle=1;align=center;verticalAlign=middle;');
		}

		Editor.createElectricCell(group, 'OFF', w * 0.12, h * 0.58, w * 0.76, h * 0.13,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#a9a49a;strokeColor=#7c786e;strokeWidth=0.5;' +
			'fontSize=' + Math.max(6, w * 0.09) + ';fontColor=#111827;fontStyle=1;align=center;verticalAlign=middle;');
		Editor.createElectricText(group, marking, pad, h * 0.72, w - 2 * pad, h * 0.17, Math.max(7, w * 0.09), true, 'center');
	};

	Editor.createElectricBreakerPolePreview = function(entry, group, w, h, poles)
	{
		var series = Editor.getElectricShapeValue(entry, 'Серия');
		var marking = Editor.getElectricShapeValue(entry, 'Маркировка');
		var rating = Editor.getElectricRating(entry);
		var moduleW = w / poles;
		var bandH = Math.max(12, h * 0.054);
		var fontBase = Math.max(6, Math.min(16, moduleW * 0.17));

		Editor.createElectricCell(group, '', 0, 0, w, h,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#f8f8f8;' +
			'gradientColor=#d9d9d9;gradientDirection=south;strokeColor=#111827;strokeWidth=0.8;');
		Editor.createElectricCell(group, '', 0, 0, w, bandH,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#f2f2f2;strokeColor=#c7c7c7;strokeWidth=0.45;');
		Editor.createElectricCell(group, '', 0, h - bandH, w, bandH,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#f2f2f2;strokeColor=#c7c7c7;strokeWidth=0.45;');
		Editor.createElectricCell(group, '', 0, h * 0.057, w, h * 0.07,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#eeeeee;strokeColor=#d6d6d6;strokeWidth=0.45;');
		Editor.createElectricCell(group, '', 0, h * 0.815, w, h * 0.064,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#eeeeee;strokeColor=#d6d6d6;strokeWidth=0.45;');

		for (var i = 0; i < poles; i++)
		{
			var poleX = i * moduleW;
			var cx = poleX + moduleW / 2;
			var screw = Math.max(4, Math.min(8.4, moduleW * 0.12));

			if (i > 0)
			{
				Editor.createElectricCell(group, '', poleX - 0.35, 0, 0.7, h,
					'rounded=0;whiteSpace=wrap;html=1;fillColor=#c5c5c5;strokeColor=none;');
			}

			Editor.createElectricCell(group, '', cx - screw / 2, bandH * 0.28, screw, screw,
				'ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#ffffff;strokeColor=#777777;strokeWidth=0.7;');
			Editor.createElectricCell(group, '', cx - screw * 0.65, bandH * 0.72,
				screw * 1.3, Math.max(2, screw * 0.42),
				'rounded=0;whiteSpace=wrap;html=1;fillColor=#d8d8d8;strokeColor=#b5b5b5;strokeWidth=0.45;');
			Editor.createElectricCell(group, '', cx - screw / 2, h - bandH * 0.72, screw, screw,
				'ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#ffffff;strokeColor=#777777;strokeWidth=0.7;');
			Editor.createElectricCell(group, '', cx - screw * 0.65, h - bandH * 0.98,
				screw * 1.3, Math.max(2, screw * 0.42),
				'rounded=0;whiteSpace=wrap;html=1;fillColor=#d8d8d8;strokeColor=#b5b5b5;strokeWidth=0.45;');
			Editor.createElectricCell(group, 'OFF', poleX + moduleW * 0.03, h * 0.52,
				moduleW * 0.94, h * 0.13,
				'rounded=0;whiteSpace=wrap;html=1;fillColor=#a9a49a;strokeColor=#7c786e;strokeWidth=0.5;' +
				'fontSize=' + Math.max(5, moduleW * 0.09) + ';fontColor=#ffffff;fontStyle=1;align=center;verticalAlign=middle;');
		}

		Editor.createElectricCell(group, '', w * 0.033, h * 0.14, Math.max(8, w * 0.047), Math.max(7, h * 0.032),
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#e41f26;strokeColor=none;');
		Editor.createElectricText(group, 'EKF', w * 0.09, h * 0.13, w * 0.2, h * 0.06,
			fontBase, true, 'left');
		Editor.createElectricCell(group, series, 0, h * 0.222, w, h * 0.026,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#3b3b3b;strokeColor=none;' +
			'fontSize=' + Math.max(5, w * 0.04) + ';fontColor=#ffffff;fontStyle=1;align=center;verticalAlign=middle;');
		Editor.createElectricCell(group, '', 1, h * 0.222, moduleW * 0.54, Math.max(2, h * 0.01),
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#16b84e;strokeColor=none;');
		Editor.createElectricText(group, rating, w * 0.05, h * 0.29, w * 0.5, h * 0.1,
			Math.max(12, moduleW * 0.28), true, 'left');
		Editor.createElectricCell(group, 'QF', w * 0.38, h * 0.39, w * 0.24, h * 0.095,
			'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFE45C;strokeColor=#B88900;strokeWidth=0.8;' +
			'fontColor=#111827;fontSize=' + Math.max(8, w * 0.09) + ';fontStyle=1;align=center;verticalAlign=middle;arcSize=35;');
		Editor.createElectricCell(group, '6000<br>3', w - Math.max(18, w * 0.11) - 6, h * 0.267,
			Math.max(18, w * 0.11), Math.max(18, h * 0.058),
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#b8b8b8;strokeWidth=0.55;' +
			'fontSize=' + Math.max(5, moduleW * 0.07) + ';fontColor=#6b7280;align=center;verticalAlign=middle;');
		Editor.createElectricText(group, series + '<br>' + marking, w * 0.02, h * 0.66,
			w * 0.96, h * 0.18, Math.max(8, w * 0.055), true, 'center');
	};

	Editor.createElectricTerminalPreview = function(entry, group, w, h)
	{
		var type = Editor.getElectricShapeValue(entry, 'Тип');
		var colors = Editor.getElectricTerminalColor(entry);
		var isPlate = /Заглуш|аксесс/i.test(type + ' ' + entry.section);

		Editor.createElectricCell(group, '', 0, 0, w, h,
			'rounded=1;whiteSpace=wrap;html=1;fillColor=' + colors.fill +
			';strokeColor=' + colors.stroke + ';strokeWidth=1.1;arcSize=8;');

		if (!isPlate)
		{
			Editor.createElectricCell(group, '', w * 0.18, h * 0.1, w * 0.64, h * 0.18,
				'rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#64748b;strokeWidth=0.8;arcSize=18;');
			Editor.createElectricCell(group, '', w * 0.18, h * 0.72, w * 0.64, h * 0.18,
				'rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#64748b;strokeWidth=0.8;arcSize=18;');
		}

		Editor.createElectricCell(group, '', w * 0.45, h * 0.34, w * 0.1, h * 0.28,
			'rounded=1;whiteSpace=wrap;html=1;fillColor=' + colors.accent +
			';strokeColor=none;arcSize=40;');
	};

	Editor.createElectricPsuPreview = function(entry, group, w, h)
	{
		var model = Editor.getElectricShapeValue(entry, 'Модель');
		var input = Editor.getElectricShapeValue(entry, 'Вход');
		var output = Editor.getElectricShapeValue(entry, 'Выход');
		var power = Editor.getElectricShapeValue(entry, 'Мощность');
		var terminalLayout = Editor.getElectricPsuTerminalLayout(entry);
		var topTerminals = terminalLayout.top;
		var bottomTerminals = terminalLayout.bottom;
		var terminal = Math.max(4, Math.min(8.4, w * 0.05));
		var logoW = Math.min(w * 0.34, h * 0.18);
		var logoX = w * 0.06;
		var contentColor = '#d8d0bb';
		var smallColor = '#d7d7d7';

		Editor.createElectricCell(group, '', 0, 0, w, h,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#626663;' +
			'strokeColor=#222;strokeWidth=0.8;');
		Editor.createElectricCell(group, '', 0, 0, w, h * 0.107,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#30383a;strokeColor=none;strokeWidth=0;');
		Editor.createElectricCell(group, '', 0, h * 0.107, w, h * 0.048,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#41484a;strokeColor=#171b1c;strokeWidth=0.6;');
		Editor.createElectricCell(group, '', 0, h * 0.158, w, h * 0.706,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#5e625f;strokeColor=none;strokeWidth=0;');
		Editor.createElectricCell(group, '', 0, h * 0.791, w, h * 0.048,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#41484a;strokeColor=#171b1c;strokeWidth=0.6;');
		Editor.createElectricCell(group, '', 0, h * 0.839, w, h * 0.161,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#4b504e;strokeColor=none;strokeWidth=0;');

		for (var i = 0; i < topTerminals.length; i++)
		{
			var tx = w * topTerminals[i].x;

			Editor.createElectricCell(group, '', tx - terminal / 2, h * 0.064 - terminal / 2,
				terminal, terminal,
				'ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#050606;strokeColor=none;strokeWidth=0;');
			Editor.createElectricCell(group, topTerminals[i].label, tx - w * 0.055, h * 0.083,
				w * 0.11, h * 0.032,
				'text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;' +
				'fontSize=' + Math.max(4, w * 0.035) + ';fontColor=#d9d0a2;whiteSpace=wrap;spacing=0;overflow=hidden;');
		}

		for (var j = 0; j < bottomTerminals.length; j++)
		{
			var bx = w * bottomTerminals[j].x;

			Editor.createElectricCell(group, '', bx - terminal / 2, h * 0.949 - terminal / 2,
				terminal, terminal,
				'ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#050606;strokeColor=none;strokeWidth=0;');
			Editor.createElectricCell(group, bottomTerminals[j].label, bx - w * 0.06, h * 0.875,
				w * 0.12, h * 0.04,
				'text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;' +
				'fontSize=' + Math.max(5, w * 0.05) + ';fontColor=#e7e7e7;whiteSpace=wrap;spacing=0;overflow=hidden;');
		}

		Editor.createElectricCell(group, '', logoX, h * 0.203, logoW, h * 0.071,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#777b78;strokeColor=#9b9b86;strokeWidth=0.5;');
		Editor.createElectricCell(group, 'MW', logoX + logoW * 0.06, h * 0.203, logoW * 0.88, h * 0.037,
			'text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;' +
			'fontSize=' + Math.max(6, w * 0.07) + ';fontColor=' + contentColor +
			';whiteSpace=wrap;spacing=0;overflow=hidden;fontStyle=1;');
		Editor.createElectricCell(group, 'MEAN WELL', logoX + logoW * 0.06, h * 0.236, logoW * 0.88, h * 0.03,
			'text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;' +
			'fontSize=' + Math.max(4, w * 0.036) + ';fontColor=' + contentColor +
			';whiteSpace=wrap;spacing=0;overflow=hidden;fontStyle=1;');
		Editor.createElectricCell(group, model, logoX + logoW + w * 0.04, h * 0.203,
			Math.max(0, w - logoX - logoW - w * 0.1), h * 0.071,
			'text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;' +
			'fontSize=' + Math.max(6, Math.min(12, w * 0.065)) + ';fontColor=' +
			contentColor + ';whiteSpace=wrap;spacing=0;overflow=hidden;fontStyle=1;');
		Editor.createElectricCell(group, 'INPUT: ' + input, w * 0.06, h * 0.294,
			w * 0.88, h * 0.051,
			'text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;' +
			'fontSize=' + Math.max(4, w * 0.043) + ';fontColor=' + smallColor +
			';whiteSpace=wrap;spacing=0;overflow=hidden;');
		Editor.createElectricCell(group, 'OUTPUT: ' + output, w * 0.06, h * 0.35,
			w * 0.88, h * 0.051,
			'text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;' +
			'fontSize=' + Math.max(4, w * 0.043) + ';fontColor=' + smallColor +
			';whiteSpace=wrap;spacing=0;overflow=hidden;');
		Editor.createElectricCell(group, 'PS', w * 0.37, h * 0.401, w * 0.26, h * 0.085,
			'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFE45C;strokeColor=#B88900;strokeWidth=0.8;' +
			'fontColor=#111111;fontSize=' + Math.max(7, w * 0.07) +
			';fontStyle=1;align=center;verticalAlign=middle;arcSize=35;');
		Editor.createElectricCell(group, power, w * 0.68, h * 0.68, w * 0.26, h * 0.08,
			'text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;' +
			'fontSize=' + Math.max(5, w * 0.055) + ';fontColor=#f7df25;' +
			'whiteSpace=wrap;spacing=0;overflow=hidden;fontStyle=1;');
	};

	Editor.createElectricWbPreview = function(entry, group, w, h)
	{
		if (entry.preview != null)
		{
			Editor.createElectricCell(group, '', 0, 0, w, h,
				'shape=image;html=1;imageAspect=0;aspect=fixed;verticalLabelPosition=bottom;' +
				'verticalAlign=top;image=' + Editor.getElectricShapeAssetUrl(entry.preview) + ';');
			return;
		}

		var data = entry.data || {};
		var model = data['Модель'] || data['Серия'] || entry.title;
		var modularity = data['Модульность'] || data['Ширина'] || '';
		var isController = entry.libraryId == 'electric-wb-controllers' ||
			String(model).indexOf('Wiren Board') == 0;
		var headerFill = isController ? '#1f5f9f' : '#ffffff';
		var bodyFill = isController ? '#f3f6fa' : '#f8fafc';
		var accent = isController ? '#74b843' : '#1f5f9f';
		var terminals = Math.max(2, Math.min(8, Math.round(w / 28)));
		var terminal = Math.max(4, Math.min(7, w * 0.045));

		Editor.createElectricCell(group, '', 0, 0, w, h,
			'rounded=1;whiteSpace=wrap;html=1;fillColor=' + bodyFill +
			';strokeColor=#1f2937;strokeWidth=0.8;arcSize=4;');
		Editor.createElectricCell(group, '', 0, 0, w, h * 0.12,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=' + headerFill +
			';strokeColor=#cbd5e1;strokeWidth=0.45;');
		Editor.createElectricCell(group, '', 0, h * 0.88, w, h * 0.12,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#e5e7eb;strokeColor=#cbd5e1;strokeWidth=0.45;');

		for (var i = 0; i < terminals; i++)
		{
			var tx = w * (0.12 + (0.76 * i / Math.max(1, terminals - 1)));

			Editor.createElectricCell(group, '', tx - terminal / 2, h * 0.065 - terminal / 2,
				terminal, terminal,
				'ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#111827;strokeColor=none;strokeWidth=0;');
			Editor.createElectricCell(group, '', tx - terminal / 2, h * 0.935 - terminal / 2,
				terminal, terminal,
				'ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#111827;strokeColor=none;strokeWidth=0;');
		}

		Editor.createElectricCell(group, 'WB', w * 0.07, h * 0.2, w * 0.18, h * 0.1,
			'rounded=1;whiteSpace=wrap;html=1;fillColor=' + accent +
			';strokeColor=#17466f;strokeWidth=0.45;fontColor=#ffffff;' +
			'fontSize=' + Math.max(5, w * 0.05) + ';fontStyle=1;align=center;verticalAlign=middle;arcSize=10;');
		Editor.createElectricCell(group, Editor.trimElectricText(model, 18),
			w * 0.29, h * 0.19, w * 0.64, h * 0.12,
			'text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;' +
			'fontSize=' + Math.max(6, Math.min(12, w * 0.06)) +
			';fontColor=#111827;whiteSpace=wrap;spacing=0;overflow=hidden;fontStyle=1;');
		Editor.createElectricCell(group, Editor.trimElectricText(modularity, 16),
			w * 0.12, h * 0.34, w * 0.76, h * 0.08,
			'text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;' +
			'fontSize=' + Math.max(5, w * 0.04) +
			';fontColor=#475569;whiteSpace=wrap;spacing=0;overflow=hidden;');
		Editor.createElectricCell(group, '', w * 0.08, h * 0.5, w * 0.84, h * 0.08,
			'rounded=1;whiteSpace=wrap;html=1;fillColor=#e2e8f0;strokeColor=#94a3b8;strokeWidth=0.45;arcSize=8;');
		Editor.createElectricCell(group, '', w * 0.08, h * 0.63, w * 0.84, h * 0.08,
			'rounded=1;whiteSpace=wrap;html=1;fillColor=#e2e8f0;strokeColor=#94a3b8;strokeWidth=0.45;arcSize=8;');

		if (isController)
		{
			Editor.createElectricCell(group, '', w * 0.7, h * 0.56, w * 0.16, h * 0.16,
				'rounded=1;whiteSpace=wrap;html=1;fillColor=#334155;strokeColor=#0f172a;strokeWidth=0.45;arcSize=8;');
		}
	};

	Editor.createElectricShapePreviewCells = function(entry)
	{
		var size = Editor.getElectricPreviewSize(entry);
		var w = size.width;
		var h = size.height;
		var group = new mxCell('', new mxGeometry(0, 0, w, h),
			'group;html=1;electricShapeId=' + entry.id + ';');
		group.vertex = true;
		group.setConnectable(false);

		if (entry.kind == 'terminal')
		{
			Editor.createElectricTerminalPreview(entry, group, w, h);
		}
		else if (entry.kind == 'psu')
		{
			Editor.createElectricPsuPreview(entry, group, w, h);
		}
		else if (entry.kind == 'wb')
		{
			Editor.createElectricWbPreview(entry, group, w, h);
		}
		else
		{
			Editor.createElectricBreakerPreview(entry, group, w, h);
		}

		return [group];
	};

	Editor.getElectricShapeTooltipText = function(entry)
	{
		var data = entry.data || {};
		var order = ['Производитель', 'Серия', 'Модель', 'Тип', 'Маркировка',
			'Сечение', 'Цвет', 'Вход', 'Выход', 'Мощность', 'Модульность',
			'Размер', 'Номинал', 'Материал', 'Исполнение', 'Монтаж',
			'Совместимость', 'Торец/заглушка', 'Артикул'];
		var lines = [entry.title];
		var used = {};

		for (var i = 0; i < order.length; i++)
		{
			if (data[order[i]] != null && data[order[i]] != '')
			{
				lines.push(order[i] + ': ' + data[order[i]]);
				used[order[i]] = true;
			}
		}

		for (var key in data)
		{
			if (used[key] == null && data[key] != null && data[key] != '')
			{
				lines.push(key + ': ' + data[key]);
			}
		}

		return lines.join('\n');
	};

	Editor.fitElectricShapeTooltip = function(sidebar)
	{
		if (sidebar.tooltip == null || sidebar.tooltipTitle == null)
		{
			return;
		}

		var margin = 8;
		var maxHeight = Math.max(220, window.innerHeight - 2 * margin);
		var maxWidth = Math.max(240, Math.min(sidebar.maxTooltipWidth,
			window.innerWidth - 2 * margin));
		var minWidth = Math.min(maxWidth, 260);
		var graphBounds = sidebar.graph2.getGraphBounds();
		var graphHeight = graphBounds.height + 2 * sidebar.tooltipBorder;
		var titleMax = Math.max(90, Math.min(180, maxHeight - graphHeight - 8));

		sidebar.tooltipTitle.style.maxHeight = titleMax + 'px';
		sidebar.tooltipTitle.style.overflowY = 'auto';
		sidebar.tooltipTitle.style.overflowX = 'hidden';
		sidebar.tooltip.style.overflow = 'hidden';
		sidebar.tooltip.style.width = Math.min(maxWidth,
			Math.max(minWidth, parseFloat(sidebar.tooltip.style.width) || 0,
				sidebar.tooltipTitle.scrollWidth + 8)) + 'px';

		var titleHeight = Math.min(sidebar.tooltipTitle.scrollHeight, titleMax) + 10;
		var totalHeight = Math.min(maxHeight, graphHeight + titleHeight);
		sidebar.tooltip.style.height = totalHeight + 'px';
		sidebar.tooltipTitle.style.marginTop = (2 - titleHeight) + 'px';

		var rect = sidebar.tooltip.getBoundingClientRect();
		var left = parseFloat(sidebar.tooltip.style.left) || rect.left;
		var top = parseFloat(sidebar.tooltip.style.top) || rect.top;

		if (left + rect.width > window.innerWidth - margin)
		{
			left = window.innerWidth - rect.width - margin;
		}

		if (top + totalHeight > window.innerHeight - margin)
		{
			top = window.innerHeight - totalHeight - margin;
		}

		sidebar.tooltip.style.left = Math.max(margin, left) + 'px';
		sidebar.tooltip.style.top = Math.max(margin, top) + 'px';
	};

	Sidebar.prototype.createElectricShapeItem = function(entry)
	{
		var cells = Editor.createElectricShapePreviewCells(entry);
		var size = Editor.getElectricPreviewSize(entry);
		var elt = this.createVertexTemplateFromCells(cells, size.width,
			size.height, entry.title, true, true, null, true, null,
			size.thumbWidth, size.thumbHeight);

		if (elt == null)
		{
			return elt;
		}

		elt.setAttribute('data-electric-shape', '1');
		elt.setAttribute('data-electric-shape-id', entry.id);
		elt.setAttribute('data-electric-shape-tooltip',
			Editor.getElectricShapeTooltipText(entry));

		var prefetchOriginal = function()
		{
			Editor.prefetchElectricShape(entry);
		};

		if (elt.addEventListener != null)
		{
			elt.addEventListener('pointerenter', prefetchOriginal, {passive: true});
			elt.addEventListener('focus', prefetchOriginal, {passive: true});
			elt.addEventListener('touchstart', prefetchOriginal, {passive: true});
		}

		return elt;
		};

		Sidebar.prototype.createDropHandler = function(cells, allowSplit,
			allowCellsInserted, bounds, startEditing, sourceCell)
		{
			var electricShapeId = Editor.getElectricShapeIdFromCells(this.graph, cells);

			if (electricShapeId != null)
			{
				return mxUtils.bind(this, function(graph, evt, target, x, y, force)
				{
					var entry = Editor.getElectricShapeEntry(electricShapeId);

					if (entry != null)
					{
						Editor.getElectricShapeCells(entry, graph).then(mxUtils.bind(this,
							function(originalCells)
							{
								var originalBounds = new mxRectangle(0, 0,
									entry.width, entry.height);
								var handler = createDropHandler.call(this, originalCells,
									allowSplit, allowCellsInserted, originalBounds,
									startEditing, sourceCell);

								handler(graph, evt, target, x, y, force);
							})).catch(mxUtils.bind(this, function(error)
							{
								Editor.showElectricShapeLoadError(this, error);
							}));
					}
				});
			}

			return createDropHandler.apply(this, arguments);
		};

		Sidebar.prototype.addElectricShapePalettes = function(catalog)
		{
		for (var i = 0; i < catalog.libraries.length; i++)
		{
			(mxUtils.bind(this, function(library)
			{
				var fns = [];
				this.setCurrentSearchEntryLibrary(library.id, library.title);

				for (var j = 0; j < library.items.length; j++)
				{
					(mxUtils.bind(this, function(entry)
					{
						fns.push(this.addEntry(entry.tags, mxUtils.bind(this, function()
						{
							return this.createElectricShapeItem(entry);
						})));
					}))(library.items[j]);
				}

				this.setCurrentSearchEntryLibrary();
				this.addPaletteFunctions(library.id, library.title, false, fns);
			}))(catalog.libraries[i]);
		}
	};

	Sidebar.prototype.updateEntries = function()
	{
		updateEntries.apply(this, arguments);

		if (Editor.isElectricTheme())
		{
			var catalog = Editor.loadElectricShapeCatalog();
			Editor.addElectricShapeConfigurations(catalog);
			var entries = [];

			for (var i = 0; i < catalog.libraries.length; i++)
			{
				entries.push({
					title: catalog.libraries[i].title,
					id: catalog.libraries[i].id,
					image: Editor.getElectricLibraryPreviewPlaceholder(catalog.libraries[i]),
					electricLibrary: catalog.libraries[i]
				});
			}

			this.entries.unshift({title: 'Electric', entries: entries});
			Editor.scheduleElectricLibraryPreviews(entries);
		}
		else
		{
			Editor.removeElectricShapeConfigurations();
		}
	};

	Sidebar.prototype.initPalettes = function()
	{
		initPalettes.apply(this, arguments);

		if (Editor.isElectricTheme())
		{
			var catalog = Editor.loadElectricShapeCatalog();
			Editor.addElectricShapeConfigurations(catalog);
			this.addElectricShapePalettes(catalog);
		}
	};

	Sidebar.prototype.createTooltip = function(elt, cells, w, h, title, showLabel,
		off, maxSize, mouseDown, closable, applyAllStyles)
	{
		createTooltip.apply(this, arguments);

		if (elt != null && elt.getAttribute != null &&
			elt.getAttribute('data-electric-shape') == '1' &&
			this.tooltipTitle != null)
		{
			var text = elt.getAttribute('data-electric-shape-tooltip') || title || '';
			var lines = text.split('\n');
			this.tooltipTitle.innerText = '';
			this.tooltipTitle.style.boxSizing = 'border-box';
			this.tooltipTitle.style.textAlign = 'left';
				this.tooltipTitle.style.whiteSpace = 'normal';
				this.tooltipTitle.style.fontSize = '11px';
				this.tooltipTitle.style.lineHeight = '1.35';
				this.tooltipTitle.style.padding = '7px 8px 0 8px';
				this.tooltipTitle.style.width = '100%';
				this.tooltipTitle.style.minWidth = '244px';

				var titleDiv = document.createElement('div');
				titleDiv.style.fontWeight = 'bold';
				titleDiv.style.textAlign = 'center';
				titleDiv.style.marginBottom = '5px';
			mxUtils.write(titleDiv, lines[0] || '');
			this.tooltipTitle.appendChild(titleDiv);

			for (var i = 1; i < lines.length; i++)
			{
					var row = document.createElement('div');
					row.style.display = 'flex';
					row.style.gap = '8px';
					row.style.justifyContent = 'space-between';
					row.style.alignItems = 'flex-start';
					row.style.marginTop = '2px';

					var parts = lines[i].split(': ');
					var key = document.createElement('span');
					key.style.color = '#6b7280';
					key.style.flex = '0 0 96px';
					mxUtils.write(key, parts[0]);

					var value = document.createElement('span');
					value.style.color = '#111827';
					value.style.flex = '1 1 auto';
					value.style.textAlign = 'left';
					value.style.overflowWrap = 'anywhere';
					mxUtils.write(value, parts.slice(1).join(': '));

				row.appendChild(key);
				row.appendChild(value);
				this.tooltipTitle.appendChild(row);
			}

			var bounds = this.graph2.getGraphBounds();
			var titleHeight = this.tooltipTitle.scrollHeight + 10;
			var width = parseFloat(this.tooltip.style.width);
			this.tooltip.style.width = Math.min(this.maxTooltipWidth,
				Math.max(width, this.tooltipTitle.scrollWidth + 8)) + 'px';
				this.tooltip.style.height = (bounds.height + 2 *
					this.tooltipBorder + titleHeight) + 'px';
				this.tooltipTitle.style.marginTop = (2 - titleHeight) + 'px';
				Editor.fitElectricShapeTooltip(this);
			}
		};
})();
