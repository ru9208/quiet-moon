import { system } from "@minecraft/server";
import "./mobs.js";
import "./hunger_mobs.js";
import "./fullmoon_spawns.js";
import "./quiet_moon_breed.js";

const FoodEffects = {
  onConsume({ source }, { params }) {
    if (!Array.isArray(params)) {
      return;
    }
    for (const effect of params) {
      const chance = effect.chance == null ? 1 : effect.chance;
      if (Math.random() > chance) continue;
      if (effect.heal != null) {
        try {
          const health = source.getComponent("minecraft:health");
          if (health) {
            health.setCurrentValue(
              Math.min(health.currentValue + effect.heal, health.effectiveMax)
            );
          }
        } catch (e) {}
        continue;
      }
      if (!effect.name) continue;
      try {
        source.addEffect(effect.name, effect.duration, {
          amplifier: effect.amplifier ?? 0,
        });
      } catch (e) {}
    }
  },
};

system.beforeEvents.startup.subscribe(({ itemComponentRegistry }) => {
  itemComponentRegistry.registerCustomComponent("my_pack:food_effects", FoodEffects);
});
