/**
 * Copyright (c) 2026, draw.io Electric contributors
 */
/**
 * Installing Electric theme.
 */
Editor.themes.push('electric');

Editor.isElectricTheme = function(theme)
{
	theme = (theme != null) ? theme : Editor.currentTheme;
	return theme == 'electric';
};

Editor.ensureElectricMath = function()
{
	if (Editor.isElectricTheme() && typeof window.MathJax === 'undefined')
	{
		Editor.initMath(App.getAssetUrl(DRAW_MATH_URL + '/startup.js'));
	}
};

(function()
{
	if (Editor.prototype == null || typeof EditorUi === 'undefined' ||
		EditorUi.prototype == null || typeof mxStencilRegistry === 'undefined')
	{
		return;
	}

	var setGraphXml = Editor.prototype.setGraphXml;
	var setMathEnabled = EditorUi.prototype.setMathEnabled;
	var loadStencil = mxStencilRegistry.loadStencil;

	Editor.prototype.setGraphXml = function()
	{
		var result = setGraphXml.apply(this, arguments);

		if (Editor.isElectricTheme() && this.graph.mathEnabled)
		{
			Editor.ensureElectricMath();

			if (Editor.MathJaxRender != null)
			{
				Editor.MathJaxRender(this.graph.container);
			}
		}

		return result;
	};

	EditorUi.prototype.setMathEnabled = function(value)
	{
		if (Editor.isElectricTheme() && value)
		{
			Editor.ensureElectricMath();
		}

		return setMathEnabled.apply(this, arguments);
	};

	mxStencilRegistry.loadStencil = function(filename, fn)
	{
		if (Editor.isElectricTheme() &&
			typeof window.DRAWIO_ASSET_URL === 'function')
		{
			filename = window.DRAWIO_ASSET_URL(filename);
		}

		return loadStencil.apply(this, [filename, fn]);
	};
})();

Editor.electricModeAttribute = 'electricMode';
Editor.defaultElectricMode = 'general';
Editor.electricLeftPanelTransitionDelay = 0.16;
Editor.electricDeviceSnapTolerance = 8;

Editor.createElectricModeIcon = function(svg)
{
	return 'data:image/svg+xml,' + encodeURIComponent(svg);
};

Editor.electricModes = [
		{
			id: 'general',
			label: 'Общая',
			title: 'Общий режим',
			labelKey: 'electricGeneralMode',
			titleKey: 'electricGeneralModeTitle',
		icon: Editor.createElectricModeIcon('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="16" rx="1.5"/><path d="M8 8h8"/><path d="M8 12h5"/><path d="M8 16h7"/></svg>')
	},
	{
		id: 'cabinetLayout',
			label: 'Шкафы',
			title: 'Компоновка шкафов',
			labelKey: 'electricCabinetMode',
			titleKey: 'electricCabinetModeTitle',
		icon: Editor.createElectricModeIcon('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 7h8"/><path d="M8 12h8"/><path d="M8 17h8"/><rect x="8" y="8.5" width="2.5" height="2" rx=".4"/><rect x="11" y="8.5" width="2.5" height="2" rx=".4"/><rect x="14" y="8.5" width="2" height="2" rx=".4"/><rect x="8" y="13.5" width="3" height="2" rx=".4"/><rect x="12" y="13.5" width="4" height="2" rx=".4"/></svg>')
	},
	{
		id: 'projectSchematics',
			label: 'Схемы',
			title: 'Проектные схемы',
			labelKey: 'electricSchematicsMode',
			titleKey: 'electricSchematicsModeTitle',
		icon: Editor.createElectricModeIcon('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="5" height="4" rx="1"/><rect x="15.5" y="4" width="5" height="4" rx="1"/><rect x="9.5" y="16" width="5" height="4" rx="1"/><path d="M8.5 6h7"/><path d="M6 8v3.5c0 .8.7 1.5 1.5 1.5H12v3"/><path d="M18 8v3.5c0 .8-.7 1.5-1.5 1.5H12"/></svg>')
	}
];

Editor.defaultElectricPanelView = 'library';
Editor.electricLayerColors = ['#7c3aed', '#0ea5e9', '#f59e0b',
	'#10b981', '#ec4899', '#6366f1'];
Editor.electricPanelViews = [
	{
		id: 'layers',
		titleKey: 'layers',
		title: 'Layers',
		icon: Editor.createElectricModeIcon('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z"/><path d="m4 12 8 4.5 8-4.5"/><path d="m4 16.5 8 4.5 8-4.5"/></svg>')
	},
	{
		id: 'library',
		titleKey: 'electricLibrary',
		title: 'Library',
		icon: Editor.createElectricModeIcon('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z"/></svg>')
	}
];

Editor.electricConnectorMetadataAttribute = 'electricConnectorStyles';
Editor.electricConnectorMetadataVersion = 1;
Editor.electricConnectorProfileKey = 'electricConnectorStyles';
Editor.electricConnectorStyleKeys = [
	'edgeStyle', 'elbow', 'shape', 'curved', 'rounded', 'orthogonalLoop',
	'jettySize', 'strokeColor', 'strokeWidth', 'opacity', 'dashed',
	'dashPattern', 'startArrow', 'startFill', 'startSize', 'endArrow',
	'endFill', 'endSize', 'sourcePerimeterSpacing',
	'targetPerimeterSpacing', 'jumpStyle', 'jumpSize', 'linecap', 'linejoin',
	'shadow', 'shadowColor', 'shadowOpacity', 'shadowOffsetX',
	'shadowOffsetY', 'shadowBlur', 'sketch', 'comic', 'fillWeight',
	'hachureGap', 'hachureAngle', 'jiggle', 'curveFitting', 'simplification',
	'flowAnimation', 'flowAnimationDirection', 'flowAnimationTimingFunction',
	'flowAnimationDuration'
];
Editor.electricConnectorIcon = Editor.createElectricModeIcon(
	'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18V8c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v8"/><path d="M16 16h4v-4"/><path d="m20 12-6 6"/></svg>');
Editor.electricConnectorBuiltins = [
	{id: 'standard', key: 'electricConnectorStandard', title: 'Standard', style:
		{edgeStyle: 'orthogonalEdgeStyle', rounded: '0', strokeColor: '#1f2937',
			strokeWidth: '1', startArrow: 'none', endArrow: 'none'}},
	{id: 'straight', key: 'straight', title: 'Straight', style:
		{edgeStyle: 'none', curved: '0', rounded: '0', strokeColor: '#1f2937',
			strokeWidth: '1', startArrow: 'none', endArrow: 'none'}},
	{id: 'orthogonal', key: 'orthogonal', title: 'Orthogonal', style:
		{edgeStyle: 'orthogonalEdgeStyle', rounded: '0', strokeColor: '#1f2937',
			strokeWidth: '1', startArrow: 'none', endArrow: 'none'}},
	{id: 'rounded', key: 'rounded', title: 'Rounded', style:
		{edgeStyle: 'orthogonalEdgeStyle', rounded: '1', curved: '0',
			strokeColor: '#1f2937', strokeWidth: '1', startArrow: 'none', endArrow: 'none'}},
	{id: 'curved', key: 'curved', title: 'Curved', style:
		{edgeStyle: 'none', rounded: '0', curved: '1', strokeColor: '#1f2937',
			strokeWidth: '1', startArrow: 'none', endArrow: 'none'}},
	{id: 'dashed', key: 'dashed', title: 'Dashed', style:
		{edgeStyle: 'orthogonalEdgeStyle', rounded: '0', strokeColor: '#64748b',
			strokeWidth: '1', dashed: '1', dashPattern: '8 8', startArrow: 'none', endArrow: 'none'}},
	{id: 'arrow', key: 'electricConnectorArrow', title: 'Arrow', style:
		{edgeStyle: 'orthogonalEdgeStyle', rounded: '0', strokeColor: '#1f2937',
			strokeWidth: '1', startArrow: 'none', endArrow: 'classic', endFill: '1'}}
];

Editor.getElectricConnectorBuiltin = function(id)
{
	for (var i = 0; i < Editor.electricConnectorBuiltins.length; i++)
	{
		if (Editor.electricConnectorBuiltins[i].id == id)
		{
			return Editor.electricConnectorBuiltins[i];
		}
	}

	return null;
};

Editor.cloneElectricConnectorStyle = function(style)
{
	var result = {};
	style = style || {};

	for (var i = 0; i < Editor.electricConnectorStyleKeys.length; i++)
	{
		var key = Editor.electricConnectorStyleKeys[i];
		var value = style[key];

		if (value != null && (typeof value == 'string' || typeof value == 'number' ||
			typeof value == 'boolean'))
		{
			result[key] = String(value);
		}
	}

	return result;
};

Editor.electricConnectorStylesEqual = function(first, second)
{
	first = Editor.cloneElectricConnectorStyle(first);
	second = Editor.cloneElectricConnectorStyle(second);

	for (var i = 0; i < Editor.electricConnectorStyleKeys.length; i++)
	{
		var key = Editor.electricConnectorStyleKeys[i];

		if (first[key] != second[key])
		{
			return false;
		}
	}

	return true;
};

Editor.addElectricStyleValue = function(cell, key, value)
{
	if (cell == null || key == null || value == null)
	{
		return;
	}

	var style = cell.style || '';

	if (style.indexOf(key + '=') < 0)
	{
		if (style.length > 0 && style.charAt(style.length - 1) != ';')
		{
			style += ';';
		}

		cell.style = style + key + '=' + value + ';';
	}
};

Editor.isElectricConnectableDeviceShapeId = function(shapeId)
{
	return shapeId != null &&
		(String(shapeId).indexOf("electric-ekf-breakers-") == 0 ||
		String(shapeId).indexOf("electric-ekf-rcbo-") == 0 ||
		String(shapeId).indexOf("electric-wb-") == 0);
};

Editor.isElectricConnectableDeviceEntry = function(entry)
{
	return entry != null &&
		(entry.kind == "breaker" || entry.kind == "rcbo" ||
		entry.kind == "wb" ||
		Editor.isElectricConnectableDeviceShapeId(entry.id));
};

Editor.markElectricShapeCells = function(cells, entry)
{
	if (cells == null)
	{
		return;
	}

	for (var i = 0; i < cells.length; i++)
	{
		Editor.addElectricStyleValue(cells[i], 'electricDevice', '1');

		if (Editor.isElectricConnectableDeviceEntry(entry) &&
			cells[i].setConnectable != null)
		{
			cells[i].setConnectable(true);
		}

		if (entry != null && entry.id != null)
		{
			Editor.addElectricStyleValue(cells[i], 'electricShapeId', entry.id);
		}
	}
};

Editor.getElectricDeviceSnapTolerance = function(graph)
{
	return Editor.electricDeviceSnapTolerance || 8;
};

Editor.electricRangesOverlap = function(a0, a1, b0, b1, tolerance)
{
	tolerance = (tolerance != null) ? tolerance : 0;

	return Math.min(a1, b1) - Math.max(a0, b0) >= -tolerance;
};

Editor.getElectricDeviceSideSnapDelta = function(bounds, delta, targets, tolerance)
{
	var result = {
		x: (delta != null && delta.x != null) ? delta.x : 0,
		y: (delta != null && delta.y != null) ? delta.y : 0
	};

	if (bounds == null || delta == null || targets == null || targets.length == 0)
	{
		return result;
	}

	tolerance = (tolerance != null) ? tolerance :
		Editor.electricDeviceSnapTolerance;

	var movedLeft = bounds.x + result.x;
	var movedRight = movedLeft + bounds.width;
	var movedTop = bounds.y + result.y;
	var movedBottom = movedTop + bounds.height;
	var bestX = tolerance + 1;
	var bestY = tolerance + 1;
	var snapX = null;
	var snapY = null;

	function trySnapX(value)
	{
		var diff = Math.abs(value - result.x);

		if (diff <= tolerance && diff < bestX)
		{
			bestX = diff;
			snapX = value;
		}
	};

	function trySnapY(value)
	{
		var diff = Math.abs(value - result.y);

		if (diff <= tolerance && diff < bestY)
		{
			bestY = diff;
			snapY = value;
		}
	};

	for (var i = 0; i < targets.length; i++)
	{
		var target = targets[i];

		if (target == null || target.width <= 0 || target.height <= 0)
		{
			continue;
		}

		var targetLeft = target.x;
		var targetRight = target.x + target.width;
		var targetTop = target.y;
		var targetBottom = target.y + target.height;

		if (Editor.electricRangesOverlap(movedTop, movedBottom,
			targetTop, targetBottom, tolerance))
		{
			trySnapX(targetLeft - bounds.x - bounds.width);
			trySnapX(targetRight - bounds.x);
		}

		if (Editor.electricRangesOverlap(movedLeft, movedRight,
			targetLeft, targetRight, tolerance))
		{
			trySnapY(targetTop - bounds.y - bounds.height);
			trySnapY(targetBottom - bounds.y);
		}
	}

	if (snapX != null)
	{
		result.x = snapX;
	}

	if (snapY != null)
	{
		result.y = snapY;
	}

	return result;
};

Editor.hasElectricDeviceSignature = function(graph, cell)
{
	var model = (graph != null) ? graph.getModel() : null;

	if (model == null || cell == null || model.getChildCount(cell) == 0)
	{
		return false;
	}

	var matches = 0;
	var maxDepth = 3;

	function visit(child, depth)
	{
		if (child == null || matches > 0 || depth > maxDepth)
		{
			return;
		}

		var value = model.getValue(child);
		var text = (value != null) ? String(value) : '';
		var style = child.style || '';

		if (/(EKF|QF|QFD|MEAN WELL|BA 47-63|АВДТ|HDR|UT)/.test(text) ||
			/electricShapeId=|fillColor=#FFE45C|fillColor=#626663/.test(style))
		{
			matches++;
			return;
		}

		for (var i = 0; i < model.getChildCount(child); i++)
		{
			visit(model.getChildAt(child, i), depth + 1);
		}
	};

	for (var i = 0; i < model.getChildCount(cell); i++)
	{
		visit(model.getChildAt(cell, i), 1);
	}

	return matches > 0;
};

Editor.electricDeviceRecognitionCache = (typeof WeakMap != 'undefined') ?
	new WeakMap() : null;

Editor.isElectricDeviceCell = function(graph, cell)
{
	var model = (graph != null) ? graph.getModel() : null;

	if (model == null || cell == null || !model.isVertex(cell))
	{
		return false;
	}

	var style = graph.getCellStyle(cell);

	if (mxUtils.getValue(style, 'electricDevice', '0') == '1' ||
		mxUtils.getValue(style, 'electricShapeId', null) != null)
	{
		return true;
	}

	if (Editor.electricDeviceRecognitionCache != null &&
		Editor.electricDeviceRecognitionCache.has(cell))
	{
		return Editor.electricDeviceRecognitionCache.get(cell);
	}

	var result = Editor.hasElectricDeviceSignature(graph, cell);

	if (Editor.electricDeviceRecognitionCache != null)
	{
		Editor.electricDeviceRecognitionCache.set(cell, result);
	}

	return result;
};

Editor.getElectricDeviceRootForCell = function(graph, cell)
{
	var model = (graph != null) ? graph.getModel() : null;
	var result = null;

	while (model != null && cell != null)
	{
		if (Editor.isElectricDeviceCell(graph, cell))
		{
			result = cell;
		}

		cell = model.getParent(cell);
	}

	return result;
};

Editor.isElectricDeviceCellAccessible = function(graph, cell)
{
	var device = Editor.getElectricDeviceRootForCell(graph, cell);

	return device == null || cell == device ||
		(graph != null && graph.electricOpenDeviceCell == device);
};

Editor.resolveElectricDeviceCellForInteraction = function(graph, cell)
{
	var device = Editor.getElectricDeviceRootForCell(graph, cell);

	if (device != null && cell != device &&
		!Editor.isElectricDeviceCellAccessible(graph, cell))
	{
		return device;
	}

	return cell;
};

Editor.openElectricDeviceForEditing = function(graph, cell)
{
	var device = Editor.getElectricDeviceRootForCell(graph, cell);

	if (graph != null && device != null)
	{
		graph.electricOpenDeviceCell = device;
	}

	return device;
};

Editor.clearElectricDeviceEditingIfOutside = function(graph, cell)
{
	var model = (graph != null) ? graph.getModel() : null;
	var device = (graph != null) ? graph.electricOpenDeviceCell : null;

	if (model != null && device != null &&
		(cell == null || (cell != device && !model.isAncestor(device, cell))))
	{
		graph.electricOpenDeviceCell = null;
	}
};

Editor.hasElectricDeviceCell = function(graph, cells)
{
	if (cells == null)
	{
		return false;
	}

	for (var i = 0; i < cells.length; i++)
	{
		if (Editor.isElectricDeviceCell(graph, cells[i]))
		{
			return true;
		}
	}

	return false;
};

Editor.getElectricDeviceSnapTargets = function(handler)
{
	var graph = (handler != null) ? handler.graph : null;
	var model = (graph != null) ? graph.getModel() : null;
	var targets = [];

	if (model == null || handler.cell == null)
	{
		return targets;
	}

	var parent = model.getParent(handler.cell);
	var count = model.getChildCount(parent);

	for (var i = 0; i < count; i++)
	{
		var cell = model.getChildAt(parent, i);

		if (cell != null && !(handler.isCellMoving != null &&
			handler.isCellMoving(cell)) && Editor.isElectricDeviceCell(graph, cell))
		{
			var state = graph.view.getState(cell);

			if (state != null && state.width > 0 && state.height > 0)
			{
				targets.push({
					x: state.x,
					y: state.y,
					width: state.width,
					height: state.height
				});
			}
		}
	}

	return targets;
};

Editor.applyElectricDeviceSideSnap = function(handler, me)
{
	var graph = (handler != null) ? handler.graph : null;

	if (!Editor.isElectricTheme() || graph == null || handler.bounds == null ||
		handler.cells == null || !Editor.hasElectricDeviceCell(graph, handler.cells))
	{
		return;
	}

	var evt = (me != null && me.getEvent != null) ? me.getEvent() : null;

	if (evt != null && mxEvent.isAltDown(evt))
	{
		return;
	}

	var targets = Editor.getElectricDeviceSnapTargets(handler);

	if (targets.length == 0)
	{
		return;
	}

	var snapped = Editor.getElectricDeviceSideSnapDelta(handler.bounds, {
		x: handler.currentDx || 0,
		y: handler.currentDy || 0
	}, targets, Editor.getElectricDeviceSnapTolerance(graph));

	handler.currentDx = snapped.x;
	handler.currentDy = snapped.y;
};

function SetElectricPageMode(ui, page, modeId)
{
	this.ui = ui;
	this.page = page;
	this.modeId = modeId;
};

SetElectricPageMode.prototype.execute = function()
{
	if (this.page != null && this.page.node != null)
	{
		var previous = this.page.node.getAttribute(Editor.electricModeAttribute);

		if (this.modeId == null || this.modeId == Editor.defaultElectricMode)
		{
			this.page.node.removeAttribute(Editor.electricModeAttribute);
		}
		else
		{
			this.page.node.setAttribute(Editor.electricModeAttribute, this.modeId);
		}

		this.modeId = previous;
		this.ui.editor.fireEvent(new mxEventObject('electricModeChanged',
			'change', this));
	}
};

(function()
{
	var switchCssForTheme = EditorUi.prototype.switchCssForTheme;
	var createUi = EditorUi.prototype.createUi;
	var refresh = EditorUi.prototype.refresh;
	var destroy = EditorUi.prototype.destroy;

	Editor.ensureElectricModeStyles = function()
	{
		if (document.getElementById('geElectricModeStyles') != null)
		{
			return;
		}

		var style = document.createElement('style');
		var transition = Editor.electricLeftPanelTransitionDelay + 's';
		style.setAttribute('id', 'geElectricModeStyles');
		style.setAttribute('type', 'text/css');
		style.appendChild(document.createTextNode(
			'.geEditor.geElectricModes{--ge-electric-mode-width:40px;--ge-electric-sidebar-width:0px;grid-template-columns:var(--ge-electric-mode-width) minmax(0,1fr) min-content;}' +
			'.geEditor.geElectricModes>.geElectricModePanel{grid-column:1;grid-row:3;box-sizing:border-box;width:var(--ge-electric-mode-width);min-width:0;min-height:0;border-right:1px solid light-dark(var(--border-color),var(--dark-border-color));background:light-dark(var(--ge-panel-color),var(--ge-dark-panel-color));display:flex;flex-direction:column;align-items:center;gap:4px;padding:5px 3px;overflow:hidden;z-index:8;transition:transform ' + transition + ' ease-in-out,opacity ' + transition + ' ease-in-out;}' +
			'.geEditor.geElectricModes>.geSidebarContainer:not(.geFormatContainer),.geEditor.geElectricModes>.geElectricLayersPanel{grid-column:2/3;grid-row:3/4;position:absolute!important;left:0;top:0;bottom:0;z-index:6;min-width:0!important;background-color:light-dark(var(--ge-panel-color),var(--ge-dark-panel-color));box-shadow:3px 0 8px rgba(0,0,0,.12);transform:translateX(0);transition:transform ' + transition + ' ease-in-out;will-change:transform;}' +
			'.geEditor.geElectricModes>.geElectricLayersPanel{box-sizing:border-box;width:var(--ge-electric-sidebar-width);border-right:1px solid light-dark(var(--border-color),var(--dark-border-color));display:none;flex-direction:column;overflow:hidden;}' +
			'.geEditor.geElectricModes.geElectricPanelLayers>.geSidebarContainer:not(.geFormatContainer){display:none;}' +
			'.geEditor.geElectricModes.geElectricPanelLayers>.geElectricLayersPanel{display:flex;}' +
			'.geEditor.geElectricModes>.geHsplit{grid-column:2/3;grid-row:3/4;position:absolute;left:var(--ge-electric-sidebar-width);top:0;bottom:0;z-index:7;transition:opacity ' + transition + ' ease-in-out;}' +
			'.geEditor.geElectricModes>.geDiagramContainer{grid-column:2;grid-row:3;min-width:0;}' +
			'.geEditor.geElectricModes>.geSidebarContainer.geFormatContainer{grid-column:3;grid-row:3;}' +
			'.geEditor.geElectricModes.geElectricShapesCollapsed>.geSidebarContainer:not(.geFormatContainer),.geEditor.geElectricModes.geElectricShapesCollapsed>.geElectricLayersPanel{transform:translateX(calc(-100% - 1px));pointer-events:none;}' +
			'.geEditor.geElectricModes.geElectricShapesCollapsed>.geHsplit{opacity:0!important;pointer-events:none;}' +
			'.geEditor.geElectricModes.geElectricFullscreen>.geElectricModePanel{opacity:0;transform:translateX(-100%);pointer-events:none;}' +
			'.geEditor.geElectricModes.geElectricFullscreen>.geSidebarContainer:not(.geFormatContainer),.geEditor.geElectricModes.geElectricFullscreen>.geElectricLayersPanel{transform:translateX(calc(-100% - 1px));pointer-events:none;}' +
			'.geEditor.geElectricModes.geElectricFullscreen>.geHsplit{opacity:0!important;pointer-events:none;}' +
			'.geEditor.geElectricModes .geToolbarContainer>.geToolbar>a.geElectricToolbarViewButton,.geEditor.geElectricModes .geToolbarContainer>.geToolbar>a[data-electric-toolbar-toggle="1"],.geEditor.geElectricModes .geToolbarContainer>.geToolbar>a[title^="Скрыть левую панель"],.geEditor.geElectricModes .geToolbarContainer>.geToolbar>a[title^="Показать левую панель"]{box-sizing:border-box!important;display:flex!important;width:34px!important;min-width:34px!important;height:30px!important;margin:4px 3px 4px -13px!important;padding:3px!important;align-items:center!important;justify-content:center!important;}' +
			'.geEditor.geElectricModes .geToolbarContainer>.geToolbar>a[data-electric-toolbar-toggle="1"]+.geSeparator,.geEditor.geElectricModes .geToolbarContainer>.geToolbar>a[title^="Скрыть левую панель"]+.geSeparator,.geEditor.geElectricModes .geToolbarContainer>.geToolbar>a[title^="Показать левую панель"]+.geSeparator{margin-left:0!important;}' +
			'.geElectricModeButton,.geElectricPanelViewButton{box-sizing:border-box;width:34px;min-height:30px;border:1px solid transparent;border-radius:5px;background:transparent;color:light-dark(var(--text-color),var(--dark-text-color));display:flex;align-items:center;justify-content:center;padding:3px;cursor:pointer;overflow:hidden;}' +
			'.geElectricModeButton:hover,.geElectricPanelViewButton:hover{background:light-dark(var(--highlight-color),var(--dark-highlight-color));}' +
			'.geElectricModeButton.geActive,.geElectricPanelViewButton.geActive{background:light-dark(var(--accent-color),var(--dark-accent-color));border-color:light-dark(var(--primary-hover-color),var(--dark-active-accent-color));color:light-dark(var(--accent-text-color),var(--dark-accent-text-color));}' +
			'.geElectricModeIcon{width:16px;height:16px;flex:0 0 16px;background-repeat:no-repeat;background-position:center;background-size:16px 16px;opacity:.9;}' +
			'.geElectricModeSeparator{width:24px;height:1px;margin:2px 0;background:light-dark(var(--border-color),var(--dark-border-color));flex:0 0 1px;}' +
			'.geElectricLayersHeader{box-sizing:border-box;height:40px;min-height:40px;padding:0 8px 0 12px;border-bottom:1px solid light-dark(var(--border-color),var(--dark-border-color));display:flex;align-items:center;gap:4px;}' +
			'.geElectricLayersTitle{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;font-size:13px;font-weight:600;}' +
			'.geElectricLayersAction{box-sizing:border-box;width:28px;height:28px;border:0;border-radius:4px;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;}' +
			'.geElectricLayersAction:hover{background:light-dark(var(--highlight-color),var(--dark-highlight-color));}' +
			'.geElectricLayersActionIcon{width:16px;height:16px;background-repeat:no-repeat;background-position:center;background-size:16px 16px;}' +
			'.geElectricLayersTree{min-height:0;flex:1;overflow:auto;padding:4px 0 8px;}' +
			'.geElectricLayerRow{box-sizing:border-box;height:30px;display:flex;align-items:center;padding-right:6px;color:light-dark(var(--text-color),var(--dark-text-color));cursor:default;user-select:none;}' +
			'.geElectricLayerRow:hover{background:light-dark(var(--highlight-color),var(--dark-highlight-color));}' +
			'.geElectricLayerRow.geActiveLayer{background:light-dark(var(--accent-color),var(--dark-accent-color));font-weight:600;}' +
			'.geElectricLayerRow.geSelectedElement{background:light-dark(var(--highlight-color),var(--dark-highlight-color));}' +
			'.geElectricLayerRow.geDragging{opacity:.45;}' +
			'.geElectricLayerRow.geDragOverBefore{box-shadow:inset 0 2px 0 light-dark(var(--accent-color),var(--dark-accent-color));}' +
			'.geElectricLayerRow.geDragOverAfter{box-shadow:inset 0 -2px 0 light-dark(var(--accent-color),var(--dark-accent-color));}' +
			'.geElectricLayerRow.geDragOverInside{background:light-dark(var(--accent-color),var(--dark-accent-color));outline:1px solid light-dark(var(--primary-hover-color),var(--dark-active-accent-color));outline-offset:-1px;}' +
			'.geElectricLayerRow.geHidden>.geElectricLayerMain{opacity:.45;}' +
			'.geElectricTreeToggle{box-sizing:border-box;width:20px;height:28px;border:0;background:transparent;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;}' +
			'.geElectricTreeToggle:before{content:"";width:0;height:0;border-top:4px solid transparent;border-bottom:4px solid transparent;border-left:5px solid currentColor;transition:transform .12s ease-in-out;}' +
			'.geElectricTreeToggle.geExpanded:before{transform:rotate(90deg);}' +
			'.geElectricTreeToggle.geEmpty{visibility:hidden;}' +
			'.geElectricTreeToggle.geDevice{visibility:hidden;}' +
			'.geElectricLayerVisibility{box-sizing:border-box;width:25px;height:28px;border:0;background:transparent no-repeat center;background-size:16px 16px;cursor:pointer;opacity:.75;}' +
			'.geElectricLayerMain{min-width:0;flex:1;display:flex;align-items:center;gap:7px;height:100%;}' +
			'.geElectricLayerMarker{width:3px;height:16px;border-radius:2px;background:#7c3aed;flex:0 0 3px;}' +
			'.geElectricElementMarker{box-sizing:border-box;width:12px;height:12px;border:1.5px solid currentColor;border-radius:2px;opacity:.7;flex:0 0 12px;}' +
			'.geElectricElementMarker.geEdgeMarker{border-radius:0;border-width:0 0 1.5px 0;transform:rotate(-30deg);}' +
			'.geElectricElementMarker.geDeviceMarker{border-radius:2px;border-width:1.5px;position:relative;}' +
			'.geElectricElementMarker.geDeviceMarker:after{content:"";position:absolute;left:2px;right:2px;top:4px;height:1.5px;background:currentColor;box-shadow:0 3px 0 currentColor;}' +
			'.geElectricLayerLabel{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;}' +
			'.geElectricActiveLayerMark{box-sizing:border-box;width:14px;height:14px;border:1px solid currentColor;border-radius:50%;display:none;align-items:center;justify-content:center;flex:0 0 14px;}' +
			'.geElectricActiveLayerMark:after{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;}' +
			'.geElectricLayerRow.geActiveLayer>.geElectricActiveLayerMark{display:flex;}' +
			'.geElectricLayersEmpty{padding:20px 16px;color:light-dark(var(--placeholder-color),var(--dark-placeholder-color));font-size:12px;text-align:center;white-space:normal;}' +
			'.geElectricConnectorToolbar{display:inline-flex;align-items:center;height:30px;margin:4px 3px;vertical-align:top;}' +
			'.geElectricConnectorToolbar>a{box-sizing:border-box!important;display:flex!important;align-items:center;justify-content:center;width:30px;height:30px;margin:0!important;padding:3px!important;border-radius:4px;cursor:pointer;}' +
			'.geElectricConnectorToolbar>a:hover{background:light-dark(var(--highlight-color),var(--dark-highlight-color));}' +
			'.geElectricConnectorToolbar>a.geElectricConnectorPrimary{position:relative;background-repeat:no-repeat;background-position:center;background-size:20px 20px;}' +
			'.geElectricConnectorToolbar>a.geElectricConnectorPrimary:after{content:"";position:absolute;left:6px;right:6px;bottom:3px;height:2px;border-radius:1px;background:var(--ge-electric-connector-color,#1f2937);}' +
			'.geElectricConnectorStyleOps{border-top:1px solid light-dark(var(--border-color),var(--dark-border-color));margin-top:6px;padding-top:8px;}' +
			'.geElectricConnectorStyleOpsTitle{font-size:12px;font-weight:600;margin:0 0 5px;}' +
			'.geElectricConnectorStyleButton{box-sizing:border-box!important;position:relative;width:100%;min-height:52px;height:auto;margin:0 0 6px!important;padding:6px 28px 6px 8px!important;text-align:left!important;display:flex!important;align-items:center;gap:10px;overflow:hidden;}' +
			'.geElectricConnectorStyleButton:after{content:"";position:absolute;right:10px;top:50%;width:7px;height:7px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:translateY(-65%) rotate(45deg);opacity:.75;}' +
			'.geElectricConnectorStyleButton .geElectricConnectorStylePreview{width:58px;height:38px;flex:0 0 58px;}' +
			'.geElectricConnectorStyleButtonText{min-width:0;flex:1;line-height:1.2;}' +
			'.geElectricConnectorStyleButtonName{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:light-dark(var(--text-color),var(--dark-text-color));}' +
			'.geElectricConnectorStyleButtonSummary{font-size:12px;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:light-dark(var(--placeholder-color),var(--dark-placeholder-color));}' +
			'.geElectricConnectorStyleOpsActions{display:flex;gap:4px;}' +
			'.geElectricConnectorStyleOpsActions button{min-width:0;flex:1;height:28px;margin:0!important;}' +
			'.geElectricConnectorStylePicker{box-sizing:border-box;height:100%;min-height:0;padding:16px;display:flex;flex-direction:column;color:light-dark(var(--text-color),var(--dark-text-color));}' +
			'.geElectricConnectorStylePickerTitle{font-size:20px;font-weight:600;margin:0 0 12px;}' +
			'.geElectricConnectorStylePickerSearch{box-sizing:border-box;width:100%;height:36px;margin:0 0 10px;padding:4px 10px;border:1px solid light-dark(var(--border-color),var(--dark-border-color));border-radius:6px;font-size:14px;}' +
			'.geElectricConnectorStylePickerList{min-height:0;flex:1;overflow:auto;padding-right:4px;}' +
			'.geElectricConnectorStylePickerSection{font-size:12px;font-weight:600;color:light-dark(var(--placeholder-color),var(--dark-placeholder-color));margin:10px 0 5px;}' +
			'.geElectricConnectorStylePickerRow{box-sizing:border-box;display:flex;align-items:center;gap:10px;min-height:48px;padding:6px 8px;border-radius:6px;cursor:pointer;}' +
			'.geElectricConnectorStylePickerRow:hover,.geElectricConnectorStylePickerRow.geSelected{background:light-dark(var(--highlight-color),var(--dark-highlight-color));}' +
			'.geElectricConnectorStylePreview{box-sizing:border-box;width:54px;height:34px;border:1px solid light-dark(var(--border-color),var(--dark-border-color));border-radius:4px;background:light-dark(#fff,#222);display:flex;align-items:center;padding:0 7px;flex:0 0 54px;}' +
			'.geElectricConnectorStylePreviewLine{width:100%;height:0;position:relative;}' +
			'.geElectricConnectorStylePreviewLine.geArrow:after{content:"";position:absolute;right:-1px;top:-4px;width:7px;height:7px;border-right:2px solid currentColor;border-top:2px solid currentColor;transform:rotate(45deg);}' +
			'.geElectricConnectorStylePickerText{min-width:0;flex:1;}' +
			'.geElectricConnectorStylePickerName{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
			'.geElectricConnectorStylePickerSummary{font-size:12px;color:light-dark(var(--placeholder-color),var(--dark-placeholder-color));white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
			'.geElectricConnectorStylePickerMenu{box-sizing:border-box;width:28px;height:28px;border:0;border-radius:4px;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;flex:0 0 28px;color:light-dark(var(--text-color),var(--dark-text-color));}' +
			'.geElectricConnectorStylePickerMenu:hover{background:light-dark(var(--highlight-color),var(--dark-highlight-color));}' +
			'.geElectricConnectorStylePickerMenu:before{content:"";width:4px;height:4px;border-radius:50%;background:currentColor;box-shadow:0 -7px 0 currentColor,0 7px 0 currentColor;opacity:.75;}' +
			'.geElectricConnectorStylePickerEmpty{padding:18px 8px;color:light-dark(var(--placeholder-color),var(--dark-placeholder-color));font-size:13px;text-align:center;}' +
			'html body.geDarkMode .geElectricModeIcon{filter:invert(1);}'
		));

		document.head.appendChild(style);
	};

	EditorUi.prototype.switchCssForTheme = function(value)
	{
		switchCssForTheme.apply(this, arguments);

		var node = (mxUtils.isAncestorNode(document.body, this.container)) ?
			this.container : this.editor.graph.container;

		if (node != null && Editor.isElectricTheme(value))
		{
			node.classList.add('geClassic');
		}

		if (this.container != null)
		{
			if (Editor.isElectricTheme(value))
			{
				this.installElectricModePanel();
			}
			else
			{
				this.removeElectricModePanel();
			}
		}
	};

	EditorUi.prototype.createUi = function()
	{
		createUi.apply(this, arguments);

		if (Editor.isElectricTheme())
		{
			this.installElectricModePanel();
		}
	};

	EditorUi.prototype.refresh = function(sizeDidChange)
	{
		var electricOverlay = Editor.isElectricTheme() &&
			this.electricModePanel != null;

		if (electricOverlay)
		{
			var formatWidth = this.formatContainer.style.width;
			this.sidebarContainer.style.width = Math.max(0,
				this.hsplitPosition || 0) + 'px';
			this.formatContainer.style.width = (this.format != null &&
				this.formatWidth > 0) ? '' : '0';

			// The left Shapes panel is an overlay, so its width must not resize
			// or recenter the graph while the splitter is being dragged.
			if (sizeDidChange || formatWidth != this.formatContainer.style.width)
			{
				this.editor.graph.sizeDidChange();
			}
		}
		else
		{
			refresh.apply(this, arguments);
		}

		if (Editor.isElectricTheme())
		{
			this.installElectricToolbarViewButton();
			this.installElectricConnectorToolbar();
		}
		this.updateElectricModePanel();
		this.updateElectricLeftPanelState();
		this.updateElectricLeftOverlayGeometry(false);
	};

	EditorUi.prototype.destroy = function()
	{
		this.removeElectricModeListeners();
		this.removeElectricModePanel();
		destroy.apply(this, arguments);
	};

	EditorUi.prototype.getElectricMode = function(id)
	{
		for (var i = 0; i < Editor.electricModes.length; i++)
		{
			if (Editor.electricModes[i].id == id)
			{
				return Editor.electricModes[i];
			}
		}

		return null;
	};

	EditorUi.prototype.getElectricModeIdForPage = function(page)
	{
		var modeId = (page != null && page.node != null) ?
			page.node.getAttribute(Editor.electricModeAttribute) : null;

		return (this.getElectricMode(modeId) != null) ?
			modeId : Editor.defaultElectricMode;
	};

	EditorUi.prototype.selectElectricMode = function(modeId)
	{
		if (!Editor.isElectricTheme() || this.currentPage == null)
		{
			return;
		}

		var mode = this.getElectricMode(modeId);

		if (mode != null)
		{
			if (this.getElectricModeIdForPage(this.currentPage) != mode.id)
			{
				this.editor.graph.model.execute(new SetElectricPageMode(
					this, this.currentPage, mode.id));
			}

			this.updateElectricModePanel();
		}
	};

	EditorUi.prototype.getElectricToolbarViewButton = function()
	{
		var buttons = (this.toolbarContainer != null) ?
			this.toolbarContainer.getElementsByTagName('a') : [];

		for (var i = 0; i < buttons.length; i++)
		{
			var title = buttons[i].getAttribute('title') || '';

			var viewTitle = mxResources.get('view') || 'View';

			if (title.indexOf(viewTitle) == 0 || title.indexOf('View') == 0)
			{
				return buttons[i];
			}
		}

		return null;
	};

	EditorUi.prototype.installElectricToolbarViewButton = function()
	{
		var button = this.getElectricToolbarViewButton();

		if (button != null && this.electricToolbarViewButton != button)
		{
			this.restoreElectricToolbarViewButton();
			this.electricToolbarViewButton = button;
			this.electricToolbarViewButtonTitle = button.getAttribute('title');
			this.electricToolbarViewButtonAriaLabel =
				button.getAttribute('aria-label');
			this.electricToolbarViewButtonAriaExpanded =
				button.getAttribute('aria-expanded');
			this.electricToolbarViewButtonHandler = mxUtils.bind(this, function(evt)
			{
				if (Editor.isElectricTheme())
				{
					this.toggleElectricLeftPanel();

					if (evt.stopImmediatePropagation != null)
					{
						evt.stopImmediatePropagation();
					}

					mxEvent.consume(evt);
				}
			});
			button.addEventListener('click',
				this.electricToolbarViewButtonHandler, true);
		}

		if (button != null)
		{
			button.classList.add('geElectricToolbarViewButton');
			button.setAttribute('data-electric-toolbar-toggle', '1');
		}

		this.updateElectricLeftPanelState();
	};

	EditorUi.prototype.restoreElectricToolbarViewButton = function()
	{
		if (this.electricToolbarViewButton != null)
		{
			if (this.electricToolbarViewButtonHandler != null)
			{
				this.electricToolbarViewButton.removeEventListener('click',
					this.electricToolbarViewButtonHandler, true);
			}

			this.electricToolbarViewButton.classList.remove('geElectricToolbarViewButton');
			this.electricToolbarViewButton.removeAttribute('data-electric-toolbar-toggle');

			if (this.electricToolbarViewButtonTitle != null)
			{
				this.electricToolbarViewButton.setAttribute('title',
					this.electricToolbarViewButtonTitle);
			}
			else
			{
				this.electricToolbarViewButton.removeAttribute('title');
			}

			if (this.electricToolbarViewButtonAriaLabel != null)
			{
				this.electricToolbarViewButton.setAttribute('aria-label',
					this.electricToolbarViewButtonAriaLabel);
			}
			else
			{
				this.electricToolbarViewButton.removeAttribute('aria-label');
			}

			if (this.electricToolbarViewButtonAriaExpanded != null)
			{
				this.electricToolbarViewButton.setAttribute('aria-expanded',
					this.electricToolbarViewButtonAriaExpanded);
			}
			else
			{
				this.electricToolbarViewButton.removeAttribute('aria-expanded');
			}

			this.electricToolbarViewButton = null;
			this.electricToolbarViewButtonHandler = null;
			this.electricToolbarViewButtonTitle = null;
			this.electricToolbarViewButtonAriaLabel = null;
			this.electricToolbarViewButtonAriaExpanded = null;
		}
	};

	EditorUi.prototype.getElectricConnectorStyleStore = function(scope, create)
	{
		var store = null;

		if (scope == 'profile')
		{
			if (typeof mxSettings != 'undefined' && mxSettings.settings != null)
			{
				store = mxSettings.settings[Editor.electricConnectorProfileKey];
			}
		}
		else
		{
			if (this.electricConnectorProjectStore == null && this.fileNode != null)
			{
				try
				{
					this.electricConnectorProjectStore = JSON.parse(
						this.fileNode.getAttribute(Editor.electricConnectorMetadataAttribute) || 'null');
				}
				catch (e)
				{
					this.electricConnectorProjectStore = null;
				}
			}

			store = this.electricConnectorProjectStore;
		}

		if (store == null || store.version != Editor.electricConnectorMetadataVersion ||
			!Array.isArray(store.presets))
		{
			store = {version: Editor.electricConnectorMetadataVersion, presets: [], lastStyle: null};

			if (create)
			{
				if (scope == 'profile' && typeof mxSettings != 'undefined' &&
					mxSettings.settings != null)
				{
					mxSettings.settings[Editor.electricConnectorProfileKey] = store;
				}
				else if (scope == 'project')
				{
					this.electricConnectorProjectStore = store;
				}
			}
		}

		var valid = [];

		for (var i = 0; i < store.presets.length; i++)
		{
			var preset = store.presets[i];
			var name = (preset != null && preset.name != null) ?
				String(preset.name).replace(/^\s+|\s+$/g, '').substring(0, 64) : '';
			var style = Editor.cloneElectricConnectorStyle(
				(preset != null) ? preset.style : null);

			if (name.length > 0 && Object.keys(style).length > 0)
			{
				valid.push({id: (preset.id != null) ? String(preset.id) : Editor.guid(),
					name: name, style: style});
			}
		}

		store.presets = valid;
		store.lastStyle = Editor.cloneElectricConnectorStyle(store.lastStyle);
		return store;
	};

	EditorUi.prototype.saveElectricConnectorStyleStore = function(scope)
	{
		var store = this.getElectricConnectorStyleStore(scope, true);

		if (scope == 'profile')
		{
			if (typeof mxSettings != 'undefined' && mxSettings.save != null)
			{
				mxSettings.save();
			}
		}
		else
		{
			if (this.fileNode != null)
			{
				this.fileNode.setAttribute(Editor.electricConnectorMetadataAttribute,
					JSON.stringify(store));
			}

			var file = this.getCurrentFile();

			if (file != null && file.setModified != null)
			{
				file.setModified(true);
			}
			else if (this.editor != null && this.editor.setModified != null)
			{
				this.editor.setModified(true);
			}
		}
	};

	EditorUi.prototype.getElectricSelectedConnectorEdges = function()
	{
		var graph = this.editor.graph;
		var model = graph.getModel();
		var selected = graph.getSelectionCells();
		var edges = [];

		for (var i = 0; i < selected.length; i++)
		{
			if (model.isEdge(selected[i]))
			{
				edges.push(selected[i]);
			}
		}

		return edges;
	};

	EditorUi.prototype.getElectricConnectorCurrentStyle = function()
	{
		return Editor.cloneElectricConnectorStyle(this.editor.graph.currentEdgeStyle);
	};

	EditorUi.prototype.getElectricConnectorStyleFromCell = function(cell)
	{
		var graph = this.editor.graph;
		var style = mxUtils.clone(graph.defaultEdgeStyle);
		var cellStyle = graph.getCellStyle(cell, false);

		for (var key in cellStyle)
		{
			style[key] = cellStyle[key];
		}

		return Editor.cloneElectricConnectorStyle(style);
	};

	EditorUi.prototype.setElectricConnectorCurrentStyle = function(style, replace,
		persist)
	{
		var graph = this.editor.graph;
		var next = replace ? mxUtils.clone(graph.defaultEdgeStyle) :
			mxUtils.clone(graph.currentEdgeStyle);
		var clean = Editor.cloneElectricConnectorStyle(style);

		for (var i = 0; i < Editor.electricConnectorStyleKeys.length; i++)
		{
			var key = Editor.electricConnectorStyleKeys[i];

			if (clean[key] != null)
			{
				next[key] = clean[key];
			}
			else if (replace)
			{
				delete next[key];
			}
		}

		graph.currentEdgeStyle = next;
		graph.pasteEdgeStyle = true;

		if (persist)
		{
			var profile = this.getElectricConnectorStyleStore('profile', true);
			var project = this.getElectricConnectorStyleStore('project', true);
			profile.lastStyle = Editor.cloneElectricConnectorStyle(next);
			project.lastStyle = Editor.cloneElectricConnectorStyle(next);
			this.saveElectricConnectorStyleStore('profile');
			this.saveElectricConnectorStyleStore('project');
		}

		this.updateElectricConnectorToolbar();
		this.fireEvent(new mxEventObject('electricConnectorStyleChanged'));
	};

	EditorUi.prototype.updateElectricConnectorCurrentStyle = function(changes)
	{
		var style = this.getElectricConnectorCurrentStyle();

		for (var key in changes)
		{
			if (changes[key] == null)
			{
				delete style[key];
			}
			else
			{
				style[key] = changes[key];
			}
		}

		this.setElectricConnectorCurrentStyle(style, true, true);

	};

	EditorUi.prototype.restoreElectricConnectorCurrentStyle = function()
	{
		var project = this.getElectricConnectorStyleStore('project', true);
		var profile = this.getElectricConnectorStyleStore('profile', true);
		var style = (Object.keys(project.lastStyle).length > 0) ? project.lastStyle :
			((Object.keys(profile.lastStyle).length > 0) ? profile.lastStyle : null);

		if (style != null)
		{
			this.setElectricConnectorCurrentStyle(style, true, false);
		}
	};

	EditorUi.prototype.findElectricConnectorPreset = function(value)
	{
		if (value == 'last')
		{
			return {scope: 'last', id: 'last', name: mxResources.get(
				'electricConnectorLast') || 'Last used',
				style: this.getElectricConnectorCurrentStyle()};
		}

		var pos = String(value || '').indexOf(':');
		var scope = (pos > 0) ? value.substring(0, pos) : null;
		var id = (pos > 0) ? value.substring(pos + 1) : null;

		if (scope == 'builtin')
		{
			var builtin = Editor.getElectricConnectorBuiltin(id);
			return (builtin != null) ? {scope: scope, id: id,
				name: mxResources.get(builtin.key) || builtin.title,
				style: Editor.cloneElectricConnectorStyle(builtin.style)} : null;
		}

		if (scope == 'profile' || scope == 'project')
		{
			var presets = this.getElectricConnectorStyleStore(scope, true).presets;

			for (var i = 0; i < presets.length; i++)
			{
				if (presets[i].id == id)
				{
					return {scope: scope, id: id, name: presets[i].name,
						style: Editor.cloneElectricConnectorStyle(presets[i].style)};
				}
			}
		}

		return null;
	};

	EditorUi.prototype.applyElectricConnectorStyle = function(style)
	{
		var graph = this.editor.graph;
		var edges = this.getElectricSelectedConnectorEdges();
		var clean = Editor.cloneElectricConnectorStyle(style);

		if (edges.length > 0)
		{
			graph.getModel().beginUpdate();

			try
			{
				for (var i = 0; i < Editor.electricConnectorStyleKeys.length; i++)
				{
					var key = Editor.electricConnectorStyleKeys[i];
					graph.setCellStyles(key, clean[key] != null ? clean[key] : null,
						edges);
				}
			}
			finally
			{
				graph.getModel().endUpdate();
			}
		}

		this.setElectricConnectorCurrentStyle(clean, true, true);
	};

	EditorUi.prototype.refreshElectricConnectorStyleOps = function()
	{
		var selected = this.editor.graph.getSelectionCells();

		if (this.format != null && (selected.length == 0 ||
			this.getElectricSelectedConnectorEdges().length > 0))
		{
			this.format.refresh();
		}
	};

	EditorUi.prototype.saveElectricConnectorPreset = function(scope, name, style)
	{
		var store = this.getElectricConnectorStyleStore(scope, true);
		name = String(name || '').replace(/^\s+|\s+$/g, '').substring(0, 64);

		if (name.length == 0)
		{
			return null;
		}

		var found = null;

		for (var i = 0; i < store.presets.length; i++)
		{
			if (store.presets[i].name.toLowerCase() == name.toLowerCase())
			{
				found = store.presets[i];
				break;
			}
		}

		if (found != null && !mxUtils.confirm((mxResources.get('replaceIt') ||
			'Replace') + ' "' + name + '"?'))
		{
			return null;
		}

		if (found == null)
		{
			found = {id: Editor.guid(), name: name, style: {}};
			store.presets.push(found);
		}

		found.style = Editor.cloneElectricConnectorStyle(style);
		this.saveElectricConnectorStyleStore(scope);
		this.electricConnectorSelectedPreset = scope + ':' + found.id;
		this.fireEvent(new mxEventObject('electricConnectorStyleChanged'));
		this.refreshElectricConnectorStyleOps();
		return found;
	};

	EditorUi.prototype.updateElectricConnectorPreset = function(value)
	{
		var preset = this.findElectricConnectorPreset(value);

		if (preset == null || (preset.scope != 'profile' && preset.scope != 'project'))
		{
			return;
		}

		var store = this.getElectricConnectorStyleStore(preset.scope, true);

		for (var i = 0; i < store.presets.length; i++)
		{
			if (store.presets[i].id == preset.id)
			{
				store.presets[i].style = this.getElectricConnectorCurrentStyle();
				this.saveElectricConnectorStyleStore(preset.scope);
				this.fireEvent(new mxEventObject('electricConnectorStyleChanged'));
				this.refreshElectricConnectorStyleOps();
				return;
			}
		}
	};

	EditorUi.prototype.deleteElectricConnectorPreset = function(value)
	{
		var preset = this.findElectricConnectorPreset(value);

		if (preset == null || (preset.scope != 'profile' && preset.scope != 'project') ||
			!mxUtils.confirm((mxResources.get('delete') || 'Delete') + ' "' +
			preset.name + '"?'))
		{
			return;
		}

		var store = this.getElectricConnectorStyleStore(preset.scope, true);

		for (var i = store.presets.length - 1; i >= 0; i--)
		{
			if (store.presets[i].id == preset.id)
			{
				store.presets.splice(i, 1);
			}
		}

		this.saveElectricConnectorStyleStore(preset.scope);
		this.electricConnectorSelectedPreset = 'last';
		this.fireEvent(new mxEventObject('electricConnectorStyleChanged'));
		this.refreshElectricConnectorStyleOps();
	};

	EditorUi.prototype.renameElectricConnectorPreset = function(value, name)
	{
		var preset = this.findElectricConnectorPreset(value);
		name = String(name || '').replace(/^\s+|\s+$/g, '').substring(0, 64);

		if (preset == null || (preset.scope != 'profile' && preset.scope != 'project') ||
			name.length == 0)
		{
			return;
		}

		var store = this.getElectricConnectorStyleStore(preset.scope, true);

		for (var i = 0; i < store.presets.length; i++)
		{
			if (store.presets[i].id != preset.id &&
				store.presets[i].name.toLowerCase() == name.toLowerCase())
			{
				if (!mxUtils.confirm((mxResources.get('replaceIt') || 'Replace') +
					' "' + name + '"?'))
				{
					return;
				}

				store.presets.splice(i, 1);
				break;
			}
		}

		for (var j = 0; j < store.presets.length; j++)
		{
			if (store.presets[j].id == preset.id)
			{
				store.presets[j].name = name;
				break;
			}
		}

		this.saveElectricConnectorStyleStore(preset.scope);
		this.fireEvent(new mxEventObject('electricConnectorStyleChanged'));
		this.refreshElectricConnectorStyleOps();
	};

EditorUi.prototype.getElectricConnectorToolbarHost = function()
	{
		return (this.toolbar != null && this.toolbar.edgeStyleMenu != null) ?
			this.toolbar.edgeStyleMenu.parentNode : null;
	};

	EditorUi.prototype.installElectricConnectorToolbar = function()
	{
		if (!Editor.isElectricTheme() || this.toolbar == null)
		{
			return;
		}

		this.removeElectricConnectorToolbar();
		this.hideElectricConnectorToolbarControls();
	};

	EditorUi.prototype.hideElectricConnectorToolbarControls = function()
	{
		if (this.toolbar != null && this.toolbar.edgeStyleMenu != null)
		{
			if (this.electricEdgeStyleMenuDisplay == null)
			{
				this.electricEdgeStyleMenuDisplay =
					this.toolbar.edgeStyleMenu.style.display;
			}

			this.toolbar.edgeStyleMenu.style.display = 'none';
		}
	};

	EditorUi.prototype.restoreElectricConnectorToolbarControls = function()
	{
		if (this.toolbar != null && this.toolbar.edgeStyleMenu != null &&
			this.electricEdgeStyleMenuDisplay != null)
		{
			this.toolbar.edgeStyleMenu.style.display =
				this.electricEdgeStyleMenuDisplay;
		}

		this.electricEdgeStyleMenuDisplay = null;
	};

	EditorUi.prototype.removeElectricConnectorToolbar = function()
	{
		if (this.electricConnectorToolbar != null &&
			this.electricConnectorToolbar.parentNode != null)
		{
			this.electricConnectorToolbar.parentNode.removeChild(
				this.electricConnectorToolbar);
		}

		this.electricConnectorToolbar = null;
		this.electricConnectorToolbarPrimary = null;
	};

	EditorUi.prototype.updateElectricConnectorToolbar = function()
	{
		if (this.electricConnectorToolbarPrimary == null)
		{
			return;
		}

		var style = this.getElectricConnectorCurrentStyle();
		var color = style.strokeColor || '#1f2937';
		var image = (this.getImageForEdgeStyle != null) ?
			this.getImageForEdgeStyle(style) : Editor.electricConnectorIcon;
		this.electricConnectorToolbarPrimary.style.backgroundImage = 'url("' + image + '")';
		this.electricConnectorToolbarPrimary.style.setProperty(
			'--ge-electric-connector-color', color);
		this.electricConnectorToolbarPrimary.setAttribute('title',
			mxResources.get('electricConnector') || 'Connector');
	};

	EditorUi.prototype.getElectricConnectorPresetGroups = function()
	{
		var groups = [];
		var lastName = mxResources.get('electricConnectorLast') || 'Last used';

		groups.push({
			label: mxResources.get('electricConnectorRecentStyles') ||
				'Recent styles',
			entries: [{value: 'last', name: lastName,
				style: this.getElectricConnectorCurrentStyle()}]
		});

		var builtins = [];

		for (var i = 0; i < Editor.electricConnectorBuiltins.length; i++)
		{
			var builtin = Editor.electricConnectorBuiltins[i];
			builtins.push({
				value: 'builtin:' + builtin.id,
				name: mxResources.get(builtin.key) || builtin.title,
				style: Editor.cloneElectricConnectorStyle(builtin.style)
			});
		}

		groups.push({
			label: mxResources.get('electricConnectorBuiltins') ||
				'Built-in styles',
			entries: builtins
		});

		var saved = [];
		var addSaved = mxUtils.bind(this, function(scope)
		{
			var presets = this.getElectricConnectorStyleStore(scope, true).presets;

			for (var j = 0; j < presets.length; j++)
			{
				saved.push({
					value: scope + ':' + presets[j].id,
					name: presets[j].name,
					style: Editor.cloneElectricConnectorStyle(presets[j].style)
				});
			}
		});

		addSaved('profile');
		addSaved('project');

		if (saved.length > 0)
		{
			groups.push({
				label: mxResources.get('electricConnectorSavedStyles') ||
					'Saved styles',
				entries: saved
			});
		}

		return groups;
	};

	EditorUi.prototype.getElectricConnectorPresetName = function(value)
	{
		var preset = this.findElectricConnectorPreset(value ||
			this.electricConnectorSelectedPreset || 'last');

		return (preset != null) ? preset.name :
			(mxResources.get('electricConnectorLast') || 'Last used');
	};

	EditorUi.prototype.getElectricConnectorPresetSummary = function(style)
	{
		style = style || {};
		var width = style.strokeWidth || '1';
		var line = (style.dashed == '1') ?
			(mxResources.get('dashed') || 'Dashed') :
			(mxResources.get('solid') || 'Solid');
		var color = style.strokeColor || (mxResources.get('default') || 'Default');

		return width + ' pt - ' + line + ' - ' + color;
	};

	EditorUi.prototype.createElectricConnectorStylePreview = function(style)
	{
		style = style || {};
		var preview = document.createElement('div');
		preview.className = 'geElectricConnectorStylePreview';
		var line = document.createElement('div');
		line.className = 'geElectricConnectorStylePreviewLine';

		if (style.endArrow != null && style.endArrow != 'none')
		{
			line.className += ' geArrow';
		}

		var width = parseInt(style.strokeWidth || '1');
		width = Math.max(1, Math.min(4, isNaN(width) ? 1 : width));
		var color = style.strokeColor || '#1f2937';
		line.style.borderTop = width + 'px ' +
			((style.dashed == '1') ? 'dashed' : 'solid') + ' ' + color;
		line.style.color = color;
		preview.appendChild(line);

		return preview;
	};

	EditorUi.prototype.showElectricConnectorStylePicker = function()
	{
		var ui = this;
		var container = document.createElement('div');
		container.className = 'geElectricConnectorStylePicker';
		var title = document.createElement('div');
		title.className = 'geElectricConnectorStylePickerTitle';
		mxUtils.write(title, mxResources.get('electricConnectorSelectStyle') ||
			'Select style');
		container.appendChild(title);

		var search = document.createElement('input');
		search.className = 'geElectricConnectorStylePickerSearch';
		search.setAttribute('type', 'search');
		search.setAttribute('placeholder',
			mxResources.get('electricConnectorSearchStyles') || 'Search styles');
		search.setAttribute('aria-label',
			mxResources.get('electricConnectorSearchStyles') || 'Search styles');
		container.appendChild(search);

		var list = document.createElement('div');
		list.className = 'geElectricConnectorStylePickerList';
		container.appendChild(list);

		function clearList()
		{
			while (list.firstChild != null)
			{
				list.removeChild(list.firstChild);
			}
		};

		function applyEntry(entry)
		{
			ui.electricConnectorSelectedPreset = entry.value;
			ui.applyElectricConnectorStyle(entry.style);
			ui.hideDialog(null, null, container);
			ui.refreshElectricConnectorStyleOps();
		};

		function showEntryMenu(evt, button, entry)
		{
			var preset = ui.findElectricConnectorPreset(entry.value);

			if (preset == null || (preset.scope != 'profile' &&
				preset.scope != 'project'))
			{
				return;
			}

			var menu = new mxPopupMenu(function(menu, parent)
			{
				menu.addItem(mxResources.get('rename') || 'Rename', null,
					function()
				{
					ui.prompt(mxResources.get('electricConnectorStyleName') ||
						(mxResources.get('name') || 'Name'), preset.name,
						function(name)
					{
						if (name != null)
						{
							ui.renameElectricConnectorPreset(entry.value, name);
							render();
						}
					}, true);
				}, parent);
				menu.addItem(mxResources.get('delete') || 'Delete', null,
					function()
				{
					ui.deleteElectricConnectorPreset(entry.value);
					render();
				}, parent);
			});

			menu.autoExpand = true;
			menu.hideMenu = function()
			{
				mxPopupMenu.prototype.hideMenu.apply(menu, arguments);
				menu.destroy();
			};

			var bounds = button.getBoundingClientRect();
			menu.popup(bounds.left, bounds.bottom, null, evt);
			ui.setCurrentMenu(menu);
			mxEvent.consume(evt);
		};

		function render()
		{
			clearList();
			var query = String(search.value || '').toLowerCase();
			var groups = ui.getElectricConnectorPresetGroups();
			var selectedValue = ui.electricConnectorSelectedPreset || 'last';
			var firstRow = null;
			var found = false;

			for (var i = 0; i < groups.length; i++)
			{
				var rows = [];

				for (var j = 0; j < groups[i].entries.length; j++)
				{
					var entry = groups[i].entries[j];

					if (query.length == 0 ||
						entry.name.toLowerCase().indexOf(query) >= 0)
					{
						rows.push(entry);
					}
				}

				if (rows.length == 0)
				{
					continue;
				}

				found = true;
				var section = document.createElement('div');
				section.className = 'geElectricConnectorStylePickerSection';
				mxUtils.write(section, groups[i].label);
				list.appendChild(section);

				for (var k = 0; k < rows.length; k++)
				{
					(function(entry)
					{
						var row = document.createElement('div');
						row.className = 'geElectricConnectorStylePickerRow' +
							((entry.value == selectedValue) ? ' geSelected' : '');
						row.setAttribute('data-electric-connector-style', entry.value);
						row.appendChild(ui.createElectricConnectorStylePreview(entry.style));
						var text = document.createElement('div');
						text.className = 'geElectricConnectorStylePickerText';
						var name = document.createElement('div');
						name.className = 'geElectricConnectorStylePickerName';
						mxUtils.write(name, entry.name);
						text.appendChild(name);
						var summary = document.createElement('div');
						summary.className = 'geElectricConnectorStylePickerSummary';
						mxUtils.write(summary,
							ui.getElectricConnectorPresetSummary(entry.style));
						text.appendChild(summary);
						row.appendChild(text);

						if (entry.value.indexOf('profile:') == 0 ||
							entry.value.indexOf('project:') == 0)
						{
							var menuButton = document.createElement('button');
							menuButton.className = 'geElectricConnectorStylePickerMenu';
							menuButton.setAttribute('type', 'button');
							menuButton.setAttribute('title',
								mxResources.get('edit') || 'Edit');
							menuButton.setAttribute('aria-label',
								mxResources.get('edit') || 'Edit');
							mxEvent.addListener(menuButton, 'click', function(evt)
							{
								showEntryMenu(evt, this, entry);
							});
							row.appendChild(menuButton);
						}

						mxEvent.addListener(row, 'click', function(evt)
						{
							applyEntry(entry);
							mxEvent.consume(evt);
						});

						if (firstRow == null)
						{
							firstRow = {row: row, entry: entry};
						}

						list.appendChild(row);
					})(rows[k]);
				}
			}

			if (!found)
			{
				var empty = document.createElement('div');
				empty.className = 'geElectricConnectorStylePickerEmpty';
				mxUtils.write(empty, mxResources.get('noResults') ||
					'No results');
				list.appendChild(empty);
			}

			list.electricFirstRow = firstRow;
		};

		mxEvent.addListener(search, 'input', render);
		mxEvent.addListener(search, 'keydown', function(evt)
		{
			if (evt.keyCode == 13 && list.electricFirstRow != null)
			{
				applyEntry(list.electricFirstRow.entry);
				mxEvent.consume(evt);
			}
		});

		render();
		this.showDialog(container, 420, 440, true, true);

		window.setTimeout(function()
		{
			search.focus();
		}, 0);
	};

	EditorUi.prototype.saveElectricConnectorCurrentPreset = function()
	{
		var value = this.electricConnectorSelectedPreset || 'last';
		var preset = this.findElectricConnectorPreset(value);

		if (preset != null && (preset.scope == 'profile' ||
			preset.scope == 'project'))
		{
			this.updateElectricConnectorPreset(value);
		}
		else
		{
			this.promptElectricConnectorPresetSave('project');
		}
	};

	EditorUi.prototype.showElectricConnectorPresetManageMenu = function(evt, button,
		value)
	{
		var preset = this.findElectricConnectorPreset(value);

		if (preset == null || (preset.scope != 'profile' &&
			preset.scope != 'project'))
		{
			return;
		}

		var menu = new mxPopupMenu(mxUtils.bind(this, function(menu, parent)
		{
			menu.addItem(mxResources.get('update') || 'Update', null,
				mxUtils.bind(this, function()
			{
				this.updateElectricConnectorPreset(value);
			}), parent);
			menu.addItem(mxResources.get('rename') || 'Rename', null,
				mxUtils.bind(this, function()
			{
				this.prompt(mxResources.get('name') || 'Name', preset.name,
					mxUtils.bind(this, function(name)
					{
						if (name != null)
						{
							this.renameElectricConnectorPreset(value, name);
						}
					}), true);
			}), parent);
			menu.addSeparator(parent);
			menu.addItem(mxResources.get('delete') || 'Delete', null,
				mxUtils.bind(this, function()
			{
				this.deleteElectricConnectorPreset(value);
			}), parent);
		}));

		menu.autoExpand = true;
		menu.hideMenu = mxUtils.bind(this, function()
		{
			mxPopupMenu.prototype.hideMenu.apply(menu, arguments);
			menu.destroy();
		});

		var bounds = button.getBoundingClientRect();
		menu.popup(bounds.left, bounds.bottom, null, evt);
		this.setCurrentMenu(menu);
		mxEvent.consume(evt);
	};

	EditorUi.prototype.promptElectricConnectorPresetSave = function(scope)
	{
		this.prompt(mxResources.get('electricConnectorStyleName') ||
			(mxResources.get('name') || 'Name'), '', mxUtils.bind(this,
			function(name)
			{
				if (name != null)
				{
					this.saveElectricConnectorPreset(scope, name,
						this.getElectricConnectorCurrentStyle());
				}
			}), true);
	};

	EditorUi.prototype.openElectricConnectorSettings = function()
	{
		if (!this.isFormatPanelVisible())
		{
			this.toggleFormatPanel(true);
		}

		if (this.format != null)
		{
			this.format.currentIndex = 0;
			this.format.refresh();
		}
	};

	EditorUi.prototype.syncElectricConnectorProjectStyle = function()
	{
		if (this.electricConnectorStyleFileNode != this.fileNode)
		{
			this.electricConnectorStyleFileNode = this.fileNode;
			this.electricConnectorProjectStore = null;
			this.electricConnectorSelectedPreset = 'last';
			this.restoreElectricConnectorCurrentStyle();
		}
	};

	EditorUi.prototype.addElectricConnectorStyleOps = function(container,
		allowDefaultStyle)
	{
		var selected = this.editor.graph.getSelectionCells();
		var edges = this.getElectricSelectedConnectorEdges();

		if (!Editor.isElectricTheme() || (allowDefaultStyle !== true &&
			(edges.length != selected.length || selected.length == 0)) ||
			(allowDefaultStyle === true && selected.length != 0))
		{
			return;
		}

		var ui = this;
		var section = document.createElement('div');
		section.className = 'geElectricConnectorStyleOps';
		var title = document.createElement('div');
		title.className = 'geElectricConnectorStyleOpsTitle';
		mxUtils.write(title, mxResources.get('electricConnectorStyles') ||
			'Connector styles');
		section.appendChild(title);

		var currentStyle = this.getElectricConnectorCurrentStyle();
		var currentName = this.getElectricConnectorPresetName();
		var currentSummary = this.getElectricConnectorPresetSummary(currentStyle);
		var selectStyle = document.createElement('button');
		selectStyle.setAttribute('type', 'button');
		selectStyle.className = 'geBtn geElectricConnectorStyleButton';
		selectStyle.setAttribute('title',
			(mxResources.get('electricConnectorSelectStyle') || 'Select style') +
			': ' + currentName + ' - ' + currentSummary);
		selectStyle.appendChild(this.createElectricConnectorStylePreview(
			currentStyle));
		var selectText = document.createElement('div');
		selectText.className = 'geElectricConnectorStyleButtonText';
		var selectName = document.createElement('div');
		selectName.className = 'geElectricConnectorStyleButtonName';
		mxUtils.write(selectName, currentName);
		selectText.appendChild(selectName);
		var selectSummary = document.createElement('div');
		selectSummary.className = 'geElectricConnectorStyleButtonSummary';
		mxUtils.write(selectSummary, currentSummary);
		selectText.appendChild(selectSummary);
		selectStyle.appendChild(selectText);
		mxEvent.addListener(selectStyle, 'click', mxUtils.bind(this,
			function(evt)
			{
				this.showElectricConnectorStylePicker();
				mxEvent.consume(evt);
			}));
		section.appendChild(selectStyle);

		var actions = document.createElement('div');
		actions.className = 'geElectricConnectorStyleOpsActions';
		var save = mxUtils.button(
			mxResources.get('electricConnectorSaveStyle') || 'Save style',
			mxUtils.bind(this, function(evt)
			{
				this.saveElectricConnectorCurrentPreset();
				mxEvent.consume(evt);
			}));
		save.setAttribute('title',
			mxResources.get('electricConnectorSaveStyle') || 'Save style');
		actions.appendChild(save);

		var saveAs = mxUtils.button(
			mxResources.get('electricConnectorSaveAsStyle') || 'Save as style',
			mxUtils.bind(this, function(evt)
			{
				this.promptElectricConnectorPresetSave('project');
				mxEvent.consume(evt);
			}));
		saveAs.setAttribute('title',
			mxResources.get('electricConnectorSaveAsStyle') || 'Save as style');
		actions.appendChild(saveAs);

		section.appendChild(actions);
		container.appendChild(section);
	};
	EditorUi.prototype.toggleElectricLeftPanel = function(visible)
	{
		var next = (visible != null) ? visible :
			(this.electricLeftPanelCollapsed === true);
		this.electricLeftPanelCollapsed = !next;
		this.updateElectricLeftPanelState();
		this.refreshElectricLeftPanelTransition();
	};

	EditorUi.prototype.refreshElectricLeftPanelTransition = function()
	{
		this.updateElectricLeftOverlayGeometry(true);
	};

	EditorUi.prototype.updateElectricLeftOverlayGeometry = function(animateRuler)
	{
		if (!Editor.isElectricTheme() || this.container == null ||
			this.sidebarContainer == null || this.hsplit == null)
		{
			return;
		}

		var width = Math.max(0, this.hsplitPosition || 0);
		this.container.style.setProperty('--ge-electric-sidebar-width', width + 'px');
		this.hsplit.style.left = width + 'px';
		this.updateElectricRulerPosition(animateRuler);
	};

	EditorUi.prototype.updateElectricRulerPosition = function(animate)
	{
		if (this.ruler == null || this.ruler.vRuler == null ||
			this.ruler.vRuler.container == null || this.container == null)
		{
			return;
		}

		this.electricRulerAnimate = this.electricRulerAnimate || animate === true;

		if (this.electricRulerFrame != null)
		{
			return;
		}

		this.electricRulerFrame = window.requestAnimationFrame(mxUtils.bind(this,
			function()
			{
				var ruler = this.ruler != null && this.ruler.vRuler != null ?
					this.ruler.vRuler.container : null;
				var modePanel = this.electricModePanel;

				this.electricRulerFrame = null;

				if (ruler == null || modePanel == null || this.container == null)
				{
					this.electricRulerAnimate = false;
					return;
				}

				var target = 0;
				var fullscreen = this.container.classList.contains('geElectricFullscreen');
				var collapsed = this.container.classList.contains('geElectricShapesCollapsed');

				if (!fullscreen)
				{
					target = this.container.getBoundingClientRect().left +
						modePanel.offsetLeft + modePanel.offsetWidth +
						((collapsed) ? 0 : Math.max(0, this.hsplitPosition || 0));
				}

				var offset = Math.round(target - ruler.offsetLeft);
				ruler.style.transition = this.electricRulerAnimate ?
					'transform ' + Editor.electricLeftPanelTransitionDelay + 's ease-in-out' : 'none';
				ruler.style.transform = 'translateX(' + offset + 'px)';
				this.electricRulerAnimate = false;
			}));
	};

	EditorUi.prototype.updateElectricLeftPanelState = function()
	{
		if (this.container == null)
		{
			return;
		}

		var collapsed = (this.electricLeftPanelCollapsed != null) ?
			this.electricLeftPanelCollapsed : !this.isShapesPanelVisible();

		if (collapsed)
		{
			this.container.classList.add('geElectricShapesCollapsed');
		}
		else
		{
			this.container.classList.remove('geElectricShapesCollapsed');
		}

		if (this.electricToolbarViewButton != null)
		{
			var title = (collapsed) ?
				(mxResources.get('showElectricLeftPanel') || 'Show left panel') :
				(mxResources.get('hideElectricLeftPanel') || 'Hide left panel');
			this.electricToolbarViewButton.setAttribute('title', title);
			this.electricToolbarViewButton.setAttribute('aria-label', title);
			this.electricToolbarViewButton.setAttribute('aria-expanded',
				(!collapsed).toString());
		}
	};

	EditorUi.prototype.createElectricModeButton = function(mode)
	{
		var button = document.createElement('button');
		var title = mxResources.get(mode.titleKey) || mode.title;
		button.setAttribute('type', 'button');
		button.setAttribute('title', title);
		button.setAttribute('aria-label', title);
		button.setAttribute('data-electric-mode', mode.id);
		button.className = 'geElectricModeButton';

		var icon = document.createElement('span');
		icon.className = 'geElectricModeIcon';
		icon.style.backgroundImage = 'url("' + mode.icon + '")';
		button.appendChild(icon);

		mxEvent.addListener(button, 'click', mxUtils.bind(this, function(evt)
		{
			this.selectElectricMode(mode.id);
			mxEvent.consume(evt);
		}));

		return button;
	};

	EditorUi.prototype.createElectricPanelViewButton = function(view)
	{
		var button = document.createElement('button');
		var title = mxResources.get(view.titleKey) || view.title;
		button.setAttribute('type', 'button');
		button.setAttribute('title', title);
		button.setAttribute('aria-label', title);
		button.setAttribute('data-electric-panel-view', view.id);
		button.className = 'geElectricPanelViewButton';

		var icon = document.createElement('span');
		icon.className = 'geElectricModeIcon';
		icon.style.backgroundImage = 'url("' + view.icon + '")';
		button.appendChild(icon);

		mxEvent.addListener(button, 'click', mxUtils.bind(this, function(evt)
		{
			this.setElectricLeftPanelView(view.id);
			mxEvent.consume(evt);
		}));

		return button;
	};

	EditorUi.prototype.createElectricModePanel = function()
	{
		var panel = document.createElement('div');
		panel.className = 'geElectricModePanel';
		panel.setAttribute('role', 'navigation');
		panel.setAttribute('aria-label', mxResources.get('electricModes') ||
			'Electric modes');

		for (var i = 0; i < Editor.electricPanelViews.length; i++)
		{
			panel.appendChild(this.createElectricPanelViewButton(
				Editor.electricPanelViews[i]));
		}

		var separator = document.createElement('div');
		separator.className = 'geElectricModeSeparator';
		separator.setAttribute('aria-hidden', 'true');
		panel.appendChild(separator);

		for (var i = 0; i < Editor.electricModes.length; i++)
		{
			panel.appendChild(this.createElectricModeButton(Editor.electricModes[i]));
		}

		return panel;
	};

	EditorUi.prototype.setElectricLeftPanelView = function(viewId)
	{
		viewId = (viewId == 'layers') ? 'layers' : 'library';
		this.electricLeftPanelView = viewId;
		this.electricLeftPanelCollapsed = false;

		if (viewId == 'layers')
		{
			this.container.classList.add('geElectricPanelLayers');
			this.scheduleElectricLayersPanelRefresh();
		}
		else
		{
			this.container.classList.remove('geElectricPanelLayers');
		}

		this.updateElectricPanelViewButtons();
		this.updateElectricLeftPanelState();
		this.updateElectricLeftOverlayGeometry(false);
	};

	EditorUi.prototype.updateElectricPanelViewButtons = function()
	{
		if (this.electricModePanel == null)
		{
			return;
		}

		var buttons = this.electricModePanel.querySelectorAll(
			'button[data-electric-panel-view]');

		for (var i = 0; i < buttons.length; i++)
		{
			var active = buttons[i].getAttribute('data-electric-panel-view') ==
				this.electricLeftPanelView;

			if (active)
			{
				buttons[i].classList.add('geActive');
			}
			else
			{
				buttons[i].classList.remove('geActive');
			}

			buttons[i].setAttribute('aria-pressed', active ? 'true' : 'false');
		}
	};

	EditorUi.prototype.createElectricLayersAction = function(title, icon, fn)
	{
		var button = document.createElement('button');
		button.setAttribute('type', 'button');
		button.setAttribute('title', title);
		button.setAttribute('aria-label', title);
		button.className = 'geElectricLayersAction';

		var image = document.createElement('span');
		image.className = 'geElectricLayersActionIcon';
		image.style.backgroundImage = 'url("' + icon + '")';
		button.appendChild(image);
		mxEvent.addListener(button, 'click', mxUtils.bind(this, function(evt)
		{
			fn();
			mxEvent.consume(evt);
		}));

		return button;
	};

	EditorUi.prototype.createElectricLayersPanel = function()
	{
		var panel = document.createElement('div');
		panel.className = 'geElectricLayersPanel';
		panel.setAttribute('role', 'tree');
		panel.setAttribute('aria-label', mxResources.get('layers') || 'Layers');

		var header = document.createElement('div');
		header.className = 'geElectricLayersHeader';
		var title = document.createElement('div');
		title.className = 'geElectricLayersTitle';
		mxUtils.write(title, mxResources.get('layers') || 'Layers');
		header.appendChild(title);
		header.appendChild(this.createElectricLayersAction(
			mxResources.get('addLayer') || 'Add Layer', Editor.plusImage,
			mxUtils.bind(this, function()
			{
				this.addElectricLayer();
			})));
		panel.appendChild(header);

		this.electricLayersTree = document.createElement('div');
		this.electricLayersTree.className = 'geElectricLayersTree';
		panel.appendChild(this.electricLayersTree);

		return panel;
	};

	EditorUi.prototype.getElectricLayerTreeKind = function(cell, isLayer)
	{
		var graph = this.editor.graph;
		var model = graph.getModel();

		if (isLayer)
		{
			return 'layer';
		}
		else if (Editor.isElectricDeviceCell(graph, cell))
		{
			return 'device';
		}
		else if (model.isEdge(cell))
		{
			return 'edge';
		}
		else if (model.getChildCount(cell) > 0)
		{
			return 'group';
		}

		return 'element';
	};

	EditorUi.prototype.isElectricLayerTreeDeviceInternal = function(cell)
	{
		var graph = this.editor.graph;
		var root = Editor.getElectricDeviceRootForCell(graph, cell);

		return root != null && root != cell;
	};

	EditorUi.prototype.getElectricLayerTreeDeviceEntry = function(cell)
	{
		var graph = this.editor.graph;
		var style = graph.getCellStyle(cell);
		var shapeId = mxUtils.getValue(style, 'electricShapeId', null);

		try
		{
			return shapeId != null && Editor.getElectricShapeEntry != null ?
				Editor.getElectricShapeEntry(shapeId) : null;
		}
		catch (e)
		{
			return null;
		}
	};

	EditorUi.prototype.getElectricLayerTreeLabel = function(cell, index, kind)
	{
		var graph = this.editor.graph;
		var model = graph.getModel();
		var label = graph.convertValueToString(cell);

		if (label == null || String(label).replace(/\s/g, '').length == 0)
		{
			if (kind == 'layer')
			{
				label = mxResources.get('background') || ('Layer ' + (index + 1));
			}
			else if (kind == 'device')
			{
				var entry = this.getElectricLayerTreeDeviceEntry(cell);
				label = (entry != null && entry.title != null) ? entry.title :
					(mxResources.get('device') || 'Electric device');
			}
			else if (kind == 'edge')
			{
				label = mxResources.get('connector') || 'Connector';
			}
			else if (kind == 'group')
			{
				label = mxResources.get('group') || 'Group';
			}
			else
			{
				label = (mxResources.get('shape') || 'Shape') + ' ' + (index + 1);
			}
		}

		return String(label);
	};

	EditorUi.prototype.getElectricActiveLayer = function()
	{
		var graph = this.editor.graph;
		var model = graph.getModel();
		var cell = graph.getDefaultParent();

		while (cell != null && model.getParent(cell) != model.root)
		{
			cell = model.getParent(cell);
		}

		return cell;
	};

	EditorUi.prototype.addElectricLayer = function(referenceLayer, before)
	{
		var graph = this.editor.graph;
		var model = graph.getModel();
		var layer = null;

		if (!graph.isEnabled())
		{
			return;
		}

		model.beginUpdate();

		try
		{
			var index = model.getChildCount(model.root);

			if (referenceLayer != null && model.getParent(referenceLayer) == model.root)
			{
				index = model.root.getIndex(referenceLayer) + (before ? 0 : 1);
			}

			layer = graph.addCell(new mxCell(mxResources.get('untitledLayer') ||
				'Untitled Layer'), model.root, index);
			graph.setDefaultParent(layer);
		}
		finally
		{
			model.endUpdate();
		}

		this.electricLayerToRename = layer;

		if (this.electricLayersRefreshFrame != null)
		{
			window.cancelAnimationFrame(this.electricLayersRefreshFrame);
			this.electricLayersRefreshFrame = null;
		}

		this.updateElectricLayersPanel();
	};

	EditorUi.prototype.startElectricCellRename = function(cell, labelNode, fallback)
	{
		var graph = this.editor.graph;

		if (!graph.isEnabled() || cell == null || labelNode == null)
		{
			return;
		}

		var oldValue = mxUtils.getTextContent(labelNode);
		labelNode.contentEditable = 'true';
		labelNode.style.textOverflow = '';
		labelNode.focus();
		document.execCommand('selectAll', false, null);

		var stopEditing = mxUtils.bind(this, function(applyValue)
		{
			if (labelNode.contentEditable == 'true')
			{
				labelNode.contentEditable = 'false';
				var value = mxUtils.getTextContent(labelNode);

				if (applyValue && value != oldValue)
				{
					graph.cellLabelChanged(cell, value.length > 0 ? value : fallback);
				}
				else
				{
					this.scheduleElectricLayersPanelRefresh();
				}
			}
		});

		mxEvent.addListener(labelNode, 'keydown', function(evt)
		{
			if (evt.keyCode == 13 || evt.keyCode == 27)
			{
				stopEditing(evt.keyCode == 13);
				mxEvent.consume(evt);
			}
		});
		mxEvent.addListener(labelNode, 'blur', function()
		{
			stopEditing(true);
		});
	};

	EditorUi.prototype.startElectricLayerRename = function(layer, labelNode)
	{
		this.startElectricCellRename(layer, labelNode,
			mxResources.get('untitledLayer') || 'Untitled Layer');
	};

	EditorUi.prototype.toggleElectricLayerTreeExpansion = function(cell, kind)
	{
		var graph = this.editor.graph;
		var id = cell.getId();

		if (kind == 'device')
		{
			if (graph.electricOpenDeviceCell == cell)
			{
				graph.electricOpenDeviceCell = null;
				graph.setSelectionCell(cell);
			}
			else
			{
				Editor.openElectricDeviceForEditing(graph, cell);
				graph.setSelectionCell(cell);
			}
		}

		this.electricLayersExpanded[id] = !this.electricLayersExpanded[id];
		this.scheduleElectricLayersPanelRefresh();
	};

	EditorUi.prototype.isElectricLayerTreeToggleEvent = function(evt)
	{
		return mxEvent.isControlDown(evt) || mxEvent.isMetaDown(evt);
	};

	EditorUi.prototype.selectElectricLayerTreeElement = function(cell, evt)
	{
		var graph = this.editor.graph;
		var cells = this.electricLayerVisibleCells || [];
		var anchor = this.electricLayerSelectionAnchor;

		if (mxEvent.isShiftDown(evt) && anchor != null)
		{
			var first = mxUtils.indexOf(cells, anchor);
			var last = mxUtils.indexOf(cells, cell);

			if (first >= 0 && last >= 0)
			{
				graph.setSelectionCells(cells.slice(Math.min(first, last),
					Math.max(first, last) + 1));
			}
			else
			{
				graph.setSelectionCell(cell);
				this.electricLayerSelectionAnchor = cell;
			}
		}
		else if (this.isElectricLayerTreeToggleEvent(evt))
		{
			if (graph.isCellSelected(cell))
			{
				graph.removeSelectionCell(cell);
			}
			else
			{
				graph.addSelectionCell(cell);
			}

			this.electricLayerSelectionAnchor = cell;
		}
		else
		{
			graph.setSelectionCell(cell);
			this.electricLayerSelectionAnchor = cell;
		}

		graph.scrollCellToVisible(cell, true);
	};

	EditorUi.prototype.getElectricLayerTreeMoveCells = function(cell)
	{
		var graph = this.editor.graph;
		var model = graph.getModel();
		var cells = graph.isCellSelected(cell) ? graph.getSelectionCells() : [cell];
		var result = [];

		for (var i = 0; i < cells.length; i++)
		{
			if (!model.isLayer(cells[i]) &&
				!this.isElectricLayerTreeDeviceInternal(cells[i]))
			{
				result.push(cells[i]);
			}
		}

		return model.getTopmostCells(result);
	};

	EditorUi.prototype.getElectricLayerTreeDropPosition = function(cell, kind, evt)
	{
		if (kind == 'layer' || kind == 'group')
		{
			var bounds = evt.currentTarget.getBoundingClientRect();
			var ratio = (evt.clientY - bounds.top) / Math.max(bounds.height, 1);

			if (ratio > .28 && ratio < .72)
			{
				return 'inside';
			}

			return ratio <= .5 ? 'before' : 'after';
		}

		return evt.clientY - evt.currentTarget.getBoundingClientRect().top <=
			evt.currentTarget.offsetHeight / 2 ? 'before' : 'after';
	};

	EditorUi.prototype.canMoveElectricLayerTreeCells = function(cells, target, kind,
		position)
	{
		var graph = this.editor.graph;
		var model = graph.getModel();
		var parent = position == 'inside' ? target : model.getParent(target);

		if (cells == null || cells.length == 0 || parent == null || kind == 'device' ||
			(position == 'inside' && kind != 'layer' && kind != 'group') ||
			Editor.getElectricDeviceRootForCell(graph, parent) != null)
		{
			return false;
		}

		for (var i = 0; i < cells.length; i++)
		{
			if (cells[i] == target || cells[i] == parent ||
				model.isAncestor(cells[i], target) || model.isAncestor(cells[i], parent))
			{
				return false;
			}
		}

		return true;
	};

	EditorUi.prototype.moveElectricLayerTreeCells = function(cells, target, kind,
		position)
	{
		var graph = this.editor.graph;
		var model = graph.getModel();

		if (!graph.isEnabled() || !this.canMoveElectricLayerTreeCells(cells, target,
			kind, position))
		{
			return;
		}

		var parent = position == 'inside' ? target : model.getParent(target);
		model.beginUpdate();

		try
		{
			graph.moveCells(cells, 0, 0, false, parent);

			if (position != 'inside')
			{
				var index = parent.getIndex(target) + (position == 'after' ? 1 : 0);

				for (var i = 0; i < cells.length; i++)
				{
					model.add(parent, cells[i], index + i);
				}
			}
		}
		finally
		{
			model.endUpdate();
		}

		graph.setSelectionCells(cells);
	};

	EditorUi.prototype.clearElectricLayerTreeDropState = function()
	{
		if (this.electricLayersTree == null)
		{
			return;
		}

		var rows = this.electricLayersTree.querySelectorAll('.geDragOverBefore,' +
			'.geDragOverAfter,.geDragOverInside,.geDragging');

		for (var i = 0; i < rows.length; i++)
		{
			rows[i].classList.remove('geDragOverBefore', 'geDragOverAfter',
				'geDragOverInside', 'geDragging');
		}
	};

	EditorUi.prototype.getElectricLayerTreeMovableSelection = function()
	{
		var graph = this.editor.graph;
		var model = graph.getModel();
		var selection = graph.getSelectionCells();
		var result = [];

		for (var i = 0; i < selection.length; i++)
		{
			if (!model.isLayer(selection[i]) &&
				!this.isElectricLayerTreeDeviceInternal(selection[i]))
			{
				result.push(selection[i]);
			}
		}

		return model.getTopmostCells(result);
	};

	EditorUi.prototype.canGroupElectricLayerTreeSelection = function()
	{
		var graph = this.editor.graph;
		var cells = this.getElectricLayerTreeMovableSelection();

		if (cells.length < 2)
		{
			return false;
		}

		return graph.getCellsForGroup(cells).length == cells.length;
	};

	EditorUi.prototype.groupElectricLayerTreeSelection = function()
	{
		var graph = this.editor.graph;

		if (graph.isEnabled() && this.canGroupElectricLayerTreeSelection())
		{
			var group = graph.groupCells(null, 0,
				this.getElectricLayerTreeMovableSelection());

			if (group != null)
			{
				graph.setSelectionCell(group);
				this.electricLayersExpanded[group.getId()] = true;
			}
		}
	};

	EditorUi.prototype.ungroupElectricLayerTreeCell = function(cell)
	{
		var graph = this.editor.graph;
		var model = graph.getModel();

		if (!graph.isEnabled() || this.getElectricLayerTreeKind(cell, false) != 'group' ||
			Editor.isElectricDeviceCell(graph, cell))
		{
			return;
		}

		var cells = graph.ungroupCells([cell]);

		if (cells.length > 0)
		{
			graph.setSelectionCells(cells);
		}
	};

	EditorUi.prototype.duplicateElectricLayerTreeLayer = function(layer)
	{
		var graph = this.editor.graph;
		var model = graph.getModel();
		var copy = null;

		if (!graph.isEnabled() || model.getParent(layer) != model.root)
		{
			return;
		}

		model.beginUpdate();

		try
		{
			copy = graph.cloneCell(layer);
			graph.cellLabelChanged(copy, mxResources.get('copyOf', [
				this.getElectricLayerTreeLabel(layer, 0, 'layer')]));
			graph.addCell(copy, model.root, model.root.getIndex(layer) + 1);
			copy.setVisible(true);
		}
		finally
		{
			model.endUpdate();
		}

		if (copy != null)
		{
			graph.setDefaultParent(copy);
			graph.selectAll(copy);
		}
	};

	EditorUi.prototype.deleteElectricLayerTreeLayer = function(layer)
	{
		var graph = this.editor.graph;
		var model = graph.getModel();
		var root = model.root;

		if (!graph.isEnabled() || model.getParent(layer) != root ||
			model.getChildCount(root) <= 1)
		{
			return;
		}

		var count = model.getChildCount(layer);
		var label = this.getElectricLayerTreeLabel(layer, 0, 'layer');
		var message = 'Delete layer "' + label + '"' +
			(count > 0 ? ' and its ' + count + ' item' + (count == 1 ? '' : 's') : '') + '?';

		if (!mxUtils.confirm(message))
		{
			return;
		}

		var index = root.getIndex(layer);
		var next = model.getChildAt(root, index > 0 ? index - 1 : 1);
		model.beginUpdate();

		try
		{
			graph.removeCells([layer], false);
		}
		finally
		{
			model.endUpdate();
		}

		if (next != null && model.contains(next))
		{
			graph.setDefaultParent(next);
			graph.clearSelection();
		}
	};

	EditorUi.prototype.deleteElectricLayerTreeCell = function(cell, kind)
	{
		var graph = this.editor.graph;
		var model = graph.getModel();
		var childCount = model.getChildCount(cell);

		if (!graph.isEnabled() || this.isElectricLayerTreeDeviceInternal(cell))
		{
			return;
		}

		if (childCount > 0 && !mxUtils.confirm('Delete this ' +
			(kind == 'device' ? 'device' : 'group') + ' and its ' + childCount +
			' item' + (childCount == 1 ? '' : 's') + '?'))
		{
			return;
		}

		graph.removeCells([cell], false);
	};

	EditorUi.prototype.showElectricLayersContextMenu = function(evt, cell, layer, kind)
	{
		var graph = this.editor.graph;
		var model = graph.getModel();
		var isLayer = kind == 'layer';
		var internal = !isLayer && this.isElectricLayerTreeDeviceInternal(cell);
		var canEdit = graph.isEnabled() && !internal;
		var locked = graph.isCellLocked(cell);
		var selection = this.getElectricLayerTreeMovableSelection();
		var hasMoveSelection = selection.length > 0;
		var menu = new mxPopupMenu(mxUtils.bind(this, function(menu, parent)
		{
			if (isLayer)
			{
				menu.addItem(mxResources.get('setAsDefault') || 'Make active', null,
					mxUtils.bind(this, function()
					{
						graph.setDefaultParent(cell);
						graph.view.setCurrentRoot(null);
					}), parent, null, graph.isEnabled());
				menu.addItem(mxResources.get('addLayer') || 'Add layer', null,
					mxUtils.bind(this, function()
					{
						this.addElectricLayer(cell);
					}), parent, null, graph.isEnabled());
				menu.addItem(mxResources.get('rename') || 'Rename', null,
					mxUtils.bind(this, function()
					{
						this.startElectricLayerRename(cell,
							this.electricLayerLabelNodes[cell.getId()]);
					}), parent, null, graph.isEnabled());
				menu.addItem(mxResources.get('duplicate') || 'Duplicate', null,
					mxUtils.bind(this, function()
					{
						this.duplicateElectricLayerTreeLayer(cell);
					}), parent, null, graph.isEnabled());
				menu.addSeparator(parent);
				menu.addItem(mxResources.get(model.isVisible(cell) ? 'hide' : 'show'), null,
					mxUtils.bind(this, function()
					{
						graph.setCellsVisible([cell], !model.isVisible(cell));
					}), parent, null, graph.isEnabled());
				menu.addItem(mxResources.get(locked ? 'unlock' : 'lock'), null,
					mxUtils.bind(this, function()
					{
						graph.setCellStyles('locked', locked ? '0' : '1', [cell]);
					}), parent, null, graph.isEnabled());
				menu.addItem(mxResources.get('selectObjectsInLayer') || 'Select contents', null,
					function()
					{
						graph.selectAll(cell);
					}, parent, null, model.getChildCount(cell) > 0);
				menu.addItem(mxResources.get('moveSelectionTo', ['']) || 'Move selection here',
					null, mxUtils.bind(this, function()
					{
						this.moveElectricLayerTreeCells(selection, cell, 'layer', 'inside');
					}), parent, null, hasMoveSelection && !locked);
				menu.addItem(mxResources.get('group') || 'Group', null,
					mxUtils.bind(this, function()
					{
						this.groupElectricLayerTreeSelection();
					}), parent, null, this.canGroupElectricLayerTreeSelection());
				menu.addSeparator(parent);
				menu.addItem(mxResources.get('delete') || 'Delete', null,
					mxUtils.bind(this, function()
					{
						this.deleteElectricLayerTreeLayer(cell);
					}), parent, null, graph.isEnabled() && model.getChildCount(model.root) > 1);
			}
			else
			{
				var label = this.getElectricLayerTreeLabel(cell, 0, kind);
				menu.addItem(mxResources.get('rename') || 'Rename', null,
					mxUtils.bind(this, function()
					{
						this.startElectricCellRename(cell,
							this.electricLayerLabelNodes[cell.getId()], label);
					}), parent, null, canEdit);
				menu.addItem(mxResources.get('duplicate') || 'Duplicate', null,
					function()
					{
						var copies = graph.duplicateCells([cell]);
						graph.setSelectionCells(copies);
					}, parent, null, canEdit);
				menu.addSeparator(parent);
				menu.addItem(mxResources.get(model.isVisible(cell) ? 'hide' : 'show'), null,
					function()
					{
						graph.setCellsVisible([cell], !model.isVisible(cell));
					}, parent, null, graph.isEnabled());
				menu.addItem(mxResources.get(locked ? 'unlock' : 'lock'), null,
					function()
					{
						graph.setCellStyles('locked', locked ? '0' : '1', [cell]);
					}, parent, null, graph.isEnabled());

				var moveMenu = menu.addItem(mxResources.get('moveSelectionTo', ['']) ||
					'Move to layer', null, null, parent, null, canEdit);

				for (var i = model.getChildCount(model.root) - 1; i >= 0; i--)
				{
					(mxUtils.bind(this, function(targetLayer)
					{
						menu.addItem(this.getElectricLayerTreeLabel(targetLayer, 0, 'layer'),
							null, mxUtils.bind(this, function()
							{
								this.moveElectricLayerTreeCells(
									this.getElectricLayerTreeMovableSelection(), targetLayer,
									'layer', 'inside');
							}), moveMenu, null, !graph.isCellLocked(targetLayer));
					}))(model.getChildAt(model.root, i));
				}

				menu.addItem(mxResources.get('group') || 'Group', null,
					mxUtils.bind(this, function()
					{
						this.groupElectricLayerTreeSelection();
					}), parent, null, this.canGroupElectricLayerTreeSelection());
				menu.addItem(mxResources.get('ungroup') || 'Ungroup', null,
					mxUtils.bind(this, function()
					{
						this.ungroupElectricLayerTreeCell(cell);
					}), parent, null, canEdit && kind == 'group');
				menu.addSeparator(parent);
				menu.addItem(mxResources.get('delete') || 'Delete', null,
					mxUtils.bind(this, function()
					{
						this.deleteElectricLayerTreeCell(cell, kind);
					}), parent, null, canEdit);
			}
		}));

		menu.smartSeparators = true;
		menu.showDisabled = true;
		menu.autoExpand = true;
		menu.hideMenu = mxUtils.bind(this, function()
		{
			mxPopupMenu.prototype.hideMenu.apply(menu, arguments);
			menu.destroy();
		});
		menu.popup(mxEvent.getClientX(evt), mxEvent.getClientY(evt), null, evt);
		this.setCurrentMenu(menu);
		mxEvent.consume(evt);
	};

	EditorUi.prototype.addElectricLayerTreeRow = function(cell, layer, depth,
		index, isLayer, parentVisible)
	{
		var graph = this.editor.graph;
		var model = graph.getModel();
		var childCount = model.getChildCount(cell);
		var kind = this.getElectricLayerTreeKind(cell, isLayer);
		var deviceInternal = !isLayer && this.isElectricLayerTreeDeviceInternal(cell);
		var id = cell.getId();
		var expanded = this.electricLayersExpanded[id];

		if (expanded == null)
		{
			expanded = isLayer;
			this.electricLayersExpanded[id] = expanded;
		}

		var visible = model.isVisible(cell);
		var effectiveVisible = parentVisible && visible;
		var row = document.createElement('div');
		row.className = 'geElectricLayerRow';
		row.style.paddingLeft = (4 + depth * 16) + 'px';
		row.setAttribute('role', 'treeitem');
		row.setAttribute('aria-level', String(depth + 1));
		row.setAttribute('data-cell-id', id);
		row.setAttribute('data-layer-id', layer.getId());
		row.setAttribute('data-electric-kind', kind);

		if (childCount > 0 && kind != 'device')
		{
			row.setAttribute('aria-expanded', expanded ? 'true' : 'false');
		}

		if (!effectiveVisible)
		{
			row.classList.add('geHidden');
		}

		if (isLayer && this.electricActiveLayer == cell)
		{
			row.classList.add('geActiveLayer');
		}
		else if (!isLayer && graph.isCellSelected(cell))
		{
			row.classList.add('geSelectedElement');
		}

		var toggle = document.createElement('button');
		toggle.setAttribute('type', 'button');
		toggle.setAttribute('aria-label', mxResources.get(
			expanded ? 'collapse' : 'expand') || (expanded ? 'Collapse' : 'Expand'));
		toggle.className = 'geElectricTreeToggle' + (kind == 'device' ? ' geDevice' :
			(childCount == 0 ? ' geEmpty' : (expanded ? ' geExpanded' : '')));
		row.appendChild(toggle);

		if (childCount > 0 && kind != 'device')
		{
			mxEvent.addListener(toggle, 'click', mxUtils.bind(this, function(evt)
			{
				this.toggleElectricLayerTreeExpansion(cell, kind);
				mxEvent.consume(evt);
			}));
		}

		var visibility = document.createElement('button');
		visibility.setAttribute('type', 'button');
		visibility.setAttribute('title', mxResources.get(visible ? 'hide' : 'show'));
		visibility.setAttribute('aria-label', mxResources.get(visible ? 'hide' : 'show'));
		visibility.setAttribute('aria-pressed', visible ? 'true' : 'false');
		visibility.className = 'geElectricLayerVisibility geAdaptiveAsset';
		visibility.style.backgroundImage = 'url("' +
			(visible ? Editor.visibleImage : Editor.hiddenImage) + '")';
		row.appendChild(visibility);
		mxEvent.addListener(visibility, 'click', function(evt)
		{
			if (graph.isEnabled())
			{
				graph.setCellsVisible([cell], !visible);
			}

			mxEvent.consume(evt);
		});

		var main = document.createElement('div');
		main.className = 'geElectricLayerMain';
		var marker = document.createElement('span');
		marker.className = isLayer ? 'geElectricLayerMarker' :
			('geElectricElementMarker' + (kind == 'edge' ? ' geEdgeMarker' : '') +
				(kind == 'device' ? ' geDeviceMarker' : ''));

		if (isLayer)
		{
			var layerIndex = model.root.getIndex(layer);
			marker.style.backgroundColor = Editor.electricLayerColors[
				layerIndex % Editor.electricLayerColors.length];
		}

		main.appendChild(marker);
		var label = document.createElement('div');
		label.className = 'geElectricLayerLabel';
		mxUtils.write(label, this.getElectricLayerTreeLabel(cell, index, kind));
		main.appendChild(label);
		row.appendChild(main);

		var active = document.createElement('span');
		active.className = 'geElectricActiveLayerMark';
		active.setAttribute('title', mxResources.get('currentLayer') || 'Current Layer');
		row.appendChild(active);

		mxEvent.addListener(row, 'click', mxUtils.bind(this, function(evt)
		{
			if (mxEvent.getSource(evt) != visibility &&
				mxEvent.getSource(evt) != toggle && label.contentEditable != 'true')
			{
				if (isLayer)
				{
					graph.setDefaultParent(cell);
					graph.view.setCurrentRoot(null);
				}
			else
			{
				this.selectElectricLayerTreeElement(cell, evt);
			}

				mxEvent.consume(evt);
			}
		}));

		if (isLayer)
		{
			mxEvent.addListener(label, 'dblclick', mxUtils.bind(this, function(evt)
			{
				this.startElectricLayerRename(cell, label);
				mxEvent.consume(evt);
			}));
		}
		else if (kind == 'device' || kind == 'group')
		{
			mxEvent.addListener(row, 'dblclick', mxUtils.bind(this, function(evt)
			{
				if (label.contentEditable != 'true')
				{
					this.toggleElectricLayerTreeExpansion(cell, kind);
				}

				mxEvent.consume(evt);
			}));
		}

		mxEvent.addListener(row, 'contextmenu', mxUtils.bind(this, function(evt)
		{
			if (!isLayer && !graph.isCellSelected(cell))
			{
				graph.setSelectionCell(cell);
				this.electricLayerSelectionAnchor = cell;
			}
			else if (isLayer)
			{
				graph.setDefaultParent(cell);
			}

			this.showElectricLayersContextMenu(evt, cell, layer, kind);
		}));

		if (!deviceInternal)
		{
			if (!isLayer)
			{
				row.setAttribute('draggable', 'true');
				row.addEventListener('dragstart', mxUtils.bind(this, function(evt)
				{
					var cells = this.getElectricLayerTreeMoveCells(cell);

					if (cells.length == 0)
					{
						evt.preventDefault();
						return;
					}

					this.electricLayerDragCells = cells;
					this.clearElectricLayerTreeDropState();
					row.classList.add('geDragging');

					try
					{
						evt.dataTransfer.effectAllowed = 'move';
						evt.dataTransfer.setData('text/plain', id);
					}
					catch (e)
					{
						// Drag data is optional for the in-panel operation.
					}
				}));
			}
			row.addEventListener('dragover', mxUtils.bind(this, function(evt)
			{
				var position = this.getElectricLayerTreeDropPosition(cell, kind, evt);

				if (this.canMoveElectricLayerTreeCells(this.electricLayerDragCells,
					cell, kind, position))
				{
					evt.preventDefault();
					this.clearElectricLayerTreeDropState();
					row.classList.add(position == 'inside' ? 'geDragOverInside' :
						(position == 'before' ? 'geDragOverBefore' : 'geDragOverAfter'));
				}
			}));
			row.addEventListener('drop', mxUtils.bind(this, function(evt)
			{
				var position = this.getElectricLayerTreeDropPosition(cell, kind, evt);
				evt.preventDefault();
				this.moveElectricLayerTreeCells(this.electricLayerDragCells, cell,
					kind, position);
				this.electricLayerDragCells = null;
				this.clearElectricLayerTreeDropState();
			}));
			row.addEventListener('dragend', mxUtils.bind(this, function()
			{
				this.electricLayerDragCells = null;
				this.clearElectricLayerTreeDropState();
			}));
		}

		this.electricLayersTree.appendChild(row);
		this.electricLayerLabelNodes[id] = label;

		if (!isLayer)
		{
			this.electricLayerVisibleCells.push(cell);
		}

		if (expanded)
		{
			for (var i = 0; i < childCount; i++)
			{
				this.addElectricLayerTreeRow(model.getChildAt(cell, i), layer,
					depth + 1, i, false, effectiveVisible);
			}
		}
	};

	EditorUi.prototype.updateElectricLayersPanel = function()
	{
		if (this.electricLayersTree == null || this.editor == null)
		{
			return;
		}

		var graph = this.editor.graph;
		var model = graph.getModel();
		this.electricLayersTree.innerText = '';
		this.electricLayersExpanded = this.electricLayersExpanded || {};
		this.electricLayerLabelNodes = {};
		this.electricLayerVisibleCells = [];
		this.electricActiveLayer = this.getElectricActiveLayer();
		var count = model.getChildCount(model.root);

		for (var i = count - 1; i >= 0; i--)
		{
			var layer = model.getChildAt(model.root, i);
			this.addElectricLayerTreeRow(layer, layer, 0, i, true, true);
		}

		if (count == 0)
		{
			var empty = document.createElement('div');
			empty.className = 'geElectricLayersEmpty';
			mxUtils.write(empty, mxResources.get('noResults') || 'No layers');
			this.electricLayersTree.appendChild(empty);
		}

		if (this.electricLayerToRename != null)
		{
			var layerToRename = this.electricLayerToRename;
			this.electricLayerToRename = null;
			this.startElectricLayerRename(layerToRename,
				this.electricLayerLabelNodes[layerToRename.getId()]);
		}
	};

	EditorUi.prototype.scheduleElectricLayersPanelRefresh = function()
	{
		if (this.electricLayersPanel == null ||
			this.electricLeftPanelView != 'layers' ||
			this.electricLayersRefreshFrame != null)
		{
			return;
		}

		this.electricLayersRefreshFrame = window.requestAnimationFrame(
			mxUtils.bind(this, function()
			{
				this.electricLayersRefreshFrame = null;
				this.updateElectricLayersPanel();
			}));
	};

	EditorUi.prototype.installElectricModePanel = function()
	{
		if (this.editor.chromeless || this.container == null || this.sidebarContainer == null)
		{
			return;
		}

		Editor.ensureElectricModeStyles();
		this.installElectricModeListeners();
		this.installElectricFullscreenViewportGuard();
		this.installElectricLayersActionGuard();
		this.installElectricToolbarViewButton();
		this.installElectricConnectorToolbar();
		this.syncElectricConnectorProjectStyle();
		window.setTimeout(mxUtils.bind(this, function()
		{
			if (Editor.isElectricTheme())
			{
				this.installElectricToolbarViewButton();
				this.installElectricConnectorToolbar();
			}
		}), 0);

		if (this.electricLeftPanelCollapsed == null)
		{
			this.electricLeftPanelCollapsed = false;
		}

		if (this.electricLeftPanelView == null)
		{
			this.electricLeftPanelView = Editor.defaultElectricPanelView;
		}

		this.container.classList.add('geElectricModes');

		if (this.electricModePanel == null)
		{
			this.electricModePanel = this.createElectricModePanel();
			this.container.insertBefore(this.electricModePanel, this.sidebarContainer);
		}

		if (this.electricLayersPanel == null)
		{
			this.electricLayersPanel = this.createElectricLayersPanel();
			this.container.insertBefore(this.electricLayersPanel,
				this.sidebarContainer);
		}

		if (this.electricLeftPanelView == 'layers')
		{
			this.container.classList.add('geElectricPanelLayers');
		}
		else
		{
			this.container.classList.remove('geElectricPanelLayers');
		}

		if (this.hsplit != null)
		{
			this.hsplit.getSplitPosition = mxUtils.bind(this, function()
			{
				return this.hsplitPosition || 0;
			});
		}

		this.updateElectricModePanel();
		this.updateElectricPanelViewButtons();
		this.scheduleElectricLayersPanelRefresh();
		this.updateElectricLeftPanelState();
		this.updateElectricLeftOverlayGeometry(false);
	};

	EditorUi.prototype.removeElectricModePanel = function()
	{
		if (this.container != null)
		{
			this.container.classList.remove('geElectricModes');
			this.container.classList.remove('geElectricShapesCollapsed');
			this.container.classList.remove('geElectricFullscreen');
			this.container.classList.remove('geElectricPanelLayers');
		}

		if (this.electricRulerFrame != null)
		{
			window.cancelAnimationFrame(this.electricRulerFrame);
			this.electricRulerFrame = null;
		}

		if (this.electricLayersRefreshFrame != null)
		{
			window.cancelAnimationFrame(this.electricLayersRefreshFrame);
			this.electricLayersRefreshFrame = null;
		}

		if (this.hsplit != null)
		{
			delete this.hsplit.getSplitPosition;
			this.hsplit.style.left = '';
		}

		this.restoreElectricToolbarViewButton();
		this.restoreElectricConnectorToolbarControls();
		this.removeElectricConnectorToolbar();
		this.removeElectricFullscreenViewportGuard();
		this.removeElectricLayersActionGuard();
		this.electricLeftPanelCollapsed = null;
		this.electricLeftPanelView = null;
		this.electricFullscreenState = null;
		this.electricLayersExpanded = null;
		this.electricLayerLabelNodes = null;
		this.electricLayerToRename = null;

		if (this.electricModePanel != null)
		{
			if (this.electricModePanel.parentNode != null)
			{
				this.electricModePanel.parentNode.removeChild(this.electricModePanel);
			}

			this.electricModePanel = null;
		}

		if (this.electricLayersPanel != null)
		{
			if (this.electricLayersPanel.parentNode != null)
			{
				this.electricLayersPanel.parentNode.removeChild(
					this.electricLayersPanel);
			}

			this.electricLayersPanel = null;
			this.electricLayersTree = null;
		}
	};

	EditorUi.prototype.getElectricCanvasViewportState = function()
	{
		if (this.diagramContainer == null)
		{
			return null;
		}

		var page = this.diagramContainer.querySelector('.geBackgroundPage');
		var containerBounds = this.diagramContainer.getBoundingClientRect();
		var pageBounds = (page != null) ? page.getBoundingClientRect() : null;

		return {
			scrollLeft: this.diagramContainer.scrollLeft,
			scrollTop: this.diagramContainer.scrollTop,
			pageLeft: (pageBounds != null) ?
				pageBounds.left - containerBounds.left : null,
			pageTop: (pageBounds != null) ?
				pageBounds.top - containerBounds.top : null
		};
	};

	EditorUi.prototype.restoreElectricCanvasViewport = function()
	{
		var state = this.electricCanvasViewportState;

		if (state == null || this.diagramContainer == null)
		{
			return;
		}

		var page = this.diagramContainer.querySelector('.geBackgroundPage');

		if (page != null && state.pageLeft != null && state.pageTop != null)
		{
			var containerBounds = this.diagramContainer.getBoundingClientRect();
			var pageBounds = page.getBoundingClientRect();
			this.diagramContainer.scrollLeft += Math.round(
				pageBounds.left - containerBounds.left - state.pageLeft);
			this.diagramContainer.scrollTop += Math.round(
				pageBounds.top - containerBounds.top - state.pageTop);
		}
		else
		{
			this.diagramContainer.scrollLeft = state.scrollLeft;
			this.diagramContainer.scrollTop = state.scrollTop;
		}
	};

	EditorUi.prototype.scheduleElectricCanvasViewportRestore = function()
	{
		this.clearElectricCanvasViewportRestore();

		var restore = mxUtils.bind(this, function()
		{
			this.restoreElectricCanvasViewport();
		});

		this.electricCanvasViewportFrame = window.requestAnimationFrame(
			mxUtils.bind(this, function()
			{
				this.electricCanvasViewportFrame = null;
				restore();
			}));

		this.electricCanvasViewportTimers = [];
		var delays = [80, 180, 350];

		for (var i = 0; i < delays.length; i++)
		{
			this.electricCanvasViewportTimers.push(window.setTimeout(
				restore, delays[i]));
		}
	};

	EditorUi.prototype.clearElectricCanvasViewportRestore = function()
	{
		if (this.electricCanvasViewportFrame != null)
		{
			window.cancelAnimationFrame(this.electricCanvasViewportFrame);
			this.electricCanvasViewportFrame = null;
		}

		if (this.electricCanvasViewportTimers != null)
		{
			for (var i = 0; i < this.electricCanvasViewportTimers.length; i++)
			{
				window.clearTimeout(this.electricCanvasViewportTimers[i]);
			}
		}

		this.electricCanvasViewportTimers = null;
	};

	EditorUi.prototype.installElectricFullscreenViewportGuard = function()
	{
		var action = (this.actions != null) ? this.actions.get('fullscreen') : null;

		if (action == null || this.electricFullscreenAction != null)
		{
			return;
		}

		this.electricFullscreenAction = action;
		this.electricFullscreenActionFunct = action.funct;
		action.funct = mxUtils.bind(this, function()
		{
			this.electricCanvasViewportState =
				this.getElectricCanvasViewportState();
			return this.electricFullscreenActionFunct.apply(action, arguments);
		});
	};

	EditorUi.prototype.removeElectricFullscreenViewportGuard = function()
	{
		this.clearElectricCanvasViewportRestore();

		if (this.electricFullscreenAction != null &&
			this.electricFullscreenActionFunct != null)
		{
			this.electricFullscreenAction.funct =
				this.electricFullscreenActionFunct;
		}

		this.electricFullscreenAction = null;
		this.electricFullscreenActionFunct = null;
		this.electricCanvasViewportState = null;
	};

	EditorUi.prototype.hideElectricNativeLayersWindow = function()
	{
		var actions = this.actions;

		if (actions != null && actions.layersWindow != null &&
			actions.layersWindow.window != null &&
			actions.layersWindow.window.isVisible())
		{
			actions.layersWindow.window.setVisible(false);
		}
	};

	EditorUi.prototype.installElectricLayersActionGuard = function()
	{
		var action = (this.actions != null) ? this.actions.get('layers') : null;

		if (action == null || this.electricLayersAction != null)
		{
			return;
		}

		this.electricLayersAction = action;
		this.electricLayersActionFunct = action.funct;
		this.electricLayersActionSelectedCallback = action.selectedCallback;
		action.funct = mxUtils.bind(this, function()
		{
			this.hideElectricNativeLayersWindow();

			if (this.electricLeftPanelView == 'layers' &&
				this.electricLeftPanelCollapsed !== true)
			{
				this.electricLeftPanelCollapsed = true;
				this.updateElectricLeftPanelState();
				this.updateElectricLeftOverlayGeometry(false);
			}
			else
			{
				this.setElectricLeftPanelView('layers');
			}

			this.fireEvent(new mxEventObject('layers'));
		});
		action.setSelectedCallback(mxUtils.bind(this, function()
		{
			return Editor.isElectricTheme() &&
				this.electricLeftPanelView == 'layers' &&
				this.electricLeftPanelCollapsed !== true;
		}));
		this.hideElectricNativeLayersWindow();
	};

	EditorUi.prototype.removeElectricLayersActionGuard = function()
	{
		if (this.electricLayersAction != null &&
			this.electricLayersActionFunct != null)
		{
			this.electricLayersAction.funct = this.electricLayersActionFunct;
			this.electricLayersAction.selectedCallback =
				this.electricLayersActionSelectedCallback;
		}

		this.electricLayersAction = null;
		this.electricLayersActionFunct = null;
		this.electricLayersActionSelectedCallback = null;
	};

	EditorUi.prototype.updateElectricModePanel = function()
	{
		if (this.electricModePanel == null)
		{
			return;
		}

		var modeId = this.getElectricModeIdForPage(this.currentPage);
		var buttons = this.electricModePanel.querySelectorAll('button[data-electric-mode]');

		for (var i = 0; i < buttons.length; i++)
		{
			var active = buttons[i].getAttribute('data-electric-mode') == modeId;

			if (active)
			{
				buttons[i].classList.add('geActive');
				buttons[i].setAttribute('aria-pressed', 'true');
			}
			else
			{
				buttons[i].classList.remove('geActive');
				buttons[i].setAttribute('aria-pressed', 'false');
			}
		}

		this.updateElectricPanelViewButtons();
		this.scheduleElectricLayersPanelRefresh();
	};

	EditorUi.prototype.installElectricModeListeners = function()
	{
		if (this.electricModeListenersInstalled || this.editor == null)
		{
			return;
		}

		this.electricModeRefreshHandler = mxUtils.bind(this, function()
		{
			this.updateElectricModePanel();
			this.updateElectricLeftPanelState();
			this.updateElectricLeftOverlayGeometry(false);
			this.scheduleElectricLayersPanelRefresh();
		});

		this.electricLayersModelHandler = mxUtils.bind(this, function()
		{
			this.scheduleElectricLayersPanelRefresh();
		});

		this.electricConnectorStyleHandler = mxUtils.bind(this, function(sender, evt)
		{
			if (!Editor.isElectricTheme() || this.electricConnectorStyleApplying)
			{
				return;
			}

			var cells = evt.getProperty('cells') || [];
			var graph = this.editor.graph;

				for (var i = 0; i < cells.length; i++)
				{
					if (graph.getModel().isEdge(cells[i]))
					{
						this.setElectricConnectorCurrentStyle(
							this.getElectricConnectorStyleFromCell(cells[i]), true, true);
						return;
					}
				}

			if (evt.getProperty('force') === true)
			{
				var keys = evt.getProperty('keys') || [];

				for (var j = 0; j < keys.length; j++)
				{
					if (Editor.electricConnectorStyleKeys.indexOf(keys[j]) >= 0)
					{
						this.setElectricConnectorCurrentStyle(
							this.getElectricConnectorCurrentStyle(), true, true);
						return;
					}
				}
			}
		});

		this.electricConnectorFileHandler = mxUtils.bind(this, function()
		{
			this.electricConnectorStyleFileNode = null;
			this.syncElectricConnectorProjectStyle();
		});

		this.electricShapesPanelHandler = mxUtils.bind(this, function()
		{
			if (this.electricLeftPanelCollapsed == null)
			{
				this.electricLeftPanelCollapsed = !this.isShapesPanelVisible();
			}

			this.updateElectricModePanel();
			this.updateElectricLeftPanelState();
			this.updateElectricLeftOverlayGeometry(false);
		});

		this.electricSidebarWidthHandler = mxUtils.bind(this, function()
		{
			this.updateElectricLeftOverlayGeometry(false);
		});

		this.electricFullscreenHandler = mxUtils.bind(this, function()
		{
			if (!Editor.isElectricTheme() || this.container == null)
			{
				return;
			}

			if (document.fullscreenElement != null)
			{
				if (this.electricFullscreenState == null)
				{
					this.electricFullscreenState = {
						collapsed: this.electricLeftPanelCollapsed === true
					};
				}

				this.container.classList.add('geElectricFullscreen');
			}
			else
			{
				this.container.classList.remove('geElectricFullscreen');

				if (this.electricFullscreenState != null)
				{
					this.electricLeftPanelCollapsed =
						this.electricFullscreenState.collapsed;
					this.electricFullscreenState = null;
				}
			}

			this.updateElectricLeftPanelState();
			this.updateElectricLeftOverlayGeometry(true);
			this.scheduleElectricCanvasViewportRestore();
		});

		this.editor.addListener('fileLoaded', this.electricModeRefreshHandler);
		this.editor.addListener('fileLoaded', this.electricConnectorFileHandler);
		this.editor.addListener('pageSelected', this.electricModeRefreshHandler);
		this.editor.addListener('pageRenamed', this.electricModeRefreshHandler);
		this.editor.addListener('pageMoved', this.electricModeRefreshHandler);
		this.editor.addListener('pagesPatched', this.electricModeRefreshHandler);
		this.editor.addListener('electricModeChanged', this.electricModeRefreshHandler);
		this.addListener('currentThemeChanged', this.electricModeRefreshHandler);
		this.addListener('styleChanged', this.electricConnectorStyleHandler);
		this.addListener('shapesPanelChanged', this.electricShapesPanelHandler);
		this.addListener('sidebarWidthChanged', this.electricSidebarWidthHandler);
		this.editor.graph.getModel().addListener(mxEvent.CHANGE,
			this.electricLayersModelHandler);
		this.editor.graph.getSelectionModel().addListener(mxEvent.CHANGE,
			this.electricLayersModelHandler);
		this.editor.graph.addListener('defaultParentChanged',
			this.electricLayersModelHandler);
		document.addEventListener('fullscreenchange', this.electricFullscreenHandler);
		this.electricModeListenersInstalled = true;
	};

	EditorUi.prototype.removeElectricModeListeners = function()
	{
		if (this.electricModeListenersInstalled && this.editor != null)
		{
			this.editor.removeListener(this.electricModeRefreshHandler);
			this.editor.removeListener(this.electricConnectorFileHandler);
			this.removeListener(this.electricShapesPanelHandler);
			this.removeListener(this.electricSidebarWidthHandler);
			this.removeListener(this.electricModeRefreshHandler);
			this.removeListener(this.electricConnectorStyleHandler);
			this.editor.graph.getModel().removeListener(
				this.electricLayersModelHandler);
			this.editor.graph.getSelectionModel().removeListener(
				this.electricLayersModelHandler);
			this.editor.graph.removeListener(this.electricLayersModelHandler);
		}

		if (this.electricFullscreenHandler != null)
		{
			document.removeEventListener('fullscreenchange', this.electricFullscreenHandler);
		}

		this.electricModeListenersInstalled = false;
		this.electricModeRefreshHandler = null;
		this.electricShapesPanelHandler = null;
		this.electricSidebarWidthHandler = null;
		this.electricLayersModelHandler = null;
		this.electricConnectorStyleHandler = null;
		this.electricConnectorFileHandler = null;
		this.electricFullscreenHandler = null;
	};

	if (typeof StyleFormatPanel != 'undefined' &&
		StyleFormatPanel.prototype.addStyleOps != null)
	{
		var addElectricConnectorStyleOps = StyleFormatPanel.prototype.addStyleOps;

		StyleFormatPanel.prototype.addStyleOps = function(div)
		{
			var result = addElectricConnectorStyleOps.apply(this, arguments);

			if (Editor.isElectricTheme() && this.editorUi != null &&
				this.editorUi.addElectricConnectorStyleOps != null)
			{
				this.editorUi.addElectricConnectorStyleOps(div);
			}

			return result;
		};
	}

	if (typeof DiagramFormatPanel != 'undefined' &&
		DiagramFormatPanel.prototype.addStyleOps != null)
	{
		var addElectricConnectorDefaultStyleOps =
			DiagramFormatPanel.prototype.addStyleOps;

		DiagramFormatPanel.prototype.addStyleOps = function(div)
		{
			var result = addElectricConnectorDefaultStyleOps.apply(this, arguments);

			if (Editor.isElectricTheme() && this.editorUi != null &&
				this.editorUi.addElectricConnectorStyleOps != null)
			{
				this.editorUi.addElectricConnectorStyleOps(div, true);
			}

			return result;
		};
	}
})();

(function()
{
	if (typeof Graph == 'undefined')
	{
		return;
	}

	var getEventState = Graph.prototype.getEventState;
	var isCellConnectable = Graph.prototype.isCellConnectable;
	var isCellSelectable = Graph.prototype.isCellSelectable;
	var selectCellForEvent = Graph.prototype.selectCellForEvent;
	var dblClick = Graph.prototype.dblClick;

	Graph.prototype.getEventState = function(state)
	{
		state = getEventState.apply(this, arguments);

		if (Editor.isElectricTheme() && state != null)
		{
			var cell = Editor.resolveElectricDeviceCellForInteraction(
				this, state.cell);

			if (cell != null && cell != state.cell)
			{
				state = this.view.getState(cell) || state;
			}
		}

		return state;
	};

	Graph.prototype.isCellConnectable = function(cell)
	{
		if (Editor.isElectricTheme() && cell != null)
		{
			var style = this.getCellStyle(cell);
			var shapeId = mxUtils.getValue(style, "electricShapeId", null);

			if (Editor.isElectricConnectableDeviceShapeId(shapeId) &&
				mxUtils.getValue(style, 'connectable', '1') != '0')
			{
				return true;
			}
		}

		return isCellConnectable.apply(this, arguments);
	};

	Graph.prototype.isCellSelectable = function(cell)
	{
		if (Editor.isElectricTheme() && cell != null &&
			!Editor.isElectricDeviceCellAccessible(this, cell))
		{
			return false;
		}

		return isCellSelectable.apply(this, arguments);
	};

	Graph.prototype.selectCellForEvent = function(cell, evt)
	{
		if (Editor.isElectricTheme())
		{
			cell = Editor.resolveElectricDeviceCellForInteraction(this, cell);
			Editor.clearElectricDeviceEditingIfOutside(this, cell);
		}

		return selectCellForEvent.apply(this, [cell, evt]);
	};

	Graph.prototype.dblClick = function(evt, cell)
	{
		if (Editor.isElectricTheme() && cell != null)
		{
			var device = Editor.getElectricDeviceRootForCell(this, cell);

			if (device != null && (cell == device ||
				!Editor.isElectricDeviceCellAccessible(this, cell)))
			{
				Editor.openElectricDeviceForEditing(this, device);

				if (this.setSelectionCell != null)
				{
					this.setSelectionCell(device);
				}

				mxEvent.consume(evt);
				return;
			}
		}

		return dblClick.apply(this, arguments);
	};
})();

(function()
{
	var mouseMove = mxGraphHandler.prototype.mouseMove;
	var updatePreview = mxGraphHandler.prototype.updatePreview;

	mxGraphHandler.prototype.mouseMove = function(sender, me)
	{
		this.electricDeviceSnapMouseEvent = me;

		try
		{
			return mouseMove.apply(this, arguments);
		}
		finally
		{
			this.electricDeviceSnapMouseEvent = null;
		}
	};

	mxGraphHandler.prototype.updatePreview = function(remote)
	{
		if (!remote && this.electricDeviceSnapMouseEvent != null)
		{
			Editor.applyElectricDeviceSideSnap(this,
				this.electricDeviceSnapMouseEvent);
		}

		return updatePreview.apply(this, arguments);
	};
})();
