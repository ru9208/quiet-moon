import { world, system } from "@minecraft/server";

const COMBAT_DIFF_KEY = "my_pack:combat_difficulty";
const MOON_SPAWN_ACTIVE_KEY = "my_pack:moon_spawn_active";
const LEVELS = ["peaceful", "easy", "normal", "hard"];
const MOON_CHECK_INTERVAL = 80;
const DIMENSIONS = ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"];

function isFullMoon() {
  try {
    const phase = world.getMoonPhase();
    return phase === 0 || phase === "FullMoon";
  } catch {
    try {
      return Math.floor(world.getAbsoluteTime() / 24000) % 8 === 0;
    } catch {
      return false;
    }
  }
}

function levelFromDifficulty(value) {
  if (value == null) {
    return undefined;
  }
  if (typeof value === "number") {
    return LEVELS[value];
  }
  const text = String(value).toLowerCase();
  if (text.includes("peaceful")) return "peaceful";
  if (text.includes("easy")) return "easy";
  if (text.includes("hard")) return "hard";
  if (text.includes("normal")) return "normal";
  return undefined;
}

function getCurrentLevel() {
  try {
    return levelFromDifficulty(world.getDifficulty());
  } catch {
    return undefined;
  }
}

function applyLevel(level) {
  try {
    if (typeof world.setDifficulty === "function") {
      const index = LEVELS.indexOf(level);
      if (index >= 0) {
        world.setDifficulty(index);
      }
    }
  } catch {
    // API may require an enum value
  }
  try {
    world.getDimension("minecraft:overworld").runCommand(`difficulty ${level}`);
  } catch {
    // ignore
  }
}

function getSavedCombatLevel() {
  const saved = world.getDynamicProperty(COMBAT_DIFF_KEY);
  if (saved === "easy" || saved === "normal" || saved === "hard") {
    return saved;
  }
  return "normal";
}

function saveCombatLevel(level) {
  if (level === "easy" || level === "normal" || level === "hard") {
    world.setDynamicProperty(COMBAT_DIFF_KEY, level);
  }
}

function ensureCombatDifficulty() {
  const current = getCurrentLevel();
  if (current === "easy" || current === "normal" || current === "hard") {
    saveCombatLevel(current);
    return;
  }
  applyLevel(getSavedCombatLevel());
}

function setMobSpawning(enabled) {
  try {
    if (world.gameRules && "doMobSpawning" in world.gameRules) {
      world.gameRules.doMobSpawning = enabled;
      return;
    }
  } catch {
    // fall through to command
  }
  const text = enabled ? "true" : "false";
  for (const id of DIMENSIONS) {
    try {
      world.getDimension(id).runCommand(`gamerule doMobSpawning ${text}`);
    } catch {
      // ignore
    }
  }
}

function enterFullMoon() {
  world.setDynamicProperty(MOON_SPAWN_ACTIVE_KEY, true);
  ensureCombatDifficulty();
  setMobSpawning(true);
}

function enterQuietMoon() {
  world.setDynamicProperty(MOON_SPAWN_ACTIVE_KEY, false);
  ensureCombatDifficulty();
  setMobSpawning(false);
}

function syncMoonSpawns(fullMoon, wasFullMoon, initialLoad) {
  if (fullMoon) {
    if (!wasFullMoon || (initialLoad && world.getDynamicProperty(MOON_SPAWN_ACTIVE_KEY) !== true)) {
      enterFullMoon();
    }
    return;
  }
  if (wasFullMoon || (initialLoad && world.getDynamicProperty(MOON_SPAWN_ACTIVE_KEY) !== false)) {
    enterQuietMoon();
  }
}

let primed = false;
let wasFullMoon = false;

system.runInterval(() => {
  const now = isFullMoon();
  const initialLoad = !primed;
  if (!primed || now !== wasFullMoon) {
    syncMoonSpawns(now, wasFullMoon, initialLoad);
    primed = true;
    wasFullMoon = now;
  }
}, MOON_CHECK_INTERVAL);

export { isFullMoon, isQuietMoon };

function isQuietMoon() {
  return world.getDynamicProperty(MOON_SPAWN_ACTIVE_KEY) === false;
}
