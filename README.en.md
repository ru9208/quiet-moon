# Quiet Moon

[中文](README.md) | **English**

Two Minecraft Bedrock add-ons. They are designed to be used together.

| Pack | Version | Engine | Release file |
|------|---------|--------|----------------|
| Food | **v1.0.48** | 1.21.130+ | `Food_v1.0.48.mcaddon` |
| Enchant Fish & Pets | **v2.1.19** | 1.21.0+ | `Pets_EnchantFish_v2.1.19.mcaddon` |

## Author

- Author: **ru9208**
- Bilibili intro video: **(add the link after upload)**

This repo is the canonical source (history + Releases). If GitHub is slow, use the cloud-drive link in the Bilibili description.

## Download

Get `.mcaddon` files from **Releases**. Do not drop the source folders into Minecraft. Disable old packs before importing. Villager trades apply to **newly spawned** villagers and wandering traders.

---

## Food pack changes

### Moon and spawns

- On a quiet-moon day (Nether and End included), **new mobs stop spawning**. Combat difficulty stays; existing mobs are not wiped.
- A full moon (phase 0, all day) turns spawning back on and restores your saved Easy / Normal / Hard.

### Hunger and survival pace

- Quiet moon: meat animals (**cows, pigs, sheep, chickens, rabbits, hoglins**, etc.) **cannot breed**. Full moon is the harvest window.
- Skip the night in a bed: wake with **saturation cleared** and **Hunger I for 120 seconds**.
- Adult chickens lay about every **20–40 minutes** (about 4× vanilla).

### Mobs

- **Skeletons** and **strays** still shoot; **phantoms** still come; **illagers** stay hostile.
- **Zombies, husks, drowned, and zombie villagers** hunt you only at hunger **≤3 shanks (6 food)**. Zombie villagers fight back. They still chase villagers, witches, illagers, and ravagers. Conversion only from a **zombie-family melee** kill (50% Normal / 100% Hard).
- **Creepers** aggro only when a nearby player **sprints**.
- **Spiders** attack only in **low light**.
- **Phantoms** inflict about **3 seconds of blindness**, with softer damage.
- **Piglin reputation**: start untrusting. Admire gold or kill wither skeletons / zombified piglins to raise it. High rep skips chest / gold-gear / gold-block rage. Hitting costs rep; a kill costs more; death resets it.
- **Magma cubes** do not chase; contact damage and fire on players are cancelled.
- **Ghasts** shoot only if the main hand is a **bow, crossbow, or trident**. Unarmed melee does not draw aggro; they **retaliate** if hit.
- Most Nether mobs (blazes, wither skeletons, etc.) no longer treat the player as default prey.
- **Illagers** and **witches** flee zombies; zombies attack them too.

### Food and stews

- **10 potion stews**: potion + bowl + cooked meat + a vegetable. Instant **5-heart** heal, **20 hunger**, solid saturation. Most buffs ~**8 min**; Down Feather slow-falling ~**4 min**; Turtle Shell resistance/slowness ~**20 s**. Rejuvenating Honeyroot is crafted with Regeneration but **only instant-heals**.
- Crafted stews and cooked meat **do not stack**. Bread, baked potatoes, etc. cap at **16**. Crops and snacks have low saturation. **Pufferfish stack to 64**.

| Stew | Seasoning | Effect |
|------|-----------|--------|
| Gale Chicken | Swiftness | Heal + Speed ~8 min |
| Brute Beef | Strength | Heal + Strength ~8 min |
| Honeyroot | Regeneration | **Heal only** |
| Turtle Shell | Turtle Master | Heal + Resistance + Slowness ~20 s |
| Nether Pork | Fire Resistance | Heal + Fire Res ~8 min |
| Seabreath | Water Breathing | Heal + Water Breathing ~8 min |
| Nightlow Salmon | Night Vision | Heal + Night Vision ~8 min |
| Veilsh Rabbit | Invisibility | Heal + Invisibility ~8 min |
| Springberry | Leaping | Heal + Jump Boost ~8 min |
| Down Feather | Slow Falling | Heal + Slow Falling ~4 min |

---

## Enchant Fish & Pets changes

### Fishing

- Enchanted books removed from fishing; treasure slot is **ender pearls**.
- Top weights: junk 25, pearls 5, vanilla fish 65, enchant fish 5. Day/night pools, equal weight, **no overlap**.
- **Cod and salmon only on a full-moon day**. On a quiet moon, biomes without tropical/puffer fill that 65% with junk; **enchant fish stay at 5%**.
- **42 enchant fish** (41 in day/night pools; **Power** is a fletcher buy, not in biome pools). **Mending and Looting are End-only**.

| Biome | Day | Night |
|-------|-----|-------|
| Freshwater | Lure, Luck of the Sea, Knockback | Depth Strider, Unbreaking |
| The End | Mending, Looting | Mending, Looting |
| Desert | Fire Aspect, Flame | Punch |
| Jungle | Thorns | Bane of Arthropods |
| Swamp | Sharpness | Feather Falling |
| Arctic Y>62 | Frost Walker, Projectile Prot. | Silk Touch |
| Mountain Y>62 | Protection, Breach | Wind Burst |
| Roofed Forest | Quick Charge | Piercing |
| Cherry Grove | Multishot | Lunge |
| Sulfur Caves | Fire Protection | Blast Protection |
| Ocean | Riptide, Respiration, Impaling | Loyalty, Channeling, Infinity |
| Caves | Smite, Efficiency | Fortune |
| Dripstone | Aqua Affinity | Curse of Binding |
| Lush Caves | Swift Sneak | Density |
| Deep Dark | Soul Speed | Curse of Vanishing |

### Enchanting table

- **Writable book**: book + feather + ink sac (glow ink works), crafted at the table.
- **Enchanted book**: writable book in the main hand, enchant fish off-hand, at the table. Stack size = level (three Protection fish = Protection III).

### Villagers

- **No random pools, no leveling**. Each profession buys a fixed set of enchant fish; emeralds buy logs/stems and brewing mats. Cartographers keep explorer maps.

| Profession | Buys |
|------------|------|
| Farmer | Loyalty, Fortune, Lure |
| Toolsmith | Quick Charge, Efficiency, Silk Touch, Unbreaking |
| Cartographer | Depth Strider, Channeling |
| Librarian | Swift Sneak, Infinity, Mending |
| Fletcher | Power, Punch, Flame, Multishot |
| Weaponsmith | Sharpness, Smite, Fire Aspect, Lunge |
| Mason | Riptide, Breach, Density |
| Shepherd | Frost Walker, Bane of Arthropods, Wind Burst |
| Leatherworker | Feather Falling, Thorns |
| Fisherman | Respiration, Aqua Affinity, Impaling, Luck of the Sea |
| Cleric | Soul Speed, Binding, Vanishing |
| Butcher | Knockback, Looting, Piercing |
| Armorer | Protection, Blast / Fire / Projectile Protection |

Wandering traders buy random enchant fish; 2 emeralds may roll a shulker or zombified-nautilus bucket.

### Pets and buckets

- Bucketable: squid, glow squid, nautilus, zombified nautilus (coral variant), tamed shulkers. Squid breed with **nautilus shells**.
- Tamed nautilus come to a **water/fish bucket**; wild adults only care about pufferfish. The custom nautilus bucket is for carrying. Axolotls also come to a water bucket.
- **Shulkers**: tame with ender pearls, stay underwater, one deployed per player. Back up 3+ blocks after opening to display. **Dyes only recolor**. Sitting, no threats: **oxidized copper** pulls a random slot. Vanishing gear is cached on death and stored at **your** shulker; items picked up after death are not wiped.

---

## License

All rights reserved. Personal use in Minecraft is allowed. Do not re-upload to MCPEDL, CurseForge, or other sites without permission. Keep author credit and the Bilibili link.
