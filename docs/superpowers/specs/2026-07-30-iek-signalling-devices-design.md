# IEK signalling devices

## Goal

Add the two IEK DIN-rail signalling devices visible in the supplied cabinet
photo to Electric Shapes. The change is limited to the Electric theme and the
existing asynchronous shape catalog.

## Devices

| Item | Part number | Appearance | Physical size |
| --- | --- | --- | --- |
| IEK LС-47 signal lamp, red, 230 V | MLS10-230-K04 | White single-module enclosure with a red square lens and yellow LС-47 band | 18 x 65 x 78 mm |
| IEK ZD-47 DIN-rail bell, 230 V | MZD10-230 | White single-module enclosure with IEK band, bell icon and horizontal sound slots | 18 x 68.5 x 84 mm |

The photo identifies the manufacturer as IEK. Both devices occupy one DIN
module, so their canvas geometry uses the real 18 mm width and preserves each
device's front-height proportion.

## Catalog and assets

- Add a source page named `IEK — сигнализация` to `base.drawio`.
- Add a generated library `electric-iek-signalling` titled `IEK сигнализация`.
- Store each device as a compact, original PNG illustration embedded in its
  source shape, following the existing Wiren Board image-shape pattern.
- The illustrations reproduce the identifying front-panel layout and colours
  but do not copy a supplier photograph.
- Reuse the catalog's current lazy original loading. The catalogue embeds only
  small previews; the complete device XML is requested when the user inserts
  the device.

## Generator changes

- Extend the generator's page map, vendor/source metadata, item kind and
  deterministic library order for `iek_signalling`.
- Generate and validate PNG previews for IEK image devices with the same size
  constraint applied to Wiren Board previews.
- Record official IEK source URLs for the lamp and bell in each item.

## Quality checks

- Add a static catalog test for the IEK library and its two stable item IDs.
- Extend manifest verification with expected counts, source image preview
  presence and actual file-size checks.
- Regenerate catalog, originals and previews from the versioned source.
- Run all Electric Node tests and the catalog verifier.

## Compatibility

Existing catalogs, SVG/mxGraph devices and non-Electric themes remain
unchanged. The new image cells are regular Electric device groups, so they
retain existing selection, snapping, layer and drag/drop behaviour.
