# Quiet Moon

两个 Minecraft Bedrock 附加包，建议一起使用。

Two Bedrock add-ons. They are designed to be used together.

| 包 | 版本 | 引擎 | 发布文件 |
|----|------|------|----------|
| 食物包 / Food | **v1.0.48** | 1.21.130+ | `Food_v1.0.48.mcaddon` |
| 附魔鱼与宠物 / Enchant Fish & Pets | **v2.1.19** | 1.21.0+ | `Pets_EnchantFish_v2.1.19.mcaddon` |

## 作者 / Author

- 作者 / Author: **ru9208**
- Bilibili 介绍视频 / Intro video: **（发布后把链接填在这里）**

本仓库是发布正本（版本历史 + Releases）。国内玩家下载若 GitHub 较慢，请以视频简介里的网盘为准。

This repo is the canonical source (history + Releases). If GitHub is slow, use the cloud-drive link in the Bilibili description.

## 下载 / Download

请到右侧 **Releases** 下载 `.mcaddon`，不要直接克隆源码进游戏。旧世界请先关掉旧包再导入。村民交易写在新生成的村民身上。

Get `.mcaddon` files from **Releases**. Do not drop the source folders into Minecraft. Disable old packs before importing. Villager trades apply to **newly spawned** villagers and wandering traders.

---

## 食物包改进 / Food pack changes

### 满月与刷怪 / Moon and spawns

- 非满月整天（含下界、末地）**停止新刷怪**；战斗难度保持，场上已有的怪不会被清掉。满月（月相 0，整天）重新开刷，并恢复你保存的简单 / 普通 / 困难。
- On a quiet-moon day (Nether and End included), **new mobs stop spawning**. Combat difficulty stays; existing mobs are not wiped. A full moon (phase 0, all day) turns spawning back on and restores your saved Easy / Normal / Hard.

### 饥饿与生存节奏 / Hunger and survival pace

- 非满月：**牛、猪、羊、鸡、兔、疣猪兽** 等肉食动物无法繁殖。满月才是出栏窗口。
- Quiet moon: meat animals (**cows, pigs, sheep, chickens, rabbits, hoglins**, etc.) **cannot breed**. Full moon is the harvest window.
- 睡过跳夜：醒来 **清空饱和度**，并获得 **饥饿 I 共 120 秒**。
- Skip the night in a bed: wake with **saturation cleared** and **Hunger I for 120 seconds**.
- 成年鸡下蛋约 **20–40 分钟** 一枚（原版约 4 倍间隔）。
- Adult chickens lay about every **20–40 minutes** (about 4× vanilla).

### 怪物 / Mobs

- **骷髅、流浪者** 仍会主动射击；**幻翼** 仍会来找你；**灾厄村民** 默认敌对。
- **Skeletons** and **strays** still shoot; **phantoms** still come; **illagers** stay hostile.
- **僵尸、尸壳、溺尸、僵尸村民**：饥饿 **≤3 格（6 点）** 才追玩家。僵尸村民被打会还手；仍追村民，也追女巫、灾厄村民、劫掠兽。女巫和灾厄村民只有被 **僵尸族近战咬死** 才会转化（普通 50%，困难 100%）。
- **Zombies, husks, drowned, zombie villagers** hunt you only at hunger **≤3 shanks (6 food)**. Zombie villagers fight back. They still chase villagers, witches, illagers, and ravagers. Conversion only from a **zombie-family melee** kill (50% Normal / 100% Hard).
- **苦力怕**：附近有玩家 **冲刺** 才被激怒。
- **Creepers** aggro only when a nearby player **sprints**.
- **蜘蛛**：只在 **亮度过低** 时攻击。
- **Spiders** attack only in **low light**.
- **幻翼**：命中约 **3 秒失明**，伤害更温和。
- **Phantoms** inflict about **3 seconds of blindness**, with softer damage.
- **猪灵声望**：默认不信任。丢金器让它欣赏、击杀凋灵骷髅或僵尸猪灵可提升；开箱 / 不穿金 / 破坏金块在声望够高时不群殴。先动手掉声望，打死掉更多；玩家死亡重置。
- **Piglin reputation**: start untrusting. Admire gold or kill wither skeletons / zombified piglins to raise it. High rep skips chest/gold-gear/gold-block rage. Hitting costs rep; a kill costs more; death resets it.
- **岩浆怪** 不追玩家；对玩家的接触伤害和着火取消。
- **Magma cubes** do not chase; contact damage and fire on players are cancelled.
- **恶魂**：主手 **弓 / 弩 / 三叉戟** 才主动喷火；空手不主动打，挨打会还手。
- **Ghasts** shoot only if the main hand is a **bow, crossbow, or trident**. Unarmed melee does not draw aggro; they **retaliate** if hit.
- 下界多数怪物（烈焰人、凋灵骷髅等）不再把玩家当默认猎物。
- Most Nether mobs (blazes, wither skeletons, etc.) no longer treat the player as default prey.
- **灾厄村民、女巫** 见僵尸会跑；僵尸也会打他们。
- **Illagers** and **witches** flee zombies; zombies attack them too.

### 食物与炖汤 / Food and stews

- **10 种药水炖汤**：药水 + 碗 + 熟肉 + 蔬菜。瞬回 **五颗心**、**20 饥饿**、较高饱和。多数增益约 **8 分钟**；浮羽炖缓降约 **4 分钟**；神龟甲汤抗性/缓慢约 **20 秒**。回春蜜根汤用再生药水当调料，吃下去 **只有瞬回、没有再生**。
- **10 potion stews**: potion + bowl + cooked meat + a vegetable. Instant **5-heart** heal, **20 hunger**, solid saturation. Most buffs ~**8 min**; Down Feather slow-falling ~**4 min**; Turtle Shell resistance/slowness ~**20 s**. Rejuvenating Honeyroot is crafted with Regeneration but **only instant-heals**.
- 炖汤与熟肉 **不可堆叠**；面包、烤土豆等上限 **16**；作物和零食饱和偏低。**河豚可堆叠 64**。
- Crafted stews and cooked meat **do not stack**. Bread, baked potatoes, etc. cap at **16**. Crops and snacks have low saturation. **Pufferfish stack to 64**.

| 炖汤 | 调料 | 效果 | Stew | Seasoning | Effect |
|------|------|------|------|-----------|--------|
| 疾风鸡汤 | 迅捷 | 瞬回 + 速度 ~8 min | Gale Chicken | Swiftness | Heal + Speed |
| 蛮力炖 | 力量 | 瞬回 + 力量 ~8 min | Brute Beef | Strength | Heal + Strength |
| 回春蜜根汤 | 再生 | **仅瞬回** | Honeyroot | Regeneration | **Heal only** |
| 神龟甲汤 | 神龟 | 瞬回 + 抗性 + 缓慢 ~20 s | Turtle Shell | Turtle Master | Heal + Res + Slow |
| 下界猪排锅 | 抗火 | 瞬回 + 抗火 ~8 min | Nether Pork | Fire Res | Heal + Fire Res |
| 海息寒汤 | 水肺 | 瞬回 + 水肺 ~8 min | Seabreath | Water Breathing | Heal + Water Breathing |
| 夜视鲑鱼汤 | 夜视 | 瞬回 + 夜视 ~8 min | Nightlow Salmon | Night Vision | Heal + Night Vision |
| 隐踪兔汤 | 隐身 | 瞬回 + 隐身 ~8 min | Veilsh Rabbit | Invisibility | Heal + Invisibility |
| 轻身莓兔盅 | 跳跃 | 瞬回 + 跳跃 ~8 min | Springberry | Leaping | Heal + Jump Boost |
| 浮羽炖 | 缓降 | 瞬回 + 缓降 ~4 min | Down Feather | Slow Falling | Heal + Slow Falling |

---

## 附魔鱼与宠物改进 / Enchant Fish & Pets changes

### 钓鱼 / Fishing

- 去掉钓上的附魔书；宝藏槽改为 **100% 末影珍珠**。
- Enchanted books removed from fishing; treasure slot is **ender pearls**.
- 顶层权重：垃圾 25、珍珠 5、原版鱼 65、附魔鱼 5。昼夜分池，同池等权，**白天与夜间鱼种不重叠**。
- Top weights: junk 25, pearls 5, vanilla fish 65, enchant fish 5. Day/night pools, equal weight, **no overlap**.
- **鳕鱼 / 鲑鱼仅满月整天可钓**。非满月若该群系没有热带鱼/河豚，那 65% 用垃圾占位；**附魔鱼仍是 5%**。
- **Cod and salmon only on a full-moon day**. Quiet moon: biomes without tropical/puffer fill that 65% with junk; **enchant fish stay at 5%**.
- **42 种附魔鱼**（昼夜池 41 种；**力量** 由制箭师收购，当前不进钓鱼池）。**经验修补、抢夺仅末地**。
- **42 enchant fish** (41 in day/night pools; **Power** is a fletcher buy, not in biome pools). **Mending and Looting are End-only**.

| 生态 | 白天 | 夜间 | Biome | Day | Night |
|------|------|------|-------|-----|-------|
| 淡水 | 饵钓、海之眷顾、击退 | 深海探索者、耐久 | Freshwater | Lure, Luck of the Sea, Knockback | Depth Strider, Unbreaking |
| 末地 | 经验修补、抢夺 | 经验修补、抢夺 | The End | Mending, Looting | Mending, Looting |
| 沙漠 | 火焰附加、火矢 | 冲击 | Desert | Fire Aspect, Flame | Punch |
| 丛林 | 荆棘 | 节肢杀手 | Jungle | Thorns | Bane of Arthropods |
| 沼泽 | 锋利 | 摔落保护 | Swamp | Sharpness | Feather Falling |
| 寒带 Y>62 | 霜冻行者、弹射物保护 | 精准采集 | Arctic Y>62 | Frost Walker, Projectile Prot. | Silk Touch |
| 山地 Y>62 | 保护、破甲 | 风爆 | Mountain Y>62 | Protection, Breach | Wind Burst |
| 黑森林 | 快速装填 | 穿透 | Roofed Forest | Quick Charge | Piercing |
| 樱花树林 | 多重射击 | 突进 | Cherry Grove | Multishot | Lunge |
| 硫磺洞穴 | 火焰保护 | 爆炸保护 | Sulfur Caves | Fire Protection | Blast Protection |
| 海洋 | 激流、水下呼吸、穿刺 | 忠诚、引雷、无限 | Ocean | Riptide, Respiration, Impaling | Loyalty, Channeling, Infinity |
| 普通洞穴 | 亡灵杀手、效率 | 时运 | Caves | Smite, Efficiency | Fortune |
| 溶洞 | 水下速掘 | 绑定诅咒 | Dripstone | Aqua Affinity | Curse of Binding |
| 繁茂洞穴 | 迅捷潜行 | 密度 | Lush Caves | Swift Sneak | Density |
| 深暗之域 | 灵魂疾行 | 消失诅咒 | Deep Dark | Soul Speed | Curse of Vanishing |

### 附魔台 / Enchanting table

- **书与笔**：书 + 羽毛 + 墨囊（荧光墨囊也可），在附魔台合成。
- **Writable book**: book + feather + ink sac (glow ink works), at the table.
- **附魔书**：主手书与笔、副手附魔鱼，对着附魔台。条数 = 等级（三条保护鱼 = 保护 III）。
- **Enchanted book**: writable book main-hand, enchant fish off-hand. Stack size = level (three Protection fish = Protection III).

### 村民 / Villagers

- **无随机交易池、无等级**。各职业固定收购对应附魔鱼；绿宝石换建材（原木或菌柄）和炼药材料。制图师保留探索地图。
- **No random pools, no leveling**. Each profession buys a fixed set of enchant fish; emeralds buy logs/stems and brewing mats. Cartographers keep explorer maps.

| 职业 | 收购 | Profession | Buys |
|------|------|------------|------|
| 农民 | 忠诚、时运、饵钓 | Farmer | Loyalty, Fortune, Lure |
| 工具匠 | 快速装填、效率、精准采集、耐久 | Toolsmith | Quick Charge, Efficiency, Silk Touch, Unbreaking |
| 制图师 | 深海探索者、引雷 | Cartographer | Depth Strider, Channeling |
| 图书管理员 | 迅捷潜行、无限、经验修补 | Librarian | Swift Sneak, Infinity, Mending |
| 制箭师 | 力量、冲击、火矢、多重射击 | Fletcher | Power, Punch, Flame, Multishot |
| 武器匠 | 锋利、亡灵杀手、火焰附加、突进 | Weaponsmith | Sharpness, Smite, Fire Aspect, Lunge |
| 石匠 | 激流、破甲、密度 | Mason | Riptide, Breach, Density |
| 牧羊人 | 霜冻行者、节肢杀手、风爆 | Shepherd | Frost Walker, Bane, Wind Burst |
| 皮匠 | 摔落保护、荆棘 | Leatherworker | Feather Falling, Thorns |
| 渔夫 | 水下呼吸、水下速掘、穿刺、海之眷顾 | Fisherman | Respiration, Aqua Affinity, Impaling, Luck of the Sea |
| 牧师 | 灵魂疾行、绑定诅咒、消失诅咒 | Cleric | Soul Speed, Binding, Vanishing |
| 屠夫 | 击退、抢夺、穿透 | Butcher | Knockback, Looting, Piercing |
| 盔甲匠 | 保护、爆炸保护、火焰保护、弹射物保护 | Armorer | Protection, Blast / Fire / Projectile Prot. |

流浪商人随机收附魔鱼；2 绿宝石有机会出潜影贝桶 / 僵尸鹦鹉螺桶。

Wandering traders buy random enchant fish; 2 emeralds may roll a shulker or zombified-nautilus bucket.

### 宠物与桶装 / Pets and buckets

- 可桶装：墨鱼、发光墨鱼、鹦鹉螺、僵尸鹦鹉螺（含珊瑚变种）、驯服潜影贝。墨鱼用 **鹦鹉螺壳** 繁殖。
- Bucketable: squid, glow squid, nautilus, zombified nautilus (coral variant), tamed shulkers. Squid breed with **nautilus shells**.
- 驯服鹦鹉螺认 **水桶 / 鱼桶**；野生成体只认河豚。自定义鹦鹉螺桶用于装载。蝾螈也会被水桶吸引。
- Tamed nautilus come to a **water/fish bucket**; wild adults only care about pufferfish. The custom nautilus bucket is for carrying. Axolotls also come to a water bucket.
- **潜影贝**：末影珍珠驯服，可待水下，每玩家同时只放出一只。开壳后后退 3 格以上才展示背包。**染料只改色**。坐下无威胁时用 **氧化铜块** 随机取出一格。消失诅咒装备死亡后缓存，靠近自己的潜影贝才存入；死后新捡到的不会被清掉。
- **Shulkers**: tame with ender pearls, stay underwater, one deployed per player. Back up 3+ blocks after opening to display. **Dyes only recolor**. Sitting, no threats: **oxidized copper** pulls a random slot. Vanishing gear is cached on death and stored at **your** shulker; items picked up after death are not wiped.

---

## 许可 / License

保留版权。可在 Minecraft 中个人使用。未经允许请勿二次上传到 MCPEDL、CurseForge 等平台。转载请保留作者署名与 B 站链接。

All rights reserved. Personal use in Minecraft is allowed. Do not re-upload without permission. Keep author credit and the Bilibili link.
