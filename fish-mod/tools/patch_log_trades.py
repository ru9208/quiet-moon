"""Add 64-log sell trades to villagers and wandering trader."""
import json
from pathlib import Path

TRADE_DIR = Path(__file__).resolve().parents[1] / "BP" / "trading" / "economy_trades"

VILLAGER_LOGS = {
    "armorer_trades.json": "minecraft:dark_oak_log",
    "butcher_trades.json": "minecraft:oak_log",
    "cartographer_trades.json": "minecraft:birch_log",
    "cleric_trades.json": "minecraft:spruce_log",
    "farmer_trades.json": "minecraft:cherry_log",
    "fisherman_trades.json": "minecraft:mangrove_log",
    "fletcher_trades.json": "minecraft:jungle_log",
    "leather_worker_trades.json": "minecraft:acacia_log",
    "librarian_trades.json": "minecraft:pale_oak_log",
    "stone_mason_trades.json": "minecraft:stripped_oak_log",
    "shepherd_trades.json": "minecraft:stripped_birch_log",
    "tool_smith_trades.json": "minecraft:crimson_stem",
    "weapon_smith_trades.json": "minecraft:warped_stem",
}

WANDERING_LOGS = [
    "minecraft:oak_log",
    "minecraft:spruce_log",
    "minecraft:birch_log",
    "minecraft:jungle_log",
    "minecraft:acacia_log",
    "minecraft:dark_oak_log",
    "minecraft:mangrove_log",
    "minecraft:cherry_log",
    "minecraft:pale_oak_log",
    "minecraft:crimson_stem",
    "minecraft:warped_stem",
]


def log_sell_trade(log_id: str) -> dict:
    return {
        "wants": [{"item": "minecraft:emerald", "quantity": 1}],
        "gives": [{"item": log_id, "quantity": 64}],
        "max_uses": 16,
        "reward_exp": True,
        "trader_exp": 2,
    }


def has_log_sell(trades: list) -> bool:
    for trade in trades:
        for give in trade.get("gives", []):
            item = give.get("item", "")
            if item.endswith("_log") or item.endswith("_stem"):
                return True
    return False


def patch_villager(path: Path, log_id: str) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    first_group = data["tiers"][0]["groups"][0]
    trades = first_group["trades"]

    for trade in trades:
        for give in trade.get("gives", []):
            item = give.get("item", "")
            if item.endswith("_log") or item.endswith("_stem"):
                give["item"] = log_id
                give["quantity"] = 64
                path.write_text(json.dumps(data, indent="\t", ensure_ascii=False) + "\n", encoding="utf-8")
                print(f"Updated log sell in {path.name} -> {log_id}")
                return

    trades.append(log_sell_trade(log_id))
    path.write_text(json.dumps(data, indent="\t", ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Added log sell to {path.name} -> {log_id}")


def patch_wandering_trader(path: Path) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    groups = data["tiers"][0]["groups"]

    for group in groups:
        if group.get("num_to_select") == 1 and group.get("trades"):
            first_give = group["trades"][0].get("gives", [{}])[0].get("item", "")
            if first_give in WANDERING_LOGS:
                print("Wandering trader log group already present")
                return

    log_group = {
        "num_to_select": 1,
        "trades": [log_sell_trade(log_id) for log_id in WANDERING_LOGS],
    }

    insert_at = len(groups) - 1
    for i, group in enumerate(groups):
        if group.get("num_to_select") == 1 and group.get("trades"):
            first_give = group["trades"][0].get("gives", [{}])[0].get("item", "")
            if first_give == "minecraft:experience_bottle":
                insert_at = i
                break

    groups.insert(insert_at, log_group)
    path.write_text(json.dumps(data, indent="\t", ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Added wandering trader random log group ({len(WANDERING_LOGS)} types)")


def main() -> None:
    for filename, log_id in VILLAGER_LOGS.items():
        patch_villager(TRADE_DIR / filename, log_id)
    patch_wandering_trader(TRADE_DIR / "wandering_trader_trades.json")


if __name__ == "__main__":
    main()
