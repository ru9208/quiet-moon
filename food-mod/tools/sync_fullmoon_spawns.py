"""Fetch official 1.21.130 spawn_rules and add overworld full-moon filter."""
from __future__ import annotations

import json
import re
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPAWN_DIR = ROOT / "BP" / "spawn_rules" / "minecraft"
ENT_DIR = ROOT / "BP" / "entities"
LOOT_DIR = ROOT / "BP" / "loot_tables" / "entities"
TAG = "v1.21.130.3"
BASE = f"https://raw.githubusercontent.com/Mojang/bedrock-samples/{TAG}/behavior_pack"

OVERWORLD_SPAWN_FILES = [
    "bogged.json",
    "camel_husk.json",
    "creeper.json",
    "drowned.json",
    "enderman.json",
    "guardian.json",
    "husk.json",
    "parched.json",
    "phantom.json",
    "pillager.json",
    "pillager_patrol.json",
    "skeleton.json",
    "slime.json",
    "spider.json",
    "stray.json",
    "witch.json",
    "zombie.json",
    "zombie_horse.json",
]

NETHER_SPAWN_FILES = [
    "blaze.json",
    "ghast.json",
    "hoglin.json",
    "magma_cube.json",
    "piglin.json",
    "strider.json",
    "wither_skeleton.json",
    "zombie_pigman.json",
]

ENTITY_FILES = [
    "zombie.json",
    "husk.json",
    "drowned.json",
    "zombie_horse.json",
    "camel_husk.json",
]

LOOT_FILES = [
    "zombie_rider.json",
    "zombie_rider_equipment.json",
    "zombie_equipment.json",
    "zombie.json",
]

NETHER_BIOME_TAGS = {
    "nether",
    "nether_wastes",
    "soulsand_valley",
    "soul_sand_valley",
    "crimson_forest",
    "warped_forest",
    "basalt_deltas",
    "netherwart_forest",
    "spawn_nether",
    "the_end",
}

MOON = {"test": "moon_phase", "operator": "==", "value": 0}
HUNT = {
    "test": "has_tag",
    "subject": "other",
    "value": "my_pack:zombie_hunt_player",
}


def fetch(rel: str) -> str:
    url = f"{BASE}/{rel}"
    last_error: Exception | None = None
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "MyPackSync/1.0"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read().decode("utf-8")
        except Exception as exc:
            last_error = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"fetch failed {rel}: {last_error}")


def strip_json_comments(text: str) -> str:
    out: list[str] = []
    for line in text.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("//"):
            continue
        if "//" in line:
            in_str = False
            escaped = False
            buf: list[str] = []
            for idx, ch in enumerate(line):
                if escaped:
                    buf.append(ch)
                    escaped = False
                    continue
                if ch == "\\":
                    buf.append(ch)
                    escaped = True
                    continue
                if ch == '"':
                    in_str = not in_str
                    buf.append(ch)
                    continue
                if not in_str and ch == "/" and idx + 1 < len(line) and line[idx + 1] == "/":
                    break
                buf.append(ch)
            line = "".join(buf).rstrip()
            if not line.strip():
                continue
        out.append(line)
    return "\n".join(out)


def parse_json(text: str) -> dict:
    cleaned = strip_json_comments(text)
    cleaned = re.sub(r",\s*([}\]])", r"\1", cleaned)
    return json.loads(cleaned)


def dump_json(data: dict) -> str:
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"


def condition_is_nether(cond: dict) -> bool:
    def has_positive_nether_tag(node) -> bool:
        if isinstance(node, dict):
            if node.get("test") == "has_biome_tag" and node.get("value") in NETHER_BIOME_TAGS:
                op = node.get("operator", "==")
                if op in ("==", "=", "equals"):
                    return True
            return any(has_positive_nether_tag(child) for child in node.values())
        if isinstance(node, list):
            return any(has_positive_nether_tag(child) for child in node)
        return False

    return has_positive_nether_tag(cond.get("minecraft:biome_filter"))


def already_has_moon(node) -> bool:
    if isinstance(node, dict):
        if node.get("test") == "moon_phase":
            return True
        return any(already_has_moon(v) for v in node.values())
    if isinstance(node, list):
        return any(already_has_moon(v) for v in node)
    return False


def add_moon_filter(biome_filter):
    if biome_filter is None:
        return dict(MOON)
    if already_has_moon(biome_filter):
        return biome_filter
    if isinstance(biome_filter, list):
        return list(biome_filter) + [dict(MOON)]
    if isinstance(biome_filter, dict) and "all_of" in biome_filter:
        next_filter = dict(biome_filter)
        next_filter["all_of"] = list(biome_filter["all_of"]) + [dict(MOON)]
        return next_filter
    return {"all_of": [biome_filter, dict(MOON)]}


def patch_overworld_spawns(data: dict) -> dict:
    rules = data.get("minecraft:spawn_rules", {})
    conditions = rules.get("conditions", [])
    for cond in conditions:
        if not isinstance(cond, dict) or condition_is_nether(cond):
            continue
        cond["minecraft:biome_filter"] = add_moon_filter(cond.get("minecraft:biome_filter"))
    return data


def require_hunt_on_player(filters):
    if not isinstance(filters, dict):
        return filters
    tests = []
    if "all_of" in filters:
        tests = filters["all_of"]
        if any(isinstance(t, dict) and t.get("value") == "my_pack:zombie_hunt_player" for t in tests):
            return filters
        has_player = any(isinstance(t, dict) and t.get("value") == "player" and t.get("test") == "is_family" for t in tests)
        if has_player:
            return {"all_of": list(tests) + [dict(HUNT)]}
        return filters
    if "any_of" in filters:
        parts = []
        for part in filters["any_of"]:
            if isinstance(part, dict) and part.get("test") == "is_family" and part.get("value") == "player":
                parts.append({"all_of": [part, dict(HUNT)]})
            else:
                parts.append(part)
        return {"any_of": parts}
    if filters.get("test") == "is_family" and filters.get("value") == "player":
        return {"all_of": [filters, dict(HUNT)]}
    return filters


def patch_zombie_hunt(entity: dict) -> dict:
    def walk(node):
        if isinstance(node, dict):
            if "minecraft:behavior.nearest_attackable_target" in node:
                target = node["minecraft:behavior.nearest_attackable_target"]
                for entry in target.get("entity_types", []):
                    if isinstance(entry, dict) and "filters" in entry:
                        entry["filters"] = require_hunt_on_player(entry["filters"])
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(entity)
    return entity


def write(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(dump_json(data), encoding="utf-8")


def main() -> None:
    SPAWN_DIR.mkdir(parents=True, exist_ok=True)
    for name in OVERWORLD_SPAWN_FILES:
        raw = fetch(f"spawn_rules/{name}")
        data = parse_json(raw)
        write(SPAWN_DIR / name, data)
        print(f"OW spawn {name}")

    for name in NETHER_SPAWN_FILES:
        raw = fetch(f"spawn_rules/{name}")
        data = parse_json(raw)
        write(SPAWN_DIR / name, data)
        print(f"NE spawn {name}")

    for name in ENTITY_FILES:
        raw = fetch(f"entities/{name}")
        data = parse_json(raw)
        if name in {"zombie.json", "husk.json", "drowned.json"}:
            data = patch_zombie_hunt(data)
        write(ENT_DIR / name, data)
        print(f"entity {name}")

    for name in LOOT_FILES:
        try:
            raw = fetch(f"loot_tables/entities/{name}")
        except Exception as exc:
            print(f"skip loot {name}: {exc}")
            continue
        write(LOOT_DIR / name, parse_json(raw))
        print(f"loot {name}")


if __name__ == "__main__":
    main()
