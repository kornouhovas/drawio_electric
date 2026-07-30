#!/usr/bin/env python3
import argparse
import base64
import gzip
import hashlib
import html
import io
import json
import os
import re
import shutil
import struct
import urllib.parse
import xml.etree.ElementTree as ET
import zlib
from collections import defaultdict
from pathlib import Path


PAGES = {
    "EKF — автоматы": "ekf_breakers",
    "EKF — дифавтоматы 2M": "ekf_rcbo_2m",
    "EKF — клеммы UT (винтовые)": "ekf_ut",
    "MW — устройства": "mw_hdr",
    "IEK — сигнализация": "iek_signalling",
    "Wiren Board — контроллеры": "wb_controllers",
    "Wiren Board — устройства": "wb_devices",
}

BREAKER_SECTIONS = {
    "ВА 47-63 — 1P (19)": "1P",
    "ВА 47-63 — 2P (9)": "2P",
    "ВА 47-63 / 47-63N — 3P (14)": "3P",
}

BREAKER_CURVE_ORDER = ["B", "C", "D"]
RCBO_LEAKAGE_ORDER = ["10мА", "30мА", "100мА", "300мА"]
MW_VOLTAGE_ORDER = ["12V", "24V", "48V"]
WB_LIBRARY_ID = "electric-wb-devices"
WB_LIBRARY_TITLE = "Wiren Board устройства"
IEK_SIGNALLING_LIBRARY_ID = "electric-iek-signalling"
IEK_SIGNALLING_LIBRARY_TITLE = "IEK сигнализация"
WB_PREVIEW_MAX_SIZE = 360
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"

PAGE_VENDOR = {
    "ekf_breakers": "EKF",
    "ekf_rcbo_2m": "EKF",
    "ekf_ut": "EKF",
    "mw_hdr": "MEAN WELL",
    "iek_signalling": "IEK",
    "wb_controllers": "Wiren Board",
    "wb_devices": "Wiren Board",
}

SOURCE_URLS = {
    "ekf_breakers": "https://ekfgroup.com/ru/catalog/avtomaticheskie-vyklyuchateli",
    "ekf_rcbo_2m": "https://ekfgroup.com/ru/catalog/differencialnye-avtomaty",
    "ekf_ut": "https://ekfgroup.com/ru/catalog/klemmnye-kolodki-ut-vintovye",
    "mw_hdr": "https://www.meanwell.com/Upload/PDF/HDR%20DIN%20rail%20power%20supply.pdf",
    "iek_signalling": "https://www.iek.ru/products/catalog/modulnoe_oborudovanie/modulnoe_oborudovanie_karat/dopolnitelnye_ustroystva_karat/",
    "wb_controllers": "https://wirenboard.com/",
    "wb_devices": "https://wirenboard.com/",
}

IEK_SIGNALLING_SOURCE_URLS = {
    "MLS10-230-K04": "https://www.iek.ru/products/catalog/modulnoe_oborudovanie/modulnoe_oborudovanie_karat/dopolnitelnye_ustroystva_karat/signalnye_lampy/lampa_signalnaya_ls_47_neon_krasnaya_iek",
    "MZD10-230": "https://www.iek.ru/products/catalog/modulnoe_oborudovanie/modulnoe_oborudovanie_karat/dopolnitelnye_ustroystva_karat/prochie_dopolnitelnye_ustroystva/zvonok_zd_47_na_din_reyku_iek",
}

MW_TERMINAL_LAYOUTS = {
    "HDR-15": {
        "top": [("+V", 0.44), ("-V", 0.60)],
        "bottom": [("N", 0.44), ("L", 0.60)],
    },
    "HDR-30": {
        "top": [("-V", 0.62), ("+V", 0.76)],
        "bottom": [("N", 0.40), ("L", 0.68)],
    },
    "HDR-60": {
        "top": [("-V", 0.28), ("-V", 0.38), ("+V", 0.48), ("+V", 0.58)],
        "bottom": [("L", 0.22), ("N", 0.38)],
    },
    "HDR-100": {
        "top": [("-V", 0.43), ("-V", 0.50), ("+V", 0.57), ("+V", 0.64)],
        "bottom": [("L", 0.12), ("N", 0.28)],
    },
    "HDR-150": {
        "top": [("-V", 0.12), ("-V", 0.17), ("+V", 0.22), ("+V", 0.27)],
        "bottom": [("N", 0.82), ("L", 0.91)],
    },
}


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


def electric_cell(cell_id, parent_id, value, style, x, y, width, height):
    cell = ET.Element("mxCell", {
        "id": cell_id,
        "parent": parent_id,
        "style": style,
        "value": value,
        "vertex": "1",
    })
    ET.SubElement(cell, "mxGeometry", {
        "x": f"{x:.3f}",
        "y": f"{y:.3f}",
        "width": f"{width:.3f}",
        "height": f"{height:.3f}",
        "as": "geometry",
    })
    return cell


def mw_series(data):
    value = f"{data.get('Серия', '')} {data.get('Модель', '')}"
    match = re.search(r"HDR-(150|100|60|30|15)", value)
    return f"HDR-{match.group(1)}" if match is not None else None


def normalized_mw_terminals(device, data):
    _, _, width, height = geometry(device)
    device_id = device.get("id")
    layout = MW_TERMINAL_LAYOUTS.get(mw_series(data))

    if layout is None or width <= 0 or height <= 0:
        raise RuntimeError(f"Unsupported MW terminal layout for {device_id}")

    result = []
    terminal_size = 8.4
    terminal_style = (
        "ellipse;whiteSpace=wrap;html=1;fillColor=#050606;"
        "strokeColor=none;strokeWidth=0.5;"
    )

    for side in ("top", "bottom"):
        for index, (label, relative_x) in enumerate(layout[side]):
            center_x = width * relative_x

            if side == "top":
                terminal_y = height * 0.064 - terminal_size / 2
                label_y = height * 0.083
                label_height = max(10.0, height * 0.032)
                font_size = 5
                font_color = "#d9d0a2"
            else:
                terminal_y = height * 0.949 - terminal_size / 2
                label_y = height * 0.875
                label_height = max(14.0, height * 0.04)
                font_size = 8
                font_color = "#e7e7e7"

            result.append(electric_cell(
                f"{device_id}_{side}_term_{index}", device_id, "",
                terminal_style, center_x - terminal_size / 2, terminal_y,
                terminal_size, terminal_size,
            ))
            result.append(electric_cell(
                f"{device_id}_{side}_lab_{index}", device_id, label,
                "text;html=1;strokeColor=none;fillColor=none;align=center;"
                "verticalAlign=middle;fontSize=" + str(font_size) +
                ";fontColor=" + font_color +
                ";whiteSpace=wrap;spacing=0;overflow=hidden;",
                center_x - 12, label_y, 24, label_height,
            ))

    return result


def normalize_device_cells(cells, page_key, data):
    if not cells:
        return cells

    device = cells[0]
    device_id = device.get("id") or ""
    _, _, _, device_height = geometry(device)
    result = []

    for cell in cells:
        cell_id = cell.get("id") or ""

        if page_key == "mw_hdr" and (
            cell_id.endswith("_device_din_slot") or
            re.search(r"_device_(top|bottom)_(term|lab)_\d+$", cell_id)
        ):
            continue

        if page_key == "ekf_ut" and "_marking" in cell_id:
            _, y, _, _ = geometry(cell)

            if y >= device_height - 0.1:
                continue

        result.append(cell)

    if page_key == "mw_hdr":
        result.extend(normalized_mw_terminals(device, data))

    return result


def graph_model_for_device(device, by_parent, page_key, data,
                           force_root_connectable=False):
    root = ET.Element("mxGraphModel")
    model_root = ET.SubElement(root, "root")
    ET.SubElement(model_root, "mxCell", {"id": "0"})
    ET.SubElement(model_root, "mxCell", {"id": "1", "parent": "0"})

    cells = normalize_device_cells(
        [device] + descendants(device.get("id"), by_parent), page_key, data
    )

    for index, cell in enumerate(cells):
        copy = ET.fromstring(ET.tostring(cell, encoding="unicode"))

        if index == 0:
            copy.set("parent", "1")

            if force_root_connectable:
                copy.attrib.pop("connectable", None)
            geo = copy.find("mxGeometry")

            if geo is not None:
                geo.set("x", "0")
                geo.set("y", "0")

        model_root.append(copy)

    return ET.tostring(root, encoding="unicode", short_empty_elements=True)


def png_chunk(kind, payload):
    checksum = zlib.crc32(kind + payload) & 0xffffffff
    return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", checksum)


def png_chunks(data):
    if not data.startswith(PNG_SIGNATURE):
        raise ValueError("not a png")

    position = len(PNG_SIGNATURE)

    while position < len(data):
        length = struct.unpack(">I", data[position:position + 4])[0]
        kind = data[position + 4:position + 8]
        payload = data[position + 8:position + 8 + length]
        position += length + 12
        yield kind, payload

        if kind == b"IEND":
            break


def paeth_predictor(left, up, upper_left):
    p = left + up - upper_left
    pa = abs(p - left)
    pb = abs(p - up)
    pc = abs(p - upper_left)

    if pa <= pb and pa <= pc:
        return left

    if pb <= pc:
        return up

    return upper_left


def unfilter_png_rows(raw, width, height, bytes_per_pixel):
    stride = width * bytes_per_pixel
    rows = []
    previous = bytearray(stride)
    position = 0

    for _ in range(height):
        filter_type = raw[position]
        position += 1
        scanline = bytearray(raw[position:position + stride])
        position += stride
        row = bytearray(stride)

        for index, value in enumerate(scanline):
            left = row[index - bytes_per_pixel] if index >= bytes_per_pixel else 0
            up = previous[index]
            upper_left = previous[index - bytes_per_pixel] if index >= bytes_per_pixel else 0

            if filter_type == 0:
                result = value
            elif filter_type == 1:
                result = value + left
            elif filter_type == 2:
                result = value + up
            elif filter_type == 3:
                result = value + ((left + up) // 2)
            elif filter_type == 4:
                result = value + paeth_predictor(left, up, upper_left)
            else:
                raise ValueError(f"unsupported png filter {filter_type}")

            row[index] = result & 0xff

        rows.append(bytes(row))
        previous = row

    return rows


def resize_png_nearest(data, max_size=WB_PREVIEW_MAX_SIZE):
    chunks = list(png_chunks(data))
    ihdr = next(payload for kind, payload in chunks if kind == b"IHDR")
    width, height, bit_depth, color_type, compression, filter_method, interlace = struct.unpack(">IIBBBBB", ihdr)

    bytes_per_pixel = {
        0: 1,
        2: 3,
        3: 1,
        4: 2,
        6: 4,
    }.get(color_type)

    if bit_depth != 8 or compression != 0 or filter_method != 0 or interlace != 0 or bytes_per_pixel is None:
        raise ValueError("unsupported png format")

    scale = min(1.0, float(max_size) / max(width, height))
    new_width = max(1, int(round(width * scale)))
    new_height = max(1, int(round(height * scale)))
    idat = b"".join(payload for kind, payload in chunks if kind == b"IDAT")
    rows = unfilter_png_rows(zlib.decompress(idat), width, height, bytes_per_pixel)
    output_rows = []

    for y in range(new_height):
        source_y = min(height - 1, int(y * height / new_height))
        source_row = rows[source_y]
        output_row = bytearray()

        for x in range(new_width):
            source_x = min(width - 1, int(x * width / new_width))
            start = source_x * bytes_per_pixel
            output_row.extend(source_row[start:start + bytes_per_pixel])

        output_rows.append(b"\x00" + bytes(output_row))

    output = [PNG_SIGNATURE]
    output.append(png_chunk(
        b"IHDR",
        struct.pack(">IIBBBBB", new_width, new_height, bit_depth, color_type, compression, filter_method, interlace),
    ))

    for kind, payload in chunks:
        if kind in (b"PLTE", b"tRNS"):
            output.append(png_chunk(kind, payload))

    output.append(png_chunk(b"IDAT", zlib.compress(b"".join(output_rows), 9)))
    output.append(png_chunk(b"IEND", b""))

    return b"".join(output)


def png_image_from_cell(cell):
    style = cell.get("style") or ""
    match = re.search(r"image=data:image/png%3Bbase64,([^;\"]+)", style)

    if match is None:
        return None

    return base64.b64decode(urllib.parse.unquote(match.group(1)))


def png_image_for_preview(device, by_parent):
    for cell in [device] + descendants(device.get("id"), by_parent):
        png = png_image_from_cell(cell)

        if png is not None:
            return png

    return None


def table_data(card, by_parent):
    data = {}

    rows = {}

    for child in descendants(card.get("id"), by_parent):
        cell_id = child.get("id") or ""
        match = re.search(r"_r(\d+)_(k|v)_text$", child.get("id") or "")

        if match:
            rows.setdefault(int(match.group(1)), {})[match.group(2)] = clean_text(child.get("value"))

        match = re.search(r"_tbl_(lt|rt)_(\d+)$", cell_id)

        if match:
            key = "k" if match.group(1) == "lt" else "v"
            rows.setdefault(int(match.group(2)), {})[key] = clean_text(child.get("value"))

    for row in sorted(rows):
        if "k" in rows[row] and "v" in rows[row]:
            data[rows[row]["k"]] = rows[row]["v"]

    return data


def device_cell(card, by_parent):
    card_id = card.get("id")
    device = next(
        (child for child in by_parent[card_id]
         if (child.get("id") or "").endswith("_device")),
        None,
    )

    if device is not None:
        return device

    return next(
        (child for child in by_parent[card_id]
         if (child.get("id") or "").endswith("_image")),
        None,
    )


def title_for_item(data, fallback):
    if data.get("Модель"):
        return data["Модель"]

    series = data.get("Серия")
    marking = data.get("Маркировка")

    if series and marking:
        return f"{series} {marking}"

    if series:
        return series

    if data.get("Артикул"):
        return data["Артикул"]

    return fallback


def item_kind(page_key):
    return {
        "ekf_breakers": "breaker",
        "ekf_rcbo_2m": "rcbo",
        "ekf_ut": "terminal",
        "mw_hdr": "psu",
        "iek_signalling": "signalling",
        "wb_controllers": "wb",
        "wb_devices": "wb",
    }[page_key]


def breaker_curve(data):
    match = re.search(r"\b([BCD])\d+", data.get("Маркировка", ""))
    return match.group(1) if match is not None else "other"


def library_for_item(page_key, section, data):
    if page_key == "ekf_breakers" and section in BREAKER_SECTIONS:
        pole = BREAKER_SECTIONS[section]
        curve = breaker_curve(data)
        suffix = curve.lower()

        if curve in BREAKER_CURVE_ORDER:
            return (
                f"electric-ekf-breakers-{pole.lower()}-{suffix}",
                f"EKF автоматы {pole} — характеристика {curve}",
            )

        return f"electric-ekf-breakers-{pole.lower()}-other", f"EKF автоматы {pole} — характеристика прочие"

    if page_key == "ekf_ut":
        return "electric-ekf-ut", "EKF клеммы UT"

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

    if page_key == "iek_signalling":
        return IEK_SIGNALLING_LIBRARY_ID, IEK_SIGNALLING_LIBRARY_TITLE

    if page_key in ("wb_controllers", "wb_devices"):
        return WB_LIBRARY_ID, WB_LIBRARY_TITLE

    safe = slug(section or page_key)
    return f"electric-{safe}", section or page_key


def source_url_for_item(page_key, data):
    if page_key == "iek_signalling":
        return IEK_SIGNALLING_SOURCE_URLS.get(
            data.get("Артикул"), SOURCE_URLS[page_key])

    return SOURCE_URLS[page_key]


def tags_for_item(entry, data):
    parts = [
        "electric", "электрика", "шкаф", "din", entry["title"],
        entry["libraryTitle"], entry["kind"],
    ]
    parts.extend(data.values())
    return " ".join(str(part) for part in parts if part)


def source_bytes(base_drawio):
    if base_drawio.suffix == ".gz":
        with gzip.open(base_drawio, "rb") as source:
            return source.read()

    return base_drawio.read_bytes()


def make_titles_unique(entries):
    by_title = defaultdict(list)

    for entry in entries:
        by_title[entry["title"]].append(entry)

    for duplicates in by_title.values():
        if len(duplicates) < 2:
            continue

        for entry in duplicates:
            qualifier = entry.get("sourceKey") or entry["id"].rsplit("-", 1)[-1]
            entry["title"] = f"{entry['title']} · {qualifier}"

    for entry in entries:
        entry["tags"] = tags_for_item(entry, entry["data"])


def parse_items(base_drawio):
    raw_source = source_bytes(base_drawio)
    mxfile = ET.parse(io.BytesIO(raw_source)).getroot()
    entries = []

    for page_name, page_key in PAGES.items():
        diagram = next(
            (node for node in mxfile.findall("diagram") if node.get("name") == page_name),
            None,
        )

        if diagram is None:
            raise RuntimeError(f"Required page not found: {page_name}")

        root = diagram.find("mxGraphModel/root")

        if root is None:
            raise RuntimeError(f"Page has no uncompressed graph model: {page_name}")

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

            device = device_cell(card, by_parent)

            if device is None:
                raise RuntimeError(f"Device group not found for {card_id}")

            data = table_data(card, by_parent)
            data.setdefault("Производитель", PAGE_VENDOR[page_key])
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
                "sourceUrl": source_url_for_item(page_key, data),
                "sourceKey": data.get("Артикул") or data.get("Модель") or card_id,
            }
            if page_key in ("iek_signalling", "wb_controllers", "wb_devices"):
                preview_png = png_image_for_preview(device, by_parent)

                if preview_png is not None:
                    preview_file = f"previews/{item_id}.png"
                    entry["preview"] = preview_file
                    entry["_preview_png"] = resize_png_nearest(preview_png)

            entry["_xml"] = graph_model_for_device(
                device, by_parent, page_key, data,
                force_root_connectable=page_key in (
                    "ekf_breakers", "ekf_rcbo_2m",
                    "iek_signalling",
                    "wb_controllers", "wb_devices",
                ),
            )
            entries.append(entry)

    ids = [entry["id"] for entry in entries]

    if len(ids) != len(set(ids)):
        duplicates = sorted(item_id for item_id in set(ids) if ids.count(item_id) > 1)
        raise RuntimeError(f"Duplicate Electric item ids: {duplicates[:10]}")

    make_titles_unique(entries)
    return entries, hashlib.sha256(raw_source).hexdigest()


def write_manifest(entries, output_dir, source_hash):
    libraries = {}

    for entry in entries:
        libraries.setdefault(entry["libraryId"], {
            "id": entry["libraryId"],
            "title": entry["libraryTitle"],
            "items": [],
        })["items"].append({key: value for key, value in entry.items() if not key.startswith("_")})

    order = [
        "electric-ekf-breakers-1p-b",
        "electric-ekf-breakers-1p-c",
        "electric-ekf-breakers-1p-d",
        "electric-ekf-breakers-2p-b",
        "electric-ekf-breakers-2p-c",
        "electric-ekf-breakers-2p-d",
        "electric-ekf-breakers-3p-b",
        "electric-ekf-breakers-3p-c",
        "electric-ekf-breakers-3p-d",
        "electric-ekf-rcbo-2m-10ma",
        "electric-ekf-rcbo-2m-30ma",
        "electric-ekf-rcbo-2m-100ma",
        "electric-ekf-rcbo-2m-300ma",
        "electric-ekf-ut",
        "electric-mw-hdr-12v",
        "electric-mw-hdr-24v",
        "electric-mw-hdr-48v",
        IEK_SIGNALLING_LIBRARY_ID,
        WB_LIBRARY_ID,
    ]
    sorted_libraries = [libraries[key] for key in order if key in libraries]
    sorted_libraries.extend(libraries[key] for key in sorted(libraries) if key not in order)

    manifest = {
        "version": 2,
        "title": "Electric",
        "source": "tools/electric_shapes/source/base.drawio.gz",
        "sourceSha256": source_hash,
        "assetVersion": source_hash[:16],
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
            {
                "vendor": "IEK",
                "url": "https://www.iek.ru/products/catalog/modulnoe_oborudovanie/modulnoe_oborudovanie_karat/dopolnitelnye_ustroystva_karat/",
                "covers": "IEK LS-47 signal lamp and ZD-47 DIN rail bell",
            },
            {
                "vendor": "Wiren Board",
                "url": "https://wirenboard.com/",
                "covers": "Wiren Board controllers and DIN rail devices from WB-Library.svg",
            },
        ],
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    items_dir = output_dir / "items"
    items_dir.mkdir(parents=True, exist_ok=True)
    previews_dir = output_dir / "previews"
    previews_dir.mkdir(parents=True, exist_ok=True)

    for old in items_dir.glob("*.xml"):
        old.unlink()

    for old in previews_dir.glob("*.png"):
        old.unlink()

    for entry in entries:
        (output_dir / entry["original"]).write_text(entry["_xml"], encoding="utf-8")

        if entry.get("_preview_png") is not None:
            (output_dir / entry["preview"]).write_bytes(entry["_preview_png"])

    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    (output_dir / "catalog.js").write_text(
        "Editor.electricShapeCatalog = " +
        json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) +
        ";\n",
        encoding="utf-8",
    )


def replace_output_atomically(entries, output_dir, source_hash):
    output_dir = output_dir.resolve()
    temporary = output_dir.with_name(output_dir.name + ".tmp")
    backup = output_dir.with_name(output_dir.name + ".bak")

    shutil.rmtree(temporary, ignore_errors=True)
    shutil.rmtree(backup, ignore_errors=True)
    write_manifest(entries, temporary, source_hash)

    try:
        if output_dir.exists():
            os.replace(output_dir, backup)

        os.replace(temporary, output_dir)
    except Exception:
        if not output_dir.exists() and backup.exists():
            os.replace(backup, output_dir)
        raise
    else:
        shutil.rmtree(backup, ignore_errors=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("base_drawio", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()

    entries, source_hash = parse_items(args.base_drawio)
    replace_output_atomically(entries, args.output_dir, source_hash)
    print(f"Generated {len(entries)} Electric shape items in {args.output_dir}")


if __name__ == "__main__":
    main()
