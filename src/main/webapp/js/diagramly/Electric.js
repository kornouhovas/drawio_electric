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
			'.geEditor.geElectricModes>.geSidebarContainer:not(.geFormatContainer){grid-column:2;grid-row:3;position:absolute!important;left:0;top:0;bottom:0;z-index:6;min-width:0!important;box-shadow:3px 0 8px rgba(0,0,0,.12);transform:translateX(0);transition:transform ' + transition + ' ease-in-out;will-change:transform;}' +
			'.geEditor.geElectricModes>.geHsplit{grid-column:2;grid-row:3;position:absolute;left:var(--ge-electric-sidebar-width);top:0;bottom:0;z-index:7;transition:opacity ' + transition + ' ease-in-out;}' +
			'.geEditor.geElectricModes>.geDiagramContainer{grid-column:2;grid-row:3;min-width:0;}' +
			'.geEditor.geElectricModes>.geSidebarContainer.geFormatContainer{grid-column:3;grid-row:3;}' +
			'.geEditor.geElectricModes.geElectricShapesCollapsed>.geSidebarContainer:not(.geFormatContainer){transform:translateX(calc(-100% - 1px));pointer-events:none;}' +
			'.geEditor.geElectricModes.geElectricShapesCollapsed>.geHsplit{opacity:0!important;pointer-events:none;}' +
			'.geEditor.geElectricModes.geElectricFullscreen>.geElectricModePanel{opacity:0;transform:translateX(-100%);pointer-events:none;}' +
			'.geEditor.geElectricModes.geElectricFullscreen>.geSidebarContainer:not(.geFormatContainer){transform:translateX(calc(-100% - 1px));pointer-events:none;}' +
			'.geEditor.geElectricModes.geElectricFullscreen>.geHsplit{opacity:0!important;pointer-events:none;}' +
			'.geEditor.geElectricModes .geToolbarContainer>.geToolbar>a.geElectricToolbarViewButton,.geEditor.geElectricModes .geToolbarContainer>.geToolbar>a[data-electric-toolbar-toggle="1"],.geEditor.geElectricModes .geToolbarContainer>.geToolbar>a[title^="Скрыть левую панель"],.geEditor.geElectricModes .geToolbarContainer>.geToolbar>a[title^="Показать левую панель"]{box-sizing:border-box!important;display:flex!important;width:34px!important;min-width:34px!important;height:30px!important;margin:4px 3px 4px -13px!important;padding:3px!important;align-items:center!important;justify-content:center!important;}' +
			'.geEditor.geElectricModes .geToolbarContainer>.geToolbar>a[data-electric-toolbar-toggle="1"]+.geSeparator,.geEditor.geElectricModes .geToolbarContainer>.geToolbar>a[title^="Скрыть левую панель"]+.geSeparator,.geEditor.geElectricModes .geToolbarContainer>.geToolbar>a[title^="Показать левую панель"]+.geSeparator{margin-left:0!important;}' +
			'.geElectricModeButton{box-sizing:border-box;width:34px;min-height:30px;border:1px solid transparent;border-radius:5px;background:transparent;color:light-dark(var(--text-color),var(--dark-text-color));display:flex;align-items:center;justify-content:center;padding:3px;cursor:pointer;overflow:hidden;}' +
			'.geElectricModeButton:hover{background:light-dark(var(--highlight-color),var(--dark-highlight-color));}' +
			'.geElectricModeButton.geActive{background:light-dark(var(--accent-color),var(--dark-accent-color));border-color:light-dark(var(--primary-hover-color),var(--dark-active-accent-color));color:light-dark(var(--accent-text-color),var(--dark-accent-text-color));}' +
			'.geElectricModeIcon{width:16px;height:16px;flex:0 0 16px;background-repeat:no-repeat;background-position:center;background-size:16px 16px;opacity:.9;}' +
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

	EditorUi.prototype.createElectricModePanel = function()
	{
		var panel = document.createElement('div');
		panel.className = 'geElectricModePanel';
		panel.setAttribute('role', 'navigation');
		panel.setAttribute('aria-label', mxResources.get('electricModes') ||
			'Electric modes');

		for (var i = 0; i < Editor.electricModes.length; i++)
		{
			panel.appendChild(this.createElectricModeButton(Editor.electricModes[i]));
		}

		return panel;
	};

	EditorUi.prototype.installElectricModePanel = function()
	{
		if (this.editor.chromeless || this.container == null || this.sidebarContainer == null)
		{
			return;
		}

		Editor.ensureElectricModeStyles();
		this.installElectricModeListeners();
		this.installElectricToolbarViewButton();
		window.setTimeout(mxUtils.bind(this, function()
		{
			if (Editor.isElectricTheme())
			{
				this.installElectricToolbarViewButton();
			}
		}), 0);

		if (this.electricLeftPanelCollapsed == null)
		{
			this.electricLeftPanelCollapsed = false;
		}

		this.container.classList.add('geElectricModes');

		if (this.electricModePanel == null)
		{
			this.electricModePanel = this.createElectricModePanel();
			this.container.insertBefore(this.electricModePanel, this.sidebarContainer);
		}

		if (this.hsplit != null)
		{
			this.hsplit.getSplitPosition = mxUtils.bind(this, function()
			{
				return this.hsplitPosition || 0;
			});
		}

		this.updateElectricModePanel();
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
		}

		if (this.electricRulerFrame != null)
		{
			window.cancelAnimationFrame(this.electricRulerFrame);
			this.electricRulerFrame = null;
		}

		if (this.hsplit != null)
		{
			delete this.hsplit.getSplitPosition;
			this.hsplit.style.left = '';
		}

		this.restoreElectricToolbarViewButton();
		this.electricLeftPanelCollapsed = null;
		this.electricFullscreenState = null;

		if (this.electricModePanel != null)
		{
			if (this.electricModePanel.parentNode != null)
			{
				this.electricModePanel.parentNode.removeChild(this.electricModePanel);
			}

			this.electricModePanel = null;
		}
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
		});

		this.editor.addListener('fileLoaded', this.electricModeRefreshHandler);
		this.editor.addListener('pageSelected', this.electricModeRefreshHandler);
		this.editor.addListener('pageRenamed', this.electricModeRefreshHandler);
		this.editor.addListener('pageMoved', this.electricModeRefreshHandler);
		this.editor.addListener('pagesPatched', this.electricModeRefreshHandler);
		this.editor.addListener('electricModeChanged', this.electricModeRefreshHandler);
		this.addListener('currentThemeChanged', this.electricModeRefreshHandler);
		this.addListener('shapesPanelChanged', this.electricShapesPanelHandler);
		this.addListener('sidebarWidthChanged', this.electricSidebarWidthHandler);
		document.addEventListener('fullscreenchange', this.electricFullscreenHandler);
		this.electricModeListenersInstalled = true;
	};

	EditorUi.prototype.removeElectricModeListeners = function()
	{
		if (this.electricModeListenersInstalled && this.editor != null)
		{
			this.editor.removeListener(this.electricModeRefreshHandler);
			this.removeListener(this.electricShapesPanelHandler);
			this.removeListener(this.electricSidebarWidthHandler);
			this.removeListener(this.electricModeRefreshHandler);
		}

		if (this.electricFullscreenHandler != null)
		{
			document.removeEventListener('fullscreenchange', this.electricFullscreenHandler);
		}

		this.electricModeListenersInstalled = false;
		this.electricModeRefreshHandler = null;
		this.electricShapesPanelHandler = null;
		this.electricSidebarWidthHandler = null;
		this.electricFullscreenHandler = null;
	};
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
