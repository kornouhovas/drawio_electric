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

	Editor.getElectricPreviewSize = function(entry)
	{
		if (entry.kind == 'terminal')
		{
			return {width: 44, height: 112, thumbWidth: 24, thumbHeight: 50};
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

		var marking = data['Маркировка'] || entry.title;
		var rating = Editor.getElectricRating(entry);

		return [
			Editor.trimElectricText(data['Серия'] || 'EKF', 12),
			Editor.trimElectricText(rating, 10),
			Editor.trimElectricText(marking, 16)
		];
	};

	Editor.getElectricSvgTextLine = function(value, x, y, size, weight, anchor)
	{
		return '<text x="' + x + '" y="' + y +
			'" font-family="Arial,sans-serif" font-size="' + size +
			'" font-weight="' + (weight || '400') + '" text-anchor="' +
			(anchor || 'middle') + '" fill="#111827">' +
			Editor.getElectricSvgText(value) + '</text>';
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

		if (entry.kind == 'terminal')
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
			svg += '<rect x="' + faceX + '" y="' + faceY + '" width="' +
				faceW + '" height="' + faceH +
				'" fill="#f8fafc" stroke="#111827" stroke-width="1.3"/>';
			svg += '<rect x="' + faceX + '" y="' + faceY + '" width="' +
				faceW + '" height="' + Math.max(7, faceH * 0.11) +
				'" fill="#e5e7eb" stroke="#cbd5e1" stroke-width="0.5"/>';
			svg += '<rect x="' + faceX + '" y="' + (faceY + faceH * 0.86) +
				'" width="' + faceW + '" height="' + (faceH * 0.14) +
				'" fill="#e5e7eb" stroke="#cbd5e1" stroke-width="0.5"/>';
			svg += Editor.getElectricSvgTextLine('MW', faceX + faceW * 0.18,
				faceY + faceH * 0.22, compact ? 7 : 9, '700');
			svg += Editor.getElectricSvgTextLine(rows[0], faceX + faceW / 2,
				faceY + faceH * 0.43, compact ? 7 : 9, '700');
			svg += Editor.getElectricSvgTextLine(rows[1], faceX + faceW / 2,
				faceY + faceH * 0.58, compact ? 5.5 : 7, '400');
			svg += Editor.getElectricSvgTextLine(rows[2], faceX + faceW / 2,
				faceY + faceH * 0.72, compact ? 6 : 8, '700');
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

	Editor.getElectricLibraryPreviewTile = function(entry, x, y, w, h)
	{
		var label = Editor.getElectricShapeLabel(entry);
		var body = Editor.createElectricModuleFaceSvg(entry, x + 4, y + 3,
			w - 8, h - 25, true);

		body += Editor.getElectricSvgTextLine(
			Editor.trimElectricText(label, 18), x + w / 2, y + h - 7, 7.5, '700');

		return body;
	};

	Editor.getElectricLibraryPreview = function(library)
	{
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
					image: Editor.getElectricLibraryPreview(catalog.libraries[i])
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
