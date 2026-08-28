"""Import body_of_* / fish_* sprites and bucket PNGs into RP/textures/items."""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "texture" / "CE79C5D6-B6AA-4033-B0F0-13CFE89C7EDC"
OUT = ROOT / "Rp" / "textures" / "items"
REPORT = ROOT / "tools" / "output" / "body_texture_import.json"
SIZE = 16

# Explicit renames in source export
EXPLICIT_FISH: dict[str, str] = {
    "fish_aqua_affinity 2": "fish_aqua_affinity",
    "fish_blast_protection": "fish_blast_protection",
    "fish_breach": "fish_breach",
    "fish_channeling": "fish_channeling",
}

BUCKET_MAP: dict[str, str] = {
    "tadpole_bucket": "shulker_bucket",
    "squid_bucket": "squid_bucket",
    "glowsquid_bucket": "glow_squid_bucket",
    "nautilus_bucket": "nautilus_bucket",
    "z-nautilus_bucket": "z-nautilus_bucket",
    "zs-nautilus_bucket": "zs-nautilus_bucket",
}

UNNAMED_RE = re.compile(r"^(?:未命名|\u672a\u547d\u540d)(?:\s+(\d+))?$")


def fish_ids_lang_order() -> list[str]:
    lang = ROOT / "Rp" / "texts" / "en_US.lang"
    ids: list[str] = []
    for line in lang.read_text(encoding="utf-8").splitlines():
        if line.startswith("item.enchant_fish:fish_") and ".name=" not in line:
            key = line.split("=", 1)[0].split(":", 1)[1]
            ids.append(key)
    return ids


def normalize(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    if img.size != (SIZE, SIZE):
        img = img.resize((SIZE, SIZE), Image.Resampling.NEAREST)
    return img


def unnamed_sort_key(name: str) -> tuple[int, str]:
    m = UNNAMED_RE.match(name)
    if not m:
        return (9999, name)
    num = int(m.group(1)) if m.group(1) else 1
    return (num, name)


def resolve_fish_sources() -> dict[str, Path]:
    if not SRC.is_dir():
        raise FileNotFoundError(f"Missing texture source: {SRC}")

    mapping: dict[str, Path] = {}
    unnamed: list[Path] = []
    fallback: Path | None = None

    for path in sorted(SRC.glob("*.png")):
        stem = path.stem
        if stem in EXPLICIT_FISH:
            mapping[EXPLICIT_FISH[stem]] = path
            continue
        if stem.startswith("body_of_"):
            fish_id = f"fish_{stem[len('body_of_'):]}"
            mapping[fish_id] = path
            continue
        if stem.startswith("fish_") and stem in fish_ids_lang_order():
            mapping[stem] = path
            continue
        if UNNAMED_RE.match(stem):
            unnamed.append(path)
            continue
        if stem == "fish":
            fallback = path
            continue

    unnamed.sort(key=lambda p: unnamed_sort_key(p.stem))
    pending = [fid for fid in fish_ids_lang_order() if fid not in mapping]
    for path, fish_id in zip(unnamed, pending):
        mapping[fish_id] = path
    pending = [fid for fid in fish_ids_lang_order() if fid not in mapping]
    if pending and fallback:
        for fish_id in pending:
            mapping[fish_id] = fallback

    return mapping


def copy_textures() -> dict:
    OUT.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)

    fish_map = resolve_fish_sources()
    report: dict = {"fish": {}, "buckets": {}, "missing_fish": [], "renamed_source": []}

    for fish_id, src in fish_map.items():
        dest = OUT / f"{fish_id}.png"
        normalize(Image.open(src)).save(dest, optimize=True)
        body_name = f"body_of_{fish_id[len('fish_'):]}.png"
        report["fish"][fish_id] = {"source": src.name, "body_name": body_name, "dest": dest.name}
        # mirror rename in source folder for body_of_* convention
        body_src = SRC / body_name
        if src.resolve() != body_src.resolve() and not body_src.exists():
            shutil.copy2(src, body_src)
            report["renamed_source"].append({"from": src.name, "to": body_name})

    for src_stem, dest_stem in BUCKET_MAP.items():
        matches = list(SRC.glob(f"{src_stem}*.png"))
        if not matches:
            report["buckets"][dest_stem] = {"missing": True}
            continue
        src = sorted(matches, key=lambda p: len(p.name))[0]
        dest = OUT / f"{dest_stem}.png"
        normalize(Image.open(src)).save(dest, optimize=True)
        report["buckets"][dest_stem] = {"source": src.name, "dest": dest.name}

    all_fish = fish_ids_lang_order()
    report["missing_fish"] = [fid for fid in all_fish if fid not in fish_map]
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    return report


def main() -> None:
    report = copy_textures()
    print(f"Fish textures: {len(report['fish'])}/{len(fish_ids_lang_order())}")
    print(f"Buckets: {list(report['buckets'].keys())}")
    if report["missing_fish"]:
        print("Missing fish:", ", ".join(report["missing_fish"]))
    print(f"Report: {REPORT}")


if __name__ == "__main__":
    main()
