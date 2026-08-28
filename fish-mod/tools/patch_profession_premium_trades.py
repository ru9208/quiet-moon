"""Replace villager random premium pool with one fixed trade per profession."""
from __future__ import annotations

import json
from pathlib import Path

TRADE_DIR = Path(__file__).resolve().parents[1] / "BP" / "trading" / "economy_trades"

PREMIUM_ITEMS = {
    "experience_bottle": ("minecraft:experience_bottle", 16),
    "golden_carrot": ("minecraft:golden_carrot", 1),
    "glistering_melon_slice": ("minecraft:glistering_melon_slice", 1),
    "rabbit_foot": ("minecraft:rabbit_foot", 16),
    "pufferfish": ("minecraft:pufferfish", 16),
    "glowstone_dust": ("minecraft:glowstone_dust", 16),
}

# Fixed premium sell per profession (wandering trader keeps random pool).
PROFESSION_PREMIUM = {
    "armorer_trades.json": "glowstone_dust",
    "butcher_trades.json": "golden_carrot",
    "cartographer_trades.json": "experience_bottle",
    "cleric_trades.json": "rabbit_foot",
    "farmer_trades.json": "glistering_melon_slice",
    "fisherman_trades.json": "pufferfish",
    "fletcher_trades.json": "rabbit_foot",
    "leather_worker_trades.json": "golden_carrot",
    "librarian_trades.json": "experience_bottle",
    "shepherd_trades.json": "glistering_melon_slice",
    "stone_mason_trades.json": "glowstone_dust",
    "tool_smith_trades.json": "experience_bottle",
    "weapon_smith_trades.json": "golden_carrot",
}

PREMIUM_GIVE_ITEMS = {give for give, _ in PREMIUM_ITEMS.values()}


def premium_trade(key: str) -> dict:
    item, quantity = PREMIUM_ITEMS[key]
    return {
        "wants": [{"item": "minecraft:emerald", "quantity": 1}],
        "gives": [{"item": item, "quantity": quantity}],
        "max_uses": 16,
        "reward_exp": True,
        "trader_exp": 2,
    }


def is_premium_trade(trade: dict) -> bool:
    gives = trade.get("gives", [])
    if len(gives) != 1:
        return False
    item = gives[0].get("item")
    wants = trade.get("wants", [])
    return (
        item in PREMIUM_GIVE_ITEMS
        and len(wants) == 1
        and wants[0].get("item") == "minecraft:emerald"
        and wants[0].get("quantity") == 1
    )


def gives_potion(trade: dict) -> bool:
    return any(give.get("item") == "minecraft:potion:1" for give in trade.get("gives", []))


def patch_villager(path: Path, premium_key: str) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    tier = data["tiers"][0]
    groups = tier["groups"]

    premium_groups = [g for g in groups if g.get("num_to_select") == 1 and any(is_premium_trade(t) for t in g.get("trades", []))]
    fixed_groups = [g for g in groups if g not in premium_groups]

    if len(fixed_groups) != 1:
        raise SystemExit(f"{path.name}: expected 1 fixed group, found {len(fixed_groups)}")

    trades = fixed_groups[0]["trades"]
    trades[:] = [t for t in trades if not is_premium_trade(t) and not gives_potion(t)]
    trades.append(premium_trade(premium_key))

    tier["groups"] = fixed_groups
    path.write_text(json.dumps(data, indent="\t", ensure_ascii=False) + "\n", encoding="utf-8")
    item, qty = PREMIUM_ITEMS[premium_key]
    print(f"{path.name}: fixed -> 1 emerald for {qty}x {item}")


def patch_wandering_trader(path: Path) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    removed = 0
    for tier in data.get("tiers", []):
        for group in tier.get("groups", []):
            trades = group.get("trades", [])
            kept = [
                trade
                for trade in trades
                if not any(give.get("item") == "minecraft:potion:1" for give in trade.get("gives", []))
            ]
            removed += len(trades) - len(kept)
            group["trades"] = kept
    if removed:
        path.write_text(json.dumps(data, indent="\t", ensure_ascii=False) + "\n", encoding="utf-8")
    return removed


def main() -> None:
    for filename, premium_key in sorted(PROFESSION_PREMIUM.items()):
        patch_villager(TRADE_DIR / filename, premium_key)
    removed = patch_wandering_trader(TRADE_DIR / "wandering_trader_trades.json")
    print(f"wandering_trader_trades.json: removed {removed} potion trade(s)")


if __name__ == "__main__":
    main()
