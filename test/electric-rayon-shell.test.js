const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const electric = fs.readFileSync(path.join(root,
	'src/main/webapp/js/diagramly/Electric.js'), 'utf8');
const devel = fs.readFileSync(path.join(root,
	'src/main/webapp/js/diagramly/Devel.js'), 'utf8');

for (const mapping of [
	"{action: 'insertRectangle', image: Editor.thinRectangleImage}",
	"{action: 'insertText', image: Editor.thinTextImage}",
	"{action: 'insertEdge', image: Editor.electricConnectorIcon}",
	"{action: 'undo', image: Editor.undoImage}",
	"{action: 'redo', image: Editor.redoImage}",
	"{action: 'zoomOut', image: Editor.zoomOutImage}",
	"{action: fitActionName, image: Editor.zoomFitImage}",
	"{action: 'zoomIn', image: Editor.zoomInImage}",
	"{action: 'grid', image: Editor.thinGridImage}",
	"{action: 'format', image: Editor.formatImage}",
	"{action: 'fullscreen', image: Editor.fullscreenImage}"
])
{
	assert(electric.includes(mapping), `Missing bottom-toolbar mapping: ${mapping}`);
}

assert(electric.includes("(this.actions.get('fitWindow') != null) ?") &&
	electric.includes("'fitWindow' : 'smartFit'"),
	'The fit button must conservatively fall back to smartFit');
assert(electric.includes('var currentAction = ui.actions.get(item.action);') &&
	electric.includes('currentAction.funct(evt);') &&
	electric.includes('currentAction.isVisible == null || currentAction.isVisible()'),
	'Buttons must resolve and invoke action.funct at click time');
assert(electric.includes('var visible = action != null && (action.isVisible == null ||') &&
	electric.includes("entry.button.style.display = visible ? '' : 'none'") &&
	electric.includes("entry.button.setAttribute('aria-hidden', visible ? 'false' : 'true')"),
	'Hidden actions must not render or invoke from the Electric toolbar');
assert(electric.includes("button.setAttribute('role', 'button')") &&
	electric.includes("button.setAttribute('aria-label', title)") &&
	electric.includes("entry.button.setAttribute('aria-pressed'") &&
	electric.includes('evt.keyCode == 13 || evt.keyCode == 32'),
	'Bottom-toolbar controls must expose accessible state');
assert(electric.includes("action.addListener('stateChanged', entry.stateHandler)") &&
	electric.includes('entry.action.removeListener(entry.stateHandler);'),
	'Action state listeners must be installed and removed with Electric mode');
assert(electric.includes("this.addListener('inlineFullscreenChanged', this.electricFullscreenHandler)") &&
	electric.includes('this.removeListener(this.electricFullscreenHandler);'),
	'Inline fullscreen lifecycle listeners must be removed on theme teardown');
assert(electric.includes('this.installElectricBottomToolbar();') &&
	electric.includes('this.removeElectricBottomToolbar();') &&
	electric.includes('this.electricBottomToolbar.parentNode.removeChild('),
	'The bottom toolbar DOM must follow the Electric mode lifecycle');
assert(electric.includes('.geEditor.geElectricModes.geElectricFullscreen>.geElectricBottomToolbar'),
	'The Electric bottom toolbar may remain available in fullscreen');
assert(electric.includes('translateX(calc(-100% - var(--ge-electric-mode-width) - 1px))'),
	'Fullscreen must move the overlay beyond the hidden rail offset');
assert(electric.includes('.geElectricModes.geElectricFullscreen{--ge-electric-visible-left-width:0px;grid-template-columns:0 minmax(0,1fr)') &&
	electric.includes('minimumCanvasWidth = (viewportWidth <= 700) ? 96 : 0'),
	'Fullscreen and narrow layouts must not reserve hidden or overlapping panel space');
assert(electric.includes("if (entry.actionName == 'fullscreen')") &&
	!electric.includes("else if (entry.actionName == 'fullscreen')") &&
	electric.includes('selected = selected || this.isElectricFullscreenActive();') &&
	electric.includes('var actionSelected = action != null && action.toggleAction') &&
	electric.includes('document.fullscreenElement != null ||') &&
	electric.includes('Editor.inlineFullscreen === true') &&
	electric.includes("this.addListener('inlineFullscreenChanged',") &&
	electric.includes('window.setTimeout(syncFullscreen, 0)') &&
	electric.includes('window.setTimeout(syncFullscreen, 100)') &&
	electric.includes('result.then(syncFullscreen)') &&
	electric.includes("evt.type == 'fullscreenchange'") &&
	electric.includes("this.container.classList.remove('geFullscreen')") &&
	electric.includes("document.addEventListener('keydown', this.electricFullscreenKeyHandler, true)") &&
	electric.includes("document.removeEventListener('keydown', this.electricFullscreenKeyHandler, true)") &&
	electric.includes("this.container.classList.contains('geElectricFullscreen')") &&
	electric.includes('this.setInlineFullscreen(false);') &&
	electric.includes("this.electricFullscreenHandler({type: 'fullscreenchange'});") &&
	electric.includes('this.electricFullscreenHandler();'),
	'Fullscreen state must cover document, inline, Escape, and asynchronous native runtimes');
assert(electric.includes('overflow-x:auto;overflow-y:hidden') &&
	electric.includes('flex:0 0 32px') &&
	electric.includes('--ge-electric-visible-left-width:calc(') &&
	electric.includes('100% - var(--ge-electric-visible-left-width) - var(--ge-electric-visible-format-width)') &&
	electric.includes('max(44px,calc(') &&
	!electric.includes('100vw - 64px'),
	'Compact toolbar layout must retain inspector width and scroll nonshrinking controls');
assert(electric.includes('.geFormatTitleContainer') &&
	electric.includes('.geFormatTitle.geActiveFormatTitle') &&
	!electric.includes('.geFormatTab.geActive'),
	'Inspector styling must target the native format title DOM');
assert(electric.includes('--ge-electric-shell-surface:light-dark(') &&
	electric.includes('--ge-electric-shell-border:light-dark(') &&
	electric.includes('--ge-electric-shell-text:light-dark(') &&
	electric.includes('color:var(--ge-electric-shell-text)!important') &&
	electric.includes('body.geDarkMode.geEditor.geElectricModes') &&
	electric.includes('geElectricConnectorPrimary{filter:invert(1)'),
	'Electric shell surfaces and toolbar icons must remain legible in dark mode');
assert(electric.includes('EditorUi.prototype.setElectricSurfaceAvailability') &&
	electric.includes("element.setAttribute('aria-hidden', available ? 'false' : 'true')") &&
	electric.includes("element.setAttribute('inert', 'inert')") &&
	electric.includes("element.removeAttribute('inert')") &&
	electric.includes("if (!Editor.isElectricTheme())") &&
	electric.includes("this.container.classList.remove('geElectricShapesCollapsed')") &&
	electric.includes("var layersActive = this.electricLeftPanelView == 'layers'") &&
	electric.includes('leftAvailable && !layersActive') &&
	electric.includes('leftAvailable && layersActive') &&
	electric.includes('(!leftAvailable || layersActive)') &&
	electric.includes('(!leftAvailable || !layersActive)') &&
	electric.includes('this.updateElectricSurfaceAccessibility(collapsed);'),
	'Collapsed and fullscreen Electric surfaces must leave the focus order');
assert(electric.includes('EditorUi.prototype.toggleElectricLegacyChrome') &&
	electric.includes("data-electric-shell-menu', '1'") &&
	electric.includes('geElectricLegacyChrome') &&
	electric.includes('Editor.menuImage'),
	'The Rayon shell must keep native top chrome behind an accessible rail menu');
assert(electric.includes('geElectricModes:not(.geElectricLegacyChrome)>.geMenubarContainer') &&
	electric.includes('geElectricModes:not(.geElectricLegacyChrome)>.geToolbarContainer') &&
	electric.includes('grid-template-rows:0 0 minmax(0,1fr) min-content') &&
	electric.includes('grid-template-columns:var(--ge-electric-mode-width) minmax(0,1fr) var(--ge-electric-visible-format-width)'),
	'The Electric workspace must hide legacy chrome by default without deleting it');
assert(electric.includes('this.electricBottomToolbar.appendChild(') &&
	electric.includes('this.electricConnectorToolbar'),
	'The standard connector selector must remain available in the bottom toolbar');
assert(electric.includes('this.toolbar.edgeStyleMenu') &&
	electric.includes("wrapper.className = 'geElectricConnectorToolbar'") &&
	electric.includes("menu.classList.add('geElectricConnectorPrimary')") &&
	electric.includes('EditorUi.prototype.attachElectricConnectorToolbar') &&
	electric.includes('this.electricConnectorToolbarOriginalTitle') &&
	electric.includes('this.electricConnectorToolbarOriginalBackgroundImage') &&
	electric.includes("this.restoreElectricInlineProperty(primary, 'background-image'") &&
	electric.includes('this.electricConnectorToolbarOriginalParent.insertBefore(primary,'),
	'The native connector selector must move into Electric and fully restore on teardown');
assert(electric.includes('background-repeat:no-repeat!important') &&
	electric.includes('background-position:8px center!important') &&
	electric.includes('background-size:16px 16px!important'),
	'Library disclosure icons must render once instead of tiling across headings');
assert(devel.includes("mxscript(drawDevUrl + 'js/diagramly/Electric.js')") &&
	devel.includes("mxscript(drawDevUrl + 'electric/shapes/catalog.js')") &&
	devel.includes("mxscript(drawDevUrl + 'js/diagramly/ElectricShapes.js')") &&
	devel.indexOf("js/diagramly/Electric.js") > devel.indexOf("if (!window.DRAWIO_PUBLIC_BUILD)") &&
	devel.indexOf("js/diagramly/Electric.js") > devel.indexOf("js/diagramly/vsdx/VsdxExport.js") &&
	devel.indexOf("js/diagramly/Electric.js") < devel.indexOf("electric/shapes/catalog.js") &&
	devel.indexOf("electric/shapes/catalog.js") < devel.indexOf("js/diagramly/ElectricShapes.js"),
	'Electric sources must load in development mode in production build order');
assert(electric.includes('this.electricDeferredInstallTimer = window.setTimeout(') &&
	electric.includes('window.clearTimeout(this.electricDeferredInstallTimer)') &&
	electric.includes("this.container.classList.contains('geElectricModes')"),
	'Deferred Electric installation must be cancelled and bound to the active UI');
