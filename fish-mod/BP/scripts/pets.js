
import {
  world,
  system,
  ItemStack,
  EntityEquippableComponent,
  EquipmentSlot,
  StructureSaveMode,
  GameMode,
  Direction,
  EnchantmentTypes,
} from "@minecraft/server";

const PACK_VERSION = "2.1.19";
const PHANTOM_BLINDNESS_TICKS = 60;
const SHULKER_DEPLOYED_KEY = "my_pack:shulker_deployed";
const RESET_CHAT_COMMANDS = new Set(["!mypack reset", "!mypack:reset", "!潜影贝复位"]);
const RESET_SCRIPT_EVENT = "my_pack:reset_flags";
const SHULKER_OWNER_KEY = "my_pack:pet_owner_id";
const SHULKER_SITTING_TAG = "my_pack:is_sitting";
const VANISH_PENDING_TAG = "my_pack:pending_vanish_return";
const VANISH_CARRYING_TAG = "my_pack:carrying_vanish";
const SCRIPT_SITTING_KEY = "my_pack:script_sitting";
const PENDING_VANISH_KEY = "my_pack:pending_vanish_return";
const VANISH_STASH_KEY = "my_pack:vanish_stash";
const WORLD_VANISH_LEDGER_KEY = "my_pack:vanish_ledger";
const VANISH_DEBUG = false;
const ENDER_PEARL_ID = "minecraft:ender_pearl";
const OXIDIZED_COPPER_BLOCK_ID = "minecraft:oxidized_copper";
const VANISH_RETURN_RADIUS = 6;
const VANISH_CHECK_INTERVAL_TICKS = 5;
const VANISH_DEPOSIT_NOTIFY_COOLDOWN_TICKS = 40;
const DEPLOY_BLOCK_NOTIFY_COOLDOWN_TICKS = 40;
const STRUCTURE_KEY = "my_pack:structureId";
const VARIANT_KEY = "my_pack:bucketVariant";
const RETURN_BUCKET_KEY = "my_pack:returnBucket";
const PICKUP_COOLDOWN_TICKS = 10;
const PLACE_COOLDOWN_TICKS = 10;
const HIDE_HEAD_PROPERTY = "my_pack:hide_head";
const SITTING_PROPERTY = "my_pack:sitting";
const DISPLAY_ITEM_TAG = "my_pack:shulker_display";
const INVENTORY_SIZE = 6;
const DISPLAY_RECLAIM_RADIUS = 4;
const DISPLAY_INSET = 0.55;
const DISPLAY_Y_ADJUST = -0.2;
const DISPLAY_SPIN_DEG_PER_TICK = 9;
const DISPLAY_CHANCE = 0.5;
const DISPLAY_NEARBY_BLOCK_RADIUS = 3;
const DISPLAY_RETRY_INTERVAL_TICKS = 5;
const DISPLAY_FX_SOUND = "mob.shulker.teleport";
const DISPLAY_FX_PARTICLE = "minecraft:mob_portal";
const DISPLAY_FX_PARTICLE_BURST = 8;
const FX_PARTICLE_SPREAD = 0.45;
const FX_PLAYER_RADIUS = 48;

const DISPLAY_NON_THREAT_TYPES = new Set([
  "minecraft:item",
  "minecraft:xp_orb",
  "minecraft:arrow",
  "minecraft:shulker_bullet",
  "minecraft:thrown_trident",
  "minecraft:snowball",
  "minecraft:egg",
  "minecraft:ender_pearl",
  "minecraft:eye_of_ender_signal",
  "minecraft:lightning_bolt",
  "minecraft:area_effect_cloud",
]);

const pickupCooldown = new Map();
const placeCooldown = new Map();
const blockPlaceTick = new Map();
const displayState = new Map();
/** @type {Map<string, number>} */
const displayRetryIntervals = new Map();
/** @type {Map<string, boolean>} */
const displayOpenRoll = new Map();
/** @type {Map<string, boolean>} */
const shulkerSittingState = new Map();
/** @type {Map<string, boolean>} */
const shulkerShellOpenState = new Map();
/** @type {Set<string>} */
const shulkerBucketPickupIds = new Set();
/** @type {Map<string, { stash: unknown[]; pending: boolean }>} */
const vanishSessionStore = new Map();
const vanishDepositNotifyAt = new Map();
const vanishCacheNotifyAt = new Map();
const vanishReturnNotifyAt = new Map();
const deployBlockNotifyAt = new Map();

function isLiveEntity(entity) {
  if (!entity) {
    return false;
  }

  try {
    if (typeof entity.isValid === "function") {
      return entity.isValid();
    }
    return entity.isValid !== false;
  } catch {
    return false;
  }
}

const WATER_BLOCK_IDS = new Set(["minecraft:water", "minecraft:flowing_water"]);

/** @type {import("@minecraft/server").ItemStack["typeId"][]} */
const MOB_BUCKET_ITEM_IDS = [];

/** @type {Map<string, MobBucketDefinition>} */
const bucketDefByItemId = new Map();

/** @type {Map<string, MobBucketDefinition[]>} */
const bucketDefsByEntityType = new Map();

/**
 * @typedef {Object} MobBucketDefinition
 * @property {string} bucketId
 * @property {string} entityType
 * @property {string} pickupContainer
 * @property {string} returnContainer
 * @property {boolean} requiresWater
 * @property {string} fillSound
 * @property {string} emptySound
 * @property {string} fallbackFillSound
 * @property {string} fallbackEmptySound
 * @property {string} [entityVariant]
 * @property {(entity: import("@minecraft/server").Entity, player: import("@minecraft/server").Player) => boolean} [canPickup]
 * @property {(entity: import("@minecraft/server").Entity) => void} [onPickup]
 * @property {(dimension: import("@minecraft/server").Dimension, location: import("@minecraft/server").Vector3, player: import("@minecraft/server").Player) => void} [afterPlace]
 * @property {(dimension: import("@minecraft/server").Dimension, location: import("@minecraft/server").Vector3) => import("@minecraft/server").Entity | undefined} [spawnDefault]
 */

/** @type {MobBucketDefinition[]} */
const BUCKET_DEFINITIONS = [
  {
    bucketId: "my_pack:shulker_bucket",
    entityType: "minecraft:shulker",
    pickupContainer: "minecraft:bucket",
    returnContainer: "minecraft:bucket",
    requiresWater: false,
    fillSound: "mob.shulker.teleport",
    emptySound: "mob.shulker.teleport",
    fallbackFillSound: "bucket.fill.fish",
    fallbackEmptySound: "bucket.empty.fish",
    canPickup: isTamedShulkerOwnedBy,
    onPickup: stopShulkerDisplay,
    afterPlace: ensureTamedShulkersAtLocation,
    spawnDefault: spawnDefaultWildShulker,
  },
  {
    bucketId: "my_pack:squid_bucket",
    entityType: "minecraft:squid",
    pickupContainer: "minecraft:water_bucket",
    returnContainer: "minecraft:water_bucket",
    requiresWater: true,
    fillSound: "bucket.fill.fish",
    emptySound: "bucket.empty.fish",
    fallbackFillSound: "bucket.fill.fish",
    fallbackEmptySound: "bucket.empty.fish",
  },
  {
    bucketId: "my_pack:glow_squid_bucket",
    entityType: "minecraft:glow_squid",
    pickupContainer: "minecraft:water_bucket",
    returnContainer: "minecraft:water_bucket",
    requiresWater: true,
    fillSound: "bucket.fill.fish",
    emptySound: "bucket.empty.fish",
    fallbackFillSound: "bucket.fill.fish",
    fallbackEmptySound: "bucket.empty.fish",
  },
  {
    bucketId: "my_pack:nautilus_bucket",
    entityType: "minecraft:nautilus",
    pickupContainer: "minecraft:water_bucket",
    returnContainer: "minecraft:water_bucket",
    requiresWater: true,
    fillSound: "bucket.fill.fish",
    emptySound: "bucket.empty.fish",
    fallbackFillSound: "bucket.fill.fish",
    fallbackEmptySound: "bucket.empty.fish",
  },
  {
    bucketId: "my_pack:zombie_nautilus_bucket",
    entityType: "minecraft:zombie_nautilus",
    entityVariant: "default",
    pickupContainer: "minecraft:water_bucket",
    returnContainer: "minecraft:water_bucket",
    requiresWater: true,
    fillSound: "bucket.fill.fish",
    emptySound: "bucket.empty.fish",
    fallbackFillSound: "bucket.fill.fish",
    fallbackEmptySound: "bucket.empty.fish",
  },
  {
    bucketId: "my_pack:coral_zombie_nautilus_bucket",
    entityType: "minecraft:zombie_nautilus",
    entityVariant: "coral",
    pickupContainer: "minecraft:water_bucket",
    returnContainer: "minecraft:water_bucket",
    requiresWater: true,
    fillSound: "bucket.fill.fish",
    emptySound: "bucket.empty.fish",
    fallbackFillSound: "bucket.fill.fish",
    fallbackEmptySound: "bucket.empty.fish",
  },
];

for (const def of BUCKET_DEFINITIONS) {
  MOB_BUCKET_ITEM_IDS.push(def.bucketId);
  bucketDefByItemId.set(def.bucketId, def);

  const entityDefs = bucketDefsByEntityType.get(def.entityType) ?? [];
  entityDefs.push(def);
  bucketDefsByEntityType.set(def.entityType, entityDefs);
}

function getEntityVariant(entity) {
  try {
    const component = entity.getComponent("minecraft:variant");
    if (component?.value !== undefined) {
      return String(component.value);
    }
  } catch {
    // 组件不可用时忽略
  }

  try {
    const property = entity.getProperty("minecraft:variant");
    if (property !== undefined) {
      return String(property);
    }
  } catch {
    // 属性不可用时忽略
  }

  return undefined;
}

function getZombieNautilusVariant(entity) {
  const variant = getEntityVariant(entity);
  if (
    variant === "coral" ||
    variant === "minecraft:warm" ||
    variant === "warm" ||
    variant === "1"
  ) {
    return "coral";
  }
  return "default";
}

function matchesBucketVariant(entity, def) {
  if (def.entityType !== "minecraft:zombie_nautilus" || !def.entityVariant) {
    return true;
  }
  return getZombieNautilusVariant(entity) === def.entityVariant;
}

/** Bedrock BP enum: default | coral (see vanilla zombie_nautilus.json). */
function applyZombieNautilusVariant(entity, variant) {
  const value = variant === "coral" ? "coral" : "default";
  try {
    entity.setProperty("minecraft:variant", value);
    return getZombieNautilusVariant(entity) === value;
  } catch {
    return false;
  }
}

function bucketUsesStructureStorage(def) {
  return (
    def.entityType === "minecraft:shulker" ||
    def.entityType === "minecraft:nautilus" ||
    def.entityType === "minecraft:zombie_nautilus"
  );
}

function isAquaticBucketEntity(typeId) {
  return (
    typeId === "minecraft:nautilus" || typeId === "minecraft:zombie_nautilus"
  );
}

function snapStructurePlaceLocation(dimension, targetLocation, requiresWater) {
  let loc = targetLocation;
  if (requiresWater) {
    loc = getWaterSpawnCenter(dimension, targetLocation) ?? targetLocation;
  }
  return {
    x: Math.floor(loc.x) + 0.5,
    y: Math.floor(loc.y) + 0.5,
    z: Math.floor(loc.z) + 0.5,
  };
}

function fixZombieNautilusVariantNear(dimension, location, variant) {
  if (variant !== "coral" && variant !== "default") {
    return;
  }
  system.runTimeout(() => {
    try {
      const entities = dimension.getEntities({
        type: "minecraft:zombie_nautilus",
        location,
        maxDistance: 2.5,
      });
      for (const entity of entities) {
        if (getZombieNautilusVariant(entity) !== variant) {
          applyZombieNautilusVariant(entity, variant);
        }
      }
    } catch {
      // 忽略
    }
  }, 2);
}

function spawnZombieNautilus(dimension, location, coral) {
  const entity = dimension.spawnEntity("minecraft:zombie_nautilus", location);
  if (coral) {
    system.run(() => {
      try {
        if (entity.isValid) {
          applyZombieNautilusVariant(entity, "coral");
        }
      } catch {
        // 忽略
      }
    });
  }
}

function spawnMobFromBucket(dimension, location, def, storedVariant) {
  if (def.entityType === "minecraft:zombie_nautilus") {
    const coral =
      storedVariant === "coral" ||
      (storedVariant !== "default" && def.entityVariant === "coral");
    spawnZombieNautilus(dimension, location, coral);
    return;
  }

  if (def.spawnDefault) {
    def.spawnDefault(dimension, location);
    return;
  }

  dimension.spawnEntity(def.entityType, location);
}

function getBucketDefByItemId(itemId) {
  return bucketDefByItemId.get(itemId);
}

function getBucketDefForPickup(containerId, entity) {
  const defs = bucketDefsByEntityType.get(entity.typeId);
  if (!defs) {
    return undefined;
  }

  return defs.find(
    (def) =>
      def.pickupContainer === containerId && matchesBucketVariant(entity, def)
  );
}

function isWaterBlockId(typeId) {
  return WATER_BLOCK_IDS.has(typeId);
}

function getBlockAt(dimension, x, y, z) {
  try {
    return dimension.getBlock({ x, y, z });
  } catch {
    return undefined;
  }
}

function isWaterAt(dimension, location) {
  const bx = Math.floor(location.x);
  const by = Math.floor(location.y);
  const bz = Math.floor(location.z);

  for (let dy = -2; dy <= 3; dy++) {
    const block = getBlockAt(dimension, bx, by + dy, bz);
    if (isWaterBlockId(block?.typeId)) {
      return true;
    }
  }

  return false;
}

function getWaterSpawnCenter(dimension, location) {
  const bx = Math.floor(location.x);
  const by = Math.floor(location.y);
  const bz = Math.floor(location.z);

  for (let dy = 0; dy <= 2; dy++) {
    for (const checkY of [by + dy, by - dy, by + dy - 1]) {
      const block = getBlockAt(dimension, bx, checkY, bz);
      if (isWaterBlockId(block?.typeId)) {
        return getBlockCenter(block);
      }
    }
  }

  return undefined;
}

function giveItemOrDrop(player, itemStack) {
  if (!itemStack) {
    return;
  }

  const container = player.getComponent("minecraft:inventory")?.container;
  const leftover = container?.addItem(itemStack);

  if (leftover) {
    player.dimension.spawnItem(leftover, player.location);
  }
}

function consumeOneFromEquipmentSlot(slot, expectedTypeId) {
  const stack = slot.getItem();
  if (!stack || stack.typeId !== expectedTypeId || stack.amount < 1) {
    return { consumed: false, wasStacked: false };
  }

  const wasStacked = stack.amount > 1;
  if (wasStacked) {
    stack.amount -= 1;
    slot.setItem(stack);
  } else {
    slot.setItem(undefined);
  }

  return { consumed: true, wasStacked };
}

function getBlockCenter(block) {
  const { x, y, z } = block.location;
  return { x: x + 0.5, y: y + 0.5, z: z + 0.5 };
}

function playBucketSound(player, primarySound, fallbackSound) {
  try {
    player.playSound(primarySound);
  } catch {
    try {
      player.playSound(fallbackSound);
    } catch {
      // 忽略音效失败
    }
  }
}

function getMainhandSlot(player) {
  const equippable = player.getComponent(EntityEquippableComponent.componentId);
  return equippable?.getEquipmentSlot(EquipmentSlot.Mainhand);
}

function isOnPickupCooldown(playerId) {
  const until = pickupCooldown.get(playerId);
  return until !== undefined && until > system.currentTick;
}

function setPickupCooldown(playerId) {
  pickupCooldown.set(playerId, system.currentTick + PICKUP_COOLDOWN_TICKS);
}

function isOnPlaceCooldown(playerId) {
  const until = placeCooldown.get(playerId);
  return until !== undefined && until > system.currentTick;
}

function setPlaceCooldown(playerId) {
  placeCooldown.set(playerId, system.currentTick + PLACE_COOLDOWN_TICKS);
}

function isShulker(entity) {
  return entity.typeId === "minecraft:shulker";
}

function getShulkerInventory(entity) {
  return entity.getComponent("minecraft:inventory")?.container;
}

function getRandomFilledSlot(container) {
  const filledSlots = [];

  for (let slot = 0; slot < INVENTORY_SIZE; slot++) {
    if (container.getItem(slot)) {
      filledSlots.push(slot);
    }
  }

  if (filledSlots.length === 0) {
    return -1;
  }

  return filledSlots[Math.floor(Math.random() * filledSlots.length)];
}

function takeOneItemFromSlot(container, slot) {
  const item = container.getItem(slot);
  if (!item) {
    return undefined;
  }

  const displayStack = item.clone();
  displayStack.amount = 1;

  if (item.amount > 1) {
    item.amount -= 1;
    container.setItem(slot, item);
  } else {
    container.setItem(slot, undefined);
  }

  return displayStack;
}

function returnItemToInventory(shulker, itemStack, preferredSlot) {
  const container = getShulkerInventory(shulker);
  if (!container || !itemStack) {
    return itemStack;
  }

  if (
    preferredSlot >= 0 &&
    preferredSlot < INVENTORY_SIZE &&
    !container.getItem(preferredSlot)
  ) {
    container.setItem(preferredSlot, itemStack);
    return undefined;
  }

  const leftover = container.addItem(itemStack);
  return leftover;
}

function clearDisplayInterval(shulkerId) {
  const state = displayState.get(shulkerId);
  if (!state?.intervalId) {
    return;
  }

  system.clearRun(state.intervalId);
  state.intervalId = undefined;
}

function setHideHead(shulker, hidden) {
  try {
    shulker.setProperty(HIDE_HEAD_PROPERTY, hidden);
  } catch {
    // 属性尚未注册时忽略
  }
}

function setShulkerSitting(shulker, sitting) {
  try {
    shulker.setProperty(SITTING_PROPERTY, sitting);
  } catch {
    // 属性尚未注册时忽略
  }
}

function findDisplayItemEntity(shulker, itemEntityId) {
  if (itemEntityId) {
    const entities = shulker.dimension.getEntities({
      type: "minecraft:item",
      location: shulker.location,
      maxDistance: DISPLAY_RECLAIM_RADIUS,
    });

    for (const entity of entities) {
      if (entity.id === itemEntityId) {
        return entity;
      }
    }
  }

  const taggedEntities = shulker.dimension.getEntities({
    type: "minecraft:item",
    location: shulker.location,
    maxDistance: DISPLAY_RECLAIM_RADIUS,
    tags: [DISPLAY_ITEM_TAG],
  });

  for (const entity of taggedEntities) {
    if (entity.getDynamicProperty("my_pack:owner_shulker") === shulker.id) {
      return entity;
    }
  }

  return undefined;
}

function getShulkerDisplayLocation(shulker) {
  const head = shulker.getHeadLocation();
  const base = shulker.location;

  return {
    x: head.x + (base.x - head.x) * DISPLAY_INSET,
    y: head.y + (base.y - head.y) * DISPLAY_INSET + DISPLAY_Y_ADJUST,
    z: head.z + (base.z - head.z) * DISPLAY_INSET,
  };
}

function isPassableFxBlock(block) {
  if (!block) {
    return false;
  }

  try {
    return block.isAir;
  } catch {
    return false;
  }
}

function getShulkerFxLocation(shulker) {
  const head = shulker.getHeadLocation();
  const base = shulker.location;
  const dx = head.x - base.x;
  const dy = head.y - base.y;
  const dz = head.z - base.z;
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const uz = dz / length;
  const dimension = shulker.dimension;

  for (let step = 0.25; step <= 1.5; step += 0.25) {
    const candidate = {
      x: head.x + ux * step,
      y: head.y + uy * step + 0.15,
      z: head.z + uz * step,
    };

    try {
      const block = dimension.getBlock({
        x: Math.floor(candidate.x),
        y: Math.floor(candidate.y),
        z: Math.floor(candidate.z),
      });

      if (isPassableFxBlock(block)) {
        return candidate;
      }
    } catch {
      // 忽略单点检测失败
    }
  }

  return {
    x: head.x + ux * 0.6,
    y: head.y + uy * 0.6 + 0.35,
    z: head.z + uz * 0.6,
  };
}

function getShulkerDisplayItemRotation() {
  return { x: 0, y: (system.currentTick * DISPLAY_SPIN_DEG_PER_TICK) % 360, z: 0 };
}

function isWithinThreatRadius(entity, checkLoc, radius) {
  const dx = entity.location.x - checkLoc.x;
  const dy = entity.location.y - checkLoc.y;
  const dz = entity.location.z - checkLoc.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return distance <= radius;
}

function hasThreatNearLocation(
  shulker,
  checkLoc,
  radius,
  excludeEntityId,
  options = {}
) {
  const ignorePlayerId = options.ignorePlayerId;
  const nearby = shulker.dimension.getEntities({
    location: checkLoc,
    maxDistance: radius,
  });

  for (const entity of nearby) {
    if (
      ignorePlayerId &&
      entity.typeId === "minecraft:player" &&
      entity.id === ignorePlayerId
    ) {
      continue;
    }
    if (
      isDisplayPickupThreat(shulker, entity, excludeEntityId) &&
      isWithinThreatRadius(entity, checkLoc, radius)
    ) {
      return true;
    }
  }

  return false;
}

function isDisplayPickupThreat(shulker, entity, excludeEntityId) {
  if (!isLiveEntity(entity) || entity.id === shulker.id || entity.id === excludeEntityId) {
    return false;
  }

  if (DISPLAY_NON_THREAT_TYPES.has(entity.typeId)) {
    return false;
  }

  return true;
}

function getNearbyPlayers(dimension, location, radius) {
  const radiusSq = radius * radius;
  const players = [];

  for (const player of world.getAllPlayers()) {
    if (player.dimension.id !== dimension.id) {
      continue;
    }

    const dx = player.location.x - location.x;
    const dy = player.location.y - location.y;
    const dz = player.location.z - location.z;

    if (dx * dx + dy * dy + dz * dz <= radiusSq) {
      players.push(player);
    }
  }

  return players;
}

function getSpreadFxLocation(location, spread = FX_PARTICLE_SPREAD) {
  return {
    x: location.x + (Math.random() - 0.5) * spread,
    y: location.y + (Math.random() - 0.5) * spread,
    z: location.z + (Math.random() - 0.5) * spread,
  };
}

function spawnParticlesAt(dimension, location, particleId, burst = 1) {
  const players = getNearbyPlayers(dimension, location, FX_PLAYER_RADIUS);

  for (let i = 0; i < burst; i++) {
    const spreadLoc = getSpreadFxLocation(location);

    try {
      dimension.spawnParticle(particleId, spreadLoc);
    } catch {
      // dimension.spawnParticle 在部分平台无效
    }

    for (const player of players) {
      try {
        player.spawnParticle(particleId, spreadLoc);
      } catch {
        // 忽略单玩家粒子失败
      }
    }
  }
}

function playDisplayFx(shulker, location) {
  if (!isLiveEntity(shulker)) {
    return;
  }

  const dimension = shulker.dimension;
  const particleLocation = getShulkerFxLocation(shulker);

  try {
    dimension.playSound(DISPLAY_FX_SOUND, location);
  } catch {
    // 忽略音效失败
  }

  spawnParticlesAt(
    dimension,
    particleLocation,
    DISPLAY_FX_PARTICLE,
    DISPLAY_FX_PARTICLE_BURST
  );
}

function getItemStackFromEntity(itemEntity) {
  const itemComponent = itemEntity.getComponent("minecraft:item");
  return itemComponent?.itemStack;
}

function stopShulkerDisplay(shulker) {
  const shulkerId = shulker.id;
  const state = displayState.get(shulkerId);

  clearDisplayInterval(shulkerId);
  setHideHead(shulker, false);

  if (!state) {
    displayState.delete(shulkerId);
    return;
  }

  const itemEntity = findDisplayItemEntity(shulker, state.itemEntityId);
  if (isLiveEntity(itemEntity)) {
    playDisplayFx(
      shulker,
      itemEntity.location
    );

    const itemStack = getItemStackFromEntity(itemEntity);
    const leftover = returnItemToInventory(shulker, itemStack, state.sourceSlot ?? -1);

    itemEntity.remove();

    if (leftover) {
      shulker.dimension.spawnItem(leftover, shulker.location);
    }
  }

  displayState.delete(shulkerId);
}

function startDisplayItemTracking(shulker, itemEntity) {
  const shulkerId = shulker.id;
  clearDisplayInterval(shulkerId);

  const intervalId = system.runInterval(() => {
    const state = displayState.get(shulkerId);
    if (!state) {
      system.clearRun(intervalId);
      return;
    }

    if (!isLiveEntity(shulker)) {
      stopShulkerDisplay(shulker);
      system.clearRun(intervalId);
      return;
    }

    if (!isLiveEntity(itemEntity)) {
      setHideHead(shulker, false);
      displayState.delete(shulkerId);
      system.clearRun(intervalId);
      return;
    }

    if (
      hasThreatNearLocation(
        shulker,
        shulker.location,
        DISPLAY_NEARBY_BLOCK_RADIUS,
        undefined
      )
    ) {
      stopShulkerDisplay(shulker);
      system.clearRun(intervalId);
      return;
    }

    try {
      const displayLoc = getShulkerDisplayLocation(shulker);
      itemEntity.teleport(displayLoc, { checkForBlocks: false });
      itemEntity.setRotation(getShulkerDisplayItemRotation());
      itemEntity.clearVelocity();
    } catch {
      // 展示物可能已被移除
    }
  }, 1);

  const state = displayState.get(shulkerId);
  if (state) {
    state.intervalId = intervalId;
  }
}

function clearDisplayRetry(shulkerId) {
  const intervalId = displayRetryIntervals.get(shulkerId);
  if (intervalId !== undefined) {
    system.clearRun(intervalId);
    displayRetryIntervals.delete(shulkerId);
  }
}

function resetDisplayOpenRoll(shulkerId) {
  displayOpenRoll.delete(shulkerId);
}

function isShulkerShellOpen(shulker) {
  if (shulkerShellOpenState.get(shulker.id) === true) {
    return true;
  }

  try {
    const open = shulker.getProperty("my_pack:shell_open");
    return open === true || open === 1;
  } catch {
    return false;
  }
}

function setShulkerShellOpenState(shulker, open) {
  if (!shulker?.id) {
    return;
  }

  shulkerShellOpenState.set(shulker.id, open);
  if (!open) {
    clearDisplayRetry(shulker.id);
    resetDisplayOpenRoll(shulker.id);
  }
}

function passesDisplayChance(shulkerId) {
  if (!displayOpenRoll.has(shulkerId)) {
    displayOpenRoll.set(shulkerId, Math.random() < DISPLAY_CHANCE);
  }
  return displayOpenRoll.get(shulkerId) === true;
}

function tryStartShulkerDisplay(shulker) {
  if (!isShulker(shulker) || !isLiveEntity(shulker) || displayState.has(shulker.id)) {
    return false;
  }

  const container = getShulkerInventory(shulker);
  if (!container || getRandomFilledSlot(container) < 0) {
    return false;
  }

  if (!passesDisplayChance(shulker.id)) {
    return false;
  }

  if (
    hasThreatNearLocation(
      shulker,
      getShulkerDisplayLocation(shulker),
      DISPLAY_NEARBY_BLOCK_RADIUS,
      undefined
    )
  ) {
    return false;
  }

  startShulkerDisplay(shulker);
  clearDisplayRetry(shulker.id);
  return true;
}

function beginShulkerDisplayWatch(shulker) {
  if (!isShulker(shulker) || !isLiveEntity(shulker)) {
    return;
  }

  const shulkerId = shulker.id;
  resetDisplayOpenRoll(shulkerId);
  clearDisplayRetry(shulkerId);

  if (tryStartShulkerDisplay(shulker)) {
    return;
  }

  if (displayOpenRoll.has(shulkerId) && !displayOpenRoll.get(shulkerId)) {
    return;
  }

  const intervalId = system.runInterval(() => {
    if (!isLiveEntity(shulker)) {
      clearDisplayRetry(shulkerId);
      resetDisplayOpenRoll(shulkerId);
      return;
    }

    if (!isShulkerShellOpen(shulker)) {
      clearDisplayRetry(shulkerId);
      resetDisplayOpenRoll(shulkerId);
      return;
    }

    if (displayState.has(shulkerId)) {
      clearDisplayRetry(shulkerId);
      return;
    }

    if (displayOpenRoll.has(shulkerId) && !displayOpenRoll.get(shulkerId)) {
      clearDisplayRetry(shulkerId);
      return;
    }

    const container = getShulkerInventory(shulker);
    if (!container || getRandomFilledSlot(container) < 0) {
      clearDisplayRetry(shulkerId);
      return;
    }

    tryStartShulkerDisplay(shulker);
  }, DISPLAY_RETRY_INTERVAL_TICKS);

  displayRetryIntervals.set(shulkerId, intervalId);
}

function startShulkerDisplay(shulker) {
  if (!isShulker(shulker)) {
    return;
  }

  if (displayState.has(shulker.id)) {
    stopShulkerDisplay(shulker);
  }

  const container = getShulkerInventory(shulker);
  if (!container) {
    return;
  }

  const slot = getRandomFilledSlot(container);
  if (slot < 0) {
    return;
  }

  const displayStack = takeOneItemFromSlot(container, slot);
  if (!displayStack) {
    return;
  }

  let itemEntity;
  try {
    itemEntity = shulker.dimension.spawnItem(
      displayStack,
      getShulkerDisplayLocation(shulker)
    );
  } catch {
    returnItemToInventory(shulker, displayStack, slot);
    return;
  }

  itemEntity.addTag(DISPLAY_ITEM_TAG);
  itemEntity.setDynamicProperty("my_pack:owner_shulker", shulker.id);

  displayState.set(shulker.id, {
    itemEntityId: itemEntity.id,
    sourceSlot: slot,
  });

  setHideHead(shulker, true);
  playDisplayFx(shulker, getShulkerDisplayLocation(shulker));
  startDisplayItemTracking(shulker, itemEntity);
}

function playerHasDeployedShulker(player) {
  return player.getDynamicProperty(SHULKER_DEPLOYED_KEY) === true;
}

function setPlayerShulkerDeployed(player, value) {
  player.setDynamicProperty(SHULKER_DEPLOYED_KEY, value);
}

function bindShulkerOwner(shulker, player) {
  if (!isLiveEntity(shulker) || !isLiveEntity(player)) {
    return;
  }

  try {
    shulker.setDynamicProperty(SHULKER_OWNER_KEY, player.id);
  } catch {
    // 忽略写入失败
  }

  setPlayerShulkerDeployed(player, true);
}

function clearShulkerDeployedForPlayerId(playerId) {
  if (!playerId) {
    return;
  }

  for (const player of world.getAllPlayers()) {
    if (player.id === playerId) {
      setPlayerShulkerDeployed(player, false);
      return;
    }
  }
}

function clearShulkerDeployedForOwner(shulker) {
  const owner = getShulkerOwnerPlayer(shulker);
  if (isLiveEntity(owner)) {
    setPlayerShulkerDeployed(owner, false);
    return;
  }

  try {
    const storedId = shulker.getDynamicProperty(SHULKER_OWNER_KEY);
    if (typeof storedId === "string" && storedId.length > 0) {
      clearShulkerDeployedForPlayerId(storedId);
    }
  } catch {
    // 忽略
  }
}

function getShulkerOwnerPlayer(shulker) {
  try {
    const storedId = shulker.getDynamicProperty(SHULKER_OWNER_KEY);
    if (typeof storedId === "string" && storedId.length > 0) {
      for (const player of world.getAllPlayers()) {
        if (player.id === storedId) {
          return player;
        }
      }
    }
  } catch {
    // 忽略读取失败
  }

  const tameable = shulker.getComponent("minecraft:tameable");
  if (!tameable?.isTamed) {
    return undefined;
  }

  if (tameable.tamedToPlayer && isLiveEntity(tameable.tamedToPlayer)) {
    return tameable.tamedToPlayer;
  }

  if (tameable.tamedTo && isLiveEntity(tameable.tamedTo)) {
    return tameable.tamedTo;
  }

  const ownerId = tameable.tamedToPlayerId;
  if (ownerId) {
    for (const player of world.getAllPlayers()) {
      if (player.id === ownerId) {
        return player;
      }
    }
  }

  return undefined;
}


function notifyDeployBlocked(player, reason = "deploy") {
  if (!isLiveEntity(player)) {
    return;
  }

  const key = `${getVanishPlayerKey(player)}:${reason}`;
  const now = system.currentTick;
  const last = deployBlockNotifyAt.get(key) ?? -Infinity;
  if (now - last < DEPLOY_BLOCK_NOTIFY_COOLDOWN_TICKS) {
    return;
  }
  deployBlockNotifyAt.set(key, now);

  try {
    player.sendMessage("§c你已经有一只潜影贝在场了，请先收起或等其消失");
  } catch {
    // 忽略
  }
}

function playerBlocksExtraShulkerDeploy(player, excludeEntityId) {
  if (!isLiveEntity(player)) {
    return true;
  }

  return playerOwnsLiveShulker(player, excludeEntityId);
}

function rejectExtraShulkerTame(shulker, player, options = {}) {
  const { notify = false, refundPearl = false } = options;
  if (!isLiveEntity(shulker)) {
    return;
  }

  stopShulkerDisplay(shulker);
  markShulkerSitting(shulker, false);

  try {
    shulker.setDynamicProperty(SHULKER_OWNER_KEY, undefined);
  } catch {
    // 忽略
  }

  try {
    shulker.triggerEvent("my_pack:reject_tame");
  } catch {
    // 忽略
  }

  if (notify) {
    notifyDeployBlocked(player, "tame");
  }

  if (refundPearl && isLiveEntity(player)) {
    giveItemOrDrop(player, new ItemStack(ENDER_PEARL_ID, 1));
  }
}

function enforceSingleDeployedShulker(player) {
  if (!isLiveEntity(player)) {
    return;
  }

  /** @type {import("@minecraft/server").Entity | undefined} */
  let keeper;

  for (const dimensionId of ["overworld", "nether", "the_end"]) {
    try {
      const dimension = world.getDimension(dimensionId);
      for (const shulker of dimension.getEntities({ type: "minecraft:shulker" })) {
        if (!isTamedShulkerOwnedBy(shulker, player)) {
          continue;
        }

        if (!keeper) {
          keeper = shulker;
          continue;
        }

        rejectExtraShulkerTame(shulker, player);
      }
    } catch {
      // 忽略维度查询失败
    }
  }

  setPlayerShulkerDeployed(player, keeper !== undefined);
}

function playerOwnsLiveShulker(player, excludeEntityId) {
  for (const dimensionId of ["overworld", "nether", "the_end"]) {
    try {
      const dimension = world.getDimension(dimensionId);
      for (const shulker of dimension.getEntities({ type: "minecraft:shulker" })) {
        if (excludeEntityId && shulker.id === excludeEntityId) {
          continue;
        }
        if (isTamedShulkerOwnedBy(shulker, player)) {
          return true;
        }
      }
    } catch {
      // 忽略维度查询失败
    }
  }

  return false;
}

function reconcileShulkerDeployedFlag(player) {
  if (!isLiveEntity(player)) {
    return;
  }

  enforceSingleDeployedShulker(player);
}

function handleShulkerPetDeath(shulker) {
  if (!isShulker(shulker) || shulkerBucketPickupIds.has(shulker.id)) {
    return;
  }

  let storedOwnerId;
  try {
    storedOwnerId = shulker.getDynamicProperty(SHULKER_OWNER_KEY);
  } catch {
    storedOwnerId = undefined;
  }

  const tameable = shulker.getComponent("minecraft:tameable");
  const isPet =
    (typeof storedOwnerId === "string" && storedOwnerId.length > 0) ||
    tameable?.isTamed;

  if (!isPet) {
    return;
  }

  if (typeof storedOwnerId === "string" && storedOwnerId.length > 0) {
    clearShulkerDeployedForPlayerId(storedOwnerId);
    return;
  }

  clearShulkerDeployedForOwner(shulker);
}

function findShulkerById(dimension, shulkerId, location, maxDistance = 8) {
  if (!dimension || !shulkerId || !location) {
    return undefined;
  }

  try {
    for (const entity of dimension.getEntities({
      type: "minecraft:shulker",
      location,
      maxDistance,
    })) {
      if (entity.id === shulkerId) {
        return entity;
      }
    }
  } catch {
    // 忽略查询失败
  }

  return undefined;
}

function markShulkerSitting(shulker, sitting) {
  if (!shulker?.id) {
    return;
  }

  shulkerSittingState.set(shulker.id, sitting);
  try {
    shulker.setDynamicProperty(SCRIPT_SITTING_KEY, sitting);
  } catch {
    // 忽略
  }

  try {
    if (sitting) {
      shulker.addTag(SHULKER_SITTING_TAG);
    } else {
      shulker.removeTag(SHULKER_SITTING_TAG);
    }
  } catch {
    // 忽略
  }

  setShulkerSitting(shulker, sitting);
}

function isShulkerSitting(shulker) {
  if (!shulker) {
    return false;
  }

  try {
    if (shulker.hasTag(SHULKER_SITTING_TAG)) {
      return true;
    }
  } catch {
    // 忽略
  }

  if (shulkerSittingState.get(shulker.id) === true) {
    return true;
  }

  try {
    if (shulker.getDynamicProperty(SCRIPT_SITTING_KEY) === true) {
      shulkerSittingState.set(shulker.id, true);
      return true;
    }
  } catch {
    // 忽略
  }

  try {
    const sitting = shulker.getProperty(SITTING_PROPERTY);
    if (sitting === true || sitting === 1) {
      markShulkerSitting(shulker, true);
      return true;
    }
  } catch {
    // 忽略属性读取失败
  }

  return false;
}

function getItemEnchantable(stack) {
  if (!stack) {
    return undefined;
  }

  return (
    stack.getComponent("minecraft:enchantable") ??
    stack.getComponent("enchantable")
  );
}

function enchantTypeIdIncludesVanishing(typeRef) {
  const typeId = String(
    typeRef?.id ?? typeRef?.typeId ?? typeRef ?? ""
  ).toLowerCase();
  return typeId.includes("vanishing");
}

function hasVanishingCurse(stack) {
  if (!stack) {
    return false;
  }

  const enchantable = getItemEnchantable(stack);
  if (!enchantable) {
    return false;
  }

  try {
    for (const entry of enchantable.getEnchantments?.() ?? []) {
      if (enchantTypeIdIncludesVanishing(entry.type)) {
        return true;
      }
    }
  } catch {
    // 继续尝试其它检测方式
  }

  for (const id of [
    "vanishing",
    "vanishing_curse",
    "curse_of_vanishing",
    "minecraft:vanishing",
    "minecraft:vanishing_curse",
  ]) {
    try {
      if (
        typeof enchantable.hasEnchantment === "function" &&
        enchantable.hasEnchantment(id)
      ) {
        return true;
      }
    } catch {
      // 忽略未知 id
    }

    try {
      if (enchantable.getEnchantment(id)) {
        return true;
      }
    } catch {
      // getEnchantment 对未知 id 可能抛错，逐项捕获
    }
  }

  for (const key of ["vanishing", "vanishing_curse", "curse_of_vanishing"]) {
    try {
      const enchantType =
        EnchantmentTypes.get(key) ?? EnchantmentTypes.get(`minecraft:${key}`);
      if (enchantType && enchantable.getEnchantment(enchantType)) {
        return true;
      }
    } catch {
      // 忽略
    }
  }

  return false;
}

function resolveEnchantType(enchantId) {
  if (!enchantId) {
    return undefined;
  }

  const normalized = String(enchantId).replace(/^minecraft:/, "");
  try {
    return (
      EnchantmentTypes.get(normalized) ??
      EnchantmentTypes.get(`minecraft:${normalized}`)
    );
  } catch {
    return undefined;
  }
}

function getItemDurabilityData(stack) {
  if (!stack) {
    return undefined;
  }

  try {
    const durability =
      stack.getComponent("minecraft:durability") ?? stack.getComponent("durability");
    if (!durability) {
      return undefined;
    }

    /** @type {{ damage?: number, unbreakable?: boolean }} */
    const data = {};
    if (typeof durability.damage === "number") {
      data.damage = durability.damage;
    }
    if (durability.unbreakable === true) {
      data.unbreakable = true;
    }

    return Object.keys(data).length > 0 ? data : undefined;
  } catch {
    return undefined;
  }
}

function applyItemDurabilityData(stack, durabilityData) {
  if (!stack || !durabilityData) {
    return;
  }

  try {
    const durability =
      stack.getComponent("minecraft:durability") ?? stack.getComponent("durability");
    if (!durability) {
      return;
    }

    if (typeof durabilityData.damage === "number") {
      durability.damage = durabilityData.damage;
    }
    if (typeof durabilityData.unbreakable === "boolean") {
      durability.unbreakable = durabilityData.unbreakable;
    }
  } catch {
    // 忽略耐久写入失败
  }
}

function serializeItemStack(stack) {
  if (!stack) {
    return null;
  }

  /** @type {{ typeId: string, amount: number, enchants?: { type: string, level: number }[], damage?: number, unbreakable?: boolean }} */
  const data = {
    typeId: stack.typeId,
    amount: stack.amount,
  };

  const durabilityData = getItemDurabilityData(stack);
  if (durabilityData?.damage !== undefined) {
    data.damage = durabilityData.damage;
  }
  if (durabilityData?.unbreakable) {
    data.unbreakable = true;
  }

  try {
    const enchantable = stack.getComponent("enchantable");
    const enchantments = enchantable?.getEnchantments?.() ?? [];
    if (enchantments.length > 0) {
      data.enchants = enchantments.map((entry) => ({
        type: entry.type?.id ?? entry.type?.typeId ?? String(entry.type ?? ""),
        level: entry.level,
      }));
    }
  } catch {
    // 忽略附魔序列化失败
  }

  return data;
}

function deserializeItemStack(data) {
  if (!data?.typeId || !data.amount) {
    return undefined;
  }

  try {
    const stack = new ItemStack(data.typeId, data.amount);
    applyItemDurabilityData(stack, {
      damage: data.damage,
      unbreakable: data.unbreakable,
    });

    const enchantable = stack.getComponent("enchantable");
    if (enchantable && Array.isArray(data.enchants)) {
      for (const entry of data.enchants) {
        try {
          const enchantType = resolveEnchantType(entry.type);
          if (enchantType) {
            enchantable.addEnchantment({ type: enchantType, level: entry.level });
          } else {
            enchantable.addEnchantment({
              type: { id: entry.type },
              level: entry.level,
            });
          }
        } catch {
          // 忽略无法还原的附魔
        }
      }
    }
    return stack;
  } catch {
    return undefined;
  }
}

function syncVanishCarryingTag(player, carrying) {
  if (!player?.id) {
    return;
  }

  try {
    if (carrying) {
      player.addTag(VANISH_CARRYING_TAG);
    } else if (!getPendingVanishReturn(player)) {
      player.removeTag(VANISH_CARRYING_TAG);
    }
  } catch {
    // 忽略 tag 写入失败
  }
}

function vanishDebug(player, message) {
  if (!VANISH_DEBUG || !isLiveEntity(player)) {
    return;
  }

  try {
    player.sendMessage(`§7[消失缓存] ${message}`);
  } catch {
    // 忽略
  }
}

function getVanishPlayerKey(player) {
  return player?.name ?? player?.id ?? "";
}

/** @returns {Record<string, { stash?: unknown[]; pending?: boolean }>} */
function readVanishLedgerRaw() {
  try {
    const raw = world.getDynamicProperty(WORLD_VANISH_LEDGER_KEY);
    if (typeof raw !== "string" || raw.length === 0) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeVanishLedgerRaw(ledger) {
  try {
    if (!ledger || Object.keys(ledger).length === 0) {
      world.setDynamicProperty(WORLD_VANISH_LEDGER_KEY, undefined);
      return;
    }
    world.setDynamicProperty(WORLD_VANISH_LEDGER_KEY, JSON.stringify(ledger));
  } catch {
    // 忽略世界账本写入失败
  }
}

function syncVanishLedger(player, items, pending) {
  const key = getVanishPlayerKey(player);
  if (!key) {
    return;
  }

  const ledger = readVanishLedgerRaw();
  if (!items.length && !pending) {
    delete ledger[key];
  } else {
    ledger[key] = {
      stash: items,
      pending: pending === true,
    };
  }
  writeVanishLedgerRaw(ledger);
}

function readVanishLedgerEntry(player) {
  const key = getVanishPlayerKey(player);
  if (!key) {
    return undefined;
  }

  const entry = readVanishLedgerRaw()[key];
  if (!entry || !Array.isArray(entry.stash) || entry.stash.length === 0) {
    return undefined;
  }

  return entry;
}

function refreshVanishPreviewOnHurt(player) {
  if (!isLiveEntity(player) || getPendingVanishReturn(player)) {
    return;
  }

  const health = player.getComponent("minecraft:health");
  // 致命伤害由 entityDie → promoteStashOnPlayerDeath 统一处理，此处只更新预览
  if (health && health.currentValue <= 0) {
    return;
  }

  refreshVanishPreview(player);
}

/** @returns {ReturnType<typeof serializeItemStack>[]} */
function readVanishStashFromPlayerProperty(player) {
  try {
    const raw = player.getDynamicProperty(VANISH_STASH_KEY);
    if (typeof raw !== "string" || raw.length === 0) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistVanishStash(player, items, pending) {
  const key = getVanishPlayerKey(player);
  if (!key) {
    return;
  }

  if (!items.length && !pending) {
    vanishSessionStore.delete(key);
    syncVanishLedger(player, [], false);
    try {
      player.setDynamicProperty(VANISH_STASH_KEY, undefined);
    } catch {
      // 忽略
    }
    clearVanishPending(player);
    return;
  }

  vanishSessionStore.set(key, { stash: items, pending: pending === true });
  syncVanishLedger(player, items, pending);

  try {
    player.setDynamicProperty(
      VANISH_STASH_KEY,
      items.length > 0 ? JSON.stringify(items) : undefined
    );
  } catch {
    // 忽略
  }

  if (pending) {
    markVanishPending(player);
  } else {
    clearVanishPending(player);
  }
}

function readVanishStash(player) {
  const key = getVanishPlayerKey(player);
  if (!key) {
    return [];
  }

  const session = vanishSessionStore.get(key);
  if (session && Array.isArray(session.stash) && session.stash.length > 0) {
    return session.stash;
  }

  const ledgerEntry = readVanishLedgerEntry(player);
  if (ledgerEntry && Array.isArray(ledgerEntry.stash) && ledgerEntry.stash.length > 0) {
    return ledgerEntry.stash;
  }

  return readVanishStashFromPlayerProperty(player);
}

function readVanishPreview(player) {
  return readVanishStash(player);
}

function writeVanishPreview(player, items) {
  if (getPendingVanishReturn(player)) {
    return;
  }

  if (!items.length) {
    persistVanishStash(player, [], false);
    return;
  }

  persistVanishStash(player, items, false);
}

function markVanishPending(player) {
  if (!player?.id) {
    return;
  }

  const key = getVanishPlayerKey(player);
  const existing = vanishSessionStore.get(key) ?? { stash: [], pending: false };
  existing.pending = true;
  vanishSessionStore.set(key, existing);
  syncVanishLedger(player, existing.stash ?? readVanishStash(player), true);

  try {
    player.setDynamicProperty(PENDING_VANISH_KEY, true);
  } catch {
    // 忽略
  }

  try {
    player.addTag(VANISH_PENDING_TAG);
  } catch {
    // 忽略
  }
}

function clearVanishPending(player) {
  if (!player?.id) {
    return;
  }

  const key = getVanishPlayerKey(player);
  const session = vanishSessionStore.get(key);
  if (session) {
    session.pending = false;
    vanishSessionStore.set(key, session);
    syncVanishLedger(player, session.stash ?? [], false);
  } else {
    syncVanishLedger(player, readVanishStash(player), false);
  }

  try {
    player.setDynamicProperty(PENDING_VANISH_KEY, false);
  } catch {
    // 忽略
  }

  try {
    player.removeTag(VANISH_PENDING_TAG);
  } catch {
    // 忽略
  }
}

function clearVanishStash(player) {
  persistVanishStash(player, [], false);
  syncVanishCarryingTag(player, false);
}

function getPendingVanishReturn(player) {
  const key = getVanishPlayerKey(player);
  const session = vanishSessionStore.get(key);
  if (session?.pending === true) {
    return true;
  }

  const ledgerEntry = readVanishLedgerEntry(player);
  if (ledgerEntry?.pending === true) {
    return true;
  }

  try {
    if (player.getDynamicProperty(PENDING_VANISH_KEY) === true) {
      return true;
    }
  } catch {
    // 忽略
  }

  try {
    if (player.hasTag(VANISH_PENDING_TAG)) {
      return true;
    }
  } catch {
    // 忽略
  }

  return false;
}

function stripVanishingItemsFromPlayer(player) {
  /** @type {ReturnType<typeof serializeItemStack>[]} */
  const stripped = [];

  const inventory = player.getComponent("inventory")?.container;
  if (inventory) {
    for (let slot = 0; slot < inventory.size; slot++) {
      const stack = inventory.getItem(slot);
      if (!stack || !hasVanishingCurse(stack)) {
        continue;
      }

      const serialized = serializeItemStack(stack);
      if (serialized) {
        stripped.push(serialized);
      }

      try {
        inventory.setItem(slot, undefined);
      } catch {
        // 忽略剥离失败
      }
    }
  }

  const equippable =
    player.getComponent(EntityEquippableComponent.componentId) ??
    player.getComponent("equippable");
  if (equippable) {
    for (const slot of VANISH_ARMOR_EQUIPMENT_SLOTS) {
      const stack = equippable.getEquipment(slot);
      if (!stack || !hasVanishingCurse(stack)) {
        continue;
      }

      const serialized = serializeItemStack(stack);
      if (serialized) {
        stripped.push(serialized);
      }

      try {
        equippable.setEquipment(slot, undefined);
      } catch {
        // 忽略剥离失败
      }
    }
  }

  return dedupeVanishStashItems(stripped);
}

function depositItemsToShulker(shulker, items) {
  const container = getShulkerInventory(shulker);
  if (!container || !items.length) {
    return { transferred: 0, remaining: items.slice() };
  }

  const emptySlots = countEmptyInventorySlots(container);
  if (emptySlots <= 0) {
    return { transferred: 0, remaining: items.slice() };
  }

  let transferred = 0;
  const remaining = [];

  for (let i = 0; i < items.length; i++) {
    if (transferred >= emptySlots) {
      remaining.push(items[i]);
      continue;
    }

    const stack = deserializeItemStack(items[i]);
    if (!stack) {
      continue;
    }

    const leftover = addItemToShulkerContainer(container, stack);
    if (leftover) {
      remaining.push(serializeItemStack(leftover));
      remaining.push(...items.slice(i + 1));
      break;
    }

    transferred++;
  }

  return { transferred, remaining };
}

function vanishNeedCounts(stash) {
  /** @type {Map<string, number>} */
  const needed = new Map();
  for (const item of stash) {
    const signature = vanishItemSignature(item);
    if (!signature) {
      continue;
    }
    needed.set(signature, (needed.get(signature) ?? 0) + (item.amount ?? 1));
  }
  return needed;
}

function stripVanishingItemsMatchingStash(player, stash) {
  const needed = vanishNeedCounts(stash);
  if (!needed.size) {
    return;
  }

  const takeFromStack = (stack) => {
    if (!stack || !hasVanishingCurse(stack)) {
      return stack;
    }
    const serialized = serializeItemStack(stack);
    if (!serialized) {
      return stack;
    }
    const signature = vanishItemSignature(serialized);
    const remaining = needed.get(signature) ?? 0;
    if (remaining <= 0) {
      return stack;
    }
    const amount = Math.max(1, serialized.amount ?? 1);
    if (amount <= remaining) {
      needed.set(signature, remaining - amount);
      return undefined;
    }
    needed.set(signature, 0);
    try {
      const reduced = stack.clone();
      reduced.amount = amount - remaining;
      return reduced;
    } catch {
      return undefined;
    }
  };

  const inventory = player.getComponent("inventory")?.container;
  if (inventory) {
    for (let slot = 0; slot < inventory.size; slot++) {
      const stack = inventory.getItem(slot);
      const next = takeFromStack(stack);
      if (next === stack) {
        continue;
      }
      try {
        inventory.setItem(slot, next);
      } catch {
        // 忽略剥离失败
      }
    }
  }

  const equippable =
    player.getComponent(EntityEquippableComponent.componentId) ??
    player.getComponent("equippable");
  if (equippable) {
    for (const slot of VANISH_ARMOR_EQUIPMENT_SLOTS) {
      const stack = equippable.getEquipment(slot);
      const next = takeFromStack(stack);
      if (next === stack) {
        continue;
      }
      try {
        equippable.setEquipment(slot, next);
      } catch {
        // 忽略剥离失败
      }
    }
  }
}

function processVanishStash(player, stash) {
  if (!stash.length) {
    clearVanishStash(player);
    return;
  }

  if (isLiveEntity(player)) {
    // 只清死亡缓存里那一批，避免 pending 期间新获得的消失诅咒物品被吃掉
    stripVanishingItemsMatchingStash(player, stash);
  }

  const shulker = findOwnedShulkerNear(player, VANISH_RETURN_RADIUS);
  if (!shulker) {
    persistVanishStash(player, stash, true);
    vanishDebug(
      player,
      `已缓存 ${stash.length} 件，${VANISH_RETURN_RADIUS} 格内未找到潜影贝`
    );
    return;
  }

  const container = getShulkerInventory(shulker);
  if (!container) {
    persistVanishStash(player, stash, true);
    vanishDebug(player, "找到潜影贝但无法读取背包");
    return;
  }

  const total = stash.length;
  const { transferred, remaining } = depositItemsToShulker(shulker, stash);

  notifyVanishDeposit(player, transferred, remaining.length, total);

  if (remaining.length === 0) {
    clearVanishStash(player);
    vanishDebug(player, "全部物品已存入潜影贝");
    return;
  }

  persistVanishStash(player, remaining, true);
  vanishDebug(
    player,
    `部分存入（${transferred}/${total}），剩余 ${remaining.length} 件待取回`
  );
}

function promoteStashOnPlayerDeath(player) {
  if (!player?.id) {
    return;
  }

  let items = collectVanishingItemsFromPlayer(player);
  if (items.length === 0) {
    items = dedupeVanishStashItems(readVanishStash(player));
  }

  if (items.length > 0) {
    persistVanishStash(player, items, true);
    syncVanishCarryingTag(player, true);
    stripVanishingItemsFromPlayer(player);
    notifyVanishCacheStored(player, items.length);
  } else {
    vanishDebug(player, "死亡：未找到缓存（请确认物品已附魔消失诅咒）");
  }

  system.run(() => {
    if (!isLiveEntity(player)) {
      return;
    }

    const stash = readVanishStash(player);
    if (!stash.length) {
      return;
    }

    processVanishStash(player, stash);
  });
}

function vanishItemSignature(data) {
  if (!data?.typeId) {
    return "";
  }

  const enchants = (data.enchants ?? [])
    .map((entry) => `${entry.type}:${entry.level}`)
    .sort()
    .join("|");
  const damagePart =
    typeof data.damage === "number" ? `@d${data.damage}` : "";
  const unbreakPart = data.unbreakable ? "@u1" : "";
  return `${data.typeId}#${enchants}${damagePart}${unbreakPart}`;
}

function dedupeVanishStashItems(items) {
  /** @type {Map<string, ReturnType<typeof serializeItemStack>>} */
  const merged = new Map();

  for (const item of items) {
    if (!item?.typeId || !item.amount) {
      continue;
    }

    const signature = vanishItemSignature(item);
    const existing = merged.get(signature);
    if (existing) {
      existing.amount += item.amount;
      continue;
    }

    merged.set(signature, {
      typeId: item.typeId,
      amount: item.amount,
      enchants: item.enchants ? item.enchants.map((entry) => ({ ...entry })) : undefined,
      damage: item.damage,
      unbreakable: item.unbreakable,
    });
  }

  return Array.from(merged.values());
}

/** 主手/副手已在 inventory 容器内，equippable 只额外扫盔甲槽。 */
const VANISH_ARMOR_EQUIPMENT_SLOTS = [
  EquipmentSlot.Head,
  EquipmentSlot.Chest,
  EquipmentSlot.Legs,
  EquipmentSlot.Feet,
];

function collectVanishingItemsFromPlayer(player) {
  /** @type {ReturnType<typeof serializeItemStack>[]} */
  const cached = [];

  const inventory = player.getComponent("inventory")?.container;
  if (inventory) {
    for (let slot = 0; slot < inventory.size; slot++) {
      const stack = inventory.getItem(slot);
      if (stack && hasVanishingCurse(stack)) {
        const serialized = serializeItemStack(stack);
        if (serialized) {
          cached.push(serialized);
        }
      }
    }
  }

  const equippable =
    player.getComponent(EntityEquippableComponent.componentId) ??
    player.getComponent("equippable");
  if (equippable) {
    for (const slot of VANISH_ARMOR_EQUIPMENT_SLOTS) {
      const stack = equippable.getEquipment(slot);
      if (stack && hasVanishingCurse(stack)) {
        const serialized = serializeItemStack(stack);
        if (serialized) {
          cached.push(serialized);
        }
      }
    }
  }

  return dedupeVanishStashItems(cached);
}

function countEmptyInventorySlots(container) {
  let empty = 0;
  for (let slot = 0; slot < INVENTORY_SIZE; slot++) {
    if (!container.getItem(slot)) {
      empty++;
    }
  }
  return empty;
}

function findOwnedShulkerNear(player, maxDistance) {
  try {
    const entities = player.dimension.getEntities({
      type: "minecraft:shulker",
      location: player.location,
      maxDistance,
    });
    for (const entity of entities) {
      if (isTamedShulkerOwnedBy(entity, player)) {
        return entity;
      }
    }
  } catch {
    // 忽略查询失败
  }
  return undefined;
}

function addItemToShulkerContainer(container, stack) {
  if (!container || !stack) {
    return stack;
  }

  try {
    const leftover = container.addItem(stack);
    if (!leftover) {
      return undefined;
    }

    for (let slot = 0; slot < INVENTORY_SIZE; slot++) {
      if (!container.getItem(slot)) {
        container.setItem(slot, leftover);
        return undefined;
      }
    }

    return leftover;
  } catch {
    return stack;
  }
}

function tryReturnVanishCacheToShulker(player) {
  if (!isLiveEntity(player) || !getPendingVanishReturn(player)) {
    return;
  }

  const stash = readVanishStash(player);
  if (!stash.length) {
    clearVanishStash(player);
    return;
  }

  processVanishStash(player, stash);
}

function refreshVanishPreview(player) {
  if (!player?.id || getPendingVanishReturn(player)) {
    return;
  }

  const items = dedupeVanishStashItems(collectVanishingItemsFromPlayer(player));
  syncVanishCarryingTag(player, items.length > 0);

  if (!items.length) {
    return;
  }

  persistVanishStash(player, items, false);
}

function shouldNotifyVanishReturn(player) {
  const key = getVanishPlayerKey(player);
  const cacheTick = vanishCacheNotifyAt.get(key);
  if (cacheTick !== undefined && system.currentTick - cacheTick < 400) {
    return false;
  }

  const tick = system.currentTick;
  const last = vanishReturnNotifyAt.get(key) ?? -Infinity;
  if (tick - last < 200) {
    return false;
  }
  vanishReturnNotifyAt.set(key, tick);
  return true;
}

function notifyVanishReturnPending(player, itemCount) {
  if (!shouldNotifyVanishReturn(player)) {
    return;
  }

  try {
    if (itemCount > 0) {
      player.sendMessage(
        `§e你有 ${itemCount} 件消失诅咒物品待潜影贝取回（靠近 6 格内）`
      );
    } else {
      player.sendMessage(`§e你有消失诅咒物品待潜影贝取回（靠近 6 格内）`);
    }
  } catch {
    // 忽略
  }
}

function notifyVanishCacheStored(player, itemCount) {
  if (!player?.id || itemCount <= 0) {
    return;
  }

  const key = getVanishPlayerKey(player);
  const tick = system.currentTick;
  if (vanishCacheNotifyAt.get(key) === tick) {
    return;
  }
  vanishCacheNotifyAt.set(key, tick);

  try {
    player.sendMessage(
      `§e已缓存 ${itemCount} 件消失诅咒物品，重生后靠近潜影贝（6 格内）取回`
    );
  } catch {
    // 忽略
  }
}

function notifyVanishDeposit(player, transferred, remaining, total) {
  if (!isLiveEntity(player) || transferred <= 0) {
    return;
  }

  const key = getVanishPlayerKey(player);
  const now = system.currentTick;
  const isComplete = remaining <= 0;

  if (!isComplete) {
    const lastNotify = vanishDepositNotifyAt.get(key) ?? 0;
    if (now - lastNotify < VANISH_DEPOSIT_NOTIFY_COOLDOWN_TICKS) {
      return;
    }
  }

  vanishDepositNotifyAt.set(key, now);

  try {
    if (isComplete) {
      player.sendMessage(
        `§a潜影贝已存入 ${transferred} 件消失诅咒物品`
      );
      vanishDepositNotifyAt.delete(key);
      return;
    }

    player.sendMessage(
      `§a潜影贝已存入 ${transferred}/${total} 件，剩余 §e${remaining} §a件待取回（潜影贝背包已满）`
    );
  } catch {
    // 忽略
  }
}

function reconcileVanishItemsOnRespawn(player, options = {}) {
  const { notify = true } = options;
  if (!player?.id) {
    return;
  }

  let items = dedupeVanishStashItems(readVanishStash(player));
  const pending = getPendingVanishReturn(player);
  const keptItems = collectVanishingItemsFromPlayer(player);

  // pending 时背包里可能是新钓/新捡的消失诅咒物品，不能覆盖死亡缓存
  if (keptItems.length > 0 && !pending) {
    items = keptItems;
  }
  let carrying = false;
  try {
    carrying = player.hasTag(VANISH_CARRYING_TAG);
  } catch {
    // 忽略
  }

  if (!items.length && !pending && !carrying) {
    return;
  }

  if (items.length > 0) {
    persistVanishStash(player, items, true);
    if (notify) {
      notifyVanishReturnPending(player, items.length);
    }
    tryReturnVanishCacheToShulker(player);
    return;
  }

  if (pending || carrying) {
    if (notify) {
      notifyVanishReturnPending(player, 0);
    }
    tryReturnVanishCacheToShulker(player);
  }
}

function explainCopperExtractFailure(player, shulker) {
  if (!isShulkerSitting(shulker)) {
    player.sendMessage("§c潜影贝需要先坐下");
    return;
  }
  if (displayState.has(shulker.id)) {
    player.sendMessage("§c潜影贝正在展示物品，无法取出");
    return;
  }
  if (
    hasThreatNearLocation(
      shulker,
      shulker.location,
      DISPLAY_NEARBY_BLOCK_RADIUS,
      undefined,
      { ignorePlayerId: player.id }
    )
  ) {
    player.sendMessage("§c附近有生物，潜影贝不愿交出物品");
    return;
  }

  const container = getShulkerInventory(shulker);
  if (!container || getRandomFilledSlot(container) < 0) {
    player.sendMessage("§c潜影贝背包里没有可取出的物品");
  }
}

function handleShulkerCopperInteract(event, player, target, itemStack) {
  if (itemStack.typeId !== OXIDIZED_COPPER_BLOCK_ID || !isShulker(target)) {
    return false;
  }

  if (!isTamedShulkerOwnedBy(target, player)) {
    return false;
  }

  event.cancel = true;

  const shulkerId = target.id;
  const dimension = target.dimension;
  const location = { ...target.location };

  system.run(() => {
    if (!isLiveEntity(player)) {
      return;
    }

    const shulker =
      findShulkerById(dimension, shulkerId, location) ??
      (isLiveEntity(target) ? target : undefined);

    if (!shulker || !isTamedShulkerOwnedBy(shulker, player)) {
      return;
    }

    if (canUseCopperExtract(shulker, player)) {
      tryCopperExtractFromShulker(player, shulker);
      return;
    }

    explainCopperExtractFailure(player, shulker);
  });

  return true;
}

function canUseCopperExtract(shulker, player) {
  if (!isShulker(shulker) || !isTamedShulkerOwnedBy(shulker, player)) {
    return false;
  }
  if (!isShulkerSitting(shulker)) {
    return false;
  }
  if (displayState.has(shulker.id)) {
    return false;
  }
  if (
    hasThreatNearLocation(
      shulker,
      shulker.location,
      DISPLAY_NEARBY_BLOCK_RADIUS,
      undefined,
      { ignorePlayerId: player.id }
    )
  ) {
    return false;
  }
  const container = getShulkerInventory(shulker);
  return !!container && getRandomFilledSlot(container) >= 0;
}

function tryCopperExtractFromShulker(player, shulker) {
  if (!canUseCopperExtract(shulker, player)) {
    return;
  }

  const slot = getMainhandSlot(player);
  if (!slot?.hasItem() || slot.typeId !== OXIDIZED_COPPER_BLOCK_ID) {
    return;
  }

  const container = getShulkerInventory(shulker);
  if (!container) {
    return;
  }

  const itemSlot = getRandomFilledSlot(container);
  if (itemSlot < 0) {
    return;
  }

  const dropStack = takeOneItemFromSlot(container, itemSlot);
  if (!dropStack) {
    return;
  }

  const { consumed } = consumeOneFromEquipmentSlot(slot, OXIDIZED_COPPER_BLOCK_ID);
  if (!consumed) {
    returnItemToInventory(shulker, dropStack, itemSlot);
    return;
  }

  try {
    shulker.dimension.spawnItem(dropStack, shulker.location);
    playDisplayFx(shulker, shulker.location);
  } catch {
    returnItemToInventory(shulker, dropStack, itemSlot);
    giveItemOrDrop(player, new ItemStack(OXIDIZED_COPPER_BLOCK_ID, 1));
  }
}

function handleShulkerPearlInteract(event, player, target, itemStack) {
  if (itemStack.typeId !== ENDER_PEARL_ID || target.typeId !== "minecraft:shulker") {
    return false;
  }

  const tameable = target.getComponent("minecraft:tameable");
  if (tameable?.isTamed) {
    return false;
  }

  if (playerBlocksExtraShulkerDeploy(player, target.id)) {
    event.cancel = true;
    system.run(() => notifyDeployBlocked(player, "pearl"));
    return true;
  }

  return false;
}

function isTamedShulkerOwnedBy(entity, player) {
  if (entity.typeId !== "minecraft:shulker") {
    return false;
  }

  try {
    const storedId = entity.getDynamicProperty(SHULKER_OWNER_KEY);
    if (typeof storedId === "string" && storedId.length > 0) {
      return storedId === player.id;
    }
  } catch {
    // 忽略
  }

  const tameable = entity.getComponent("minecraft:tameable");
  if (!tameable?.isTamed) {
    return false;
  }

  if (tameable.tamedToPlayer && isLiveEntity(tameable.tamedToPlayer)) {
    return tameable.tamedToPlayer.id === player.id;
  }

  if (tameable.tamedTo !== undefined) {
    return tameable.tamedTo.id === player.id;
  }

  if (tameable.tamedToPlayerId !== undefined) {
    return tameable.tamedToPlayerId === player.id;
  }

  return false;
}

function saveEntityToStructure(entity) {
  const structureId = `my_pack:bucket_${Math.floor(Math.random() * 999999999)}`;
  if (isAquaticBucketEntity(entity.typeId)) {
    return saveAquaticEntityToStructure(entity, structureId);
  }
  return saveShulkerEntityToStructure(entity, structureId);
}

/** 在水中原位保存，避免传送到高空导致实体/结构状态异常。 */
function saveAquaticEntityToStructure(entity, structureId) {
  const dimension = entity.dimension;
  const bx = Math.floor(entity.location.x);
  const by = Math.floor(entity.location.y);
  const bz = Math.floor(entity.location.z);
  const blockCorner = { x: bx, y: by, z: bz };

  try {
    world.structureManager.createFromWorld(
      structureId,
      dimension,
      blockCorner,
      blockCorner,
      {
        includeBlocks: false,
        includeEntities: true,
        saveMode: StructureSaveMode.World,
      }
    );
    return structureId;
  } catch {
    return undefined;
  }
}

function saveShulkerEntityToStructure(entity, structureId) {
  const previousLocation = { ...entity.location };
  const dimension = entity.dimension;
  const saveY = dimension.heightRange.max - 1;

  try {
    entity.teleport(
      { x: entity.location.x, y: saveY, z: entity.location.z },
      { checkForBlocks: false }
    );
    world.structureManager.createFromWorld(
      structureId,
      dimension,
      entity.location,
      entity.location,
      {
        includeBlocks: false,
        includeEntities: true,
        saveMode: StructureSaveMode.World,
      }
    );
    try {
      entity.teleport(previousLocation, { checkForBlocks: false });
    } catch {
      // 忽略
    }
    return structureId;
  } catch {
    try {
      entity.teleport(previousLocation, { checkForBlocks: false });
    } catch {
      // 忽略恢复位置失败
    }
    return undefined;
  }
}

function getPlaceLocationFromRay(player, requiresWater = false) {
  const dimension = player.dimension;
  const result = dimension.getBlockFromRay(
    player.getHeadLocation(),
    player.getViewDirection(),
    {
      includeLiquidBlocks: true,
      includePassableBlocks: requiresWater,
      maxDistance: 6,
    }
  );

  if (!result) {
    return undefined;
  }

  if (isWaterBlockId(result.block.typeId)) {
    return getBlockCenter(result.block);
  }

  const faceLocation = {
    x: result.block.location.x + result.faceLocation.x + 0.5,
    y: result.block.location.y + result.faceLocation.y + 0.5,
    z: result.block.location.z + result.faceLocation.z + 0.5,
  };

  if (requiresWater) {
    return (
      getWaterSpawnCenter(dimension, faceLocation) ??
      getWaterSpawnCenter(dimension, getBlockCenter(result.block)) ??
      (isWaterAt(dimension, faceLocation) ? faceLocation : undefined)
    );
  }

  return faceLocation;
}

function getPlaceLocationFromBlock(dimension, block, blockFace, requiresWater = false) {
  if (isWaterBlockId(block.typeId)) {
    return getBlockCenter(block);
  }

  const { x, y, z } = block.location;

  let faceLocation;
  switch (blockFace) {
    case Direction.Up:
      faceLocation = { x: x + 0.5, y: y + 1.0, z: z + 0.5 };
      break;
    case Direction.Down:
      faceLocation = { x: x + 0.5, y: y - 0.5, z: z + 0.5 };
      break;
    case Direction.North:
      faceLocation = { x: x + 0.5, y: y + 0.5, z: z - 0.5 };
      break;
    case Direction.South:
      faceLocation = { x: x + 0.5, y: y + 0.5, z: z + 0.5 };
      break;
    case Direction.West:
      faceLocation = { x: x - 0.5, y: y + 0.5, z: z + 0.5 };
      break;
    case Direction.East:
      faceLocation = { x: x + 1.5, y: y + 0.5, z: z + 0.5 };
      break;
    default:
      faceLocation = { x: x + 0.5, y: y + 1.0, z: z + 0.5 };
  }

  if (requiresWater) {
    return (
      getWaterSpawnCenter(dimension, faceLocation) ??
      getWaterSpawnCenter(dimension, getBlockCenter(block)) ??
      (isWaterAt(dimension, faceLocation) ? faceLocation : undefined)
    );
  }

  return faceLocation;
}

function finishMobBucketPlace(player, slot, def) {
  if (player.getGameMode() === GameMode.Creative) {
    return;
  }

  const stack = slot.getItem();
  if (!stack || stack.typeId !== def.bucketId) {
    return;
  }

  const shouldReturnContainer = slot.getDynamicProperty(RETURN_BUCKET_KEY) ?? true;
  const { wasStacked } = consumeOneFromEquipmentSlot(slot, def.bucketId);

  if (wasStacked) {
    if (shouldReturnContainer) {
      giveItemOrDrop(player, new ItemStack(def.returnContainer, 1));
    }
    return;
  }

  if (shouldReturnContainer) {
    slot.setItem(new ItemStack(def.returnContainer, 1));
  } else {
    slot.setItem(undefined);
  }
}

function spawnDefaultWildShulker(dimension, location) {
  const shulker = dimension.spawnEntity("minecraft:shulker", location);
  const container = getShulkerInventory(shulker);

  if (container) {
    for (let slot = 0; slot < INVENTORY_SIZE; slot++) {
      container.setItem(slot, undefined);
    }
  }

  return shulker;
}

function ensureTamedShulkersAtLocation(dimension, location, player) {
  system.runTimeout(() => {
    try {
      const placed = dimension.getEntities({
        type: "minecraft:shulker",
        location,
        maxDistance: 3,
      });
      for (const shulker of placed) {
        if (shulker.getComponent("minecraft:tameable")?.isTamed) {
          try {
            shulker.triggerEvent("my_pack:ensure_pet");
          } catch {
            // 忽略事件失败
          }
          if (isLiveEntity(player) && isTamedShulkerOwnedBy(shulker, player)) {
            if (playerBlocksExtraShulkerDeploy(player, shulker.id)) {
              rejectExtraShulkerTame(shulker, player);
            } else {
              bindShulkerOwner(shulker, player);
            }
          }
        }
      }
    } catch {
      // 忽略查找失败
    }
  }, 1);
}

function placeMobBucket(player, placeLocation, def) {
  const slot = getMainhandSlot(player);
  if (!slot?.hasItem() || slot.typeId !== def.bucketId) {
    return;
  }

  if (def.entityType === "minecraft:shulker") {
    if (playerBlocksExtraShulkerDeploy(player)) {
      notifyDeployBlocked(player, "place");
      return;
    }
  }

  if (isOnPlaceCooldown(player.id)) {
    return;
  }

  setPlaceCooldown(player.id);

  const structureId = slot.getDynamicProperty(STRUCTURE_KEY);
  const useStructure =
    bucketUsesStructureStorage(def) &&
    typeof structureId === "string" &&
    structureId.length > 0;
  const storedVariant = slot.getDynamicProperty(VARIANT_KEY);

  const targetLocation =
    placeLocation ?? getPlaceLocationFromRay(player, def.requiresWater);
  if (!targetLocation) {
    return;
  }

  if (def.requiresWater && !isWaterAt(player.dimension, targetLocation)) {
    return;
  }

  if (useStructure) {
    const placeAt = snapStructurePlaceLocation(
      player.dimension,
      targetLocation,
      def.requiresWater
    );
    let placedFromStructure = false;
    try {
      world.structureManager.place(structureId, player.dimension, placeAt, {
        includeBlocks: false,
        includeEntities: true,
      });
      placedFromStructure = true;
    } catch {
      placedFromStructure = false;
    }

    if (!placedFromStructure) {
      try {
        spawnMobFromBucket(
          player.dimension,
          placeAt,
          def,
          typeof storedVariant === "string" ? storedVariant : undefined
        );
      } catch {
        return;
      }
    } else if (def.entityType === "minecraft:zombie_nautilus") {
      const variantBackup =
        typeof storedVariant === "string"
          ? storedVariant
          : def.entityVariant;
      if (variantBackup === "coral" || variantBackup === "default") {
        fixZombieNautilusVariantNear(player.dimension, placeAt, variantBackup);
      }
    }

    def.afterPlace?.(player.dimension, placeAt, player);

    system.runTimeout(() => {
      try {
        world.structureManager.delete(structureId);
      } catch {
        // 结构可能已被自动清理
      }
    }, 1);
  } else {
    try {
      spawnMobFromBucket(
        player.dimension,
        targetLocation,
        def,
        typeof storedVariant === "string" ? storedVariant : undefined
      );
      def.afterPlace?.(player.dimension, targetLocation, player);
    } catch {
      return;
    }
  }

  finishMobBucketPlace(player, slot, def);

  playBucketSound(player, def.emptySound, def.fallbackEmptySound);
}

function pickupMob(player, entity, def) {
  if (isOnPickupCooldown(player.id)) {
    return;
  }

  def.onPickup?.(entity);

  const slot = getMainhandSlot(player);
  if (!slot?.hasItem() || slot.typeId !== def.pickupContainer) {
    return;
  }

  if (def.canPickup && !def.canPickup(entity, player)) {
    return;
  }

  if (def.entityType === "minecraft:shulker") {
    shulkerBucketPickupIds.add(entity.id);
  }

  let structureId;
  if (bucketUsesStructureStorage(def)) {
    structureId = saveEntityToStructure(entity);
    if (!structureId) {
      return;
    }
  }

  const bucketItem = new ItemStack(def.bucketId, 1);
  if (structureId) {
    bucketItem.setDynamicProperty(STRUCTURE_KEY, structureId);
  }
  if (def.entityType === "minecraft:zombie_nautilus") {
    bucketItem.setDynamicProperty(
      VARIANT_KEY,
      getZombieNautilusVariant(entity)
    );
  }
  bucketItem.setDynamicProperty(RETURN_BUCKET_KEY, true);

  const { consumed, wasStacked } = consumeOneFromEquipmentSlot(
    slot,
    def.pickupContainer
  );
  if (!consumed) {
    if (def.entityType === "minecraft:shulker") {
      shulkerBucketPickupIds.delete(entity.id);
    }
    if (structureId) {
      try {
        world.structureManager.delete(structureId);
      } catch {
        // 忽略
      }
    }
    return;
  }

  try {
    entity.remove();
  } catch {
    if (def.entityType === "minecraft:shulker") {
      shulkerBucketPickupIds.delete(entity.id);
    }
    if (structureId) {
      try {
        world.structureManager.delete(structureId);
      } catch {
        // 忽略
      }
    }
    return;
  }

  if (wasStacked) {
    giveItemOrDrop(player, bucketItem);
  } else {
    slot.setItem(bucketItem);
  }

  setPickupCooldown(player.id);

  if (def.entityType === "minecraft:shulker") {
    setPlayerShulkerDeployed(player, false);
  }

  playBucketSound(player, def.fillSound, def.fallbackFillSound);
}

world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
  const { player, target, itemStack } = event;

  if (!itemStack) {
    return;
  }

  if (handleShulkerPearlInteract(event, player, target, itemStack)) {
    return;
  }

  if (handleShulkerCopperInteract(event, player, target, itemStack)) {
    return;
  }

  const def = getBucketDefForPickup(itemStack.typeId, target);
  if (!def) {
    return;
  }

  event.cancel = true;
  system.run(() => pickupMob(player, target, def));
});

world.beforeEvents.itemUseOn.subscribe((event) => {
  const { source: player, itemStack, block, blockFace } = event;

  const def = getBucketDefByItemId(itemStack.typeId);
  if (!def) {
    return;
  }

  event.cancel = true;
  blockPlaceTick.set(player.id, system.currentTick);

  const placeLocation = getPlaceLocationFromBlock(
    player.dimension,
    block,
    blockFace,
    def.requiresWater
  );
  system.run(() => placeMobBucket(player, placeLocation, def));
});

world.afterEvents.itemUse.subscribe((event) => {
  const { source: player, itemStack } = event;

  const def = getBucketDefByItemId(itemStack.typeId);
  if (!def) {
    return;
  }

  if (blockPlaceTick.get(player.id) === system.currentTick) {
    return;
  }

  system.run(() => placeMobBucket(player, undefined, def));
});

world.beforeEvents.playerLeave.subscribe((event) => {
  pickupCooldown.delete(event.player.id);
  placeCooldown.delete(event.player.id);
  blockPlaceTick.delete(event.player.id);
});

world.afterEvents.entityDie.subscribe((event) => {
  const entity = event.deadEntity;
  if (!entity) {
    return;
  }

  if (entity.typeId === "minecraft:player") {
    promoteStashOnPlayerDeath(entity);
    return;
  }

  handleShulkerPetDeath(entity);
});

world.afterEvents.playerSpawn.subscribe((event) => {
  if (event.initialSpawn) {
    system.run(() => reconcileShulkerDeployedFlag(event.player));
    return;
  }

  const player = event.player;
  for (const delay of [0, 10, 40, 80]) {
    system.runTimeout(() => {
      if (!isLiveEntity(player)) {
        return;
      }
      reconcileShulkerDeployedFlag(player);
      reconcileVanishItemsOnRespawn(player, { notify: delay === 0 });
    }, delay);
  }
});

system.run(() => {
  for (const player of world.getAllPlayers()) {
    reconcileShulkerDeployedFlag(player);
  }
});

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    if (!isLiveEntity(player)) {
      continue;
    }
    refreshVanishPreview(player);
    if (getPendingVanishReturn(player)) {
      tryReturnVanishCacheToShulker(player);
    }
  }
}, VANISH_CHECK_INTERVAL_TICKS);

world.afterEvents.entityHurt.subscribe((event) => {
  const hurtEntity = event.hurtEntity;

  if (hurtEntity.typeId === "minecraft:player") {
    refreshVanishPreviewOnHurt(hurtEntity);

    const damager = event.damageSource.damagingEntity;
    if (isLiveEntity(damager) && damager.typeId === "minecraft:phantom") {
      try {
        hurtEntity.addEffect("blindness", PHANTOM_BLINDNESS_TICKS, {
          amplifier: 0,
          showParticles: true,
        });
      } catch {
        // 忽略效果施加失败
      }
    }
  }
});

world.afterEvents.dataDrivenEntityTrigger.subscribe(
  (event) => {
    const { entity, eventId } = event;

    if (!isShulker(entity)) {
      return;
    }

    if (eventId === "minecraft:on_open") {
      setShulkerShellOpenState(entity, true);
      system.run(() => beginShulkerDisplayWatch(entity));
      return;
    }

    if (eventId === "minecraft:on_tame") {
      system.run(() => {
        const owner = getShulkerOwnerPlayer(entity);
        if (!isLiveEntity(owner)) {
          return;
        }

        if (playerBlocksExtraShulkerDeploy(owner, entity.id)) {
          rejectExtraShulkerTame(entity, owner, {
            notify: true,
            refundPearl: true,
          });
          return;
        }

        bindShulkerOwner(entity, owner);
        enforceSingleDeployedShulker(owner);
      });
      return;
    }

    if (eventId === "minecraft:on_close") {
      setShulkerShellOpenState(entity, false);
      system.run(() => {
        clearDisplayRetry(entity.id);
        resetDisplayOpenRoll(entity.id);
        stopShulkerDisplay(entity);
      });
      return;
    }

    if (eventId === "my_pack:on_sit") {
      markShulkerSitting(entity, true);
      return;
    }

    if (eventId === "my_pack:on_stand") {
      markShulkerSitting(entity, false);
    }
  },
  {
    entityTypes: ["minecraft:shulker"],
    eventTypes: [
      "minecraft:on_open",
      "minecraft:on_close",
      "minecraft:on_tame",
      "my_pack:on_sit",
      "my_pack:on_stand",
    ],
  }
);

world.afterEvents.entityRemove.subscribe((event) => {
  if (event.typeId === "minecraft:shulker") {
    shulkerBucketPickupIds.delete(event.removedEntityId);
    clearDisplayRetry(event.removedEntityId);
    resetDisplayOpenRoll(event.removedEntityId);
    shulkerSittingState.delete(event.removedEntityId);
    shulkerShellOpenState.delete(event.removedEntityId);
  }

  if (event.typeId !== "minecraft:shulker") {
    return;
  }

  const state = displayState.get(event.removedEntityId);
  if (!state) {
    return;
  }

  clearDisplayInterval(event.removedEntityId);
  displayState.delete(event.removedEntityId);
});

function resetPlayerPackFlags(player) {
  if (!isLiveEntity(player)) {
    return;
  }

  const key = getVanishPlayerKey(player);

  setPlayerShulkerDeployed(player, false);
  clearVanishStash(player);
  clearVanishPending(player);
  syncVanishCarryingTag(player, false);

  vanishSessionStore.delete(key);
  syncVanishLedger(player, [], false);
  vanishCacheNotifyAt.delete(key);
  vanishReturnNotifyAt.delete(key);
  vanishDepositNotifyAt.delete(key);

  for (const reason of ["deploy", "tame", "pearl", "place"]) {
    deployBlockNotifyAt.delete(`${key}:${reason}`);
  }

  if (playerOwnsLiveShulker(player)) {
    setPlayerShulkerDeployed(player, true);
  } else {
    enforceSingleDeployedShulker(player);
  }

  try {
    player.sendMessage(
      "§a[Pets] 已复位：潜影贝放出标记、消失诅咒缓存与 pending 状态"
    );
  } catch {
    // 忽略
  }
}

world.beforeEvents.chatSend?.subscribe?.((event) => {
  const trimmed = event.message.trim();
  if (
    !RESET_CHAT_COMMANDS.has(trimmed) &&
    !RESET_CHAT_COMMANDS.has(trimmed.toLowerCase())
  ) {
    return;
  }

  event.cancel = true;
  system.run(() => resetPlayerPackFlags(event.sender));
});

system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== RESET_SCRIPT_EVENT) {
    return;
  }

  const source = event.sourceEntity;
  if (source?.typeId === "minecraft:player") {
    resetPlayerPackFlags(source);
  }
});

console.warn(
  `[Pets] module v${PACK_VERSION} loaded (shulker pet + vanish cache)`
);
