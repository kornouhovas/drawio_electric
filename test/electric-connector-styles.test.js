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
	electric.includes('DiagramFormatPanel.prototype.addStyleOps = function(div)') &&
	electric.includes('EditorUi.prototype.addElectricConnectorStyleOps') &&
	electric.includes('allowDefaultStyle === true && selected.length != 0') &&
	!electric.includes('EditorUi.prototype.renderElectricConnectorFormatPanel') &&
	!electric.includes('Format.prototype.immediateRefresh = function()'),
	'Preset controls must extend native Style panels for selected and future connectors');
assert(electric.includes('EditorUi.prototype.showElectricConnectorStylePicker') &&
	electric.includes('geElectricConnectorStylePickerSearch') &&
	electric.includes('EditorUi.prototype.getElectricConnectorPresetGroups') &&
	electric.includes('EditorUi.prototype.saveElectricConnectorCurrentPreset') &&
	electric.includes("mxResources.get('electricConnectorSaveStyle')") &&
	electric.includes("mxResources.get('electricConnectorSaveAsStyle')") &&
	!electric.includes("mxResources.get('electricConnectorSaveMyShort')") &&
	!electric.includes("mxResources.get('electricConnectorSaveProjectShort')") &&
	!electric.includes('showElectricConnectorSaveMenu'),
	'Connector presets must use a searchable picker and simple save/save-as actions');
assert(electric.includes('graph.setCellStyles(key, clean[key] != null ? clean[key] : null,') &&
	electric.includes('graph.getModel().beginUpdate()'),
	'Applying a preset to selected connectors must use a single model transaction');

for (const resource of [english, russian]) {
	for (const key of [
		'electricConnector=', 'electricConnectorStyles=', 'electricConnectorLast=',
		'electricConnectorRecentStyles=', 'electricConnectorBuiltins=',
		'electricConnectorSavedStyles=', 'electricConnectorStyleName=',
		'electricConnectorSelectStyle=', 'electricConnectorSearchStyles=',
		'electricConnectorSaveStyle=', 'electricConnectorSaveAsStyle='
	]) {
		assert(resource.includes(key), `Missing connector resource: ${key}`);
	}

	for (const key of [
		'electricConnectorMyStyles=', 'electricConnectorProjectStyles=',
		'electricConnectorSaveMy=', 'electricConnectorSaveProject=',
		'electricConnectorSaveMyShort=', 'electricConnectorSaveProjectShort='
	]) {
		assert(!resource.includes(key), `Obsolete connector resource remains: ${key}`);
	}
}
