const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const electric = fs.readFileSync(path.join(root,
	'src/main/webapp/js/diagramly/Electric.js'), 'utf8');
const editorUi = fs.readFileSync(path.join(root,
	'src/main/webapp/js/grapheditor/EditorUi.js'), 'utf8');

assert(electric.includes('grid-template-columns:var(--ge-electric-mode-width) minmax(0,1fr) var(--ge-electric-visible-format-width);'),
	'Electric must reserve stable grid columns for the mode panel and visible inspector');
assert(electric.includes('--ge-electric-mode-width:44px') &&
	electric.includes('--ge-electric-sidebar-width:264px') &&
	electric.includes('--ge-electric-format-width:264px'),
	'Electric must define the desktop Rayon shell dimensions');
assert(electric.includes('grid-column:2/3;grid-row:3/4;position:absolute!important;left:0;top:0;bottom:0;z-index:6;'),
	'The Shapes sidebar must overlay the diagram instead of taking layout space');
assert(electric.includes('background-color:light-dark(var(--ge-panel-color),var(--ge-dark-panel-color));'),
	'The overlay Shapes sidebar must have an opaque theme background');
assert(electric.includes('geElectricShapesCollapsed>.geSidebarContainer:not(.geFormatContainer),') &&
	electric.includes('transform:translateX(calc(-100% - 1px))'),
	'Collapsing Shapes must animate the overlay rather than resize it to zero');
assert(!electric.includes('geElectricShapesCollapsed>.geElectricModePanel{width:0'),
	'The Electric mode panel must remain visible when Shapes is collapsed');
assert(electric.includes('this.updateElectricRulerPosition(animateRuler);'),
	'The vertical ruler must be repositioned independently from the diagram');
assert(electric.includes('modePanel.offsetLeft + modePanel.offsetWidth +') &&
	electric.includes('this.getElectricLeftPanelWidth()'),
	'The vertical ruler must use the stable sidebar width during transitions');
assert(electric.includes("document.addEventListener('fullscreenchange', this.electricFullscreenHandler);"),
	'Fullscreen transitions must be observed, including exits with Escape');
assert(electric.includes('this.electricFullscreenState = {'),
	'Fullscreen must preserve the prior left-panel state');
assert(electric.includes('this.getElectricCanvasViewportState();') &&
	electric.includes('this.scheduleElectricCanvasViewportRestore();'),
	'Fullscreen must preserve the visible canvas position during viewport changes');
assert(electric.includes('this.hsplit.getSplitPosition = mxUtils.bind(this'),
	'The splitter must use the sidebar-local coordinate system');
assert(editorUi.includes('if (elt.getSplitPosition != null)'),
	'The generic splitter must support a local position provider');
assert(electric.includes('@media(max-width:1280px)') &&
	electric.includes('@media(max-width:960px)') &&
	electric.includes('@media(max-width:700px)') &&
	electric.includes('--ge-electric-mode-width:44px'),
	'Electric must provide compact shell rules at all required breakpoints');
assert(electric.includes('--ge-electric-workspace:light-dark(#f7f7f7,#19191b)') &&
	electric.includes('background-color:var(--ge-electric-workspace)'),
	'Electric must use the neutral Rayon workspace color');
assert(electric.includes('EditorUi.prototype.getElectricDefaultLeftPanelWidth') &&
	electric.includes('return this.getElectricAvailableLeftPanelWidth();') &&
	electric.includes('minimumCanvasWidth = (viewportWidth <= 700) ? 96 : 0') &&
	electric.includes('(viewportWidth <= 960) ? 232 :') &&
	electric.includes('((viewportWidth <= 1280) ? 248 : 264);'),
	'Fresh Electric sessions must receive a nonzero responsive overlay width');
assert(electric.includes('EditorUi.prototype.ensureElectricLeftPanelWidth') &&
	electric.includes('this.ensureElectricLeftPanelWidth();') &&
	electric.includes('this.hsplitPosition == EditorUi.prototype.hsplitPosition'),
	'Opening or installing the Electric panel must repair a zero split position');
const ensureWidth = electric.slice(
	electric.indexOf('EditorUi.prototype.ensureElectricLeftPanelWidth'),
	electric.indexOf('EditorUi.prototype.captureElectricInlineProperty'));
assert(!ensureWidth.includes('sizeDidChange') && !ensureWidth.includes('refresh('),
	'Reopening the overlay must not recenter or resize the canvas');
assert(electric.includes('EditorUi.prototype.captureElectricShellInlineState') &&
	electric.includes('EditorUi.prototype.restoreElectricShellInlineState') &&
	electric.includes('sidebarWidth: this.captureElectricInlineProperty(') &&
	electric.includes('formatWidth: this.captureElectricInlineProperty(') &&
	electric.includes("hsplitLeft: this.captureElectricInlineProperty(this.hsplit, 'left')") &&
	electric.includes('state.ruler.transform') &&
	electric.includes('state.ruler.transition'),
	'Electric teardown must restore native panel, splitter, and ruler inline styles');
