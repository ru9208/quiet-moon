import { world, system } from "@minecraft/server";

/** Zombies hunt players only while this tag is present (food level <= 6, i.e. 3 shanks). */
export const ZOMBIE_HUNT_TAG = "my_pack:zombie_hunt_player";
const HUNGER_THRESHOLD = 6;
const SYNC_INTERVAL = 20;
const SLEEP_POLL_INTERVAL = 1;
const WAKE_CHECK_DELAY = 10;
const WAKE_DEBOUNCE_TICKS = 40;

/** Hunger I for 120s ≈ 3 food if saturation is empty (0.005 exhaustion/tick). */
const WAKE_HUNGER_DURATION = 2400;
const WAKE_HUNGER_SECONDS = 120;
const WAKE_HUNGER_AMPLIFIER = 0;

/** Time of day when the player last started sleeping. */
const sleepStartByPlayer = new Map();
const sleepingByPlayer = new Map();
const lastWakeHungerTick = new Map();

function getFoodLevel(player) {
  try {
    const hunger = player.getComponent("minecraft:player.hunger");
    if (hunger) {
      return hunger.currentValue;
    }
  } catch {
    // player.hunger unavailable
  }
  return 20;
}

function syncHungerHuntTag(player) {
  if (!player?.isValid) {
    return;
  }
  const shouldHunt = getFoodLevel(player) <= HUNGER_THRESHOLD;
  const hasTag = player.hasTag(ZOMBIE_HUNT_TAG);
  if (shouldHunt && !hasTag) {
    player.addTag(ZOMBIE_HUNT_TAG);
  } else if (!shouldHunt && hasTag) {
    player.removeTag(ZOMBIE_HUNT_TAG);
  }
}

function isNonSurvival(player) {
  try {
    const mode = String(player.getGameMode()).toLowerCase();
    return mode === "creative" || mode === "spectator";
  } catch {
    return false;
  }
}

function skippedNight(sleepStart, wakeTime) {
  if (sleepStart == null) {
    return wakeTime < 1000;
  }
  return wakeTime < sleepStart;
}

function clearSaturation(player) {
  try {
    const saturation = player.getComponent("minecraft:player.saturation");
    if (!saturation) {
      return;
    }
    if (typeof saturation.setCurrentValue === "function") {
      saturation.setCurrentValue(0);
    } else {
      saturation.currentValue = 0;
    }
  } catch {
    // player.saturation unavailable
  }
}

function applyWakeHunger(player) {
  clearSaturation(player);
  try {
    player.addEffect("hunger", WAKE_HUNGER_DURATION, {
      amplifier: WAKE_HUNGER_AMPLIFIER,
      showParticles: true,
    });
    return;
  } catch {
    // addEffect failed
  }
  try {
    player.runCommand(
      `effect @s hunger ${WAKE_HUNGER_SECONDS} ${WAKE_HUNGER_AMPLIFIER} false`
    );
  } catch {
    // command fallback failed
  }
}

function onLeftBed(player) {
  if (!player?.isValid || isNonSurvival(player)) {
    sleepStartByPlayer.delete(player.id);
    return;
  }
  const sleepStart = sleepStartByPlayer.get(player.id);
  sleepStartByPlayer.delete(player.id);
  const playerId = player.id;
  system.runTimeout(() => {
    if (!player.isValid || isNonSurvival(player)) {
      return;
    }
    if (!skippedNight(sleepStart, world.getTimeOfDay())) {
      return;
    }
    const now = system.currentTick;
    const last = lastWakeHungerTick.get(playerId) ?? -99999;
    if (now - last < WAKE_DEBOUNCE_TICKS) {
      return;
    }
    lastWakeHungerTick.set(playerId, now);
    applyWakeHunger(player);
    syncHungerHuntTag(player);
  }, WAKE_CHECK_DELAY);
}

function pollSleepState() {
  for (const player of world.getPlayers()) {
    if (!player?.isValid) {
      continue;
    }
    let isSleeping = false;
    try {
      isSleeping = player.isSleeping === true;
    } catch {
      continue;
    }
    const wasSleeping = sleepingByPlayer.get(player.id) === true;
    if (isSleeping && !wasSleeping) {
      sleepStartByPlayer.set(player.id, world.getTimeOfDay());
    } else if (!isSleeping && wasSleeping) {
      onLeftBed(player);
    }
    sleepingByPlayer.set(player.id, isSleeping);
  }
}

world.afterEvents.playerSpawn.subscribe((event) => {
  system.run(() => syncHungerHuntTag(event.player));
});

world.afterEvents.playerLeave.subscribe((event) => {
  sleepStartByPlayer.delete(event.playerId);
  sleepingByPlayer.delete(event.playerId);
  lastWakeHungerTick.delete(event.playerId);
});

try {
  const wakeUp = world.afterEvents.playerWakeUp;
  if (wakeUp && typeof wakeUp.subscribe === "function") {
    wakeUp.subscribe((event) => onLeftBed(event.player));
  }
} catch {
  // @minecraft/server 2.0.0 has no playerWakeUp
}

system.runInterval(pollSleepState, SLEEP_POLL_INTERVAL);

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    syncHungerHuntTag(player);
  }
}, SYNC_INTERVAL);
