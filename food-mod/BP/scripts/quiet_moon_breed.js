import { world, system } from "@minecraft/server";
import { isQuietMoon } from "./fullmoon_spawns.js";

/** Meat-dropping animals only — breed feeds blocked during quiet (non-full) moon. */
const MEAT_ANIMAL_BREED_FEEDS = {
  "minecraft:cow": ["minecraft:wheat"],
  "minecraft:mooshroom": ["minecraft:wheat"],
  "minecraft:pig": [
    "minecraft:carrot",
    "minecraft:potato",
    "minecraft:beetroot",
  ],
  "minecraft:sheep": ["minecraft:wheat"],
  "minecraft:goat": ["minecraft:wheat"],
  "minecraft:chicken": [
    "minecraft:wheat_seeds",
    "minecraft:melon_seeds",
    "minecraft:pumpkin_seeds",
    "minecraft:beetroot_seeds",
    "minecraft:torchflower_seeds",
    "minecraft:pitcher_pod",
  ],
  "minecraft:rabbit": [
    "minecraft:carrot",
    "minecraft:golden_carrot",
    "minecraft:dandelion",
    "minecraft:yellow_flower",
  ],
  "minecraft:hoglin": ["minecraft:crimson_fungus"],
};

const BLOCK_MESSAGE =
  "§7非满月无法繁殖肉食动物。§8[Quiet moon — meat animals cannot breed]";

function isMeatAnimalBreedFeed(animalTypeId, itemTypeId) {
  const feeds = MEAT_ANIMAL_BREED_FEEDS[animalTypeId];
  if (!feeds || !itemTypeId) {
    return false;
  }
  return feeds.includes(itemTypeId);
}

world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
  if (!isQuietMoon()) {
    return;
  }
  const itemTypeId = event.itemStack?.typeId;
  if (!itemTypeId) {
    return;
  }
  const target = event.target;
  if (!target?.isValid) {
    return;
  }
  if (!isMeatAnimalBreedFeed(target.typeId, itemTypeId)) {
    return;
  }
  event.cancel = true;
  const player = event.player;
  system.run(() => {
    if (!player?.isValid) {
      return;
    }
    try {
      player.onScreenDisplay.setActionBar(BLOCK_MESSAGE);
    } catch {
      player.sendMessage(BLOCK_MESSAGE);
    }
  });
});
