import { system, world } from "@minecraft/server";
import {
    hasProbeBiomeTags,
    isEngineDaytime,
    isFullMoon,
    lootEventId,
    resolveFishingPool,
} from "./biome_resolver.js";

const PACK_VERSION = "2.1.19";
const PROBE_ID = "enchant_fish:biome_probe";
const HOOK_ID = "minecraft:fishing_hook";
const ROD_IDS = new Set([
    "minecraft:fishing_rod",
    "minecraft:carrot_on_a_stick",
    "minecraft:warped_fungus_on_a_stick",
]);

const CAST_TTL_TICKS = 40;
const TAG_CACHE_TTL_TICKS = 40;
const HOOK_FLY_TICKS = 8;
const UNDERGROUND_SCAN_UP = 48;
const UNDERGROUND_MIN_SOLID_ABOVE = 1;

/** @type {Map<string, { location: import("@minecraft/server").Vector3; tick: number }>} */
const recentCasts = new Map();

/** @type {Map<string, { tags: string[]; tick: number }>} */
const tagCache = new Map();

const NON_SOLID_PREFIXES = [
    "minecraft:air",
    "minecraft:cave_air",
    "minecraft:void_air",
    "minecraft:water",
    "minecraft:flowing_water",
    "minecraft:lava",
    "minecraft:flowing_lava",
    "minecraft:tall_grass",
    "minecraft:short_grass",
    "minecraft:seagrass",
    "minecraft:kelp",
    "minecraft:vine",
    "minecraft:leaves",
    "minecraft:azalea_leaves",
    "minecraft:cherry_leaves",
    "minecraft:mangrove_leaves",
];

function findNearestRodPlayer(hookEntity, maxDist = 12) {
    const dim = hookEntity.dimension;
    const loc = hookEntity.location;
    let best = undefined;
    let bestDist = maxDist * maxDist;
    for (const player of world.getAllPlayers()) {
        if (!player.isValid() || player.dimension.id !== dim.id) continue;
        const inv = player.getComponent("inventory")?.container;
        if (!inv) continue;
        const selected = inv.getItem(player.selectedSlotIndex);
        if (!selected || !ROD_IDS.has(selected.typeId)) continue;
        const pLoc = player.location;
        const dx = pLoc.x - loc.x;
        const dy = pLoc.y - loc.y;
        const dz = pLoc.z - loc.z;
        const dist = dx * dx + dy * dy + dz * dz;
        if (dist <= bestDist) {
            bestDist = dist;
            best = player;
        }
    }
    return best;
}

function floorCenter(location) {
    return {
        x: Math.floor(location.x) + 0.5,
        y: Math.floor(location.y) + 0.5,
        z: Math.floor(location.z) + 0.5,
    };
}

/** Feet / water cell — never the flying hook's current block. */
function belowInWater(location) {
    return {
        x: Math.floor(location.x) + 0.5,
        y: Math.floor(location.y) - 0.5,
        z: Math.floor(location.z) + 0.5,
    };
}

function cacheKey(dimension, location) {
    return `${dimension.id}:${Math.floor(location.x)}:${Math.floor(location.y)}:${Math.floor(location.z)}`;
}

function isNonSolidBlockId(typeId) {
    if (!typeId) {
        return true;
    }
    return NON_SOLID_PREFIXES.some(
        (prefix) => typeId === prefix || typeId.startsWith(`${prefix}_`)
    );
}

function getBlockAt(dimension, x, y, z) {
    try {
        return dimension.getBlock({ x, y, z });
    } catch {
        return undefined;
    }
}

/**
 * Mirrors Bedrock is_underground: enclosed water — solid ceiling above the water column.
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").Vector3} location
 */
function isUndergroundAt(dimension, location) {
    const x = Math.floor(location.x);
    const y = Math.floor(location.y);
    const z = Math.floor(location.z);
    let solidAbove = 0;

    for (let dy = 1; dy <= UNDERGROUND_SCAN_UP; dy++) {
        const block = getBlockAt(dimension, x, y + dy, z);
        if (!block) {
            return false;
        }
        if (isNonSolidBlockId(block.typeId)) {
            continue;
        }
        solidAbove++;
        if (solidAbove >= UNDERGROUND_MIN_SOLID_ABOVE) {
            return true;
        }
    }

    return false;
}

function sampleLocations(castLocation, hookLocation) {
    const points = [belowInWater(castLocation)];
    const hx = Math.floor(hookLocation.x);
    const hy = Math.floor(hookLocation.y);
    const hz = Math.floor(hookLocation.z);
    for (let dy = 1; dy <= 4; dy++) {
        points.push({ x: hx + 0.5, y: hy - dy + 0.5, z: hz + 0.5 });
    }
    return points;
}

async function probeBiomeTagsAt(dimension, location) {
    let probe;
    try {
        probe = dimension.spawnEntity(PROBE_ID, belowInWater(location));
        for (let i = 0; i < 5; i++) {
            await system.waitTicks(1);
            if (!probe.isValid()) break;
            const tags = probe.getTags();
            if (hasProbeBiomeTags(tags)) {
                return tags;
            }
        }
        return probe.isValid() ? probe.getTags() : [];
    } catch (error) {
        console.warn(`[FishingBiome] probe spawn failed: ${error}`);
        return [];
    } finally {
        if (probe?.isValid()) {
            probe.remove();
        }
    }
}

function tryGetBiomeTags(dimension, location) {
    try {
        if (typeof dimension.getBiome !== "function") {
            return [];
        }
        const biome = dimension.getBiome(floorCenter(location));
        if (!biome || typeof biome.getTags !== "function") {
            return [];
        }
        return biome.getTags();
    } catch {
        return [];
    }
}

async function readBiomeTagsFromProbe(dimension, locations) {
    for (const location of locations) {
        const key = cacheKey(dimension, location);
        const cached = tagCache.get(key);
        if (cached && system.currentTick - cached.tick <= TAG_CACHE_TTL_TICKS) {
            return cached.tags;
        }

        const tags = await probeBiomeTagsAt(dimension, location);
        if (tags.length > 0) {
            tagCache.set(key, { tags, tick: system.currentTick });
        }
        if (hasProbeBiomeTags(tags)) {
            return tags;
        }
    }
    return [];
}

async function collectBiomeTags(dimension, locations) {
    for (const location of locations) {
        const apiTags = tryGetBiomeTags(dimension, location);
        if (apiTags.length > 0) {
            return apiTags;
        }
    }
    return readBiomeTagsFromProbe(dimension, locations);
}

/**
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").Vector3[]} locations
 * @param {import("@minecraft/server").Vector3} undergroundSample
 */
async function resolvePoolAt(dimension, locations, undergroundSample) {
    const tags = await collectBiomeTags(dimension, locations);
    const isUnderground = isUndergroundAt(dimension, undergroundSample);
    return resolveFishingPool(tags, {
        y: undergroundSample.y,
        isUnderground,
    });
}

function applyLootToHook(hook, poolId, isDay, fullMoon) {
    if (!hook.isValid()) {
        return;
    }
    try {
        hook.triggerEvent(lootEventId(poolId, isDay, fullMoon));
    } catch (error) {
        console.warn(`[FishingBiome] triggerEvent failed: ${error}`);
    }
}

function showPoolHint(player, poolId) {
    player.onScreenDisplay.setActionBar({
        rawtext: [
            { translate: "action.enchant_fish.fishing_pool" },
            { text: " " },
            { translate: `biome.enchant_fish.pool.${poolId}` },
        ],
    });
}

/** Prefetch biome tags at feet/water so the probe is not in the hook spawn cell. */
function prefetchCastBiome(dimension, castLocation) {
    const sample = belowInWater(castLocation);
    const key = cacheKey(dimension, sample);
    if (tagCache.has(key)) {
        return;
    }
    collectBiomeTags(dimension, [sample]).catch((error) => {
        console.warn(`[FishingBiome] prefetch failed: ${error}`);
    });
}

async function routeHookLoot(hook) {
    const player = findNearestRodPlayer(hook);
    if (!player) {
        return;
    }

    const cached = recentCasts.get(player.id);
    const castLoc =
        cached && system.currentTick - cached.tick <= CAST_TTL_TICKS
            ? cached.location
            : player.location;
    const hookLoc = hook.location;
    const locations = sampleLocations(castLoc, hookLoc);
    const isDay = isEngineDaytime(world.getTimeOfDay());
    const fullMoon = isFullMoon(world);

    const { poolId } = await resolvePoolAt(hook.dimension, locations, hookLoc);
    applyLootToHook(hook, poolId, isDay, fullMoon);
    showPoolHint(player, poolId);
}

world.afterEvents.itemUse.subscribe((event) => {
    const { source: player, itemStack } = event;
    if (!player?.isValid() || !itemStack || !ROD_IDS.has(itemStack.typeId)) {
        return;
    }

    const castLoc = { ...player.location };
    recentCasts.set(player.id, {
        location: castLoc,
        tick: system.currentTick,
    });
    prefetchCastBiome(player.dimension, castLoc);
});

world.afterEvents.entitySpawn.subscribe((event) => {
    const entity = event.entity;
    if (entity.typeId !== HOOK_ID) {
        return;
    }
    system.run(async () => {
        try {
            await system.waitTicks(HOOK_FLY_TICKS);
            if (!entity.isValid()) {
                return;
            }
            await routeHookLoot(entity);
        } catch (error) {
            console.warn(`[FishingBiome] route loot failed: ${error}`);
        }
    });
});

console.log(
    `[FishingBiome] module v${PACK_VERSION} loaded (probe offset + delayed hook routing + full moon)`
);
