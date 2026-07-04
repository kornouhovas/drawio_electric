#!/usr/bin/env python3
import argparse
import json
import sys
from collections import Counter
from pathlib import Path


EXPECTED_COUNTS = {
    "electric-ekf-breakers-1p": 19,
    "electric-ekf-breakers-2p": 9,
    "electric-ekf-breakers-3p": 14,
    "electric-ekf-rcbo-2m-10ma": 40,
    "electric-ekf-rcbo-2m-30ma": 46,
    "electric-ekf-rcbo-2m-100ma": 38,
    "electric-ekf-rcbo-2m-300ma": 28,
    "electric-ekf-ut": 28,
    "electric-mw-hdr-12v": 6,
    "electric-mw-hdr-24v": 6,
    "electric-mw-hdr-48v": 6,
}


def fail(message):
    print(message, file=sys.stderr)
    return 1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("shape_dir", type=Path)
    args = parser.parse_args()

    manifest_path = args.shape_dir / "manifest.json"

    if not manifest_path.exists():
        return fail(f"Missing manifest: {manifest_path}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    libraries = manifest.get("libraries", [])
    counts = {library["id"]: len(library.get("items", [])) for library in libraries}

    if counts != EXPECTED_COUNTS:
        return fail(f"Unexpected library counts:\nexpected={EXPECTED_COUNTS}\nactual={counts}")

    all_items = [item for library in libraries for item in library.get("items", [])]

    if len(all_items) != 240:
        return fail(f"Expected 240 items, got {len(all_items)}")

    ids = [item["id"] for item in all_items]
    duplicates = [item_id for item_id, count in Counter(ids).items() if count > 1]

    if duplicates:
        return fail(f"Duplicate item ids: {duplicates[:10]}")

    for library in libraries:
        if "4p" in library["id"].lower() or "4p" in library["title"].lower() or "4р" in library["title"].lower():
            return fail(f"Unexpected 4P library: {library['id']} {library['title']}")

    for item in all_items:
        for key in ("id", "libraryId", "kind", "title", "width", "height", "original", "data", "tags"):
            if key not in item:
                return fail(f"Missing {key} in {item.get('id')}")

        original = args.shape_dir / item["original"]

        if not original.exists():
            return fail(f"Missing original file for {item['id']}: {original}")

        text = original.read_text(encoding="utf-8")

        if "_outer_frame" in text or "_table_" in text:
            return fail(f"Original still contains frame/table data: {item['id']}")

        if "<mxGraphModel" not in text or "<root>" not in text:
            return fail(f"Original is not a graph model: {item['id']}")

    terminal_libraries = [library for library in libraries if library["id"].startswith("electric-ekf-ut")]

    if len(terminal_libraries) != 1 or terminal_libraries[0]["id"] != "electric-ekf-ut":
        return fail(f"Expected one merged terminal library, got {[library['id'] for library in terminal_libraries]}")

    print("Electric shapes manifest verified: 240 items, 11 libraries, merged UT terminals, no EKF 4P")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
