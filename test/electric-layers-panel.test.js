const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const electric = fs.readFileSync(path.join(root,
	'src/main/webapp/js/diagramly/Electric.js'), 'utf8');

const layersView = electric.indexOf("id: 'layers'");
const libraryView = electric.indexOf("id: 'library'");

assert(layersView >= 0 && libraryView > layersView,
	'The mode rail must list Layers before Library');
assert(electric.includes("data-electric-panel-view', view.id"),
	'Electric must expose accessible panel-view buttons');
assert(electric.includes('geElectricPanelLayers>.geSidebarContainer:not(.geFormatContainer){display:none;}') &&
	electric.includes('geElectricPanelLayers>.geElectricLayersPanel{display:flex;}'),
	'Layers must replace the library inside the same left-panel overlay');
assert(electric.includes('EditorUi.prototype.addElectricLayerTreeRow') &&
	electric.includes('this.addElectricLayerTreeRow(model.getChildAt(cell, i), layer,'),
	'The Layers panel must recursively render child elements');
assert(electric.includes("label = mxResources.get('background') || ('Layer ' + (index + 1));"),
	'Unnamed root layers must not be mislabeled as element groups');
assert(electric.includes('graph.setCellsVisible([cell], !visible);'),
	'Every layer and element must have an independent visibility toggle');
assert(electric.includes('graph.setDefaultParent(cell);'),
	'Clicking a layer must make it the insertion target');
assert(electric.includes('graph.setSelectionCell(cell);'),
	'Clicking an element in the tree must select it on the canvas');
assert(electric.includes("this.editor.graph.addListener('defaultParentChanged'") &&
	electric.includes('this.editor.graph.getModel().addListener(mxEvent.CHANGE,'),
	'The tree must track layer, model, and active-parent changes');
assert(electric.includes('this.addElectricLayer();'),
	'The Layers header must provide an add-layer command');
assert(electric.includes('window.cancelAnimationFrame(this.electricLayersRefreshFrame);'),
	'Inline layer naming must not be detached by a pending tree refresh');
