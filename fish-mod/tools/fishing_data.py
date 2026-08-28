"""Shared fishing biome routes, day/night fish splits, and display names."""

from __future__ import annotations

# Enchant fish per biome — day and night are disjoint species lists.
FISH_DAY_NIGHT: dict[str, dict[str, list[str]]] = {
    "freshwater": {
        "day": [
            "enchant_fish:fish_lure",
            "enchant_fish:fish_luck_of_the_sea",
            "enchant_fish:fish_knockback",
        ],
        "night": [
            "enchant_fish:fish_depth_strider",
            "enchant_fish:fish_unbreaking",
        ],
    },
    "end": {
        "day": ["enchant_fish:fish_mending", "enchant_fish:fish_looting"],
        "night": ["enchant_fish:fish_mending", "enchant_fish:fish_looting"],
    },
    "desert": {
        "day": ["enchant_fish:fish_fire_aspect", "enchant_fish:fish_flame"],
        "night": ["enchant_fish:fish_punch"],
    },
    "jungle": {
        "day": ["enchant_fish:fish_thorns"],
        "night": ["enchant_fish:fish_bane_of_arthropods"],
    },
    "swamp": {
        "day": ["enchant_fish:fish_sharpness"],
        "night": ["enchant_fish:fish_feather_falling"],
    },
    "arctic": {
        "day": [
            "enchant_fish:fish_frost_walker",
            "enchant_fish:fish_projectile_protection",
        ],
        "night": ["enchant_fish:fish_silk_touch"],
    },
    "mountain": {
        "day": ["enchant_fish:fish_protection", "enchant_fish:fish_breach"],
        "night": ["enchant_fish:fish_wind_burst"],
    },
    "roofed": {
        "day": ["enchant_fish:fish_quick_charge"],
        "night": ["enchant_fish:fish_piercing"],
    },
    "cherry": {
        "day": ["enchant_fish:fish_multishot"],
        "night": ["enchant_fish:fish_lunge"],
    },
    "sulfur": {
        "day": ["enchant_fish:fish_fire_protection"],
        "night": ["enchant_fish:fish_blast_protection"],
    },
    "saltwater": {
        "day": [
            "enchant_fish:fish_riptide",
            "enchant_fish:fish_respiration",
            "enchant_fish:fish_impaling",
        ],
        "night": [
            "enchant_fish:fish_loyalty",
            "enchant_fish:fish_channeling",
            "enchant_fish:fish_infinity",
        ],
    },
    "cave": {
        "day": ["enchant_fish:fish_smite", "enchant_fish:fish_efficiency"],
        "night": ["enchant_fish:fish_fortune"],
    },
    "dripstone": {
        "day": ["enchant_fish:fish_aqua_affinity"],
        "night": ["enchant_fish:fish_binding_curse"],
    },
    "lush": {
        "day": ["enchant_fish:fish_swift_sneak"],
        "night": ["enchant_fish:fish_density"],
    },
    "deep_dark": {
        "day": ["enchant_fish:fish_soul_speed"],
        "night": ["enchant_fish:fish_vanishing_curse"],
    },
}

MOON_PHASES: tuple[tuple[str, bool], ...] = (("", False), ("_fullmoon", True))

# Vanilla meat food. 鲑鱼 = salmon. No bass item; 鲈鱼 maps to 鳕鱼 (cod).
FULLMOON_FOOD_FISH: frozenset[str] = frozenset(
    {
        "minecraft:salmon",
        "minecraft:cod",
    }
)

# Per-biome vanilla food pool (weights). Tropical / puffer stay on quiet moons.
VANILLA_FISH: dict[str, list[tuple[str, int]]] = {
    "vanilla_freshwater_fish": [
        ("minecraft:cod", 60),
        ("minecraft:salmon", 40),
    ],
    "vanilla_end_fish": [
        ("minecraft:cod", 50),
        ("minecraft:salmon", 50),
    ],
    "vanilla_desert_fish": [
        ("minecraft:cod", 70),
        ("minecraft:salmon", 30),
    ],
    "vanilla_jungle_fish": [
        ("minecraft:cod", 20),
        ("minecraft:salmon", 20),
        ("minecraft:tropical_fish", 35),
        ("minecraft:pufferfish", 25),
    ],
    "vanilla_swamp_fish": [
        ("minecraft:cod", 50),
        ("minecraft:salmon", 50),
    ],
    "vanilla_arctic_fish": [
        ("minecraft:cod", 35),
        ("minecraft:salmon", 65),
    ],
    "vanilla_mountain_fish": [
        ("minecraft:cod", 45),
        ("minecraft:salmon", 55),
    ],
    "vanilla_roofed_fish": [
        ("minecraft:cod", 55),
        ("minecraft:salmon", 45),
    ],
    "vanilla_cherry_fish": [
        ("minecraft:cod", 40),
        ("minecraft:salmon", 40),
        ("minecraft:tropical_fish", 20),
    ],
    "vanilla_sulfur_fish": [
        ("minecraft:cod", 50),
        ("minecraft:salmon", 50),
    ],
    "vanilla_saltwater_fish": [
        ("minecraft:cod", 30),
        ("minecraft:salmon", 25),
        ("minecraft:tropical_fish", 15),
        ("minecraft:pufferfish", 30),
    ],
    "vanilla_cave_fish": [
        ("minecraft:cod", 60),
        ("minecraft:salmon", 40),
    ],
    "vanilla_dripstone_fish": [
        ("minecraft:cod", 55),
        ("minecraft:salmon", 45),
    ],
    "vanilla_lush_fish": [
        ("minecraft:cod", 45),
        ("minecraft:salmon", 35),
        ("minecraft:tropical_fish", 20),
    ],
    "vanilla_deep_dark_fish": [
        ("minecraft:cod", 40),
        ("minecraft:salmon", 60),
    ],
}


def vanilla_food_for(vanilla_stem: str, full_moon: bool) -> list[tuple[str, int]]:
    entries = VANILLA_FISH[vanilla_stem]
    if full_moon:
        return list(entries)
    return [(name, weight) for name, weight in entries if name not in FULLMOON_FOOD_FISH]


# Biome pool metadata: loot file stem, vanilla sub-table, probe tag suffix.
BIOME_POOLS: dict[str, dict[str, str]] = {
    "default": {
        "stem": "fishing",
        "vanilla": "vanilla_freshwater_fish",
        "fish_key": "freshwater",
        "probe": None,
        "display_zh": "淡水",
        "display_en": "Freshwater",
    },
    "end": {
        "stem": "end_fishing",
        "vanilla": "vanilla_end_fish",
        "fish_key": "end",
        "probe": "the_end",
        "display_zh": "末地",
        "display_en": "The End",
    },
    "desert": {
        "stem": "desert_fishing",
        "vanilla": "vanilla_desert_fish",
        "fish_key": "desert",
        "probe": "desert",
        "display_zh": "沙漠",
        "display_en": "Desert",
    },
    "jungle": {
        "stem": "jungle_fishing",
        "vanilla": "vanilla_jungle_fish",
        "fish_key": "jungle",
        "probe": "jungle",
        "display_zh": "丛林",
        "display_en": "Jungle",
    },
    "swamp": {
        "stem": "swamp_fishing",
        "vanilla": "vanilla_swamp_fish",
        "fish_key": "swamp",
        "probe": "swamp",
        "display_zh": "沼泽",
        "display_en": "Swamp",
    },
    "arctic": {
        "stem": "arctic_fishing",
        "vanilla": "vanilla_arctic_fish",
        "fish_key": "arctic",
        "probe": "cold",
        "display_zh": "寒带",
        "display_en": "Arctic",
    },
    "mountain": {
        "stem": "mountain_fishing",
        "vanilla": "vanilla_mountain_fish",
        "fish_key": "mountain",
        "probe": "mountain",
        "display_zh": "山地",
        "display_en": "Mountain",
    },
    "roofed": {
        "stem": "roofed_fishing",
        "vanilla": "vanilla_roofed_fish",
        "fish_key": "roofed",
        "probe": "roofed",
        "display_zh": "黑森林",
        "display_en": "Roofed Forest",
    },
    "cherry": {
        "stem": "cherry_fishing",
        "vanilla": "vanilla_cherry_fish",
        "fish_key": "cherry",
        "probe": "cherry_grove",
        "display_zh": "樱花树林",
        "display_en": "Cherry Grove",
    },
    "sulfur": {
        "stem": "sulfur_fishing",
        "vanilla": "vanilla_sulfur_fish",
        "fish_key": "sulfur",
        "probe": "sulfur_caves",
        "display_zh": "硫磺洞穴",
        "display_en": "Sulfur Caves",
    },
    "saltwater": {
        "stem": "saltwater_fishing",
        "vanilla": "vanilla_saltwater_fish",
        "fish_key": "saltwater",
        "probe": "ocean",
        "display_zh": "海洋",
        "display_en": "Ocean",
    },
    "cave": {
        "stem": "cave_fishing",
        "vanilla": "vanilla_cave_fish",
        "fish_key": "cave",
        "probe": None,
        "display_zh": "洞穴",
        "display_en": "Caves",
    },
    "dripstone": {
        "stem": "dripstone_fishing",
        "vanilla": "vanilla_dripstone_fish",
        "fish_key": "dripstone",
        "probe": "dripstone_caves",
        "display_zh": "溶洞",
        "display_en": "Dripstone Caves",
    },
    "lush": {
        "stem": "lush_fishing",
        "vanilla": "vanilla_lush_fish",
        "fish_key": "lush",
        "probe": "lush_caves",
        "display_zh": "繁茂洞穴",
        "display_en": "Lush Caves",
    },
    "deep_dark": {
        "stem": "deep_dark_fishing",
        "vanilla": "vanilla_deep_dark_fish",
        "fish_key": "deep_dark",
        "probe": "deep_dark",
        "display_zh": "深暗之域",
        "display_en": "Deep Dark",
    },
}

# Route id -> filter (last matching rule in sequence wins).
BIOME_ROUTE_RULES: list[tuple[str, dict]] = [
    ("end", {"test": "is_biome", "value": "the_end"}),
    (
        "desert",
        {
            "any_of": [
                {"test": "has_biome_tag", "value": "desert"},
                {"test": "has_biome_tag", "value": "savanna"},
                {"test": "has_biome_tag", "value": "mesa"},
            ]
        },
    ),
    (
        "jungle",
        {
            "any_of": [
                {"test": "has_biome_tag", "value": "jungle"},
                {"test": "has_biome_tag", "value": "bamboo"},
            ]
        },
    ),
    (
        "swamp",
        {
            "any_of": [
                {"test": "has_biome_tag", "value": "swamp"},
                {"test": "has_biome_tag", "value": "mangrove_swamp"},
            ]
        },
    ),
    (
        "mountain",
        {
            "all_of": [
                {
                    "any_of": [
                        {"test": "has_biome_tag", "value": "mountain"},
                        {"test": "has_biome_tag", "value": "jagged_peaks"},
                        {"test": "has_biome_tag", "value": "meadow"},
                        {"test": "has_biome_tag", "value": "grove"},
                        {"test": "has_biome_tag", "value": "extreme_hills"},
                    ]
                },
                {"test": "is_altitude", "operator": ">", "value": 62},
            ]
        },
    ),
    (
        "arctic",
        {
            "all_of": [
                {
                    "any_of": [
                        {"test": "has_biome_tag", "value": "taiga"},
                        {"test": "has_biome_tag", "value": "frozen"},
                        {"test": "has_biome_tag", "value": "ice"},
                        {"test": "has_biome_tag", "value": "snow_covered"},
                    ]
                },
                {"test": "is_altitude", "operator": ">", "value": 62},
            ]
        },
    ),
    ("roofed", {"test": "has_biome_tag", "value": "roofed"}),
    ("cherry", {"test": "has_biome_tag", "value": "cherry_grove"}),
    ("sulfur", {"test": "has_biome_tag", "value": "sulfur_caves"}),
    (
        "saltwater",
        {
            "any_of": [
                {"test": "is_biome", "value": "ocean"},
                {"test": "is_biome", "value": "beach"},
                {"test": "has_biome_tag", "value": "ocean"},
            ]
        },
    ),
    (
        "arctic",
        {
            "all_of": [
                {"test": "has_biome_tag", "value": "ocean"},
                {"test": "has_biome_tag", "value": "cold"},
            ]
        },
    ),
    ("dripstone", {"test": "has_biome_tag", "value": "dripstone_caves"}),
    ("lush", {"test": "has_biome_tag", "value": "lush_caves"}),
    ("deep_dark", {"test": "has_biome_tag", "value": "deep_dark"}),
]

# Script-only: generic underground cave pool (not a biome tag — see biome_resolver.js).
SCRIPT_ROUTE_RULES = BIOME_ROUTE_RULES + [
    (
        "cave",
        {
            "all_of": [
                {"test": "is_underground", "value": True},
                {"test": "has_biome_tag", "operator": "not", "value": "dripstone_caves"},
                {"test": "has_biome_tag", "operator": "not", "value": "lush_caves"},
                {"test": "has_biome_tag", "operator": "not", "value": "deep_dark"},
                {"test": "has_biome_tag", "operator": "not", "value": "sulfur_caves"},
            ]
        },
    ),
]

# Extra probe tags for resolver (any_of groups).
PROBE_BIOME_TAGS: list[str] = [
    "the_end",
    "desert",
    "savanna",
    "mesa",
    "jungle",
    "bamboo",
    "swamp",
    "mangrove_swamp",
    "taiga",
    "frozen",
    "ice",
    "snow_covered",
    "cold",
    "mountain",
    "jagged_peaks",
    "meadow",
    "grove",
    "extreme_hills",
    "roofed",
    "cherry_grove",
    "sulfur_caves",
    "ocean",
    "beach",
    "dripstone_caves",
    "lush_caves",
    "deep_dark",
]
