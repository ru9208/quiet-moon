"""Build monochrome hunger/enchantment icons for Unicode glyph pages.

White glyphs tint with chat color: default text stays white, saturation
uses §e gold. Icons are 8px and vertically centered in the 16px cell so
they line up with CJK item names.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "_backup" / "better_ench" / "BetterEnch" / "subpacks" / "decimal" / "font" / "default8.png"
FONT_DIR = ROOT / "RP" / "font"
GLYPH_E1 = FONT_DIR / "glyph_E1.png"
GLYPH_25 = FONT_DIR / "glyph_25.png"
DEFAULT8 = FONT_DIR / "default8.png"

SRC_FULL = 0xC9
SRC_HALF = 0xCA
SRC_ENCHANT = {
    0x54: 0xC9,  # ╔
    0x69: 0xCA,  # ╩
    0x5A: 0xC8,  # ╚
    0x57: 0xBB,  # ╗ trident
    0x5C: 0xBC,  # ╜ spear
    0x5D: 0xBD,  # ╝ hammer / mace
    0x63: 0xB9,  # ╣
    0x51: 0xBA,  # ║
    0x02: 0xB3,  # │
    0x24: 0xB4,  # ┤
    0x1C: 0xC3,  # ├
    0x34: 0xC1,  # ┴
    0x2C: 0xC2,  # ┬
    0xA0: 0xFE,  # ■
}

PUA_FULL = 0xF0  # U+E1F0 white hunger
PUA_HALF = 0xF1  # U+E1F1 white hunger
PUA_GOLD_FULL = 0xF2  # U+E1F2 gold saturation
PUA_GOLD_HALF = 0xF3  # U+E1F3 gold saturation
UNI_CELL = 16
ICON_SIZE = 8
GOLD = (255, 255, 85, 255)


def src_cell(sheet: Image.Image, index: int) -> Image.Image:
    cell = sheet.size[0] // 16
    row, col = divmod(index, 16)
    x, y = col * cell, row * cell
    return sheet.crop((x, y, x + cell, y + cell))


def to_tinted_icon(cell: Image.Image, color: tuple[int, int, int, int]) -> Image.Image:
    icon = cell.convert("RGBA").resize((ICON_SIZE, ICON_SIZE), Image.NEAREST)
    px = list(icon.getdata())
    out = []
    for r, g, b, a in px:
        if a < 16 or r + g + b < 24:
            out.append((0, 0, 0, 0))
        else:
            out.append(color)
    icon.putdata(out)
    return icon


def paste_icon(sheet: Image.Image, index: int, icon: Image.Image) -> None:
    row, col = divmod(index, 16)
    x = col * UNI_CELL + (UNI_CELL - ICON_SIZE) // 2
    # Center in the 16px cell so icons sit with CJK text, not on the baseline.
    y = row * UNI_CELL + (UNI_CELL - ICON_SIZE) // 2
    sheet.paste(icon, (x, y), icon)


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing BetterEnch font: {SRC}")
    mono = Image.open(SRC).convert("RGBA")
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    mono.save(DEFAULT8)

    e1 = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    paste_icon(e1, PUA_FULL, to_tinted_icon(src_cell(mono, SRC_FULL), (255, 255, 255, 255)))
    paste_icon(e1, PUA_HALF, to_tinted_icon(src_cell(mono, SRC_HALF), (255, 255, 255, 255)))
    paste_icon(e1, PUA_GOLD_FULL, to_tinted_icon(src_cell(mono, SRC_FULL), GOLD))
    paste_icon(e1, PUA_GOLD_HALF, to_tinted_icon(src_cell(mono, SRC_HALF), GOLD))
    e1.save(GLYPH_E1)

    g25 = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    for uni_index, src_index in SRC_ENCHANT.items():
        paste_icon(g25, uni_index, to_tinted_icon(src_cell(mono, src_index), (255, 255, 255, 255)))
    g25.save(GLYPH_25)

    print(f"Wrote {DEFAULT8}")
    print(f"Wrote {GLYPH_E1}")
    print(f"Wrote {GLYPH_25}")


if __name__ == "__main__":
    main()
