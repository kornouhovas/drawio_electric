# Electric Rayon Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Electric application shell visually and behaviorally match the selected Rayon references while retaining native draw.io behavior and isolating all changes to the Electric theme.

**Architecture:** Extend the existing Electric shell in `Electric.js` rather than replacing draw.io subsystems. Canvases delegates to the native page API, Layers continues using the existing advanced tree, the native format/sidebar DOM is restyled through Electric-scoped CSS, and all moved/hidden native surfaces are restored during theme teardown.

**Tech Stack:** draw.io JavaScript, mxGraph event/model APIs, DOM/CSS, Node static/VM tests, Docker Compose, Chrome screenshot validation.

## Global Constraints

- Apply the shell only when `Editor.isElectricTheme()` is true and the editor is not chromeless.
- Preserve native draw.io page, file, library, format, connector, undo/redo, export, and persistence behavior.
- Do not add fake Rayon account, share, collaboration, or modeling functionality.
- Use the exact tokens and viewport targets from `docs/superpowers/specs/2026-07-13-electric-rayon-fidelity-design.md`.
- Restore every hidden or moved native DOM surface when Electric is removed.
- No P0, P1, or P2 visual issue may remain at the reference viewport.

---

### Task 1: Fidelity Contract Tests

**Files:**
- Create: `test/electric-rayon-fidelity.test.js`
- Modify: `test/electric-rayon-behavior.test.js`

**Interfaces:**
- Consumes: `EditorUi` Electric shell methods and injected CSS source.
- Produces: executable assertions for geometry, page surfaces, status row, teardown, and theme isolation.

- [ ] Write assertions for 44/264/264 desktop geometry, two-row toolbar classes, Canvases DOM/method names, native tab capture/restore, and reference typography tokens.
- [ ] Run `node --test test/electric-rayon-fidelity.test.js` and verify it fails on the missing Canvases/status/tab behavior.
- [ ] Add VM behavior cases for page selection/addition and coordinate label updates.
- [ ] Run the targeted tests again and retain the expected red failures.

### Task 2: Shell Geometry and Native Surface State

**Files:**
- Modify: `src/main/webapp/js/diagramly/Electric.js`
- Test: `test/electric-rayon-fidelity.test.js`

**Interfaces:**
- Produces: `captureElectricNativePageTabsState()`, `setElectricNativePageTabsVisible(visible)`, and `restoreElectricNativePageTabsState()`.

- [ ] Implement the reference shell tokens and responsive dimensions in Electric-scoped CSS.
- [ ] Capture the native `tabContainer` display/visibility/height before hiding it.
- [ ] Hide native page tabs only after the Electric Canvases surface exists.
- [ ] Restore the exact native tab state during Electric teardown.
- [ ] Run the targeted tests until green.

### Task 3: Canvases Section

**Files:**
- Modify: `src/main/webapp/js/diagramly/Electric.js`
- Test: `test/electric-rayon-fidelity.test.js`

**Interfaces:**
- Produces: `createElectricCanvasesSection()`, `updateElectricCanvases()`, and `scheduleElectricCanvasesRefresh()`.
- Uses: `this.pages`, `this.currentPage`, `this.selectPage(page)`, and `this.insertPage()`.

- [ ] Add the Canvases header, plus action, and page-list region above Layers.
- [ ] Render one stable row per native page with current-page state and accessible labels.
- [ ] Select pages through `selectPage`; insert and select a new page through `insertPage`.
- [ ] Refresh from `pageSelected`, `pageRenamed`, `pageMoved`, and `pagesPatched`.
- [ ] Preserve Layers tree scroll/focus while Canvases updates.
- [ ] Run targeted and existing Layers tests until green.

### Task 4: Library and Inspector Fidelity

**Files:**
- Modify: `src/main/webapp/js/diagramly/Electric.js`
- Test: `test/electric-rayon-fidelity.test.js`

**Interfaces:**
- Consumes: existing sidebar and format-panel DOM.
- Produces: Electric-scoped visual treatment only.

- [ ] Apply Inter/system typography, spacing, radii, surfaces, and active/hover states.
- [ ] Restyle library search, headings, thumbnails, and More Shapes footer without changing drag/drop or lazy loading.
- [ ] Restyle Diagram/Style tabs, sections, inputs, buttons, checkboxes, and connector style controls to the 264 px inspector.
- [ ] Verify long localized strings wrap or ellipsize without overlap.
- [ ] Run the Electric test suite.

### Task 5: Two-Row Bottom Tool Deck

**Files:**
- Modify: `src/main/webapp/js/diagramly/Electric.js`
- Test: `test/electric-rayon-fidelity.test.js`

**Interfaces:**
- Produces: `electricBottomToolbarTools`, `electricBottomToolbarStatus`, `updateElectricCursorStatus(evt)`, and `updateElectricPageStatus()`.

- [ ] Move existing toolbar buttons into the tools row without replacing native actions.
- [ ] Add coordinate and page status nodes in the second row.
- [ ] Update coordinates from graph mouse events and clear them on mouse leave.
- [ ] Update page status from native page events.
- [ ] Remove listeners and nodes during Electric teardown.
- [ ] Run targeted tests and the full Electric suite.

### Task 6: Visual QA and Delivery

**Files:**
- Modify: `design-qa.md`
- Modify as findings require: `src/main/webapp/js/diagramly/Electric.js`

**Interfaces:**
- Produces: same-viewport screenshots, side-by-side comparisons, final QA record, reviewed commit, and deployment evidence.

- [ ] Build and run the Electric application.
- [ ] Capture Layers, Library, inspector, and toolbar states in Chrome at the reference viewport.
- [ ] Create combined reference/implementation comparisons and classify every mismatch P0-P3.
- [ ] Fix all P0-P2 issues and repeat captures until none remain.
- [ ] Record exact screenshot paths, viewport, states, and `final result: passed` in `design-qa.md`.
- [ ] Run `node --check`, `node --test test/electric-*.test.js`, shape verification, and Docker build.
- [ ] Request an independent final diff review and resolve blocking findings.
- [ ] Commit only task-owned changes, push the authorized branch, deploy the exact commit, and verify the public and regression URLs.

