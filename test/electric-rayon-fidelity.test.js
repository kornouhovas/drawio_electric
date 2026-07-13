const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const electric = fs.readFileSync(path.join(root,
	'src/main/webapp/js/diagramly/Electric.js'), 'utf8');

assert(electric.includes('--ge-electric-mode-width:44px') &&
	electric.includes('--ge-electric-sidebar-width:264px') &&
	electric.includes('--ge-electric-format-width:264px'),
	'The desktop Electric shell must use the measured Rayon geometry');
assert(electric.includes('font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'),
	'The Electric shell must use the Rayon-like system typography stack');
assert(electric.includes('--ge-electric-shell-accent:#146ef5') &&
	electric.includes('--ge-electric-shell-active-icon:light-dark(#eef4ff,#1d2a44)'),
	'The Electric shell must expose the reference active blue treatment');

assert(electric.includes('EditorUi.prototype.createElectricCanvasesSection') &&
	electric.includes('EditorUi.prototype.updateElectricCanvases') &&
	electric.includes('EditorUi.prototype.scheduleElectricCanvasesRefresh'),
	'The Layers view must expose native pages as a Canvases section');
assert(electric.includes("className = 'geElectricCanvases'") &&
	electric.includes("className = 'geElectricCanvasList'") &&
	electric.includes("className = 'geElectricCanvasRow'"),
	'The Canvases section must use stable DOM hooks for visual and behavior QA');
assert(electric.includes('this.selectPage(page);') &&
	electric.includes('var page = this.insertPage();') &&
	electric.includes('this.selectPage(page);'),
	'Canvas rows and add action must delegate to native draw.io page APIs');
assert(electric.includes('EditorUi.prototype.showElectricCanvasMenu') &&
	electric.includes('this.createPageMenu(page)') &&
	electric.includes("mxEvent.addListener(row, 'contextmenu'") &&
	electric.includes('EditorUi.prototype.handleElectricCanvasKeyDown') &&
	electric.includes('EditorUi.prototype.handleElectricCanvasMenuKeyDown') &&
	electric.includes('EditorUi.prototype.focusElectricCanvasMenuItem') &&
	electric.includes("item.setAttribute('role', 'menuitem')"),
	'Canvases must retain keyboard access to native rename, duplicate, move, and remove operations');
assert(electric.includes('var canvasScrollTop = this.electricCanvasList.scrollTop') &&
	electric.includes('focusedPageId') &&
	electric.includes('focusedPageIndex') &&
	electric.includes('focus({preventScroll: true})'),
	'Canvases refresh must preserve scroll position and keyboard focus');

assert(electric.includes('EditorUi.prototype.captureElectricNativePageTabsState') &&
	electric.includes('EditorUi.prototype.setElectricNativePageTabsVisible') &&
	electric.includes('EditorUi.prototype.hideElectricNativePageTabsForCanvases') &&
	electric.includes('EditorUi.prototype.restoreElectricNativePageTabsState'),
	'Electric must hide and exactly restore native bottom page tabs');
assert(electric.includes('this.captureElectricNativePageTabsState();') &&
	electric.includes('this.setElectricNativePageTabsVisible(false);') &&
	electric.match(/this\.hideElectricNativePageTabsForCanvases\(\)/g).length >= 2 &&
	electric.includes('.geEditor.geElectricModes>.geTabContainer{display:none!important;}') &&
	electric.includes("this.tabContainer, 'height'") &&
	electric.includes("ariaHiddenPresent: this.tabContainer.hasAttribute('aria-hidden')") &&
	electric.includes('this.restoreElectricNativePageTabsState();'),
	'The native page-tab lifecycle must be wired into install and teardown');

assert(electric.includes('EditorUi.prototype.installElectricLibraryHeader') &&
	electric.includes('EditorUi.prototype.decorateElectricLibraryPalettes') &&
	electric.match(/this\.installElectricLibraryHeader\(\);/g).length >= 2 &&
	electric.includes("className = 'geElectricLibraryTabs'") &&
	electric.includes('.geElectricLibraryGrid'),
	'The Electric library must expose Rayon tabs and a two-column palette grid');

assert(electric.includes("className = 'geElectricBottomToolbarTools'") &&
	electric.includes("className = 'geElectricBottomToolbarStatus'") &&
	electric.includes("className = 'geElectricCursorStatus'") &&
	electric.includes("className = 'geElectricPageStatus'"),
	'The bottom toolbar must have separate tool and status rows');
assert(electric.includes("this.electricCursorStatus.setAttribute('aria-hidden', 'true')") &&
	electric.includes("this.electricPageStatus.setAttribute('role', 'status')") &&
	electric.includes("this.electricPageStatus.setAttribute('aria-live', 'polite')"),
	'Only page changes may use a live region; high-frequency cursor coordinates must stay silent');
assert(electric.includes('EditorUi.prototype.updateElectricCursorStatus') &&
	electric.includes('EditorUi.prototype.updateElectricPageStatus') &&
	electric.includes('EditorUi.prototype.attachElectricCursorLeaveHandler') &&
	electric.includes('this.electricCursorLeaveTarget = graph.container') &&
	electric.includes("this.editor.graph.addMouseListener(this.electricCursorMouseListener)") &&
	electric.includes("this.editor.graph.removeMouseListener(this.electricCursorMouseListener)"),
	'The status row must use lifecycle-safe graph mouse and page events');
assert(electric.includes('min-width:580px') &&
	electric.includes('border-radius:14px') &&
	electric.includes('box-shadow:0 8px 28px'),
	'The floating tool deck must match the measured Rayon surface');
assert(electric.includes('EditorUi.prototype.getElectricBottomToolbarWidth') &&
	electric.includes("this.electricBottomToolbar.style.width =") &&
	electric.includes('min-width:0'),
	'The tool deck must cap itself to the visible canvas at every breakpoint');
assert(electric.includes("window.addEventListener('resize', this.electricWindowResizeHandler)") &&
	electric.includes("window.removeEventListener('resize', this.electricWindowResizeHandler)") &&
	electric.includes("this.container.classList.contains('geElectricFullscreen')") &&
	electric.includes('this.updateElectricRulerPosition(animateRuler);\n\t\tthis.updateElectricBottomToolbar();'),
	'Window resize must recompute the overlay and bottom toolbar geometry');

assert(electric.includes("this.editor.addListener('pageSelected', this.electricCanvasesRefreshHandler)") &&
	electric.includes("this.editor.addListener('pageRenamed', this.electricCanvasesRefreshHandler)") &&
	electric.includes("this.editor.addListener('pageMoved', this.electricCanvasesRefreshHandler)") &&
	electric.includes("this.editor.addListener('pagesPatched', this.electricCanvasesRefreshHandler)"),
	'Canvases must stay synchronized with all native page events');
