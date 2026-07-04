#!/usr/bin/env python3
import argparse
import html
import json
import re
import shutil
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path


PAGES = {
    "EKF — автоматы": "ekf_breakers",
    "EKF — дифавтоматы 2M": "ekf_rcbo_2m",
    "EKF — клеммы UT (винтовые)": "ekf_ut",
    "MW — устройства": "mw_hdr",
}

SECTION_REWRITES = {
    "ВА 47-63 — 1P (19)": ("electric-ekf-breakers-1p", "EKF автоматы 1P"),
    "ВА 47-63 — 2P (9)": ("electric-ekf-breakers-2p", "EKF автоматы 2P"),
    "ВА 47-63 / 47-63N — 3P (14)": ("electric-ekf-breakers-3p", "EKF автоматы 3P"),
    "UT — Проходные серые (8)": ("electric-ekf-ut-gray", "EKF клеммы UT серые"),
    "UT — Проходные синие (8)": ("electric-ekf-ut-blue", "EKF клеммы UT синие"),
    "UT — PE / заземление (7)": ("electric-ekf-ut-pe", "EKF клеммы UT PE"),
    "UT — аксессуары / зажимы (1)": ("electric-ekf-ut-accessories", "EKF UT аксессуары"),
    "UT — заглушки SAK (4)": ("electric-ekf-ut-sak", "EKF UT заглушки SAK"),
}

RCBO_LEAKAGE_ORDER = ["10мА", "30мА", "100мА", "300мА"]
MW_VOLTAGE_ORDER = ["12V", "24V", "48V"]


def clean_text(value):
    value = html.unescape((value or "").replace("&nbsp;", " "))
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def slug(value):
    value = value.lower().replace(",", "_").replace("/", "_")
    value = re.sub(r"[^a-z0-9а-яё]+", "-", value)
    return value.strip("-")


def number(value, fallback=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def geometry(cell):
    geo = cell.find("mxGeometry")
    if geo is None:
        return 0.0, 0.0, 0.0, 0.0
    return (
        number(geo.get("x")),
        number(geo.get("y")),
        number(geo.get("width")),
        number(geo.get("height")),
    )


def layer_id(cells, by_parent):
    candidates = [
        cell for cell in cells
        if (cell.get("id") or "").endswith("layer") or
        (cell.get("id") or "").endswith("_layer")
    ]

    if not candidates:
        candidates = [
            cell for cell in cells
            if cell.get("parent") in ("0", "1") and len(by_parent[cell.get("id")]) > 10
        ]

    return max(candidates, key=lambda cell: len(by_parent[cell.get("id")])).get("id")


def descendants(root_id, by_parent):
    result = []

    def walk(parent_id):
        for child in by_parent.get(parent_id, []):
            result.append(child)
            walk(child.get("id"))

    walk(root_id)
    return result


def graph_model_for_device(device, by_parent):
    root = ET.Element("mxGraphModel")
    model_root = ET.SubElement(root, "root")
    ET.SubElement(model_root, "mxCell", {"id": "0"})
    ET.SubElement(model_root, "mxCell", {"id": "1", "parent": "0"})

    cells = [device] + descendants(device.get("id"), by_parent)

    for index, cell in enumerate(cells):
        copy = ET.fromstring(ET.tostring(cell, encoding="unicode"))

        if index == 0:
            copy.set("parent", "1")
            geo = copy.find("mxGeometry")

            if geo is not None:
                geo.set("x", "0")
                geo.set("y", "0")

        model_root.append(copy)

    return ET.tostring(root, encoding="unicode", short_empty_elements=True)


def table_data(card, by_parent):
    table = next(
        (child for child in by_parent[card.get("id")]
         if (child.get("id") or "").endswith("_table")),
        None,
    )
    data = {}

    if table is None:
        return data

    rows = {}

    for child in by_parent[table.get("id")]:
        match = re.search(r"_r(\d+)_(k|v)_text$", child.get("id") or "")

        if match:
            rows.setdefault(int(match.group(1)), {})[match.group(2)] = clean_text(child.get("value"))

    for row in sorted(rows):
        if "k" in rows[row] and "v" in rows[row]:
            data[rows[row]["k"]] = rows[row]["v"]

    return data


def title_for_item(data, fallback):
    if data.get("Модель"):
        return data["Модель"]

    series = data.get("Серия")
    marking = data.get("Маркировка")

    if series and marking:
        return f"{series} {marking}"

    if data.get("Артикул"):
        return data["Артикул"]

    return fallback


def item_kind(page_key):
    return {
        "ekf_breakers": "breaker",
        "ekf_rcbo_2m": "rcbo",
        "ekf_ut": "terminal",
        "mw_hdr": "psu",
    }[page_key]


def library_for_item(page_key, section, data):
    if page_key == "ekf_rcbo_2m":
        marking = data.get("Маркировка", "")

        for leakage in RCBO_LEAKAGE_ORDER:
            if leakage in marking:
                return f"electric-ekf-rcbo-2m-{leakage.replace('мА', 'ma')}", f"EKF дифавтоматы 2M {leakage}"

        return "electric-ekf-rcbo-2m-other", "EKF дифавтоматы 2M прочие"

    if page_key == "mw_hdr":
        source = f"{data.get('Модель', '')} {data.get('Выход', '')}"

        for voltage in MW_VOLTAGE_ORDER:
            if voltage in source:
                return f"electric-mw-hdr-{voltage.lower()}", f"MW устройства {voltage}"

        return "electric-mw-hdr-other", "MW устройства прочие"

    if section in SECTION_REWRITES:
        return SECTION_REWRITES[section]

    safe = slug(section or page_key)
    return f"electric-{safe}", section or page_key


def tags_for_item(entry, data):
    parts = [
        "electric", "электрика", "шкаф", "din", entry["title"],
        entry["libraryTitle"], entry["kind"],
    ]
    parts.extend(data.values())
    return " ".join(str(part) for part in parts if part)


def parse_items(base_drawio):
    doc = ET.parse(base_drawio)
    mxfile = doc.getroot()
    entries = []

    for page_name, page_key in PAGES.items():
        diagram = next(node for node in mxfile.findall("diagram") if node.get("name") == page_name)
        root = diagram.find("mxGraphModel/root")
        cells = root.findall(".//mxCell")
        by_parent = defaultdict(list)

        for cell in cells:
            by_parent[cell.get("parent")].append(cell)

        layer = layer_id(cells, by_parent)
        top = []

        for cell in by_parent[layer]:
            _, y, _, _ = geometry(cell)
            top.append((y, cell))

        top.sort(key=lambda item: item[0])

        sections = []

        for y, cell in top:
            label = clean_text(cell.get("value"))

            if "section" in (cell.get("id") or "") and label:
                sections.append((y, label))

        for y, card in top:
            card_id = card.get("id") or ""

            if not card_id.endswith("_card"):
                continue

            section = None

            for section_y, section_label in sections:
                if section_y < y:
                    section = section_label
                else:
                    break

            device = next(
                (child for child in by_parent[card_id]
                 if (child.get("id") or "").endswith("_device")),
                None,
            )

            if device is None:
                raise RuntimeError(f"Device group not found for {card_id}")

            data = table_data(card, by_parent)
            x, y0, width, height = geometry(device)
            library_id, library_title = library_for_item(page_key, section, data)
            title = title_for_item(data, card_id)
            item_id = f"{library_id}-{slug(data.get('Артикул') or data.get('Модель') or card_id)}"
            original_file = f"items/{item_id}.xml"
            entry = {
                "id": item_id,
                "libraryId": library_id,
                "libraryTitle": library_title,
                "kind": item_kind(page_key),
                "title": title,
                "width": round(width, 3),
                "height": round(height, 3),
                "original": original_file,
                "section": section,
                "data": data,
            }
            entry["tags"] = tags_for_item(entry, data)
            entry["_xml"] = graph_model_for_device(device, by_parent)
            entries.append(entry)

    return entries


def write_manifest(entries, output_dir):
    libraries = {}

    for entry in entries:
        libraries.setdefault(entry["libraryId"], {
            "id": entry["libraryId"],
            "title": entry["libraryTitle"],
            "items": [],
        })["items"].append({key: value for key, value in entry.items() if key != "_xml"})

    order = [
        "electric-ekf-breakers-1p",
        "electric-ekf-breakers-2p",
        "electric-ekf-breakers-3p",
        "electric-ekf-rcbo-2m-10ma",
        "electric-ekf-rcbo-2m-30ma",
        "electric-ekf-rcbo-2m-100ma",
        "electric-ekf-rcbo-2m-300ma",
        "electric-ekf-ut-gray",
        "electric-ekf-ut-blue",
        "electric-ekf-ut-pe",
        "electric-ekf-ut-accessories",
        "electric-ekf-ut-sak",
        "electric-mw-hdr-12v",
        "electric-mw-hdr-24v",
        "electric-mw-hdr-48v",
    ]
    sorted_libraries = [libraries[key] for key in order if key in libraries]
    sorted_libraries.extend(libraries[key] for key in sorted(libraries) if key not in order)

    manifest = {
        "version": 1,
        "title": "Electric",
        "source": "base.drawio",
        "libraries": sorted_libraries,
        "sources": [
            {
                "vendor": "EKF",
                "url": "https://ekfgroup.com/ru/catalog/products/avtomaticheskij-vyklyuchatel-1p-10a-c-6ka-va-47-63-ekf-proxima",
                "covers": "ВА 47-63 EKF breakers",
            },
            {
                "vendor": "EKF",
                "url": "https://ekfgroup.com/ru/catalog/products/differencialnyj-avtomat-avdt-63n-1p-n-6a-b-10ma-a-el-6ka-proxima-ekf",
                "covers": "АВДТ-63N EKF RCBO",
            },
            {
                "vendor": "EKF",
                "url": "https://ekfgroup.com/ru/catalog/klemmnye-kolodki-ut-vintovye",
                "covers": "EKF UT screw terminals",
            },
            {
                "vendor": "MEAN WELL",
                "url": "https://www.meanwell.com/Upload/PDF/HDR%20DIN%20rail%20power%20supply.pdf",
                "covers": "MEAN WELL HDR DIN rail power supplies",
            },
        ],
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    items_dir = output_dir / "items"
    items_dir.mkdir(parents=True, exist_ok=True)

    for old in items_dir.glob("*.xml"):
        old.unlink()

    for entry in entries:
        (output_dir / entry["original"]).write_text(entry["_xml"], encoding="utf-8")

    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("base_drawio", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()

    if args.output_dir.exists():
        shutil.rmtree(args.output_dir)

    entries = parse_items(args.base_drawio)
    write_manifest(entries, args.output_dir)
    print(f"Generated {len(entries)} Electric shape items in {args.output_dir}")


if __name__ == "__main__":
    main()
