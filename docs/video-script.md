已按 **食物包 v1.0.48** 与 **附魔鱼/宠物包 v2.1.19** 的实际实现，重写并优化视频台词。

相对 v1.0.37 / v2.1.13 稿的主要修正：

- 非满月是 **关闭新刷怪**（三维度 `doMobSpawning`），**不是**把难度改成和平；满月才重新开刷并沿用你保存的战斗难度
- 满月判定是 **整天**（月相 0，约第 0 / 8 / 16… 天），不是「只有晚上」
- **非满月不能繁殖肉食动物**；睡过跳夜会 **清饱和 + 饥饿 I 120 秒**
- 僵尸村民 **会按饥饿追人、被打会还手**
- 岩浆怪 **接触伤害与着火对玩家取消**
- 恶魂：**弓 / 弩 / 三叉戟**才主动喷火，挨打会还手
- 附魔鱼 **42 种**（昼夜池 41 种；力量鱼走制箭师，当前不进钓鱼池）
- 鳕鱼 / 鲑鱼 **仅满月**可钓；非满月该 65% 用垃圾占位，附魔鱼仍 5%
- 宝藏槽是 **末影珍珠**；神龟汤增益约 **20 秒**；缓降汤约 **4 分钟**
- 潜影贝染料 **只改色**；取出用 **氧化铜块**
- 鹦鹉螺：驯服后认 **水桶 / 鱼桶**，野生只认河豚；自定义桶用于装载
- 原稿蜘蛛繁育仍未实现，已删

---

# My Pack 世界规则 · 视频台词（中英字幕版）

> 格式：`中文旁白` / `English subtitle`  
> 版本：Food **1.0.48** · Enchant Fish & Pets **2.1.19**  
> 引擎：食物包 **1.21.130+** · 鱼/宠物包 **1.21.0+**

---

## 一、开场 · 为什么要改规则

**CN**  
Minecraft 原版最大的遗憾，是各系统彼此过于孤立——钓鱼、附魔、炼药、村民、怪物，各玩各的。  
更糟的是，大部分敌对生物只会无脑冲脸；基岩版的刷怪机制又把这件事放大了。雪夜里，你常常不敢出门。

**EN**  
Vanilla Minecraft’s biggest flaw is how disconnected its systems feel—fishing, enchanting, brewing, villagers, and mobs barely talk to each other.  
Worse, most hostiles only know one move: rush the player. Bedrock spawning makes that louder. On a snowy night, you often don’t dare step outside.

---

**CN**  
我想要的是：像创造模式一样安静、自由，又能保留生存的乐趣。  
所以不如自己动手，写一套属于自己的世界规则。

**EN**  
I wanted the calm freedom of Creative—without losing the feeling of Survival.  
So I wrote my own world rules.

---

## 二、怪物与饥饿 · Mobs & Hunger

**CN**  
生存感，我认为最核心的就是 **怪物** 和 **饥饿**。  
但怪物不必是硬控你的捣蛋鬼。它们更应该营造 **氛围**，而不是在你装备齐全时反复打断你、反复刷怪、反复清场——还不如打硫磺史莱姆出气包有反馈。

**EN**  
For me, survival comes down to **mobs** and **hunger**.  
Mobs shouldn’t be hard-control gremlins. They should set **atmosphere**, not interrupt you after you’re already geared up. Endless spawn-and-clear loops feel worse than punching a sulfur slime for feedback.

---

**CN**  
因此默认情况下，世界会先安静下来——除非你干了件「大事」，或等到满月。  
**非满月整天**（含下界、末地），世界 **停止新刷怪**；你设定的战斗难度还在，场上已有的怪也不会被清掉。  
**满月升起**，刷怪重新打开，难度回到你保存的简单 / 普通 / 困难。这是「攒物资、熬过冬天」的节奏，不是把世界锁死成和平。

**EN**  
By default, the world stays quiet—unless you’ve done something big, or the moon is full.  
On a **non-full-moon day** (Nether and End included), **new mobs stop spawning**. Your combat difficulty stays; mobs already in the world are not wiped.  
When the **full moon** rises, spawning turns back on, and difficulty returns to your saved Easy / Normal / Hard. It’s “stockpile and survive the winter”—not a permanent Peaceful lock.

---

### 关于怪物 · About Mobs

**CN**  
**骷髅** 和 **流浪者** 仍会主动射击——总得留一点进攻性，不然太像创造模式了。  
**幻翼** 也仍会来找你。  
**灾厄村民** 默认敌对：毕竟是你把袭击引到村里的。

**EN**  
**Skeletons** and **strays** still shoot—you need some bite, or it’s basically Creative.  
**Phantoms** still come for you.  
**Illagers** stay hostile: *you* brought the raid to the village.

---

**CN**  
**僵尸、尸壳、溺尸、僵尸村民**：只有饥饿度 **≤3 格（6 点）** 时才会追玩家——和饥饿系统挂钩，像幻翼在提醒你别通宵。  
僵尸村民被打会还手。他们仍会追村民，也追女巫、灾厄村民和劫掠兽。  
被 **僵尸族近战咬死** 的女巫和灾厄村民，才会按难度转化成僵尸村民（普通 50%，困难 100%）；坠落、火、玩家击杀不会转化。

**EN**  
**Zombies, husks, drowned, and zombie villagers** hunt you only when hunger is **≤3 shanks (6 food points)**—tied to hunger, like phantoms telling you to stop pulling all-nighters.  
Zombie villagers fight back if hit. They still chase villagers, and also witches, illagers, and ravagers.  
Witches and illagers convert only if a **zombie-family melee** kill finishes them (50% on Normal, 100% on Hard). Falls, fire, and player kills do not convert.

---

**CN**  
**苦力怕**：附近有玩家 **冲刺** 才会被激怒——奔跑不再是规避一切的万能键。  
**蜘蛛**：只在 **亮度过低** 时攻击；插火把，或副手举火把（基岩可加光源模组），就能避开战斗。  
**幻翼**：命中附加约 **3 秒失明**，伤害更温和——氛围有了即可。

**EN**  
**Creepers** only aggro when a nearby player **sprints**—so running isn’t a universal escape button.  
**Spiders** attack only in **low light**; place a torch, or hold one off-hand (or use a light mod on Bedrock).  
**Phantoms** inflict about **3 seconds of blindness**, with softer damage—creepy atmosphere, less brutal pressure.

---

**CN**  
**猪灵** 加了 **声望**。默认不太信任你；丢金锭等金器让它欣赏、击杀凋灵骷髅或僵尸猪灵，可以拉高声望。  
声望够高，开箱子、不穿金、破坏金块都不会被群殴——除非你先动手。打它会掉声望，打死掉更多；你自己死亡则声望重置。  
**岩浆怪** 不追玩家，踩上去的接触伤害和着火也对玩家取消。  
**恶魂**：只有主手是 **弓、弩或三叉戟** 时才主动喷火；空手近战不主动打，但挨打会还手。收起远程武器后会重新选目标。  
下界多数怪物（烈焰人、凋灵骷髅等）不再把玩家当默认猎物，材料好收集多了。

**EN**  
**Piglins** use **reputation**. They start untrusting. Drop gold for them to admire, or kill wither skeletons / zombified piglins, to raise it.  
High enough rep means no mob rage for opening chests, skipping gold gear, or breaking gold blocks—unless you hit first. Hitting costs rep; a kill costs more; your death resets it.  
**Magma cubes** won’t chase you, and their contact damage and fire on players are cancelled.  
**Ghasts** only shoot when your main hand is a **bow, crossbow, or trident**. Unarmed melee doesn’t draw aggro, but they **retaliate** if hit. Put the ranged weapon away and they reselect.  
Most Nether mobs (blazes, wither skeletons, and so on) no longer treat the player as default prey, so ingredients are easier to farm.

---

**CN**  
为了氛围，**灾厄村民** 和 **女巫** 会像村民一样看见僵尸就跑；僵尸也会攻击他们。  
你的村民朋友真的想被入侵吗？

**EN**  
For atmosphere, **illagers** and **witches** flee zombies like villagers do; zombies attack them too.  
Did your villager friends ask for that raid?

---

## 三、饥饿与食物 · Hunger & Food

**CN**  
回到「系统缺少联系」——把 **炼药** 和 **食物** 绑在一起，是个很好的切入点。  
非满月还多了一层：**牛、猪、羊、鸡、兔、疣猪兽** 等肉食动物无法繁殖。满月才是出栏窗口。  
成年鸡下蛋也变慢了，大约 **20 到 40 分钟** 一枚。  
若你睡过跳夜：醒来会 **清空饱和度**，并获得 **饥饿 I 共 120 秒**——床不是无限免费的按钮。

**EN**  
Back to disconnected systems—linking **brewing** and **food** was an obvious fix.  
Quiet moons add another layer: **meat animals**—cows, pigs, sheep, chickens, rabbits, hoglins, and the rest—**cannot breed**. Full moon is the harvest window.  
Adult chickens lay slower too: about **20 to 40 minutes** per egg.  
Skip the night in a bed: you wake with **saturation cleared** and **Hunger I for 120 seconds**. Sleep isn’t a free skip button.

---

**CN**  
我添加了 **10 种定制炖汤**，每种对应一种 **增益药水** 配方：对应药水 + 碗 + 熟肉 + 一种蔬菜——又和 **种植** 挂钩。  
药水在这里就是 **调料**。  
食用后：**瞬间恢复五颗心**（对基岩不能快速回血特别友好），外加 **20 点饥饿与较高饱和**，以及对应药水效果。  
多数增益约 **8 分钟**；**浮羽炖** 缓降约 **4 分钟**；**神龟甲汤** 的抗性与缓慢约 **20 秒**（接近原版神龟药水）。  
**回春蜜根汤** 用再生药水当调料，但吃下去 **只有瞬回，没有再生效果**。  
合成炖汤 **不可堆叠**；**熟肉也不可堆叠**——家里备 64 块熟牛排，生存就废了。面包、烤土豆等部分食物上限 **16**。作物和零食饱和偏低，贯彻 **饱一顿**，而不是边跑边吃。  
**河豚可堆叠 64**，方便炼药。

**EN**  
I added **10 custom stews**, each tied to a **beneficial potion**: that potion + bowl + cooked meat + a vegetable—linking **farming** too.  
Potions are the **seasoning**.  
Each serving: **instant 5-heart heal** (great on Bedrock’s slow regen), **20 hunger plus solid saturation**, and the matching buff.  
Most buffs last about **8 minutes**. **Down Feather Stew** slow-falling is about **4 minutes**. **Turtle Shell Stew** resistance and slowness last about **20 seconds**—close to vanilla Turtle Master.  
**Rejuvenating Honeyroot Stew** is crafted with a Regeneration potion, but eating it **only instant-heals**—no Regeneration buff.  
Crafted stews **don’t stack**; **cooked meat doesn’t stack either**—64 steaks at home kills survival. Bread, baked potatoes, and similar cap at **16**. Crops and snacks have low saturation: **one good meal**, not endless snacking.  
**Pufferfish stack to 64** for brewing.

---

### 十种炖汤 · Ten Stews

| 炖汤 | 药水「调料」 | 吃下去 |
|------|-------------|--------|
| 疾风鸡汤 | 迅捷 | 瞬回 + 速度 ~8 分钟 |
| 蛮力炖 | 力量 | 瞬回 + 力量 ~8 分钟 |
| 回春蜜根汤 | 再生 | **仅瞬回**，无再生 |
| 神龟甲汤 | 神龟 | 瞬回 + 抗性 + 缓慢 ~20 秒 |
| 下界猪排锅 | 抗火 | 瞬回 + 抗火 ~8 分钟 |
| 海息寒汤 | 水肺 | 瞬回 + 水肺 ~8 分钟 |
| 夜视鲑鱼汤 | 夜视 | 瞬回 + 夜视 ~8 分钟 |
| 隐踪兔汤 | 隐身 | 瞬回 + 隐身 ~8 分钟 |
| 轻身莓兔盅 | 跳跃 | 瞬回 + 跳跃 ~8 分钟 |
| 浮羽炖 | 缓降 | 瞬回 + 缓降 ~4 分钟 |

| Stew | Potion seasoning | On eat |
|------|------------------|--------|
| Gale Chicken Stew | Swiftness | Instant heal + Speed ~8 min |
| Brute Beef Stew | Strength | Instant heal + Strength ~8 min |
| Rejuvenating Honeyroot Stew | Regeneration | **Instant heal only** (no Regen) |
| Turtle Shell Stew | Turtle Master | Instant heal + Resistance + Slowness ~20 s |
| Nether Pork Stew | Fire Resistance | Instant heal + Fire Res ~8 min |
| Seabreath Cold Stew | Water Breathing | Instant heal + Water Breathing ~8 min |
| Nightlow Salmon Stew | Night Vision | Instant heal + Night Vision ~8 min |
| Veilsh Rabbit Stew | Invisibility | Instant heal + Invisibility ~8 min |
| Springberry Rabbit Stew | Leaping | Instant heal + Jump Boost ~8 min |
| Down Feather Stew | Slow Falling | Instant heal + Slow Falling ~4 min |

---

## 四、附魔鱼 · Enchant Fish

**CN**  
原版随便钓钓就能出顶级附魔书——谁还肯升级、拼附魔台赌博？  
所以我砍掉了钓上附魔书，宝藏槽改成 **末影珍珠**，并把 **钓鱼** 和 **附魔台** 绑在一起。

**EN**  
Vanilla fishing hands you god-tier books—why grind levels or gamble at the table?  
So I removed enchanted books from fishing, made the treasure slot **ender pearls**, and linked **angling** to the **enchanting table**.

---

**CN**  
每次抛竿判定 **昼夜** 与 **群系**。顶层权重是：垃圾 25、珍珠 5、原版鱼 65、附魔鱼 5。  
**满月整天**，那 65% 才是鳕鱼和鲑鱼（海洋、丛林等仍可出热带鱼、河豚）。  
**非满月**，鳕鱼和鲑鱼从钓竿里消失；没有热带鱼、河豚垫着的群系，那 65% 改用垃圾占位——所以淡水会变得很「脏」，但 **附魔鱼仍是 5%**，不会被抬高。  
池内各鱼 **等权重**；**白天与夜间鱼种不重叠**——同一片水域，早晚钓到的符文完全不同。  
共 **42 种附魔鱼**：昼夜钓鱼池覆盖 **41 种**；**力量** 这一条由 **制箭师** 收购，当前不进群系池。尽情欣赏这些怪鱼吧——材质我会慢慢打磨。

**EN**  
Each cast checks **time of day** and **biome**. Top-level weights: junk 25, pearls 5, vanilla fish 65, enchant fish 5.  
On a **full-moon day**, that 65% is cod and salmon (oceans and jungles can still roll tropical fish and pufferfish).  
On a **quiet moon**, cod and salmon vanish from the rod. Biomes with no tropical/puffer leftover fill that 65% with **junk**—freshwater gets messy—but **enchant fish stay at 5%**, not inflated.  
Equal weight within the pool; **day and night species never overlap**—same water, different runes by time.  
**42 enchant fish** total: **41** in the day/night pools; **Power** is a fletcher trade, not in the biome pools right now. Enjoy the weird fish—I’ll keep polishing the textures.

---

**CN**  
**经验修补** 和 **抢夺** 在 **末地**——毕业之地，就该有像样的奖励。龙已击杀的末地，挖个水坑安静钓鱼，才是正确打开方式。  
**书与笔**：书 + 羽毛 + 墨囊（荧光墨囊也行），在附魔台合成。  
**附魔书**：主手 **书与笔**，副手 **附魔鱼**，对着 **附魔台**——副手鱼的数量决定等级，三条保护鱼就是保护 III。你得用笔写下怪鱼身上的符文——墨鱼朋友终于有用武之地了。  
为了让 **墨鱼** 与附魔系统联动，现在可 **桶装**，并用 **鹦鹉螺壳** 繁殖，方便做墨水农场——不是图书管理员那种农场。

**EN**  
**Mending** and **Looting** are in **the End**—the graduation zone deserves a real prize. After the dragon, dig a pool and fish in peace. That’s the End done right.  
**Writable book**: book + feather + ink sac (glow ink works too), crafted at the enchanting table.  
**Enchanted book**: **writable book** in the main hand, **enchant fish** off-hand, at the **table**—stack size sets the level; three Protection fish = Protection III. You’re writing runes off these weird fish. Squid finally earn their keep.  
Squid can be **bucketed** and bred with **nautilus shells**, so you can farm ink—not a librarian hall.

---

### 附魔鱼生态表（v2.1.19 · 昼夜分池）

| 生态 | 白天 | 夜间 |
|------|------|------|
| **淡水**（默认） | 饵钓、海之眷顾、击退 | 深海探索者、耐久 |
| **末地** | 经验修补、抢夺 | 经验修补、抢夺 |
| **沙漠** | 火焰附加、火矢 | 冲击 |
| **丛林** | 荆棘 | 节肢杀手 |
| **沼泽** | 锋利 | 摔落保护 |
| **寒带**（冷 biome + Y>62） | 霜冻行者、弹射物保护 | 精准采集 |
| **山地**（Y>62） | 保护、破甲 | 风爆 |
| **黑森林** | 快速装填 | 穿透 |
| **樱花树林** | 多重射击 | 突进 |
| **硫磺洞穴** | 火焰保护 | 爆炸保护 |
| **海洋** | 激流、水下呼吸、穿刺 | 忠诚、引雷、无限 |
| **普通洞穴** | 亡灵杀手、效率 | 时运 |
| **溶洞** | 水下速掘 | 绑定诅咒 |
| **繁茂洞穴** | 迅捷潜行 | 密度 |
| **深暗之域** | 灵魂疾行 | 消失诅咒 |

| Biome | Day | Night |
|-------|-----|-------|
| **Freshwater** (default) | Lure, Luck of the Sea, Knockback | Depth Strider, Unbreaking |
| **The End** | Mending, Looting | Mending, Looting |
| **Desert** | Fire Aspect, Flame | Punch |
| **Jungle** | Thorns | Bane of Arthropods |
| **Swamp** | Sharpness | Feather Falling |
| **Arctic** (cold + Y>62) | Frost Walker, Projectile Prot. | Silk Touch |
| **Mountain** (Y>62) | Protection, Breach | Wind Burst |
| **Roofed Forest** | Quick Charge | Piercing |
| **Cherry Grove** | Multishot | Lunge |
| **Sulfur Caves** | Fire Protection | Blast Protection |
| **Ocean** | Riptide, Respiration, Impaling | Loyalty, Channeling, Infinity |
| **Generic Caves** | Smite, Efficiency | Fortune |
| **Dripstone Caves** | Aqua Affinity | Curse of Binding |
| **Lush Caves** | Swift Sneak | Density |
| **Deep Dark** | Soul Speed | Curse of Vanishing |

**力量 / Power**：物品存在，制箭师收购；当前不在上表。

---

## 五、村民交易 · Villager Trading

**CN**  
村民 **没有随机交易池**，也 **没有等级系统**——高等级村民凭空消失，AI 又蠢，谁想建村民交易所？你的村民朋友真的想住在那吗？  
各职业 **固定收购几种对应的附魔鱼**（不是随机一本）；**流浪商人** 会随机收附魔鱼，野外钓鱼多了点盼头。  
绿宝石可换 **建材和炼药材料**：各职业有对应原木或菌柄，以及兔脚、金胡萝卜、闪烁西瓜、河豚等。  
**制图师** 保留探索地图——和「去不同群系钓附魔鱼」完美衔接。  
**注意**：交易写在新生成的村民身上。请重新导入附加包后，让 **新的** 村民和流浪商人生出来。

**EN**  
Villagers have **no random trade pools** and **no leveling**—high-tier villagers vanish, the AI is dumb, who wants a trade hall? Would your villagers choose to live there?  
Each profession **buys a fixed set of matching enchant fish** (not a random book). The **wandering trader** buys random fish, so outdoor fishing has a payoff.  
Emeralds buy **building blocks and brewing mats**: profession-specific logs or stems, plus rabbit feet, golden carrots, glistering melon, pufferfish, and the rest.  
The **cartographer** keeps exploration maps—perfect for biome-hopping for enchant fish.  
**Note**: trades live on newly spawned villagers. Re-import the add-on, then let **new** villagers and wandering traders generate.

---

## 六、宠物优化 · Pets

**CN**  
我为多种水生生物加了 **桶装**：墨鱼、发光墨鱼、鹦鹉螺、僵尸鹦鹉螺（含珊瑚变种）、驯服后的潜影贝。  
墨鱼联动附魔；鹦鹉螺是优秀水下坐骑，装进桶后，探索和洞穴潜水安全多了。  
**驯服后**，手持 **水桶或鱼桶** 可以把鹦鹉螺唤到身边；**野生** 成体只认河豚，不会满世界乱追。自定义 **鹦鹉螺桶** 用来装走它们。  
蝾螈手持 **水桶** 也会靠过来——没人想拿着桶追它追到把自己溺死，尤其是触屏玩家。

**EN**  
I added **bucket capture** for squid, glow squid, nautilus, zombified nautilus (coral variant too), and tamed shulkers.  
Squid tie into enchanting. Nautilus are great underwater mounts—bucketing them makes exploration and cave diving safer.  
Once **tamed**, holding a **water bucket or fish bucket** calls nautilus over. **Wild** adults only care about pufferfish, so no server-wide chases. The custom **nautilus bucket** is for carrying them.  
Axolotls also come to a **water bucket**—nobody wants to drown chasing one, especially on touch controls.

---

**CN**  
**潜影贝** 可以在水下待着，用 **末影珍珠** 驯服。场上每位玩家同时只放出 **一只**。  
把物品扔给它，它会像试炼宝箱一样 **炫耀背包**——开壳后请 **后退三格以上**，周围安静时才展示。  
**染料只改壳色**，不会按颜色取出物品。想拿回东西：坐下、无威胁时，对它使用 **氧化铜块**，会随机取出一格。  
身上有 **消失诅咒** 的装备，死亡后会先缓存；靠近 **自己的** 潜影贝才会存进去。死后新捡到的消失诅咒物品不会被清掉。  
个人爱好——但末地多了个安静的小伙伴。流浪商人有时会卖潜影贝桶，两颗绿宝石。

**EN**  
**Shulkers** can stay underwater and be tamed with **ender pearls**. Only **one** deployed shulker per player at a time.  
Toss items in—they **show off** their stash like a trial spawner. Open the shell, then **back up three-plus blocks**; they only display when it’s quiet.  
**Dyes only recolor** the shell; they do not pull items by color. To retrieve: sit them, no threats nearby, use an **oxidized copper block** for a random slot.  
**Curse of Vanishing** gear is cached on death and stored when you walk up to **your** shulker. New vanishing items you pick up after death are not wiped.  
A personal favorite—a quiet End companion. Wandering traders sometimes sell a shulker bucket for two emeralds.

---

## 七、结尾 · Closing

**CN**  
这就是 My Pack 的世界规则：**安静为主，满月才战、才刷、才能繁殖肉食；饥饿与炼药、钓鱼与附魔、村民与群系，终于连成一张网。**  
食物包 **v1.0.48**，附魔鱼与宠物包 **v2.1.19**——重新导入 mcaddon；**新生成** 的村民与流浪商人才会带上新交易。  
去雪原溜达吧。今晚若不是满月，你可能真的不用怕。

**EN**  
These are My Pack’s world rules: **calm by default; combat, spawns, and meat breeding on the full moon; hunger, brewing, fishing, enchanting, villagers, and biomes—finally one web.**  
Food pack **v1.0.48**, Enchant Fish & Pets **v2.1.19**. Re-import the mcaddon; only **newly spawned** villagers and wandering traders get the new trades.  
Take that stroll in the snow. If it isn’t a full moon, you might actually be fine tonight.

---

## 附录 A：职业收购的附魔鱼（供B镜 / 简介）

| 职业 | 收购 |
|------|------|
| 农民 | 忠诚、时运、饵钓 |
| 工具匠 | 快速装填、效率、精准采集、耐久 |
| 制图师 | 深海探索者、引雷 |
| 图书管理员 | 迅捷潜行、无限、经验修补 |
| 制箭师 | 力量、冲击、火矢、多重射击 |
| 武器匠 | 锋利、亡灵杀手、火焰附加、突进 |
| 石匠 | 激流、破甲、密度 |
| 牧羊人 | 霜冻行者、节肢杀手、风爆 |
| 皮匠 | 摔落保护、荆棘 |
| 渔夫 | 水下呼吸、水下速掘、穿刺、海之眷顾 |
| 牧师 | 灵魂疾行、绑定诅咒、消失诅咒 |
| 屠夫 | 击退、抢夺、穿透 |
| 盔甲匠 | 保护、爆炸保护、火焰保护、弹射物保护 |

流浪商人：随机收购附魔鱼；2 绿宝石有机会出潜影贝桶 / 僵尸鹦鹉螺桶。

---

## 附录 B：相对旧台词删改（供审片）

| 旧稿 | 现稿（以代码为准） |
|------|-------------------|
| 非满月切 **和平难度** | **关刷怪**，难度保持；满月再开刷 |
| 满月「夜晚」 | **整天**（月相 0） |
| 未提繁殖 / 跳夜 | 非满月 **禁肉食繁殖**；跳夜 **饥饿 I 120 秒** |
| 僵尸村民温和不还手 | **饥饿时追人，被打还手** |
| 岩浆怪保留压扁伤害 | **对玩家的接触伤害和着火取消** |
| 恶魂英文写成完全不索敌 | **弓/弩/三叉戟才主动打，挨打还手** |
| 41 种鱼 | **42 种**（池内 41；力量走制箭师） |
| 附魔鱼 5% 且未提月相食物 | 鳕鲑 **仅满月**；非满月 65% 变垃圾，附魔仍 5% |
| 炖汤增益一律 8 分钟 | 神龟 **~20 秒**；缓降 **~4 分钟**；回春 **无再生** |
| 鹦鹉螺桶吸引已驯服个体 | 驯服后认 **水桶/鱼桶**；自定义桶用于装载 |
| 染料按颜色取物 | **染料只改色**；**氧化铜** 随机取出 |
| 各职业只收一种鱼、一律 64 原木 | 每职业 **固定几种鱼**；建材含原木 **或菌柄** |
| 鸡下蛋未提 | **20–40 分钟** 一枚 |
| 蜘蛛可繁育拴绳 | **仍未实现**，不讲 |

---

## 附录 C：SRT 示例

```srt
1
00:00:00,000 --> 00:00:06,500
Minecraft 原版最大的遗憾，是各系统彼此孤立。
Vanilla Minecraft’s biggest flaw is how disconnected its systems feel.

2
00:00:06,500 --> 00:00:13,000
非满月整天停止新刷怪；满月才恢复刷怪和你保存的战斗难度。
On a quiet-moon day, new mobs stop spawning; a full moon restores spawns and your saved difficulty.

3
00:00:13,000 --> 00:00:19,000
鳕鱼和鲑鱼只有满月能钓上；附魔鱼无论月相都是百分之五。
Cod and salmon only on a full moon; enchant fish stay at five percent either way.
```

需要完整时间轴 SRT 时，告诉我目标时长（例如 8 / 12 / 15 分钟）。
