"""Split AI-generated fish sprite sheets into 42 individual 16x16 PNGs."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path(r"C:\Users\Administrator\.cursor\projects\d-CODE-My-pack\assets")
AI_OUT = ROOT / "tools" / "output" / "ai_reference"
RP_OUT = ROOT / "RP" / "textures" / "items"
SHEET_DIR = ROOT / "tools" / "output"
SIZE = 16
COLS = 7

# Sheet order left-to-right per generated batch
SHEET_FISH: list[tuple[str, list[str]]] = [
    (
        "ai_fish_sheet_01.png",
        [
            "fish_lure",
            "fish_luck_of_the_sea",
            "fish_knockback",
            "fish_depth_strider",
            "fish_unbreaking",
            "fish_riptide",
            "fish_respiration",
        ],
    ),
    (
        "ai_fish_sheet_02.png",
        [
            "fish_impaling",
            "fish_loyalty",
            "fish_channeling",
            "fish_infinity",
            "fish_mending",
            "fish_looting",
            "fish_aqua_affinity",
        ],
    ),
    (
        "ai_fish_sheet_03.png",
        [
            "fish_fire_aspect",
            "fish_flame",
            "fish_punch",
            "fish_thorns",
            "fish_bane_of_arthropods",
            "fish_feather_falling",
            "fish_sharpness",
        ],
    ),
    (
        "ai_fish_sheet_04.png",
        [
            "fish_frost_walker",
            "fish_projectile_protection",
            "fish_silk_touch",
            "fish_protection",
            "fish_breach",
            "fish_wind_burst",
            "fish_quick_charge",
        ],
    ),
    (
        "ai_fish_sheet_05.png",
        [
            "fish_piercing",
            "fish_multishot",
            "fish_lunge",
            "fish_fire_protection",
            "fish_blast_protection",
            "fish_binding_curse",
            "fish_density",
        ],
    ),
    (
        "ai_fish_sheet_06.png",
        [
            "fish_smite",
            "fish_efficiency",
            "fish_fortune",
            "fish_swift_sneak",
            "fish_soul_speed",
            "fish_vanishing_curse",
            "fish_power",
        ],
    ),
]

sys.path.insert(0, str(Path(__file__).parent))
from fishing_data import BIOME_POOLS, FISH_DAY_NIGHT  # noqa: E402


def trim_to_content(img: Image.Image, pad: int = 1) -> Image.Image:
    """Crop to non-black bounding box."""
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 16 and (r + g + b) > 24:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x <= min_x:
        return rgba
    return rgba.crop(
        (
            max(0, min_x - pad),
            max(0, min_y - pad),
            min(w, max_x + pad + 1),
            min(h, max_y + pad + 1),
        )
    )


def to_16x16(img: Image.Image) -> Image.Image:
    """Fit creature into 16x16 with nearest-neighbor scaling."""
    cropped = trim_to_content(img)
    cw, ch = cropped.size
    if cw == 0 or ch == 0:
        return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    scale = min((SIZE - 2) / cw, (SIZE - 2) / ch)
    nw = max(1, int(cw * scale))
    nh = max(1, int(ch * scale))
    scaled = cropped.resize((nw, nh), Image.Resampling.NEAREST)
    out = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ox = (SIZE - nw) // 2
    oy = (SIZE - nh) // 2
    out.paste(scaled, (ox, oy), scaled)
    return out


def split_sheet(sheet_path: Path, fish_ids: list[str]) -> dict[str, Image.Image]:
    sheet = Image.open(sheet_path).convert("RGBA")
    w, h = sheet.size
    cell_w = w // COLS
    result: dict[str, Image.Image] = {}
    for i, fish_id in enumerate(fish_ids):
        x0 = i * cell_w
        cell = sheet.crop((x0, 0, x0 + cell_w, h))
        result[fish_id] = to_16x16(cell)
    return result


def build_catalog(textures: dict[str, Image.Image]) -> Path:
    fish_ids = sorted(textures.keys())
    cols = 7
    cell = SIZE + 2
    label_h = 9
    rows = (len(fish_ids) + cols - 1) // cols
    sheet_w = cols * cell + 8
    sheet_h = rows * (cell + label_h) + 16
    sheet = Image.new("RGBA", (sheet_w, sheet_h), (12, 12, 16, 255))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("consola.ttf", 7)
    except OSError:
        font = ImageFont.load_default()
    for i, fish_id in enumerate(fish_ids):
        col = i % cols
        row = i // cols
        x = 4 + col * cell
        y = 8 + row * (cell + label_h)
        img = textures[fish_id]
        sheet.paste(img, (x, y), img)
        draw.text((x, y + SIZE + 1), fish_id.replace("fish_", ""), fill=(180, 180, 190), font=font)
    out = SHEET_DIR / "enchant_fish_16x16_ai_catalog.png"
    sheet.save(out, optimize=True)
    return out


def build_biome_sheet(textures: dict[str, Image.Image]) -> Path:
    cell = SIZE + 2
    label_h = 10
    cols = 6
    rows_data: list[tuple[str, str, list[str]]] = []
    for _pool_id, meta in BIOME_POOLS.items():
        fish_key = meta["fish_key"]
        pool = FISH_DAY_NIGHT.get(fish_key, {})
        rows_data.append((meta["display_zh"], "day", pool.get("day", [])))
        rows_data.append((meta["display_zh"], "night", pool.get("night", [])))
    sheet_h = len(rows_data) * (cell + label_h) + 24
    sheet_w = cols * cell + 8
    sheet = Image.new("RGBA", (sheet_w, sheet_h), (18, 18, 24, 255))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("consola.ttf", 8)
    except OSError:
        font = ImageFont.load_default()
    y = 8
    for biome_zh, phase, fish_list in rows_data:
        label = f"{biome_zh} · {'昼' if phase == 'day' else '夜'}"
        draw.text((4, y), label, fill=(200, 200, 210), font=font)
        y += label_h
        x = 4
        col = 0
        for full_id in fish_list:
            fish_id = full_id.split(":")[-1]
            img = textures.get(fish_id)
            if img:
                sheet.paste(img, (x, y), img)
            x += cell
            col += 1
            if col >= cols:
                col = 0
                x = 4
                y += cell
        if col > 0:
            y += cell
        y += 4
    out = SHEET_DIR / "enchant_fish_16x16_ai_reference_sheet.png"
    sheet.save(out, optimize=True)
    return out


def main() -> None:
    AI_OUT.mkdir(parents=True, exist_ok=True)
    RP_OUT.mkdir(parents=True, exist_ok=True)
    all_textures: dict[str, Image.Image] = {}

    for sheet_name, fish_ids in SHEET_FISH:
        path = ASSETS / sheet_name
        if not path.is_file():
            raise FileNotFoundError(f"Missing AI sheet: {path}")
        extracted = split_sheet(path, fish_ids)
        all_textures.update(extracted)

    expected = sorted(p.stem for p in (ROOT / "BP" / "items").glob("fish_*.json"))
    missing = [f for f in expected if f not in all_textures]
    if missing:
        raise RuntimeError(f"Missing fish after split: {missing}")

    for fish_id, img in all_textures.items():
        ref_path = AI_OUT / f"{fish_id}.png"
        rp_path = RP_OUT / f"{fish_id}.png"
        img.save(ref_path, optimize=True)
        img.save(rp_path, optimize=True)

    catalog = build_catalog(all_textures)
    biome = build_biome_sheet(all_textures)
    report = {
        "source": "ai_generated",
        "count": len(all_textures),
        "fish_ids": sorted(all_textures.keys()),
        "sheets": [s[0] for s in SHEET_FISH],
    }
    report_path = SHEET_DIR / "ai_texture_report.json"
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Extracted {len(all_textures)} AI fish sprites -> {AI_OUT}")
    print(f"Copied to RP textures -> {RP_OUT}")
    print(f"Catalog: {catalog}")
    print(f"Biome sheet: {biome}")
    print(f"Report: {report_path}")


if __name__ == "__main__":
    main()
