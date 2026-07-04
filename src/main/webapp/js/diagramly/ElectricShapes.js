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
	Editor.electricShapeCatalog = null;
	Editor.electricShapeOriginalCache = {};

	Editor.getElectricShapesBaseUrl = function()
	{
		var base = (window.DRAWIO_BASE_URL != null) ?
			window.DRAWIO_BASE_URL : window.location.origin;

		return base.replace(/\/$/, '') + '/' + Editor.electricShapesPath;
	};

	Editor.loadElectricTextResource = function(path)
	{
		var xhr = new XMLHttpRequest();
		xhr.open('GET', Editor.getElectricShapesBaseUrl() + path, false);
		xhr.send();

		if (xhr.status >= 200 && xhr.status < 300)
		{
			return xhr.responseText;
		}

		throw new Error('Cannot load Electric shape resource: ' + path);
	};

	Editor.loadElectricShapeCatalog = function()
	{
		if (Editor.electricShapeCatalog == null)
		{
			Editor.electricShapeCatalog = JSON.parse(
				Editor.loadElectricTextResource('manifest.json'));
		}

		return Editor.electricShapeCatalog;
	};

	Editor.getElectricShapeEntry = function(id)
	{
		var catalog = Editor.loadElectricShapeCatalog();

		for (var i = 0; i < catalog.libraries.length; i++)
		{
			for (var j = 0; j < catalog.libraries[i].items.length; j++)
			{
				if (catalog.libraries[i].items[j].id == id)
				{
					return catalog.libraries[i].items[j];
				}
			}
		}

		return null;
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

	Editor.getElectricShapeCells = function(entry, graph)
	{
		var xml = Editor.electricShapeOriginalCache[entry.id];

		if (xml == null)
		{
			xml = Editor.loadElectricTextResource(entry.original);
			Editor.electricShapeOriginalCache[entry.id] = xml;
		}

		var doc = mxUtils.parseXml(xml);
		var codec = new mxCodec(doc);
		var model = new mxGraphModel();
		codec.decode(doc.documentElement, model);

		return graph.cloneCells(model.root.getChildAt(0).children);
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

	Editor.getElectricLibraryPreview = function(title)
	{
		var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="180" viewBox="0 0 360 180">' +
			'<rect width="360" height="180" rx="8" fill="#f8fafc"/>' +
			'<rect x="34" y="34" width="62" height="112" rx="3" fill="#ffffff" stroke="#111827" stroke-width="2"/>' +
			'<rect x="48" y="54" width="34" height="12" fill="#ef4444"/>' +
			'<rect x="48" y="88" width="34" height="30" rx="3" fill="#9ca3af" stroke="#4b5563"/>' +
			'<rect x="128" y="34" width="92" height="112" rx="3" fill="#ffffff" stroke="#111827" stroke-width="2"/>' +
			'<path d="M146 62h56M146 90h56M146 118h56" stroke="#64748b" stroke-width="6" stroke-linecap="round"/>' +
			'<rect x="252" y="34" width="54" height="112" rx="3" fill="#eef2ff" stroke="#111827" stroke-width="2"/>' +
			'<circle cx="270" cy="58" r="5" fill="#ffffff" stroke="#111827"/>' +
			'<circle cx="288" cy="58" r="5" fill="#ffffff" stroke="#111827"/>' +
			'<text x="180" y="166" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#111827">' +
			mxUtils.htmlEntities(title) + '</text></svg>';

		return 'data:image/svg+xml,' + encodeURIComponent(svg);
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
			Editor.createElectricCell(group, 'T', w * 0.72, h * 0.33, w * 0.18, h * 0.07,
				'ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#ffffff;strokeColor=#111827;' +
				'fontSize=' + Math.max(6, w * 0.09) + ';fontStyle=1;align=center;verticalAlign=middle;');
		}

		Editor.createElectricCell(group, 'OFF', w * 0.12, h * 0.58, w * 0.76, h * 0.13,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#a9a49a;strokeColor=#7c786e;strokeWidth=0.5;' +
			'fontSize=' + Math.max(6, w * 0.09) + ';fontColor=#111827;fontStyle=1;align=center;verticalAlign=middle;');
		Editor.createElectricText(group, marking, pad, h * 0.72, w - 2 * pad, h * 0.17, Math.max(7, w * 0.09), true, 'center');
	};

	Editor.createElectricTerminalPreview = function(entry, group, w, h)
	{
		var color = Editor.getElectricShapeValue(entry, 'Цвет');
		var type = Editor.getElectricShapeValue(entry, 'Тип');
		var section = Editor.getElectricShapeValue(entry, 'Сечение');
		var fill = '#e5e7eb';

		if (color == 'Синий')
		{
			fill = '#bfdbfe';
		}
		else if (color == 'PE' || type.indexOf('зазем') >= 0)
		{
			fill = '#bbf7d0';
		}
		else if (type.indexOf('Заглуш') >= 0)
		{
			fill = '#f3f4f6';
		}

		Editor.createElectricCell(group, '', 0, 0, w, h,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=' + fill + ';strokeColor=#111827;strokeWidth=0.8;');
		Editor.createElectricCell(group, '', w * 0.18, h * 0.18, w * 0.64, h * 0.18,
			'rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#6b7280;strokeWidth=0.6;arcSize=20;');
		Editor.createElectricCell(group, '', w * 0.18, h * 0.64, w * 0.64, h * 0.18,
			'rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#6b7280;strokeWidth=0.6;arcSize=20;');
		Editor.createElectricText(group, 'XT', w * 0.08, h * 0.39, w * 0.84, h * 0.12, Math.max(8, w * 0.16), true, 'center');
		Editor.createElectricText(group, section || Editor.getElectricShapeValue(entry, 'Модель'),
			w * 0.06, h * 0.5, w * 0.88, h * 0.12, Math.max(6, w * 0.1), false, 'center');
	};

	Editor.createElectricPsuPreview = function(entry, group, w, h)
	{
		var model = Editor.getElectricShapeValue(entry, 'Модель');
		var output = Editor.getElectricShapeValue(entry, 'Выход');
		var power = Editor.getElectricShapeValue(entry, 'Мощность');

		Editor.createElectricCell(group, '', 0, 0, w, h,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#f8fafc;gradientColor=#e5e7eb;' +
			'gradientDirection=south;strokeColor=#111827;strokeWidth=0.8;');
		Editor.createElectricCell(group, '', 0, 0, w, h * 0.12,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#e5e7eb;strokeColor=#cbd5e1;strokeWidth=0.45;');
		Editor.createElectricCell(group, '', 0, h * 0.88, w, h * 0.12,
			'rounded=0;whiteSpace=wrap;html=1;fillColor=#e5e7eb;strokeColor=#cbd5e1;strokeWidth=0.45;');
		Editor.createElectricText(group, 'MW', w * 0.08, h * 0.15, w * 0.24, h * 0.08, Math.max(7, w * 0.08), true, 'left');
		Editor.createElectricText(group, 'MEAN WELL', w * 0.08, h * 0.24, w * 0.84, h * 0.06, Math.max(7, w * 0.07), true, 'left');
		Editor.createElectricText(group, model, w * 0.08, h * 0.36, w * 0.84, h * 0.09, Math.max(9, w * 0.08), true, 'left');
		Editor.createElectricText(group, output, w * 0.08, h * 0.48, w * 0.84, h * 0.1, Math.max(6, w * 0.055), false, 'left');
		Editor.createElectricText(group, power, w * 0.08, h * 0.6, w * 0.84, h * 0.08, Math.max(8, w * 0.07), true, 'left');

		var labels = ['-V', '+V', 'L', 'N'];

		for (var i = 0; i < labels.length; i++)
		{
			Editor.createElectricText(group, labels[i], w * (0.08 + i * 0.22), h * 0.78,
				w * 0.16, h * 0.08, Math.max(6, w * 0.055), true, 'center');
		}
	};

	Editor.createElectricShapePreviewCells = function(entry)
	{
		var w = Math.max(20, entry.width);
		var h = Math.max(40, entry.height);
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

	Sidebar.prototype.createElectricShapeItem = function(entry)
	{
		var cells = Editor.createElectricShapePreviewCells(entry);
		var elt = this.createVertexTemplateFromCells(cells, entry.width,
			entry.height, entry.title, true, true, null, true, null, 32, 30);
		var loaded = false;

		if (elt == null)
		{
			return elt;
		}

		elt.setAttribute('data-electric-shape', '1');
		elt.setAttribute('data-electric-shape-id', entry.id);
		elt.setAttribute('data-electric-shape-tooltip',
			Editor.getElectricShapeTooltipText(entry));

		var ensureOriginal = mxUtils.bind(this, function()
		{
			if (!loaded)
			{
				var original = Editor.getElectricShapeCells(entry, this.graph);
				cells.splice(0, cells.length);

				for (var i = 0; i < original.length; i++)
				{
					cells.push(original[i]);
				}

				loaded = true;
			}
		});

		if (elt.addEventListener != null)
		{
			elt.addEventListener('pointerdown', ensureOriginal, true);
			elt.addEventListener('mousedown', ensureOriginal, true);
			elt.addEventListener('touchstart', ensureOriginal, true);
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
						var originalCells = Editor.getElectricShapeCells(entry, graph);
						var originalBounds = new mxRectangle(0, 0, entry.width, entry.height);
						var handler = createDropHandler.call(this, originalCells, allowSplit,
							allowCellsInserted, originalBounds, startEditing, sourceCell);

						return handler(graph, evt, target, x, y, force);
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
					desc: catalog.libraries[i].items.length + ' элементов. Оригиналы загружаются при перетаскивании.',
					image: Editor.getElectricLibraryPreview(catalog.libraries[i].title)
				});
			}

			this.entries.unshift({title: 'Electric', entries: entries});
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

				var parts = lines[i].split(': ');
				var key = document.createElement('span');
				key.style.color = '#6b7280';
				key.style.flex = '0 0 auto';
				mxUtils.write(key, parts[0]);

				var value = document.createElement('span');
				value.style.color = '#111827';
				value.style.textAlign = 'right';
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
		}
	};
})();
