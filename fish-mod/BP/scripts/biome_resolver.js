/** Biome tag + underground context → fishing pool id (matches fishing_data.py priority). */

export const POOL_DISPLAY = {
    default: { zh: "淡水", en: "Freshwater" },
    end: { zh: "末地", en: "The End" },
    desert: { zh: "沙漠", en: "Desert" },
    jungle: { zh: "丛林", en: "Jungle" },
    swamp: { zh: "沼泽", en: "Swamp" },
    arctic: { zh: "寒带", en: "Arctic" },
    mountain: { zh: "山地", en: "Mountain" },
    roofed: { zh: "黑森林", en: "Roofed Forest" },
    cherry: { zh: "樱花树林", en: "Cherry Grove" },
    sulfur: { zh: "硫磺洞穴", en: "Sulfur Caves" },
    saltwater: { zh: "海洋", en: "Ocean" },
    cave: { zh: "洞穴", en: "Caves" },
    dripstone: { zh: "溶洞", en: "Dripstone Caves" },
    lush: { zh: "繁茂洞穴", en: "Lush Caves" },
    deep_dark: { zh: "深暗之域", en: "Deep Dark" },
};

const SURFACE_ARCTIC_ALTITUDE = 62;
const SURFACE_MOUNTAIN_ALTITUDE = 62;

/**
 * @param {string[]} tagList entity tags and/or raw biome tag names
 * @returns {Set<string>}
 */
export function normalizeBiomeTags(tagList) {
    const raw = new Set();
    for (const tag of tagList) {
        if (tag.startsWith("enchant_fish:probe_")) {
            raw.add(tag.slice("enchant_fish:probe_".length));
        } else if (!tag.includes(":")) {
            raw.add(tag);
        }
    }
    return raw;
}

/**
 * @param {string[]} tags
 * @param {{ y?: number, isUnderground?: boolean }} [options]
 * @returns {{ poolId: string, displayZh: string, displayEn: string }}
 */
export function resolveFishingPool(tags, options = {}) {
    const t = normalizeBiomeTags(tags);
    const y = options.y ?? 64;
    const underground = options.isUnderground === true;

    let poolId = "default";

    const apply = (id, test) => {
        if (test()) {
            poolId = id;
        }
    };

    apply("end", () => t.has("the_end"));
    apply("desert", () => t.has("desert") || t.has("savanna") || t.has("mesa"));
    apply("jungle", () => t.has("jungle") || t.has("bamboo"));
    apply("swamp", () => t.has("swamp") || t.has("mangrove_swamp"));
    apply(
        "mountain",
        () =>
            (t.has("mountain") ||
                t.has("jagged_peaks") ||
                t.has("meadow") ||
                t.has("grove") ||
                t.has("extreme_hills")) &&
            y > SURFACE_MOUNTAIN_ALTITUDE
    );
    apply(
        "arctic",
        () =>
            (t.has("taiga") ||
                t.has("frozen") ||
                t.has("ice") ||
                t.has("snow_covered")) &&
            y > SURFACE_ARCTIC_ALTITUDE
    );
    apply("roofed", () => t.has("roofed"));
    apply("cherry", () => t.has("cherry_grove"));
    apply("sulfur", () => t.has("sulfur_caves"));
    apply("saltwater", () => (t.has("ocean") || t.has("beach")) && !t.has("cold"));
    apply("arctic", () => t.has("ocean") && t.has("cold"));
    apply("dripstone", () => t.has("dripstone_caves"));
    apply("lush", () => t.has("lush_caves"));
    apply("deep_dark", () => t.has("deep_dark"));
    apply(
        "cave",
        () =>
            underground &&
            !t.has("dripstone_caves") &&
            !t.has("lush_caves") &&
            !t.has("deep_dark") &&
            !t.has("sulfur_caves")
    );

    const display = POOL_DISPLAY[poolId] ?? POOL_DISPLAY.default;
    return { poolId, displayZh: display.zh, displayEn: display.en };
}

/** Bedrock is_daytime — matches entity filter used on fishing_hook fallback. */
export function isEngineDaytime(timeOfDay) {
    const time = ((timeOfDay % 24000) + 24000) % 24000;
    return time >= 0 && time < 12000;
}

/** Full moon = phase 0 for the whole calendar day (same clock as food pack). */
export function isFullMoon(worldRef) {
    try {
        const phase = worldRef.getMoonPhase();
        return phase === 0 || phase === "FullMoon";
    } catch {
        try {
            return Math.floor(worldRef.getAbsoluteTime() / 24000) % 8 === 0;
        } catch {
            return false;
        }
    }
}

export function hasProbeBiomeTags(entityTags) {
    return entityTags.some((tag) => tag.startsWith("enchant_fish:probe_"));
}

/** @param {string} poolId @param {boolean} isDay @param {boolean} [fullMoon] */
export function lootEventId(poolId, isDay, fullMoon = false) {
    const phase = isDay ? "day" : "night";
    return fullMoon
        ? `enchant_fish:apply_loot_${poolId}_${phase}_fullmoon`
        : `enchant_fish:apply_loot_${poolId}_${phase}`;
}
