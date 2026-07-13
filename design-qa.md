# Electric Rayon Interface Design QA

## Reference

- Rayon Library and inspector: `/Users/aleksandersk/.codex/attachments/da3c8a53-f121-4e5d-bc2a-45c8350b4a2c/image-2.png`
- Rayon Canvases/Layers shell: `/Users/aleksandersk/.codex/attachments/da3c8a53-f121-4e5d-bc2a-45c8350b4a2c/image-3.png`
- Original user references: `/Users/aleksandersk/Downloads/User attachment.png`, `/Users/aleksandersk/Downloads/User attachment (1).png`, `/Users/aleksandersk/Downloads/User attachment (2).png`.
- Scope: Electric theme only; native draw.io actions and non-Electric themes remain unchanged.

## Local Browser QA

Source: isolated production image `drawio-electric:rayon-audit-final3` through
`http://127.0.0.1:18766/?ui=electric&offline=1`.

Reviewed and served `Electric.js` SHA-256:
`0a740a2ba0656e720463d445064898513f2000a508301d88cd9a94b2587e2d10`.

| Viewport | Screenshot | Result |
| --- | --- | --- |
| 1510 x 790 | `/tmp/drawio-electric-qa/audit-final-1510x790.png` | passed |
| 1039 x 790 | `/tmp/drawio-electric-qa/audit-final-1039x790.png` | passed |
| 961 x 790 | `/tmp/drawio-electric-qa/audit-final-961x790.png` | passed |
| 700 x 790 | `/tmp/drawio-electric-qa/audit-final-700x790.png` | passed |

Measured breakpoints: `700`, `960`, `961`, `1000`, `1039`, `1040`, `1280`, and `1510` px.

- Left rail, Library/Layers surface, canvas, inspector, and tool deck do not overlap.
- Tool-deck widths are `132`, `420`, `401`, `440`, `479`, `480`, `560`, and `620` px respectively.
- After collapsing the left panel, tool-deck widths are `560`, `560`, and `396` px at `1039`, `960`, and `700` px viewports. In fullscreen they are `560`, `560`, and `440` px at the same viewports, so hidden surfaces no longer reserve layout space.
- Inspector controls have no horizontal clipping at the measured widths.
- Native page tabs remain hidden while Electric Canvases is present.
- Library has two accessible tabs and a two-column grid while preserving native shape nodes; the expanded state is recorded in `/tmp/drawio-electric-qa/audit-final-library-expanded-1510x790.png`.
- ArrowLeft/ArrowRight and Home/End use roving tab focus; activating Find shapes focuses `#geOmniSearch`.
- Canvases use roving focus with ArrowUp/ArrowDown and Home/End. `F2` opens native page rename, while `Shift+F10` opens a keyboard-operable native page menu. Chrome QA executed duplicate, move submenu navigation, remove, Escape, and focus restoration; the menu is recorded in `/tmp/drawio-electric-qa/audit-final-page-menu-1510x790.png`.
- Cursor coordinates are `aria-hidden`; only the page counter is an isolated polite live region, so pointer movement does not generate screen-reader announcements.
- Two native pages load in `chrome=0` without Electric shell nodes or page-tab mutations: `/tmp/drawio-electric-qa/audit-final-chromeless-1510x790.png`.
- Left-panel collapse/expand and fullscreen enter/exit preserve the background-page position with `0 px` delta and recompute the tool-deck width immediately.
- Browser console and page error list is empty after application startup.

## Automated QA

- `node --check src/main/webapp/js/diagramly/Electric.js`: passed.
- `node --test test/electric-*.test.js`: 16/16 passed.
- Electric catalog verification: 297 items in 18 libraries, passed.
- Docker production build and Ant WAR compilation from the reviewed exact tree: passed.
- Production-image preflight: `/tmp/drawio-electric-qa/audit-final-1510x790.png`, `/tmp/drawio-electric-qa/audit-final-1039x790.png`, `/tmp/drawio-electric-qa/audit-final-961x790.png`, `/tmp/drawio-electric-qa/audit-final-700x790.png`.
- Fresh reference/implementation side-by-side: `/tmp/drawio-electric-qa/comparison-reference-vs-audit-final-1510x790.png` (Rayon Canvases/Layers reference on the left, the exact reviewed production image on the right).
- Expanded production Library grid: `/tmp/drawio-electric-qa/audit-final-library-expanded-1510x790.png`, native General items remain draggable in two columns.
- Production Canvases state: `/tmp/drawio-electric-qa/audit-final-layers-1510x790.png`, page count changed from 1 to 2 through the native page API; `/tmp/drawio-electric-qa/audit-final-page-menu-1510x790.png` records the complete native page operations menu.
- Chromeless regression: `/tmp/drawio-electric-qa/audit-final-chromeless-1510x790.png`; two pages loaded, no Electric shell nodes or page-tab inline mutation.
- Kennedy regression: `/tmp/drawio-electric-qa/audit-final-kennedy-1510x790.png`; no Electric nodes, native menubar/toolbar/page tabs visible, no browser errors.
- Browser provider: installed Chrome through Playwright fallback because the session did not expose the in-app/Chrome browser-control runtime.
- Independent review: `ACCEPT`; no P0-P2 findings. The auditor independently reran syntax, all 16 Electric tests, the 297-item/18-library catalog verifier, exact served-source hash checks, keyboard-only menu navigation, responsive collapse/fullscreen transitions, and visual regressions.
- Public deployment smoke: pending final record.

## Findings

- P0: none.
- P1: none.
- P2: none after remediation.
- P3: at very narrow widths the tool deck intentionally scrolls its native action row instead of shrinking icon targets below 32 px.

## Prior Baseline Evidence

The first Rayon-inspired pass established the Electric-only rail, Library/Layers overlay, fixed inspector, floating toolbar, native connector selector, connector-style picker, fullscreen state, focus handling, dark mode, and Kennedy isolation. Its Chrome artifacts remain available at:

- `/tmp/drawio-rayon-final-light-1440.png`
- `/tmp/drawio-rayon-final-light-1024.png`
- `/tmp/drawio-rayon-final-700-v3.png`
- `/tmp/drawio-rayon-final-layers-1440.png`
- `/tmp/drawio-rayon-final-style-picker-1440-v2.png`
- `/tmp/drawio-rayon-final-fullscreen-1440-v2.png`
- `/tmp/drawio-rayon-final-dark-1440-v2.png`
- `/tmp/drawio-rayon-final-non-electric-1440.png`

The current fidelity pass supersedes the old 56/48 px rail and 360/352 px panel geometry with the measured 44/264/264 px desktop geometry, adds native Canvases, and closes the responsive and Library gaps recorded by the independent audit.

Final result: independent review passed; public deployment smoke remains pending until the reviewed commit is pushed and deployed.
