import { world, system } from "@minecraft/server";

const PHANTOM_BLINDNESS_TICKS = 60;
const REP_KEY = "my_pack:piglin_rep";
const UNTRUSTED_TAG = "my_pack:piglin_untrusted";
const REP_MIN = -15;
const REP_MAX = 15;
const REP_DEFAULT = -5;
const GOLD_DELTA = 5;
const HIT_DELTA = -3;
const KILL_DELTA = -8;
const ZOMBIE_PIGLIN_KILL_DELTA = 3;
const WITHER_SKELETON_KILL_DELTA = 5;
const CALM_RADIUS = 32;
const ZOMBIFIED_PIGLIN_IDS = new Set([
  "minecraft:zombie_pigman",
  "minecraft:zombified_piglin",
]);

function getRep(player) {
  const value = player.getDynamicProperty(REP_KEY);
  return typeof value === "number" ? value : REP_DEFAULT;
}

function setRep(player, value) {
  const next = Math.min(REP_MAX, Math.max(REP_MIN, value));
  player.setDynamicProperty(REP_KEY, next);
  if (next < 0) {
    player.addTag(UNTRUSTED_TAG);
  } else {
    player.removeTag(UNTRUSTED_TAG);
  }
  return next;
}

function addRep(player, delta) {
  const prev = getRep(player);
  const next = setRep(player, prev + delta);
  if (prev < 0 && next >= 0) {
    clearPlayerHate(player);
    system.run(() => clearPlayerHate(player));
  }
  return next;
}

function resetRep(player) {
  setRep(player, REP_DEFAULT);
}

function isPlayer(entity) {
  return entity?.isValid && entity.typeId === "minecraft:player";
}

function triggerPiglinEvent(entity, eventName) {
  if (!entity?.isValid || entity.typeId !== "minecraft:piglin") {
    return;
  }
  try {
    entity.triggerEvent(eventName);
  } catch {
    // event missing on this piglin
  }
}

function calmPiglin(entity) {
  triggerPiglinEvent(entity, "reset_player_hate");
}

function stripAngry(entity) {
  triggerPiglinEvent(entity, "clear_angry_keep_target");
}

function piglinsNear(dimension, location) {
  try {
    return dimension.getEntities({
      type: "minecraft:piglin",
      location,
      maxDistance: CALM_RADIUS,
    });
  } catch {
    return [];
  }
}

function clearPlayerHate(player) {
  if (!isPlayer(player)) {
    return;
  }
  for (const entity of piglinsNear(player.dimension, player.location)) {
    calmPiglin(entity);
  }
  try {
    player.runCommand(`event entity @e[type=piglin,r=${CALM_RADIUS}] reset_player_hate`);
  } catch {
    // command fallback failed
  }
}

function calmPiglinsNear(player, extra) {
  if (extra) {
    calmPiglin(extra);
  }
  clearPlayerHate(player);
}

function stripAngryNear(dimension, location) {
  for (const entity of piglinsNear(dimension, location)) {
    stripAngry(entity);
  }
}

function applyPhantomBlindness(player) {
  try {
    player.addEffect("blindness", PHANTOM_BLINDNESS_TICKS, {
      amplifier: 0,
      showParticles: true,
    });
    return;
  } catch {
    // addEffect failed
  }
  try {
    player.runCommand(
      `effect @s blindness ${Math.max(1, Math.floor(PHANTOM_BLINDNESS_TICKS / 20))} 0 true`
    );
  } catch {
    // ignore
  }
}

function nearestPlayer(entity, maxDistance) {
  try {
    return entity.dimension.getPlayers({
      location: entity.location,
      maxDistance,
      closest: 1,
    })[0];
  } catch {
    return undefined;
  }
}

function projectileOwner(source) {
  const projectile = source.damagingProjectile ?? source.damagingEntity;
  if (!projectile?.isValid) {
    return undefined;
  }
  try {
    return projectile.getComponent("minecraft:projectile")?.owner;
  } catch {
    return undefined;
  }
}

function getPiglinAttacker(source) {
  const entity = source.damagingEntity;
  if (entity?.isValid && entity.typeId === "minecraft:piglin") {
    return entity;
  }
  const owner = projectileOwner(source);
  if (owner?.isValid && owner.typeId === "minecraft:piglin") {
    return owner;
  }
  return undefined;
}

function getPlayerAttacker(source) {
  const entity = source.damagingEntity;
  if (isPlayer(entity)) {
    return entity;
  }
  const owner = projectileOwner(source);
  if (isPlayer(owner)) {
    return owner;
  }
  return undefined;
}

world.beforeEvents.entityHurt.subscribe((event) => {
  const hurt = event.hurtEntity;
  if (!isPlayer(hurt)) {
    return;
  }
  const damager = event.damageSource.damagingEntity;
  if (!damager?.isValid || damager.typeId !== "minecraft:magma_cube") {
    return;
  }
  event.cancel = true;
  system.run(() => {
    if (!hurt?.isValid) {
      return;
    }
    try {
      hurt.extinguishFire();
    } catch {
      try {
        hurt.setOnFire(0, true);
      } catch {
        // ignore
      }
    }
  });
});

world.afterEvents.entityHurt.subscribe((event) => {
  const hurt = event.hurtEntity;
  if (!hurt?.isValid) {
    return;
  }

  if (hurt.typeId === "minecraft:player") {
    const damager = event.damageSource.damagingEntity;
    if (damager?.isValid && damager.typeId === "minecraft:phantom") {
      applyPhantomBlindness(hurt);
    }
    return;
  }

  if (hurt.typeId !== "minecraft:piglin") {
    return;
  }

  const piglinAttacker = getPiglinAttacker(event.damageSource);
  if (piglinAttacker && piglinAttacker.id !== hurt.id) {
    system.run(() => stripAngryNear(hurt.dimension, hurt.location));
    return;
  }

  const player = getPlayerAttacker(event.damageSource);
  if (!player) {
    return;
  }

  const health = hurt.getComponent("minecraft:health");
  if (health && health.currentValue <= 0) {
    return;
  }

  addRep(player, HIT_DELTA);
});

world.afterEvents.entityDie.subscribe((event) => {
  const dead = event.deadEntity;
  if (!dead) {
    return;
  }

  const typeId = dead.typeId;
  if (typeId === "minecraft:player") {
    resetRep(dead);
    return;
  }

  const player = getPlayerAttacker(event.damageSource);
  if (!player) {
    return;
  }

  if (ZOMBIFIED_PIGLIN_IDS.has(typeId)) {
    addRep(player, ZOMBIE_PIGLIN_KILL_DELTA);
    return;
  }

  if (typeId === "minecraft:wither_skeleton") {
    addRep(player, WITHER_SKELETON_KILL_DELTA);
    return;
  }

  if (typeId === "minecraft:piglin") {
    addRep(player, KILL_DELTA);
  }
});

world.afterEvents.playerSpawn.subscribe((event) => {
  if (event.initialSpawn) {
    setRep(event.player, getRep(event.player));
    return;
  }
  resetRep(event.player);
});

world.afterEvents.dataDrivenEntityTrigger.subscribe(
  (event) => {
    const piglin = event.entity;
    if (!piglin?.isValid || piglin.typeId !== "minecraft:piglin") {
      return;
    }
    const player = nearestPlayer(piglin, 10);
    if (!isPlayer(player)) {
      return;
    }
    addRep(player, GOLD_DELTA);
  },
  {
    entityTypes: ["minecraft:piglin"],
    eventTypes: ["admire_item_started_event"],
  }
);
