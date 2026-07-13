# Electric Rayon Interface Design QA

- Source visual truth:
  - `/Users/aleksandersk/Downloads/User attachment.png`
  - `/Users/aleksandersk/Downloads/User attachment (1).png`
  - `/Users/aleksandersk/Downloads/User attachment (2).png`
- Implementation: `src/main/webapp/js/diagramly/Electric.js`
- Browser: Google Chrome, local `?dev=1&ui=electric`
- Viewports: 1440x900, 1024x768, 700x900

## Full-view comparison evidence

- The native menubar and toolbar are hidden in the default Electric workspace and remain available from the rail hamburger button.
- The Electric rail is 56px on desktop and 48px on narrow screens.
- Library and Layers render as a left overlay, while the inspector remains a fixed right column.
- The bottom toolbar is centered in the free workspace between visible panels and becomes horizontally scrollable when space is constrained.
- The native connector selector is preserved in the bottom toolbar.
- The connector style picker is a nonmodal inspector-side popover without a backdrop.
- At 700px the left panel, bottom toolbar, and right inspector keep explicit gaps and produce no horizontal document overflow.

## Focused interaction evidence

- Repeated Library or Layers selection collapses the left overlay without changing the graph viewport bounds.
- Collapsed and fullscreen surfaces receive `aria-hidden` and `inert`.
- Fullscreen keeps the graph viewport stable, removes the hidden rail grid track, moves the overlay completely offscreen, and exits through Escape.
- The rail hamburger restores the native menubar and toolbar, then returns to the Rayon workspace without losing state.
- Switching Library/Layers moves focus out of the panel that becomes inert.
- The connector picker is singleton, exposes a semantic list with roving keyboard focus, supports arrow/Home/End traversal, and closes during Electric teardown.
- The native connector selector restores its original title and inline presentation after Electric teardown.
- Library disclosure images render once rather than tiling across headings.
- Dark mode uses the Electric surface tokens with legible rail and toolbar icons.
- Kennedy mode has no Electric rail or shell and retains the native menubar and toolbar.

## Validation artifacts

- `/tmp/drawio-rayon-final-light-1440.png`
- `/tmp/drawio-rayon-final-light-1024.png`
- `/tmp/drawio-rayon-final-700-v3.png`
- `/tmp/drawio-rayon-final-layers-1440.png`
- `/tmp/drawio-rayon-final-style-picker-1440-v2.png`
- `/tmp/drawio-rayon-final-fullscreen-1440-v2.png`
- `/tmp/drawio-rayon-final-dark-1440-v2.png`
- `/tmp/drawio-rayon-final-non-electric-1440.png`

## Comparison history

The first rendered pass exposed native top chrome, tiled disclosure icons, a centered modal style picker, an incomplete bottom toolbar, panel overlap at narrow widths, an absent native connector selector, fullscreen synchronization and offset defects, stale focus in inert panels, and a stackable connector picker. Each issue was corrected and rechecked in Chrome against the reference screenshots in the same visual context.

final result: pass
