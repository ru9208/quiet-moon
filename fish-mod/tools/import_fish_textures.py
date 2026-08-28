"""Import 16x16 enchant fish textures into the resource pack.

Primary workflow: AI-generated sprite sheets (see process_ai_fish_sheets.py).
Run after placing ai_fish_sheet_01..06.png in Cursor assets folder:

    python tools/process_ai_fish_sheets.py

Legacy user PNGs (assets/fish_<name>-*.png) are ignored once AI output exists.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROCESS = Path(__file__).parent / "process_ai_fish_sheets.py"
ASSETS = Path(r"C:\Users\Administrator\.cursor\projects\d-CODE-My-pack\assets")
REQUIRED = [f"ai_fish_sheet_{i:02d}.png" for i in range(1, 7)]


def main() -> None:
    missing = [name for name in REQUIRED if not (ASSETS / name).is_file()]
    if missing:
        print("Missing AI sprite sheets in assets:")
        for name in missing:
            print(f"  - {name}")
        print("Generate sheets first, then run process_ai_fish_sheets.py")
        sys.exit(1)
    subprocess.run([sys.executable, str(PROCESS)], check=True)


if __name__ == "__main__":
    main()
