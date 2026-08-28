# -*- coding: utf-8 -*-
"""Detach BetterEnch from the live food pack; copy it to _backup for later."""
from __future__ import annotations

import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKUP = ROOT / "_backup" / "better_ench"
RP = ROOT / "RP"
SRC_BE = ROOT / "BetterEnch"

GLYPH_RE = re.compile(r"[\uE1F0-\uE1F3\u2550-\u257F\u00b1\u25a0§]")

PACK_DESC = {
    "en_US": "Potion stews, mob tweaks, and piglin reputation.",
    "en_GB": "Potion stews, mob tweaks, and piglin reputation.",
    "zh_CN": "药剂炖菜、怪物调整与猪灵声望。",
    "es_ES": "Guisos de pocion, ajustes de mobs y reputacion piglin.",
    "es_MX": "Guisos de pocion, ajustes de mobs y reputacion piglin.",
    "pt_BR": "Ensopados de pocoes, ajustes de mobs e reputacao piglin.",
}


def stew_name(line: str) -> str:
    key, _, value = line.partition("=")
    value = value.replace("\\n", "\n").split("\n", 1)[0]
    value = GLYPH_RE.sub("", value)
    value = re.sub(r"\s+", " ", value).strip()
    return f"{key}={value}"


def strip_lang(path: Path) -> str:
    locale = path.stem
    pack_name = "Food"
    stew_lines: list[str] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        if raw.startswith("pack.name="):
            pack_name = raw.split("=", 1)[1].strip() or pack_name
        elif raw.startswith("item.my_pack."):
            stew_lines.append(stew_name(raw))
    desc = PACK_DESC.get(locale, PACK_DESC["en_US"])
    out = [
        f"pack.name={pack_name}",
        f"pack.description={desc}",
        "",
    ]
    out.extend(stew_lines)
    out.append("")
    return "\n".join(out)


def main() -> None:
    if not SRC_BE.exists() and (BACKUP / "BetterEnch").exists():
        print(f"Already detached. Backup is at {BACKUP}")
        return
    BACKUP.mkdir(parents=True, exist_ok=True)
    texts_backup = BACKUP / "rp_texts_with_glyphs"
    font_backup = BACKUP / "rp_font"
    if texts_backup.exists():
        shutil.rmtree(texts_backup)
    shutil.copytree(RP / "texts", texts_backup)
    if (RP / "font").exists():
        if font_backup.exists():
            shutil.rmtree(font_backup)
        shutil.copytree(RP / "font", font_backup)
        shutil.rmtree(RP / "font")
    dest_be = BACKUP / "BetterEnch"
    if SRC_BE.exists():
        if dest_be.exists():
            shutil.rmtree(dest_be)
        shutil.move(str(SRC_BE), str(dest_be))
    for lang in (RP / "texts").glob("*.lang"):
        lang.write_text(strip_lang(lang), encoding="utf-8")
    readme = BACKUP / "README.md"
    readme.write_text(
        "BetterEnch was removed from the live food pack to avoid shipping "
        "Arpeggy's hunger/enchant icons.\n\n"
        "This folder is a local backup only. Do not put it in BP/RP or the "
        "mcaddon.\n\n"
        "Contents:\n"
        "- BetterEnch/: original resource pack\n"
        "- rp_font/: glyph_E1 / glyph_25 / default8 copied from Food RP\n"
        "- rp_texts_with_glyphs/: item names with hunger icons and enchant prefixes\n\n"
        "Restore later: copy rp_font -> food mod/RP/font, copy lang files back, "
        "move BetterEnch to food mod/BetterEnch, then run tools/build_hunger_font.py.\n",
        encoding="utf-8",
    )
    print(f"Backup at {BACKUP}")


if __name__ == "__main__":
    main()
