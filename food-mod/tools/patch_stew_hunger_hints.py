"""Repair and update custom stew hunger/saturation hints in lang files."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

STEWS: list[tuple[str, int, float]] = [
    ("gale_chicken_stew", 20, 0.5),
    ("springberry_rabbit_stew", 20, 0.5),
    ("nightlow_salmon_stew", 20, 0.5),
    ("veilsh_rabbit_stew", 20, 0.5),
    ("down_feather_stew", 20, 0.5),
    ("seabreath_cold_stew", 20, 0.5),
    ("nether_pork_stew", 20, 0.5),
    ("brute_beef_stew", 20, 0.5),
    ("turtle_shell_stew", 20, 0.5),
    ("rejuvenating_honeyroot_stew", 20, 0.5),
]

LANG_DIRS = [
    ROOT / "_backup" / "better_ench" / "BetterEnch" / "subpacks" / "roman" / "texts",
    ROOT / "_backup" / "better_ench" / "BetterEnch" / "subpacks" / "decimal" / "texts",
    ROOT / "_backup" / "better_ench" / "BetterEnch" / "subpacks" / "chromai" / "texts",
    ROOT / "_backup" / "better_ench" / "BetterEnch" / "subpacks" / "chroma1" / "texts",
]

DISPLAY_NAMES: dict[str, dict[str, str]] = {
    "gale_chicken_stew": {
        "zh_CN": "疾风鸡汤",
        "en_US": "Gale Chicken Stew",
        "en_GB": "Gale Chicken Stew",
        "pt_BR": "Estofado de Frango Vendaval",
        "es_MX": "Estofado de pollo vendaval",
        "es_ES": "Estofado de pollo vendaval",
    },
    "springberry_rabbit_stew": {
        "zh_CN": "轻身莓兔盅",
        "en_US": "Springberry Rabbit Stew",
        "en_GB": "Springberry Rabbit Stew",
        "pt_BR": "Estofado de Coelho Primaveril",
        "es_MX": "Estofado de conejo primaveral",
        "es_ES": "Estofado de conejo primaveral",
    },
    "nightlow_salmon_stew": {
        "zh_CN": "夜视鲑鱼汤",
        "en_US": "Nightlow Salmon Stew",
        "en_GB": "Nightlow Salmon Stew",
        "pt_BR": "Estofado de Salmão Noturno",
        "es_MX": "Estofado de salmón nocturno",
        "es_ES": "Estofado de salmón nocturno",
    },
    "veilsh_rabbit_stew": {
        "zh_CN": "隐踪兔汤",
        "en_US": "Veilsh Rabbit Stew",
        "en_GB": "Veilsh Rabbit Stew",
        "pt_BR": "Estofado de Coelho Velado",
        "es_MX": "Estofado de conejo velado",
        "es_ES": "Estofado de conejo velado",
    },
    "down_feather_stew": {
        "zh_CN": "浮羽炖",
        "en_US": "Down Feather Stew",
        "en_GB": "Down Feather Stew",
        "pt_BR": "Estofado de Plumagem",
        "es_MX": "Estofado de plumón",
        "es_ES": "Estofado de plumón",
    },
    "seabreath_cold_stew": {
        "zh_CN": "海息寒汤",
        "en_US": "Seabreath Cold Stew",
        "en_GB": "Seabreath Cold Stew",
        "pt_BR": "Estofado Frio do Mar",
        "es_MX": "Estofado frío marino",
        "es_ES": "Estofado frío marino",
    },
    "nether_pork_stew": {
        "zh_CN": "下界猪排锅",
        "en_US": "Nether Pork Stew",
        "en_GB": "Nether Pork Stew",
        "pt_BR": "Estofado de Porco do Nether",
        "es_MX": "Estofado de cerdo del Nether",
        "es_ES": "Estofado de cerdo del Nether",
    },
    "brute_beef_stew": {
        "zh_CN": "蛮力炖",
        "en_US": "Brute Beef Stew",
        "en_GB": "Brute Beef Stew",
        "pt_BR": "Estofado de Carne Bruta",
        "es_MX": "Estofado de res bruta",
        "es_ES": "Estofado de res bruta",
    },
    "turtle_shell_stew": {
        "zh_CN": "神龟甲汤",
        "en_US": "Turtle Shell Stew",
        "en_GB": "Turtle Shell Stew",
        "pt_BR": "Estofado de Casco de Tartaruga",
        "es_MX": "Estofado de caparazón",
        "es_ES": "Estofado de caparazón",
    },
    "rejuvenating_honeyroot_stew": {
        "zh_CN": "回春蜜根汤",
        "en_US": "Rejuvenating Honeyroot Stew",
        "en_GB": "Rejuvenating Honeyroot Stew",
        "pt_BR": "Estofado de Mel Rejuvenescedor",
        "es_MX": "Estofado de miel raíz",
        "es_ES": "Estofado de miel raíz",
    },
}


FULL_GLYPH = chr(0xE1F0)
HALF_GLYPH = chr(0xE1F1)
SAT_FULL_GLYPH = chr(0xE1F2)
SAT_HALF_GLYPH = chr(0xE1F3)


def hunger_glyphs(nutrition: int) -> str:
    return FULL_GLYPH * (nutrition // 2) + HALF_GLYPH * (nutrition % 2)


def saturation_glyphs(nutrition: int, modifier: float) -> str:
    saturation = min(20.0, round(nutrition * modifier * 2, 2))
    full = int(saturation // 2)
    remainder = round(saturation - full * 2, 2)
    half = 1 if remainder >= 0.4 else 0
    return SAT_FULL_GLYPH * full + SAT_HALF_GLYPH * half


def build_line(item_id: str, locale: str, nutrition: int, modifier: float) -> str:
    name = DISPLAY_NAMES[item_id][locale]
    hunger = hunger_glyphs(nutrition)
    sat = saturation_glyphs(nutrition, modifier)
    return f"item.my_pack.{item_id}.name={name}\\n{hunger}\\n{sat}"


def patch_lang(path: Path) -> int:
    locale = path.stem
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    out: list[str] = []
    updated = 0
    skip_orphan = False

    for line in lines:
        if skip_orphan:
            if line.startswith("item."):
                skip_orphan = False
            else:
                continue

        matched = False
        for item_id, nutrition, modifier in STEWS:
            key = f"item.my_pack.{item_id}.name="
            if line.startswith(key):
                new_line = build_line(item_id, locale, nutrition, modifier)
                if new_line != line:
                    updated += 1
                out.append(new_line)
                matched = True
                skip_orphan = True
                break

        if not matched:
            out.append(line)

    path.write_text("\n".join(out) + ("\n" if out else ""), encoding="utf-8")
    return updated


def main() -> None:
    total = 0
    for lang_dir in LANG_DIRS:
        if not lang_dir.exists():
            continue
        for lang_file in sorted(lang_dir.glob("*.lang")):
            count = patch_lang(lang_file)
            if count:
                print(f"{lang_file.relative_to(ROOT)}: {count} entries")
                total += count
    print(f"Updated {total} entries total")


if __name__ == "__main__":
    main()
