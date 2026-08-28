"""Replace legacy U+25xx hunger glyphs with PUA U+E1F0/U+E1F1 in lang files."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

LANG_DIRS = [
    ROOT / "_backup" / "better_ench" / "BetterEnch" / "subpacks" / "roman" / "texts",
    ROOT / "_backup" / "better_ench" / "BetterEnch" / "subpacks" / "decimal" / "texts",
    ROOT / "_backup" / "better_ench" / "BetterEnch" / "subpacks" / "chromai" / "texts",
    ROOT / "_backup" / "better_ench" / "BetterEnch" / "subpacks" / "chroma1" / "texts",
]

FULL = chr(0xE1F0)
HALF = chr(0xE1F1)
LEGACY_FULL = "\u2554"
LEGACY_HALF = "\u2569"


def migrate_text(text: str) -> tuple[str, int]:
    if LEGACY_FULL not in text and LEGACY_HALF not in text:
        return text, 0
    updated = text.replace(LEGACY_FULL, FULL).replace(LEGACY_HALF, HALF)
    return updated, text.count(LEGACY_FULL) + text.count(LEGACY_HALF)


def migrate_file(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    new_text, count = migrate_text(text)
    if count:
        path.write_text(new_text, encoding="utf-8")
    return count


def main() -> None:
    total = 0
    for lang_dir in LANG_DIRS:
        if not lang_dir.exists():
            continue
        for lang_file in sorted(lang_dir.glob("*.lang")):
            count = migrate_file(lang_file)
            if count:
                print(f"{lang_file.relative_to(ROOT)}: {count} glyphs")
                total += count
    print(f"Migrated {total} glyph characters total")


if __name__ == "__main__":
    main()
