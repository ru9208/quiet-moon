"""Remove villager/wandering trader trades that sell golden apples."""
from __future__ import annotations

import json
from pathlib import Path

TRADE_DIR = Path(__file__).resolve().parents[1] / "BP" / "trading" / "economy_trades"
TARGET = "minecraft:golden_apple"


def gives_golden_apple(trade: dict) -> bool:
    return any(give.get("item") == TARGET for give in trade.get("gives", []))


def patch_file(path: Path) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    removed = 0

    for tier in data.get("tiers", []):
        for group in tier.get("groups", []):
            trades = group.get("trades", [])
            kept = [trade for trade in trades if not gives_golden_apple(trade)]
            removed += len(trades) - len(kept)
            group["trades"] = kept

    if removed:
        path.write_text(json.dumps(data, indent="\t", ensure_ascii=False) + "\n", encoding="utf-8")
    return removed


def main() -> None:
    total = 0
    for path in sorted(TRADE_DIR.glob("*.json")):
        count = patch_file(path)
        if count:
            print(f"{path.name}: removed {count}")
            total += count
    print(f"Removed {total} golden_apple trades total")


if __name__ == "__main__":
    main()
