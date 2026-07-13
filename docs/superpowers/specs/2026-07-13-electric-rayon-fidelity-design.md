# Electric Rayon Fidelity Design

## Status

Approved direction. The user selected the supplied Rayon screenshots as the visual and interaction reference and requested a one-to-one treatment for existing Electric interface elements. This document makes that direction measurable without adding unrelated Rayon product features.

## References

- Current Electric: `/Users/aleksandersk/.codex/attachments/da3c8a53-f121-4e5d-bc2a-45c8350b4a2c/image-1.png`
- Rayon library view: `/Users/aleksandersk/.codex/attachments/da3c8a53-f121-4e5d-bc2a-45c8350b4a2c/image-2.png`
- Rayon canvases/layers view: `/Users/aleksandersk/.codex/attachments/da3c8a53-f121-4e5d-bc2a-45c8350b4a2c/image-3.png`

All references are 3020 x 1580 Retina captures, corresponding to an approximately 1510 x 790 CSS viewport.

## Scope

The Electric theme receives a Rayon-like application shell while preserving draw.io editing, file, page, layer, library, format, connector, undo/redo, export, and persistence behavior. Other draw.io themes and chromeless/embed modes remain unchanged.

Only existing Electric/draw.io capabilities are represented. Rayon-specific account, sharing, collaboration, measurement, and modeling features are not fabricated.

## Shell Geometry

At the reference viewport:

| Surface | Target |
| --- | --- |
| Mode rail | 44 px |
| Left work panel | 264 px |
| Right inspector | 264 px |
| Workspace | Remaining width, `#f7f7f7` |
| Bottom tool deck | 580-620 px wide, 92-98 px high |
| Bottom tool deck offset | 12 px above viewport bottom |

The left panel overlays the diagram so expanding or collapsing it does not recenter the canvas. The right inspector stays in the layout. On smaller viewports the inspector and left panel may shrink, but controls must remain usable and the canvas must retain at least 96 px of visible width.

## Visual Tokens

- Font: `Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Base text: 13 px, line-height 1.35, weight 400.
- Section title: 14 px, weight 600.
- Primary text: `#202124`; muted text: `#737373`.
- Surface: `#ffffff`; workspace: `#f7f7f7`; hover: `#f5f5f5`; selected: `#f1f1f1`.
- Accent: `#146ef5`; active rail background: `#eef4ff`.
- Border: `#e8e8e8`; subtle divider: `#eeeeee`.
- Control radius: 8 px; cards and segmented controls: 10 px; floating tool deck: 14 px.
- Floating shadow: `0 8px 28px rgba(0, 0, 0, 0.12)`.
- Letter spacing is 0. No gradient, decorative blob, or excessive card nesting is introduced.

## Mode Rail

The rail is a quiet 44 px white column with 36 x 36 px icon buttons. Icons are centered, monochrome, and use the existing draw.io/Electric assets. The active view uses a pale blue background and blue icon treatment. Text labels remain tooltips/ARIA labels, not visible captions.

The menu control remains at the top. Existing Electric views and modes retain their behavior. Separators are 20 px wide with a single subtle line.

## Left Panel

### Canvases and Layers

The Layers view contains two sections in one scroll-independent panel:

1. `Canvases` lists all draw.io pages, selects the current page, and adds a page through the header plus button.
2. `Layers` keeps the existing advanced Electric tree, multiselection, drag/drop, context menus, visibility, grouping, and device expansion behavior.

The active canvas row uses the same quiet gray selection treatment as Rayon. Native bottom page tabs are hidden only while the Electric shell is active because pages are fully accessible in Canvases. Switching away from Electric restores the native tabs and their previous inline styles.

### Library

The library view uses a compact header with two visual tabs, a rounded search row, and a two-column shape grid where the underlying sidebar markup permits it. Existing categories, drag/drop, lazy originals, and More Shapes behavior remain unchanged. Text and previews must not overflow their tiles.

## Right Inspector

The native Diagram/Style inspector remains functional but is restyled to Rayon density:

- 264 px desktop width.
- 14 px horizontal padding and 12-16 px section spacing.
- 32-36 px inputs and buttons with 8-10 px radii.
- Muted labels, stronger section headings, subtle separators.
- Checkbox/toggle groups and segmented controls read as one surface rather than unrelated draw.io buttons.
- Native controls are not removed unless an equivalent Electric control already exists.

## Bottom Tool Deck

The existing Electric toolbar becomes a two-row floating deck:

- Top row: existing insert, connector, history, zoom, grid, format, fullscreen, and native connector-style controls.
- Bottom row: live cursor coordinates in graph units and a compact current-page label/status area.

Buttons are 36 x 36 px, separated into functional groups. Active state uses the blue accent treatment. The tool deck remains centered in the visible canvas area, not the full browser width, and updates when either side panel changes.

## Interaction and State

- Page selection in Canvases calls the native `selectPage` path.
- Adding a canvas calls native `insertPage` and selects the new page.
- Page/model events refresh Canvases and Layers without losing keyboard focus.
- The coordinate readout updates from graph mouse movement and clears on mouse leave.
- Collapse, fullscreen, theme switching, and teardown restore native draw.io state without canvas jumps.
- All controls expose titles, ARIA labels, and keyboard activation.

## Responsive Behavior

- Above 1280 px: 44 / 264 / 264 shell dimensions.
- 961-1280 px: left and right panels may reduce to 248 px.
- 701-960 px: rail 44 px, panels may reduce to 232 px; bottom toolbar scrolls horizontally if needed.
- 700 px and below: preserve a minimum 96 px canvas gap and keep controls reachable; no text may overlap or force layout shifts.

## Verification

Completion requires:

1. Static/behavior tests for theme isolation, shell geometry, Canvases, native page-tab restoration, and bottom status behavior.
2. Full Electric test suite and production Docker build.
3. Same-viewport Chrome captures for Layers, Library, inspector, and toolbar states.
4. Side-by-side comparison against the references with no P0, P1, or P2 visual issues.
5. Regression checks for non-Electric themes, collapse/fullscreen behavior, and the existing production URL.

