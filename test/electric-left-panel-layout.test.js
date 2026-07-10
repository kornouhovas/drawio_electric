const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const electric = fs.readFileSync(path.join(root,
	'src/main/webapp/js/diagramly/Electric.js'), 'utf8');
const editorUi = fs.readFileSync(path.join(root,
	'src/main/webapp/js/grapheditor/EditorUi.js'), 'utf8');

assert(electric.includes('grid-template-columns:var(--ge-electric-mode-width) minmax(0,1fr) min-content;'),
	'Electric must reserve a stable grid column only for the mode panel');
assert(electric.includes('grid-column:2/3;grid-row:3/4;position:absolute!important;left:0;top:0;bottom:0;z-index:6;'),
	'The Shapes sidebar must overlay the diagram instead of taking layout space');
assert(electric.includes('background-color:light-dark(var(--ge-panel-color),var(--ge-dark-panel-color));'),
	'The overlay Shapes sidebar must have an opaque theme background');
assert(electric.includes('geElectricShapesCollapsed>.geSidebarContainer:not(.geFormatContainer){transform:translateX'),
	'Collapsing Shapes must animate the overlay rather than resize it to zero');
assert(!electric.includes('geElectricShapesCollapsed>.geElectricModePanel{width:0'),
	'The Electric mode panel must remain visible when Shapes is collapsed');
assert(electric.includes('this.updateElectricRulerPosition(animateRuler);'),
	'The vertical ruler must be repositioned independently from the diagram');
assert(electric.includes('modePanel.offsetLeft + modePanel.offsetWidth +') &&
	electric.includes('Math.max(0, this.hsplitPosition || 0)'),
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
