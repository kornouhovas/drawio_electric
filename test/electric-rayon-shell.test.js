const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const electric = fs.readFileSync(path.join(root,
	'src/main/webapp/js/diagramly/Electric.js'), 'utf8');

for (const mapping of [
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
assert(electric.includes("if (entry.actionName == 'fullscreen')") &&
	!electric.includes("else if (entry.actionName == 'fullscreen')") &&
	electric.includes('selected = selected || this.isElectricFullscreenActive();') &&
	electric.includes('var actionSelected = action != null && action.toggleAction') &&
	electric.includes('document.fullscreenElement != null ||') &&
	electric.includes('Editor.inlineFullscreen === true') &&
	electric.includes("this.addListener('inlineFullscreenChanged',") &&
	electric.includes('result.then(mxUtils.bind(this, function()') &&
	electric.includes('this.electricFullscreenHandler();'),
	'Fullscreen state must cover document, inline, and asynchronous native runtimes');
assert(electric.includes('overflow-x:auto;overflow-y:hidden') &&
	electric.includes('flex:0 0 32px') &&
	electric.includes('100% - var(--ge-electric-mode-width) - var(--ge-electric-visible-format-width)') &&
	!electric.includes('100vw - 64px'),
	'Compact toolbar layout must retain inspector width and scroll nonshrinking controls');
assert(electric.includes('.geFormatTitleContainer') &&
	electric.includes('.geFormatTitle.geActiveFormatTitle') &&
	!electric.includes('.geFormatTab.geActive'),
	'Inspector styling must target the native format title DOM');
assert(electric.includes('--ge-electric-shell-surface:light-dark(') &&
	electric.includes('--ge-electric-shell-border:light-dark(') &&
	electric.includes('--ge-electric-shell-text:light-dark(') &&
	electric.includes('geElectricBottomToolbar>.geButton{filter:invert(1)'),
	'Electric shell surfaces and toolbar icons must remain legible in dark mode');
