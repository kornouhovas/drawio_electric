#!/usr/bin/env python3
import argparse
import gzip
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path


EXPECTED_COUNTS = {
    "electric-ekf-breakers-1p-b": 9,
    "electric-ekf-breakers-1p-c": 7,
    "electric-ekf-breakers-1p-d": 3,
    "electric-ekf-breakers-2p-b": 2,
    "electric-ekf-breakers-2p-c": 6,
    "electric-ekf-breakers-2p-d": 1,
    "electric-ekf-breakers-3p-b": 3,
    "electric-ekf-breakers-3p-c": 6,
    "electric-ekf-breakers-3p-d": 5,
    "electric-ekf-rcbo-2m-10ma": 40,
    "electric-ekf-rcbo-2m-30ma": 46,
    "electric-ekf-rcbo-2m-100ma": 38,
    "electric-ekf-rcbo-2m-300ma": 28,
    "electric-ekf-ut": 28,
    "electric-mw-hdr-12v": 6,
    "electric-mw-hdr-24v": 6,
    "electric-mw-hdr-48v": 6,
    "electric-wb-devices": 57,
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

    if manifest.get("version") != 2:
        return fail(f"Expected manifest version 2, got {manifest.get('version')}")

    source_hash = manifest.get("sourceSha256", "")

    if len(source_hash) != 64 or manifest.get("assetVersion") != source_hash[:16]:
        return fail("Manifest sourceSha256/assetVersion is invalid")

    catalog_path = args.shape_dir / "catalog.js"

    if not catalog_path.exists():
        return fail(f"Missing browser catalog: {catalog_path}")

    catalog_text = catalog_path.read_text(encoding="utf-8").strip()
    prefix = "Editor.electricShapeCatalog = "

    if not catalog_text.startswith(prefix) or not catalog_text.endswith(";"):
        return fail("Browser catalog has an invalid wrapper")

    browser_manifest = json.loads(catalog_text[len(prefix):-1])

    if browser_manifest != manifest:
        return fail("catalog.js does not match manifest.json")

    source_path = Path.cwd() / manifest.get("source", "")

    if source_path.exists():
        if source_path.suffix == ".gz":
            with gzip.open(source_path, "rb") as source:
                actual_hash = hashlib.sha256(source.read()).hexdigest()
        else:
            actual_hash = hashlib.sha256(source_path.read_bytes()).hexdigest()

        if actual_hash != source_hash:
            return fail(f"Source hash mismatch for {source_path}")
    libraries = manifest.get("libraries", [])
    counts = {library["id"]: len(library.get("items", [])) for library in libraries}

    if counts != EXPECTED_COUNTS:
        return fail(f"Unexpected library counts:\nexpected={EXPECTED_COUNTS}\nactual={counts}")

    all_items = [item for library in libraries for item in library.get("items", [])]

    expected_total = sum(EXPECTED_COUNTS.values())

    if len(all_items) != expected_total:
        return fail(f"Expected {expected_total} items, got {len(all_items)}")

    ids = [item["id"] for item in all_items]
    duplicates = [item_id for item_id, count in Counter(ids).items() if count > 1]

    if duplicates:
        return fail(f"Duplicate item ids: {duplicates[:10]}")

    titles = [item["title"] for item in all_items]
    duplicate_titles = [title for title, count in Counter(titles).items() if count > 1]

    if duplicate_titles:
        return fail(f"Duplicate item titles: {duplicate_titles[:10]}")

    for library in libraries:
        if "4p" in library["id"].lower() or "4p" in library["title"].lower() or "4р" in library["title"].lower():
            return fail(f"Unexpected 4P library: {library['id']} {library['title']}")

        if library["id"].startswith("electric-ekf-breakers-"):
            if "характеристика" not in library["title"]:
                return fail(f"Breaker library title does not include characteristic: {library['title']}")

            expected_curve = library["id"].rsplit("-", 1)[-1].upper()

            if f"характеристика {expected_curve}" not in library["title"]:
                return fail(f"Breaker library title has wrong characteristic: {library['title']}")

            for item in library.get("items", []):
                marking = item.get("data", {}).get("Маркировка", "")

                if f" {expected_curve}" not in marking:
                    return fail(f"Breaker item is in wrong characteristic group: {library['id']} {marking}")

    for item in all_items:
        for key in ("id", "libraryId", "kind", "title", "width", "height",
                    "original", "data", "tags", "sourceUrl", "sourceKey"):
            if key not in item:
                return fail(f"Missing {key} in {item.get('id')}")

        if not item["data"].get("Производитель"):
            return fail(f"Missing manufacturer in {item['id']}")

        if not item["sourceUrl"].startswith("https://"):
            return fail(f"Invalid source URL in {item['id']}: {item['sourceUrl']}")

        original = args.shape_dir / item["original"]

        if not original.exists():
            return fail(f"Missing original file for {item['id']}: {original}")

        text = original.read_text(encoding="utf-8")

        if "_outer_frame" in text or "_table_" in text:
            return fail(f"Original still contains frame/table data: {item['id']}")

        if "<mxGraphModel" not in text or "<root>" not in text:
            return fail(f"Original is not a graph model: {item['id']}")

        if item.get("kind") == "psu" and (
            "_device_din_slot" in text or
            "fillColor=#f0f0f0;strokeColor=#222;strokeWidth=0.5" in text
        ):
            return fail(f"MW original contains removed DIN stripe: {item['id']}")

        if item.get("kind") == "terminal" and "_marking" in text:
            return fail(f"UT original contains a canvas label: {item['id']}")

        if item.get("kind") == "wb":
            if item.get("libraryId") != "electric-wb-devices":
                return fail(f"Wiren Board item is outside merged library: {item['id']} {item.get('libraryId')}")

            preview = item.get("preview")

            if not preview:
                return fail(f"Missing Wiren Board preview for {item['id']}")

            preview_path = args.shape_dir / preview

            if not preview_path.exists():
                return fail(f"Missing Wiren Board preview file for {item['id']}: {preview_path}")

            if preview_path.stat().st_size >= original.stat().st_size:
                return fail(f"Wiren Board preview is not lighter than original: {item['id']}")

    terminal_libraries = [library for library in libraries if library["id"].startswith("electric-ekf-ut")]

    if len(terminal_libraries) != 1 or terminal_libraries[0]["id"] != "electric-ekf-ut":
        return fail(f"Expected one merged terminal library, got {[library['id'] for library in terminal_libraries]}")

    expected_originals = {item["original"] for item in all_items}
    actual_originals = {
        str(path.relative_to(args.shape_dir))
        for path in (args.shape_dir / "items").glob("*.xml")
    }

    if actual_originals != expected_originals:
        return fail(
            "Original file set does not match manifest: "
            f"missing={sorted(expected_originals - actual_originals)[:5]} "
            f"orphaned={sorted(actual_originals - expected_originals)[:5]}"
        )

    print(
        "Electric shapes manifest verified: "
        f"{expected_total} items, {len(EXPECTED_COUNTS)} libraries, "
        "breaker B/C/D groups, merged UT terminals, merged Wiren Board library, no EKF 4P"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
