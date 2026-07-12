const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const electric = fs.readFileSync(path.join(root,
	'src/main/webapp/js/diagramly/Electric.js'), 'utf8');
const english = fs.readFileSync(path.join(root,
	'src/main/webapp/resources/dia.txt'), 'utf8');
const russian = fs.readFileSync(path.join(root,
	'src/main/webapp/resources/dia_ru.txt'), 'utf8');

assert(electric.includes("Editor.electricConnectorMetadataAttribute = 'electricConnectorStyles'") &&
	electric.includes("Editor.electricConnectorProfileKey = 'electricConnectorStyles'"),
	'Connector styles must persist in both the diagram metadata and browser profile');
assert(electric.includes('Editor.electricConnectorBuiltins = [') &&
	electric.includes("id: 'standard'") && electric.includes("id: 'arrow'"),
	'Connector styles must expose a set of built-in presets');
assert(electric.includes('EditorUi.prototype.saveElectricConnectorPreset') &&
	electric.includes('EditorUi.prototype.updateElectricConnectorPreset') &&
	electric.includes('EditorUi.prototype.deleteElectricConnectorPreset'),
	'Named connector presets must support save, update, and delete operations');
assert(electric.includes('this.fileNode.setAttribute(Editor.electricConnectorMetadataAttribute') &&
	electric.includes('mxSettings.save()'),
	'Project metadata and browser profile changes must be persisted');
assert(electric.includes('graph.currentEdgeStyle = next;') &&
	electric.includes('graph.pasteEdgeStyle = true;'),
	'The last connector style must become the default for the next connector');
assert(electric.includes("evt.getProperty('force') === true") &&
	electric.includes('Editor.electricConnectorStyleKeys.indexOf(keys[j]) >= 0'),
	'Existing toolbar connector controls must also persist the current default style');
assert(electric.includes("data-electric-connector-open', '1'") &&
	!electric.includes("data-electric-connector-menu', '1'"),
	'The top toolbar must expose one connector-settings button without a second menu');
assert(electric.includes('StyleFormatPanel.prototype.addStyleOps = function(div)') &&
	electric.includes('EditorUi.prototype.addElectricConnectorStyleOps') &&
	electric.includes('this.getElectricSelectedConnectorEdges().length != selected.length') &&
	!electric.includes('EditorUi.prototype.renderElectricConnectorFormatPanel') &&
	!electric.includes('Format.prototype.immediateRefresh = function()'),
	'Preset controls must extend the native Style panel, not replace it with a custom panel');
assert(electric.includes('showElectricConnectorSaveMenu') &&
	electric.includes('showElectricConnectorPresetManageMenu'),
	'Saving and managing named presets must be available from the native Style panel');
assert(electric.includes('graph.setCellStyles(key, clean[key] != null ? clean[key] : null,') &&
	electric.includes('graph.getModel().beginUpdate()'),
	'Applying a preset to selected connectors must use a single model transaction');

for (const resource of [english, russian]) {
	for (const key of [
		'electricConnector=', 'electricConnectorStyles=', 'electricConnectorLast=',
		'electricConnectorMyStyles=', 'electricConnectorProjectStyles=',
		'electricConnectorSaveMy=', 'electricConnectorSaveProject=',
		'electricConnectorSaveAs='
	]) {
		assert(resource.includes(key), `Missing connector resource: ${key}`);
	}
}
