"""Set food stack limits: raw meats=64, cooked meats=1, bowls=1, other foods=16, harmful foods=64."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ITEMS = ROOT / "BP" / "items"

RAW_MEATS = {
    "minecraft:beef",
    "minecraft:porkchop",
    "minecraft:chicken",
    "minecraft:mutton",
    "minecraft:rabbit",
    "minecraft:cod",
    "minecraft:salmon",
    "minecraft:tropical_fish",
}

COOKED_MEATS = {
    "minecraft:cooked_beef",
    "minecraft:cooked_porkchop",
    "minecraft:cooked_chicken",
    "minecraft:cooked_mutton",
    "minecraft:cooked_rabbit",
    "minecraft:cooked_cod",
    "minecraft:cooked_salmon",
}

BOWL_FOODS = {
    "minecraft:mushroom_stew",
    "minecraft:rabbit_stew",
    "minecraft:beetroot_soup",
}

"""Set food stack limits: raw meats=64, cooked meats=1, bowls=1, baked snacks=16, other foods=64, harmful foods=64."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ITEMS = ROOT / "BP" / "items"

RAW_MEATS = {
    "minecraft:beef",
    "minecraft:porkchop",
    "minecraft:chicken",
    "minecraft:mutton",
    "minecraft:rabbit",
    "minecraft:cod",
    "minecraft:salmon",
    "minecraft:tropical_fish",
}

COOKED_MEATS = {
    "minecraft:cooked_beef",
    "minecraft:cooked_porkchop",
    "minecraft:cooked_chicken",
    "minecraft:cooked_mutton",
    "minecraft:cooked_rabbit",
    "minecraft:cooked_cod",
    "minecraft:cooked_salmon",
}

BOWL_FOODS = {
    "minecraft:mushroom_stew",
    "minecraft:rabbit_stew",
    "minecraft:beetroot_soup",
}

# Baked / cooked snacks stay 16. Raw crops, cookie, apples, kelp are vanilla 64.
BAKED_SNACKS = {
    "minecraft:bread",
    "minecraft:pumpkin_pie",
    "minecraft:honey_bottle",
    "minecraft:baked_potato",
}

UNCOOKED_FOODS = {
    "minecraft:cookie",
    "minecraft:dried_kelp",
    "minecraft:chorus_fruit",
    "minecraft:apple",
    "minecraft:golden_apple",
    "minecraft:enchanted_golden_apple",
    "minecraft:melon_slice",
    "minecraft:carrot",
    "minecraft:potato",
    "minecraft:beetroot",
    "minecraft:sweet_berries",
    "minecraft:golden_carrot",
}

NEGATIVE_EFFECT_FOODS = {
    "minecraft:spider_eye",
    "minecraft:poisonous_potato",
    "minecraft:rotten_flesh",
    "minecraft:pufferfish",
}

CUSTOM_STEWS = {
    "my_pack:gale_chicken_stew",
    "my_pack:brute_beef_stew",
    "my_pack:rejuvenating_honeyroot_stew",
    "my_pack:turtle_shell_stew",
    "my_pack:nether_pork_stew",
    "my_pack:seabreath_cold_stew",
    "my_pack:nightlow_salmon_stew",
    "my_pack:veilsh_rabbit_stew",
    "my_pack:springberry_rabbit_stew",
    "my_pack:down_feather_stew",
}


def filename_for(identifier: str) -> str:
    return identifier.split(":", 1)[1] + ".json"


def stack_item(identifier: str, stack: int) -> dict:
    # Vanilla foods are format 1.10; 1.21.90 overrides of those IDs are ignored.
    fmt = "1.21.90" if identifier.startswith("my_pack:") else "1.10"
    return {
        "format_version": fmt,
        "minecraft:item": {
            "description": {"identifier": identifier},
            "components": {"minecraft:max_stack_size": stack},
        },
    }


def main() -> None:
    targets: dict[str, int] = {}
    for item_id in COOKED_MEATS | BOWL_FOODS | CUSTOM_STEWS:
        targets[item_id] = 1
    for item_id in BAKED_SNACKS:
        targets[item_id] = 16
    for item_id in UNCOOKED_FOODS | RAW_MEATS | NEGATIVE_EFFECT_FOODS:
        targets[item_id] = 64

    updated = 0

    for identifier, stack in sorted(targets.items()):
        path = ITEMS / filename_for(identifier)
        if path.exists():
            data = json.loads(path.read_text(encoding="utf-8"))
            components = data["minecraft:item"].setdefault("components", {})
            if components.get("minecraft:max_stack_size") == stack:
                continue
            components["minecraft:max_stack_size"] = stack
            path.write_text(json.dumps(data, indent="\t", ensure_ascii=False) + "\n", encoding="utf-8")
            updated += 1
        else:
            # Do not emit stack-only stubs: they wipe seed/food/effects on vanilla 1.10 items.
            print(f"SKIP missing {path.name} (would wipe vanilla components)")

    print(f"Updated {updated} existing item files")


if __name__ == "__main__":
    main()
