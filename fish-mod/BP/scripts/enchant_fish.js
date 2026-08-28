import { world, ItemStack, EnchantmentTypes, EquipmentSlot, EntityEquippableComponent, system } from "@minecraft/server";

const PACK_VERSION = "2.1.19";

const ENCHANT_TABLE_ID = "minecraft:enchanting_table";
const WRITABLE_BOOK_ID = "minecraft:writable_book";
const BOOK_ID = "minecraft:book";
const FEATHER_ID = "minecraft:feather";
const INK_IDS = ["minecraft:ink_sac", "minecraft:glow_ink_sac"];

const FISH_TO_ENCHANT = {
    "enchant_fish:fish_protection": "protection",
    "enchant_fish:fish_blast_protection": "blast_protection",
    "enchant_fish:fish_fire_protection": "fire_protection",
    "enchant_fish:fish_projectile_protection": "projectile_protection",
    "enchant_fish:fish_feather_falling": "feather_falling",
    "enchant_fish:fish_thorns": "thorns",
    "enchant_fish:fish_respiration": "respiration",
    "enchant_fish:fish_aqua_affinity": "aqua_affinity",
    "enchant_fish:fish_depth_strider": "depth_strider",
    "enchant_fish:fish_frost_walker": "frost_walker",
    "enchant_fish:fish_soul_speed": "soul_speed",
    "enchant_fish:fish_swift_sneak": "swift_sneak",
    "enchant_fish:fish_sharpness": "sharpness",
    "enchant_fish:fish_smite": "smite",
    "enchant_fish:fish_bane_of_arthropods": "bane_of_arthropods",
    "enchant_fish:fish_knockback": "knockback",
    "enchant_fish:fish_fire_aspect": "fire_aspect",
    "enchant_fish:fish_looting": "looting",
    "enchant_fish:fish_impaling": "impaling",
    "enchant_fish:fish_loyalty": "loyalty",
    "enchant_fish:fish_channeling": "channeling",
    "enchant_fish:fish_riptide": "riptide",
    "enchant_fish:fish_power": "power",
    "enchant_fish:fish_punch": "punch",
    "enchant_fish:fish_flame": "flame",
    "enchant_fish:fish_infinity": "infinity",
    "enchant_fish:fish_piercing": "piercing",
    "enchant_fish:fish_multishot": "multishot",
    "enchant_fish:fish_quick_charge": "quick_charge",
    "enchant_fish:fish_efficiency": "efficiency",
    "enchant_fish:fish_silk_touch": "silk_touch",
    "enchant_fish:fish_fortune": "fortune",
    "enchant_fish:fish_unbreaking": "unbreaking",
    "enchant_fish:fish_luck_of_the_sea": "luck_of_the_sea",
    "enchant_fish:fish_lure": "lure",
    "enchant_fish:fish_mending": "mending",
    "enchant_fish:fish_breach": "breach",
    "enchant_fish:fish_density": "density",
    "enchant_fish:fish_wind_burst": "wind_burst",
    "enchant_fish:fish_lunge": "lunge",
    "enchant_fish:fish_binding_curse": "binding_curse",
    "enchant_fish:fish_vanishing_curse": "vanishing_curse",
};

const MAX_LEVEL = {
    protection: 4,
    blast_protection: 4,
    fire_protection: 4,
    projectile_protection: 4,
    feather_falling: 4,
    thorns: 3,
    respiration: 3,
    aqua_affinity: 1,
    depth_strider: 3,
    frost_walker: 2,
    soul_speed: 3,
    swift_sneak: 3,
    sharpness: 5,
    smite: 5,
    bane_of_arthropods: 5,
    knockback: 2,
    fire_aspect: 2,
    looting: 3,
    impaling: 5,
    loyalty: 3,
    channeling: 1,
    riptide: 3,
    power: 5,
    punch: 2,
    flame: 1,
    infinity: 1,
    piercing: 4,
    multishot: 1,
    quick_charge: 3,
    efficiency: 5,
    silk_touch: 1,
    fortune: 3,
    unbreaking: 3,
    luck_of_the_sea: 3,
    lure: 3,
    mending: 1,
    breach: 4,
    density: 5,
    wind_burst: 3,
    lunge: 3,
    binding_curse: 1,
    vanishing_curse: 1,
};

const BEDROCK_ENCHANT = {
    binding_curse: "binding",
    vanishing_curse: "vanishing",
};

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

console.warn(`[EnchantFish] module v${PACK_VERSION} loaded (@minecraft/server 1.17.0 API)`);

function toRoman(level) {
    return ROMAN[level] ?? String(level);
}

function enchantLangKey(enchantKey) {
    return `enchant.enchant_fish.${enchantKey}`;
}

function sendRawMessage(player, parts) {
    try {
        player.sendMessage({ rawtext: parts });
    } catch {
        player.sendMessage(parts.map((part) => part.text ?? part.translate ?? "").join(""));
    }
}

function sendEnchantBookMessage(player, enchantKey, level) {
    const roman = toRoman(level);
    sendRawMessage(player, [
        { text: "§a" },
        { translate: "action.enchant_fish.book_created.lead" },
        { text: " " },
        { translate: enchantLangKey(enchantKey) },
        { text: ` ${roman} ` },
        { translate: "action.enchant_fish.book_created.tail", with: [String(level)] },
    ]);
}

function sendWritableBookMessage(player, inkTypeId) {
    const inkKey =
        inkTypeId === "minecraft:glow_ink_sac"
            ? "action.enchant_fish.writable_book.ink.glow_ink_sac"
            : "action.enchant_fish.writable_book.ink.ink_sac";
    sendRawMessage(player, [
        { text: "§a" },
        { translate: "action.enchant_fish.writable_book.lead" },
        { translate: inkKey },
        { translate: "action.enchant_fish.writable_book.tail" },
    ]);
}

function getHeldEnchantFish(player) {
    const equippable = getPlayerEquippable(player);
    if (!equippable) {
        return null;
    }
    for (const slot of [EquipmentSlot.Mainhand, EquipmentSlot.Offhand]) {
        const stack = equippable.getEquipment(slot);
        if (!stack) {
            continue;
        }
        const enchantKey = FISH_TO_ENCHANT[stack.typeId];
        if (enchantKey) {
            return { enchantKey, amount: stack.amount };
        }
    }
    return null;
}

function showFishLevelHint(player) {
    const held = getHeldEnchantFish(player);
    if (!held) {
        return;
    }
    const maxLvl = MAX_LEVEL[held.enchantKey] ?? 1;
    const level = Math.min(held.amount, maxLvl);
    const roman = toRoman(level);
    player.onScreenDisplay.setActionBar({
        rawtext: [
            { translate: "action.enchant_fish.fish_level_hint.prefix" },
            { text: " " },
            { translate: enchantLangKey(held.enchantKey) },
            { text: ` ${roman}` },
        ],
    });
}

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

function getPlayerEquippable(player) {
  return (
    player.getComponent(EntityEquippableComponent.componentId) ??
    player.getComponent("equippable")
  );
}

world.afterEvents.worldInitialize.subscribe(() => {
    console.warn(`[EnchantFish] BP v${PACK_VERSION} ready (enchant table crafting)`);
});

function resolveEnchantBookInputs(mainHand, offhand) {
    if (!mainHand || !offhand) return null;
    if (mainHand.typeId !== WRITABLE_BOOK_ID) return null;

    const enchantKey = FISH_TO_ENCHANT[offhand.typeId];
    if (!enchantKey) return null;

    return {
        enchantKey,
        fishStack: offhand,
        fishSlot: EquipmentSlot.Offhand,
        bookStack: mainHand,
        bookSlot: EquipmentSlot.Mainhand,
    };
}

function findInkInInventory(player) {
    const inv = player.getComponent("inventory")?.container;
    if (!inv) return null;

    for (let slot = 0; slot < inv.size; slot++) {
        const stack = inv.getItem(slot);
        if (stack && INK_IDS.includes(stack.typeId)) {
            return { stack, slot };
        }
    }
    return null;
}

function resolveWritableBookInputs(mainHand, offhand, player) {
    if (!mainHand || !offhand) return null;
    if (mainHand.typeId !== BOOK_ID) return null;
    if (offhand.typeId !== FEATHER_ID) return null;

    const ink = findInkInInventory(player);
    if (!ink) return null;

    return {
        bookStack: mainHand,
        bookSlot: EquipmentSlot.Mainhand,
        featherStack: offhand,
        featherSlot: EquipmentSlot.Offhand,
        inkStack: ink.stack,
        inkSlot: ink.slot,
    };
}

function consumeOneFromSlot(container, slot, stack) {
    if (!container || !stack) return;
    if (stack.amount > 1) {
        stack.amount -= 1;
        container.setItem(slot, stack);
    } else {
        container.setItem(slot, undefined);
    }
}

function craftWritableBook(player, inputs) {
    const equippable = getPlayerEquippable(player);
    const inv = player.getComponent("inventory")?.container;
    if (!equippable || !inv) return;

    const { bookStack, bookSlot, featherStack, featherSlot, inkStack, inkSlot } = inputs;

    if (bookStack.amount > 1) {
        bookStack.amount -= 1;
        equippable.setEquipment(bookSlot, bookStack);
    } else {
        equippable.setEquipment(bookSlot, undefined);
    }

    if (featherStack.amount > 1) {
        featherStack.amount -= 1;
        equippable.setEquipment(featherSlot, featherStack);
    } else {
        equippable.setEquipment(featherSlot, undefined);
    }

    consumeOneFromSlot(inv, inkSlot, inkStack);

    const writable = new ItemStack(WRITABLE_BOOK_ID, 1);
    const leftover = inv.addItem(writable);
    if (leftover) {
        player.dimension.spawnItem(leftover, player.location);
    }

    sendWritableBookMessage(player, inkStack.typeId);
}

function craftEnchantedBook(player) {
    const equippable = getPlayerEquippable(player);
    if (!equippable) return;

    const mainHand = equippable.getEquipment(EquipmentSlot.Mainhand);
    const offhand = equippable.getEquipment(EquipmentSlot.Offhand);
    const inputs = resolveEnchantBookInputs(mainHand, offhand);
    if (!inputs) return;

    const { enchantKey, fishStack, fishSlot, bookStack, bookSlot } = inputs;
    const bedrockId = BEDROCK_ENCHANT[enchantKey] ?? enchantKey;
    const enchantType = EnchantmentTypes.get(bedrockId);
    if (!enchantType) {
        sendRawMessage(player, [
            { text: "§c" },
            { translate: "action.enchant_fish.unknown_enchant", with: [bedrockId] },
        ]);
        return;
    }

    const maxLvl = MAX_LEVEL[enchantKey] ?? 1;
    const level = Math.min(fishStack.amount, maxLvl);

    const book = new ItemStack("minecraft:enchanted_book", 1);
    const enchantable = book.getComponent("enchantable");
    if (!enchantable) {
        sendRawMessage(player, [{ text: "§c" }, { translate: "action.enchant_fish.book_failed" }]);
        return;
    }
    enchantable.addEnchantment({ type: enchantType, level });

    if (fishStack.amount > level) {
        fishStack.amount -= level;
        equippable.setEquipment(fishSlot, fishStack);
    } else {
        equippable.setEquipment(fishSlot, undefined);
    }

    if (bookStack.amount > 1) {
        bookStack.amount -= 1;
        equippable.setEquipment(bookSlot, bookStack);
    } else {
        equippable.setEquipment(bookSlot, undefined);
    }

    const inv = player.getComponent("inventory")?.container;
    const leftover = inv?.addItem(book);
    if (leftover) {
        player.dimension.spawnItem(leftover, player.location);
    }

    sendEnchantBookMessage(player, enchantKey, level);
}

function handleEnchantTableBefore(event, player, itemStackFromEvent) {
    if (event.block.typeId !== ENCHANT_TABLE_ID) return;
    if (!isLiveEntity(player)) return;

    const equippable = getPlayerEquippable(player);
    const mainHand = itemStackFromEvent ?? equippable?.getEquipment(EquipmentSlot.Mainhand);
    const offhand = equippable?.getEquipment(EquipmentSlot.Offhand);

    const enchantInputs = resolveEnchantBookInputs(mainHand, offhand);
    const writableInputs = !enchantInputs
        ? resolveWritableBookInputs(mainHand, offhand, player)
        : null;
    if (!enchantInputs && !writableInputs) return;

    event.cancel = true;
    system.run(() => {
        if (!isLiveEntity(player)) return;
        if (enchantInputs) {
            craftEnchantedBook(player);
            return;
        }
        craftWritableBook(player, writableInputs);
    });
}

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    handleEnchantTableBefore(event, event.player);
});

world.beforeEvents.itemUseOn.subscribe((event) => {
    handleEnchantTableBefore(event, event.source, event.itemStack);
});

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        if (!isLiveEntity(player)) {
            continue;
        }
        showFishLevelHint(player);
    }
}, 10);
