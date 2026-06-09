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

Editor.electricModeAttribute = 'electricMode';

Editor.createElectricModeIcon = function(svg)
{
	return 'data:image/svg+xml,' + encodeURIComponent(svg);
};

Editor.electricModes = [
	{
		id: 'projectSchematics',
		label: 'Схемы',
		title: 'Проектные схемы',
		pageName: 'Проектные схемы',
		icon: Editor.createElectricModeIcon('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="5" height="4" rx="1"/><rect x="15.5" y="4" width="5" height="4" rx="1"/><rect x="9.5" y="16" width="5" height="4" rx="1"/><path d="M8.5 6h7"/><path d="M6 8v3.5c0 .8.7 1.5 1.5 1.5H12v3"/><path d="M18 8v3.5c0 .8-.7 1.5-1.5 1.5H12"/></svg>')
	},
	{
		id: 'cabinetLayout',
		label: 'Шкафы',
		title: 'Компоновка шкафов',
		pageName: 'Компоновка шкафов',
		icon: Editor.createElectricModeIcon('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 7h8"/><path d="M8 12h8"/><path d="M8 17h8"/><rect x="8" y="8.5" width="2.5" height="2" rx=".4"/><rect x="11" y="8.5" width="2.5" height="2" rx=".4"/><rect x="14" y="8.5" width="2" height="2" rx=".4"/><rect x="8" y="13.5" width="3" height="2" rx=".4"/><rect x="12" y="13.5" width="4" height="2" rx=".4"/></svg>')
	}
];

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
		style.setAttribute('id', 'geElectricModeStyles');
		style.setAttribute('type', 'text/css');
		style.appendChild(document.createTextNode(
			'.geEditor.geElectricModes{grid-template-columns:72px min-content min-content 1fr min-content;}' +
			'.geEditor.geElectricModes>.geElectricModePanel{grid-column:1;grid-row:3;box-sizing:border-box;width:72px;min-height:0;border-right:1px solid light-dark(var(--border-color),var(--dark-border-color));background:light-dark(var(--ge-panel-color),var(--ge-dark-panel-color));display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 6px;overflow:hidden;z-index:3;}' +
			'.geEditor.geElectricModes>.geSidebarContainer:not(.geFormatContainer){grid-column:2;}' +
			'.geEditor.geElectricModes>.geHsplit{grid-column:3;}' +
			'.geEditor.geElectricModes>.geDiagramContainer{grid-column:4;}' +
			'.geEditor.geElectricModes>.geSidebarContainer.geFormatContainer{grid-column:5;}' +
			'.geElectricModeButton{box-sizing:border-box;width:58px;min-height:58px;border:1px solid transparent;border-radius:6px;background:transparent;color:light-dark(var(--text-color),var(--dark-text-color));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:5px 3px;font:inherit;font-size:11px;line-height:14px;cursor:pointer;overflow:hidden;}' +
			'.geElectricModeButton:hover{background:light-dark(var(--highlight-color),var(--dark-highlight-color));}' +
			'.geElectricModeButton.geActive{background:light-dark(var(--accent-color),var(--dark-accent-color));border-color:light-dark(var(--primary-hover-color),var(--dark-active-accent-color));color:light-dark(var(--accent-text-color),var(--dark-accent-text-color));}' +
			'.geElectricModeIcon{width:24px;height:24px;flex:0 0 24px;background-repeat:no-repeat;background-position:center;background-size:24px 24px;opacity:.9;}' +
			'.geElectricModeLabel{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
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
		refresh.apply(this, arguments);
		this.updateElectricModePanel();
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
		return (page != null && page.node != null) ?
			page.node.getAttribute(Editor.electricModeAttribute) : null;
	};

	EditorUi.prototype.getElectricModePage = function(modeId)
	{
		if (this.pages != null)
		{
			for (var i = 0; i < this.pages.length; i++)
			{
				if (this.getElectricModeIdForPage(this.pages[i]) == modeId)
				{
					return this.pages[i];
				}
			}
		}

		return null;
	};

	EditorUi.prototype.isElectricModeEmptyDocument = function()
	{
		if (this.pages == null || this.pages.length != 1 || this.currentPage == null)
		{
			return false;
		}

		var root = this.editor.graph.model.root;
		var layer = (root != null && root.getChildCount() > 0) ? root.getChildAt(0) : null;

		return layer == null || layer.getChildCount() == 0;
	};

	EditorUi.prototype.markElectricModePage = function(page, mode)
	{
		if (page != null && mode != null)
		{
			page.setName(mode.pageName);
			page.node.setAttribute(Editor.electricModeAttribute, mode.id);
		}
	};

	EditorUi.prototype.createElectricModePage = function(mode, select)
	{
		var page = this.createPage(mode.pageName, this.createPageId());
		page.node.setAttribute(Editor.electricModeAttribute, mode.id);

		var change = new ChangePage(this, page, (select) ? page : null,
			this.pages.length, !select);
		this.editor.graph.model.execute(change);

		return page;
	};

	EditorUi.prototype.ensureElectricModePages = function(autoCreate)
	{
		if (!Editor.isElectricTheme() || this.editor.chromeless ||
			this.pages == null || this.currentPage == null)
		{
			return;
		}

		if (autoCreate && this.electricModeAutoPageInitDone)
		{
			return;
		}

		var hasModePages = false;

		for (var i = 0; i < Editor.electricModes.length; i++)
		{
			if (this.getElectricModePage(Editor.electricModes[i].id) != null)
			{
				hasModePages = true;
				break;
			}
		}

		if (autoCreate)
		{
			this.electricModeAutoPageInitDone = true;
		}

		if (autoCreate && !hasModePages && this.isElectricModeEmptyDocument())
		{
			this.markElectricModePage(this.currentPage, Editor.electricModes[0]);
			this.createElectricModePage(Editor.electricModes[1], false);

			if (this.updateTabContainer != null)
			{
				this.updateTabContainer();
			}
		}
	};

	EditorUi.prototype.selectElectricMode = function(modeId)
	{
		if (!Editor.isElectricTheme() || this.pages == null)
		{
			return;
		}

		var mode = this.getElectricMode(modeId);

		if (mode != null)
		{
			var page = this.getElectricModePage(mode.id);

			if (page == null)
			{
				page = this.createElectricModePage(mode, true);
			}
			else
			{
				this.selectPage(page);
			}

			this.updateElectricModePanel();
		}
	};

	EditorUi.prototype.createElectricModeButton = function(mode)
	{
		var button = document.createElement('button');
		button.setAttribute('type', 'button');
		button.setAttribute('title', mode.title);
		button.setAttribute('aria-label', mode.title);
		button.setAttribute('data-electric-mode', mode.id);
		button.className = 'geElectricModeButton';

		var icon = document.createElement('span');
		icon.className = 'geElectricModeIcon';
		icon.style.backgroundImage = 'url("' + mode.icon + '")';
		button.appendChild(icon);

		var label = document.createElement('span');
		label.className = 'geElectricModeLabel';
		mxUtils.write(label, mode.label);
		button.appendChild(label);

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
		panel.setAttribute('aria-label', 'Electric modes');

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
		this.container.classList.add('geElectricModes');

		if (this.electricModePanel == null)
		{
			this.electricModePanel = this.createElectricModePanel();
			this.container.insertBefore(this.electricModePanel, this.sidebarContainer);
		}

		this.ensureElectricModePages(true);
		this.updateElectricModePanel();
	};

	EditorUi.prototype.removeElectricModePanel = function()
	{
		if (this.container != null)
		{
			this.container.classList.remove('geElectricModes');
		}

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
		var buttons = this.electricModePanel.getElementsByTagName('button');

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
		});

		this.electricModeFileHandler = mxUtils.bind(this, function()
		{
			this.electricModeAutoPageInitDone = false;

			if (Editor.isElectricTheme())
			{
				this.ensureElectricModePages(true);
				this.updateElectricModePanel();
			}
		});

		this.editor.addListener('fileLoaded', this.electricModeFileHandler);
		this.editor.addListener('pageSelected', this.electricModeRefreshHandler);
		this.editor.addListener('pageRenamed', this.electricModeRefreshHandler);
		this.editor.addListener('pageMoved', this.electricModeRefreshHandler);
		this.editor.addListener('pagesPatched', this.electricModeRefreshHandler);
		this.addListener('currentThemeChanged', this.electricModeRefreshHandler);
		this.electricModeListenersInstalled = true;
	};

	EditorUi.prototype.removeElectricModeListeners = function()
	{
		if (this.electricModeListenersInstalled && this.editor != null)
		{
			this.editor.removeListener(this.electricModeFileHandler);
			this.editor.removeListener(this.electricModeRefreshHandler);
			this.removeListener(this.electricModeRefreshHandler);
		}

		this.electricModeListenersInstalled = false;
		this.electricModeFileHandler = null;
		this.electricModeRefreshHandler = null;
	};
})();
