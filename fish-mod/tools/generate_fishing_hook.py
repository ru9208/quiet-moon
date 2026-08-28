"""Generate fishing_hook.json, day/night loot tables, and biome_probe entity."""
from __future__ import annotations

import json
from pathlib import Path

from fishing_data import (
    BIOME_POOLS,
    FISH_DAY_NIGHT,
    MOON_PHASES,
    PROBE_BIOME_TAGS,
    VANILLA_FISH,
    vanilla_food_for,
)

ROOT = Path(__file__).resolve().parents[1]
BP = ROOT / "BP"
HOOK_OUT = BP / "entities" / "fishing_hook.json"
PROBE_OUT = BP / "entities" / "biome_probe.json"
LOOT_DIR = BP / "loot_tables" / "gameplay"
FISH_DIR = LOOT_DIR / "fishing"


def _all_of(*parts: dict) -> dict:
    return {"all_of": list(parts)}


def _time_filter(is_day: bool) -> dict:
    return {"test": "is_daytime", "value": is_day}


def _fish_pool_json(items: list[str]) -> dict:
    return {
        "pools": [
            {
                "rolls": 1,
                "entries": [
                    {"type": "item", "weight": 10, "name": name} for name in items
                ],
            }
        ]
    }


def _weighted_pool_json(entries: list[tuple[str, int]]) -> dict:
    return {
        "pools": [
            {
                "rolls": 1,
                "entries": [
                    {"type": "item", "weight": weight, "name": name}
                    for name, weight in entries
                ],
            }
        ]
    }


def _fishing_table_json(vanilla_table: str | None, enchant_table: str | None) -> dict:
    entries: list[dict] = [
        {
            "type": "loot_table",
            "name": "loot_tables/gameplay/fishing/junk.json",
            "weight": 25,
        },
        {
            "type": "loot_table",
            "name": "loot_tables/gameplay/fishing/treasure.json",
            "weight": 5,
        },
    ]
    if vanilla_table:
        entries.append(
            {
                "type": "loot_table",
                "name": f"loot_tables/gameplay/fishing/{vanilla_table}.json",
                "weight": 65,
            }
        )
    if enchant_table:
        entries.append(
            {
                "type": "loot_table",
                "name": f"loot_tables/gameplay/fishing/{enchant_table}.json",
                "weight": 5,
            }
        )
    return {"pools": [{"rolls": 1, "entries": entries}]}


def write_vanilla_tables() -> None:
    for stem in VANILLA_FISH:
        for moon_suffix, full_moon in MOON_PHASES:
            items = vanilla_food_for(stem, full_moon)
            path = FISH_DIR / f"{stem}{moon_suffix}.json"
            if items:
                path.write_text(
                    json.dumps(
                        _weighted_pool_json(items), indent="\t", ensure_ascii=False
                    )
                    + "\n",
                    encoding="utf-8",
                )
            elif path.exists():
                path.unlink()


def write_loot_tables() -> None:
    FISH_DIR.mkdir(parents=True, exist_ok=True)
    LOOT_DIR.mkdir(parents=True, exist_ok=True)
    write_vanilla_tables()

    for stale in FISH_DIR.glob("*_fish_*_fullmoon.json"):
        stale.unlink()

    for _pool_id, meta in BIOME_POOLS.items():
        fish_key = meta["fish_key"]
        stem = meta["stem"]
        vanilla = meta["vanilla"]

        for phase in ("day", "night"):
            items = FISH_DAY_NIGHT[fish_key][phase]
            fish_stem = f"{fish_key}_fish_{phase}"
            fish_file = FISH_DIR / f"{fish_stem}.json"
            fish_file.write_text(
                json.dumps(_fish_pool_json(items), indent="\t", ensure_ascii=False)
                + "\n",
                encoding="utf-8",
            )
            for moon_suffix, full_moon in MOON_PHASES:
                vanilla_items = vanilla_food_for(vanilla, full_moon)
                # Quiet moon with no leftover food fish: junk occupies the 65% slot.
                vanilla_ref = f"{vanilla}{moon_suffix}" if vanilla_items else "junk"
                table_file = LOOT_DIR / f"{stem}_{phase}{moon_suffix}.json"
                table_file.write_text(
                    json.dumps(
                        _fishing_table_json(vanilla_ref, fish_stem),
                        indent="\t",
                        ensure_ascii=False,
                    )
                    + "\n",
                    encoding="utf-8",
                )


def build_hook_json() -> dict:
    component_groups: dict = {}
    for pool_id, meta in BIOME_POOLS.items():
        stem = meta["stem"]
        for phase in ("day", "night"):
            for moon_suffix, _full_moon in MOON_PHASES:
                group = f"loot_{pool_id}_{phase}{moon_suffix}"
                component_groups[group] = {
                    "minecraft:loot": {
                        "table": f"loot_tables/gameplay/{stem}_{phase}{moon_suffix}.json",
                    }
                }

    # Fallback only — fishing_biome.js applies the correct pool via triggerEvent.
    # JSON cannot read moon phase; quiet day/night only. Script overlays full moon.
    spawn_sequence: list[dict] = [
        {
            "filters": _time_filter(True),
            "add": {"component_groups": ["loot_default_day"]},
        },
        {
            "filters": _time_filter(False),
            "add": {"component_groups": ["loot_default_night"]},
        },
    ]

    apply_events: dict = {}
    for pool_id in BIOME_POOLS:
        for phase in ("day", "night"):
            for moon_suffix, _full_moon in MOON_PHASES:
                apply_events[
                    f"enchant_fish:apply_loot_{pool_id}_{phase}{moon_suffix}"
                ] = {
                    "add": {"component_groups": [f"loot_{pool_id}_{phase}{moon_suffix}"]},
                }

    return {
        "format_version": "1.12.0",
        "minecraft:entity": {
            "description": {
                "identifier": "minecraft:fishing_hook",
                "is_spawnable": False,
                "is_summonable": False,
                "is_experimental": False,
            },
            "component_groups": component_groups,
            "components": {
                "minecraft:collision_box": {"width": 0.15, "height": 0.15},
                "minecraft:projectile": {"on_hit": {"stick_in_ground": {}}},
                "minecraft:loot": {"table": "loot_tables/gameplay/fishing_day.json"},
                "minecraft:physics": {},
                "minecraft:pushable": {
                    "is_pushable": False,
                    "is_pushable_by_piston": True,
                },
                "minecraft:conditional_bandwidth_optimization": {
                    "default_values": {
                        "max_optimized_distance": 80.0,
                        "max_dropped_ticks": 7,
                        "use_motion_prediction_hints": True,
                    }
                },
            },
            "events": {
                "minecraft:entity_spawned": {"sequence": spawn_sequence},
                **apply_events,
            },
        },
    }


def _probe_trigger(biome_tag: str) -> tuple[dict, dict, dict, dict]:
    tag = f"enchant_fish:probe_{biome_tag}"
    add_event = f"enchant_fish:probe_add_{biome_tag}"
    remove_event = f"enchant_fish:probe_remove_{biome_tag}"
    add_trigger = {
        "filters": [
            {"test": "has_biome_tag", "value": biome_tag},
            {"test": "has_tag", "operator": "not", "value": tag},
        ],
        "event": add_event,
    }
    remove_trigger = {
        "filters": [
            {"test": "has_biome_tag", "operator": "not", "value": biome_tag},
            {"test": "has_tag", "value": tag},
        ],
        "event": remove_event,
    }
    add_evt = {"queue_command": {"command": f'tag @s add "{tag}"'}}
    remove_evt = {"queue_command": {"command": f'tag @s remove "{tag}"'}}
    return add_trigger, remove_trigger, add_evt, remove_evt


def build_probe_json() -> dict:
    triggers: list[dict] = []
    events: dict = {}

    for biome_tag in PROBE_BIOME_TAGS:
        add_t, remove_t, add_e, remove_e = _probe_trigger(biome_tag)
        triggers.extend([add_t, remove_t])
        events[f"enchant_fish:probe_add_{biome_tag}"] = add_e
        events[f"enchant_fish:probe_remove_{biome_tag}"] = remove_e

    return {
        "format_version": "1.20.60",
        "minecraft:entity": {
            "description": {
                "identifier": "enchant_fish:biome_probe",
                "is_spawnable": False,
                "is_summonable": True,
                "is_experimental": False,
            },
            "components": {
                "minecraft:type_family": {
                    "family": ["enchant_fish_biome_probe", "inanimate"]
                },
                "minecraft:environment_sensor": {"triggers": triggers},
                "minecraft:collision_box": {"width": 0, "height": 0},
                "minecraft:physics": {"has_collision": False, "has_gravity": False},
                "minecraft:pushable": {
                    "is_pushable": False,
                    "is_pushable_by_piston": False,
                },
                "minecraft:damage_sensor": {
                    "triggers": [{"deals_damage": False}]
                },
                "minecraft:knockback_resistance": {"value": 1},
                "minecraft:fire_immune": {},
                "minecraft:transient": {},
            },
            "events": events,
        },
    }


def main() -> None:
    write_loot_tables()
    hook = build_hook_json()
    HOOK_OUT.write_text(json.dumps(hook, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    probe = build_probe_json()
    PROBE_OUT.write_text(json.dumps(probe, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    apply_count = len(BIOME_POOLS) * 4
    print(f"Wrote {HOOK_OUT} (fallback day/night + {apply_count} script apply events)")
    print(f"Wrote {PROBE_OUT} ({len(PROBE_BIOME_TAGS)} biome tags)")
    print(
        f"Wrote day/night × quiet/fullmoon loot for {len(BIOME_POOLS)} pools under {LOOT_DIR}"
    )


if __name__ == "__main__":
    main()
