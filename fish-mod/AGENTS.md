# fish_mod — Agent 指南

附魔鱼 + 宠物组合包。当前版本 **v2.1.19**。

## 项目结构

| 路径 | 用途 |
|------|------|
| `BP/entities/fishing_hook.json` | 群系 × 昼夜钓鱼路由（**由生成器写入，勿手改**） |
| `BP/entities/biome_probe.json` | 抛竿群系探针（environment_sensor + `queue_command` tag） |
| `BP/loot_tables/gameplay/` | 各群系 `*_fishing_day.json` / `*_fishing_night.json` |
| `BP/loot_tables/gameplay/fishing/*_fish_day.json` | 白天专属附魔鱼（与 night **不重叠**） |
| `BP/scripts/fishing_biome.js` | 抛竿 prefetch 探针 + 鱼钩 spawn 时 `triggerEvent` 定 loot + ActionBar |
| `BP/scripts/biome_resolver.js` | tag + 地下扫描 → 钓鱼池 id（与 loot 同源） |
| `BP/scripts/pets.js` | 潜影贝宠物、消失诅咒缓存、铜块取出、流浪商人定价 |
| `BP/entities/shulker.json` | 潜影贝坐下 tag、environment_sensor、染料交互 |
| `BP/scripts/enchant_fish.js` | **仅**附魔台合成 |
| `Rp/texts/zh_CN.lang` / `en_US.lang` | `action.enchant_fish.fishing_pool`、`biome.enchant_fish.pool.*` |
| `tools/fishing_data.py` | 群系路由、昼夜鱼种、显示名 |
| `tools/generate_fishing_hook.py` | 生成 hook / probe / 全部 day-night 战利表 |
| `tools/pack_export.py` | 打包 mcaddon，内含 verify 断言 |

打包：`python tools/generate_fishing_hook.py` → `python tools/pack_export.py`

---

## 当前正确方案（v2.0.81+）

**脚本定 loot（抛竿 prefetch + 鱼钩 spawn 应用）** + **JSON 仅作淡水 fallback**：

1. 单一实体 **`minecraft:fishing_hook`**
2. `itemUse`（抛竿）：缓存抛竿点，在 **脚下/水里** prefetch 探针（**不要**刷在钩子当前格）
3. `entitySpawn`（鱼钩）：等钩子飞出约 8 tick 再采样。探针只刷在脚下或钩子**下方**水体，不用钩子当前坐标。`resolveFishingPool` + `isEngineDaytime` + `isFullMoon` → `hook.triggerEvent("enchant_fish:apply_loot_{pool}_{day|night}[_fullmoon]")`。满月整天把 **鳕鱼/鲑鱼** 放进 65% 食物池；非满月该 65% 用 **垃圾占位**。热带鱼/河豚、附魔鱼、珍珠照常。JSON 不能读月相。
4. `fishing_hook.json`：`entity_spawned` **只** fallback 默认淡水 day/night；各池 loot 由脚本 apply 事件写入
5. **普通洞穴**：无 `caves` biome tag（原版仅 lush/dripstone/deep_dark 带 `caves`）；用 **上方实心方块扫描** 判地下，排除特殊洞穴 tag
6. 特殊洞穴仍靠 tag：`dripstone_caves`、`lush_caves`、`deep_dark`、`sulfur_caves`
7. 表面寒带：`taiga/frozen/ice/snow` + **Y > 62**；**优先于**同高度的山地（寒带规则在山地之后再次应用）
8. 表面山地：`mountain/jagged_peaks/meadow/grove/extreme_hills` + **Y > 62**
9. manifest **`@minecraft/server` 1.17.0**；`getBiome()` 2.2.0+ 可用时优先，否则探针

---

## 附魔鱼池（当前 v2.0.81）

| 钓鱼池 | 白天 | 夜间 |
|--------|------|------|
| 淡水 | 饵钓、海之眷顾、击退 | 深海探索者、耐久 |
| 末地 | 经验修补、抢夺 | 经验修补、抢夺 |
| 沙漠 | 火焰附加、火矢 | 冲击 |
| 丛林 | 荆棘 | 节肢杀手 |
| 沼泽 | 锋利 | 摔落保护 |
| 寒带 | 霜冻行者、弹射物保护 | 精准采集 |
| 山地 | 保护、破甲 | 风爆 |
| 黑森林 | 快速装填 | 穿透 |
| 樱花树林 | 多重射击 | 突进 |
| 硫磺洞穴 | 火焰保护 | **爆炸保护** |
| 海洋 | 激流、水下呼吸、穿刺 | 忠诚、引雷、无限 |
| 洞穴 | 亡灵杀手、效率 | 时运 |
| 溶洞 | 水下速掘 | 绑定诅咒 |
| 繁茂洞穴 | 迅捷潜行 | 密度 |
| 深暗之域 | 灵魂疾行 | **消失诅咒** |

源码：`tools/fishing_data.py` → `FISH_DAY_NIGHT`。满月才出鳕鱼/鲑鱼；非满月 65% 食物槽用垃圾占位。附魔鱼不分月相。

---

## 实践坑总结（v2.0.72–78 实测）

### A. 战利表 / 路由

| 坑 | 说明 |
|----|------|
| **不是表「融合」** | 多池并存是鱼钩 `entity_spawned` 路由结果；一次钓鱼只走一条 `minecraft:loot` |
| **`sequence` 顺序** | 后者覆盖前者；**默认 day/night 必须排在最前**，群系+昼夜在后；若 `is_daytime`  catch-all 放**末尾**会盖掉所有群系 |
| **海洋规则盖住地下** | `loot_saltwater` / 泛 `caves` 若排在 `lush_caves` **之后**会覆盖地下池；地下规则放 sequence **末尾** |
| **3D 垂直群系** | 同一 `(x,z)` 不同 Y 可不同群系；鱼钩在抛竿位置采样，上下层 cold / lush 会钓到不同池 |
| **Bedrock loot 无条件** | **不能**在 loot JSON 写 time/biome；昼夜必须用实体过滤器 `is_daytime` |
| **时间以抛竿为准** | `entity_spawned` 绑定表，非收竿；跨黎明/黄昏边界属正常 |

### B. 群系提示（`fishing_biome.js` + `biome_probe`）

| 坑 | 说明 |
|----|------|
| **`add: { tags }` 无效** | 探针实体事件用 `"add": { "tags": "..." }` **不会**加 tag；必须用 **`queue_command`: `tag @s add "..."`**（参考 Realistic Biomes） |
| **始终显示「淡水」** | 上述 tag 失败 → `getTags()` 空 → resolver 回退 default |
| **需多 tick 等待** | `queue_command` + environment_sensor 后至少等 **1–5 tick** 再读 tag |
| **采样位置** | 鱼钩初生在空中；应用 **玩家抛竿位置**（`itemUse` 缓存）+ 鱼钩 + 下方几格多点多试 |
| **`getBiome()` 与 1.17.0** | `dimension.getBiome()` 需 **2.2.0+**；manifest 锁 1.17.0 时仅作 try/catch 备用，主路径靠探针 |
| **勿用 `has_biome_tag: caves` 当普通洞** | 原版 `#minecraft:caves` 仅含 lush/dripstone/deep_dark；普通矿洞是地表 biome + 地下扫描 |
| **提示 = loot** | v2.0.81 起同一 `resolveFishingPool`；勿再拆两套逻辑 |
| **中英提示** | 用 `rawtext` + `translate: biome.enchant_fish.pool.{id}`，勿硬编码中文 |

### C. 附魔台 / manifest

| 坑 | 说明 |
|----|------|
| **升 2.2.0 附魔台坏** | `getComponent("equippable")` / `isValid()` 等在 2.2.0 行为变化；附魔台曾整段失效 |
| **`isValid` 是属性** | `@minecraft/server` 1.17.0 下 `player.isValid()` 会抛错 → 附魔台/潜影贝整段回调崩溃；用 `isLiveEntity()` |
| **`chatSend` 1.17.0 无** | v2.1.2 起 `beforeEvents.chatSend` 在 manifest 1.17.0 可能为 `undefined`，**裸 `.subscribe` 会导致 pets.js 导入失败、附魔台脚本也不加载**；须可选链或 try/catch；复位命令改用 `/scriptevent my_pack:reset_flags` |
| **main.js 导入顺序** | `enchant_fish.js` 放在 `pets.js` 之前，避免 pets 加载失败拖垮附魔台 |
| **单入口脚本链** | Bedrock 只有一个 `main.js` entry；任一 `import` 在**顶层**抛错 → 后续模块（含附魔台）全部不加载；改 pets 后务必看日志是否有 `[EnchantFish]` |
| **双 API 勿混** | 钓鱼 JSON 不依赖 Script API；附魔台依赖 1.17.0 API；一个 manifest 一个 `@minecraft/server` 版本 |

### D. 历史失败（v2.0.59–69，仍禁止）

- 脚本 `triggerEvent` 定鱼钩 loot（v2.0.81+ **允许**）；**禁止**收竿后替换物品
- `is_biome: deep_dark`（枚举无此项，用 `has_biome_tag`）
- 在 `enchant_fish.js` 恢复钓鱼逻辑
- 多种自定义鱼钩实体破坏原版收竿

完整条目见下文「历史失败原因」。

---

## Agent 工作守则

### 必须做

- 改鱼种 / 群系：编辑 `tools/fishing_data.py`，运行 `generate_fishing_hook.py`
- 改提示文案：同步 `Rp/texts/zh_CN.lang` 与 `en_US.lang`
- 探针 tag：生成器内 **`queue_command`**，勿改回 `add: tags`
- 保持 `minecraft:fishing_hook` 单一 identifier
- 改版本：同步 `pack_export.py`、`BP/Rp manifest`、`pets.js` / `enchant_fish.js` / `fishing_biome.js` PACK_VERSION

### 禁止做

- **不要**在 `enchant_fish.js` 恢复钓鱼群系/收竿修正
- **不要**用 `is_biome` 表达仅 1.18+ 群系（如 `deep_dark`）
- **不要**新增第二套鱼钩实体做昼夜
- **不要**手改 `fishing_hook.json` / `biome_probe.json`（会被生成器覆盖）
- **不要**在 ActionBar 硬编码中文（破坏英文客户端）

### 若用户仍钓到淡水鱼 / 提示不对

1. 确认 **v2.0.81+** 且重进世界
2. 日志：`[FishingBiome] module v2.0.81 loaded (cast prefetch + script loot routing)`
3. 地下普通洞：ActionBar 应显示「洞穴」且出亡灵杀手/效率（白天）或时运（夜间）
4. 若脚本未加载：仅 fallback 淡水

---

## 历史失败原因（v2.0.59–69）

### 1. JSON `sequence` + 错误过滤器

| 问题 | 说明 |
|------|------|
| `is_biome: deep_dark` | 枚举无 `deep_dark`，规则永不命中 |
| 多组 `component_groups` 叠加 | 后者覆盖前者，顺序错误时行为难控 |

### 2. 脚本换 loot 组 / getBiome 路由

依赖 Script API 开关、时序、`getBiome` 版本；失败静默回退淡水。

### 3. 捕获后脚本替换物品

`playerInventoryItemChange` / `itemSpawn` 在钓鱼场景常不触发或时序不对。

### 4. 共性误判

| 误区 | 事实 |
|------|------|
| 「loot 表融合」 | 是路由覆盖，不是 JSON 合并 |
| 「地下 = caves 池」 | 以 **biome tag** 为准（`lush_caves` ≠ 泛 `caves`） |
| `/getbiome` | Bedrock 无此命令 |

---

## 群系 → loot 表速查（含昼夜）

| 条件 | 白天表 | 夜间表 |
|------|--------|--------|
| 默认 | `fishing_day.json` | `fishing_night.json` |
| `the_end` | `end_fishing_day` | `end_fishing_night` |
| `deep_dark` | `deep_dark_fishing_day` | `_night` |
| `lush_caves` | `lush_fishing_day` | `_night` |
| `dripstone_caves` | `dripstone_fishing_day` | `_night` |
| `caves` | `cave_fishing_day` | `_night` |
| `ocean` / `beach` | `saltwater_fishing_day` | `_night` |
| `ocean` + `cold` | `arctic_fishing_day` | `_night` |
| … | 见 `fishing_data.py` `BIOME_ROUTE_RULES` | |

---

## 潜影贝宠物 + 消失诅咒（v2.1.0 / 代码基准 v2.0.97）

> **勿用 v2.0.98 / v2.0.99 的错误迭代包**（已删除导出）；v2.1.0 为当前 manifest 版本号，逻辑同修复后的 2.0.97。

### v2.0.97 相对原包的仅有两处改动

| 改动 | 说明 |
|------|------|
| **移除 `keepOnDeath`** | 脚本不再给 vanish 装备打保留标记 → 物品 tooltip **不会出现**「此物品不会因死亡而丢失」 |
| **氧化铜块** | `minecraft:copper_block` → `minecraft:oxidized_copper`（取出 + 交互） |

### 功能概要

| 功能 | 说明 |
|------|------|
| 一玩家一只「在场」 | `my_pack:shulker_deployed` DP；仅限制**已放出**的潜影贝实体，桶内/死亡/桶道具丢失后 `reconcile` 清标记，可再驯服或再放置 |
| 消失诅咒缓存 | 每 5 tick 快照；**仅** `entityDie` 促升 pending；靠近**自己**驯服潜影贝 6 格自动存入 |
| 氧化铜取出 | 氧化铜块；**仅主人**；坐下 + 无威胁 + 非展示中 → 随机取出一格 |
| 展示 | 开壳 + 玩家退后 3 格 → 50% 展示背包随机一格 |
| 染料 | 仅改色，不掉落 |
| 流浪商人桶 | 2 绿宝石 |

### G. 提示语与在场逻辑（v2.1.0 实测）

| 坑 | 说明 |
|----|------|
| **死亡提示重复** | `entityHurt`（血量≤0）与 `entityDie` 都会走缓存 → **只在 `promoteStashOnPlayerDeath` 发「已缓存」**；`notifyVanishCacheStored` 勿 `system.run` 二次发送 |
| **重生提示重复** | `playerSpawn` 在 0/10/40/80 tick 四次 `reconcileVanishItemsOnRespawn` → **仅 delay=0 且 `shouldNotifyVanishReturn`**；若 400 tick 内已发过「已缓存」则跳过「待取回」 |
| **桶装丢宠标记卡死** | 旧 `has_shulker_pet` 在桶装/桶道具销毁后仍为 true → 改为 **`shulker_deployed` 只表示场上有实体**；装桶 `set false`，死亡 `clear`，`reconcile` 无实体则清 |
| **双潜影贝在场** | `beforeEvent` cancel 可能被 vanilla tame 绕过 → `on_tame` 须 `reject_tame` 还原；`enforceSingleDeployedShulker` 扫全场只保留一只（静默，不刷屏） |
| **潜影贝提示刷屏** | `playerBlocksExtraShulkerDeploy` 勿内联 `reconcile`；统一 `notifyDeployBlocked` 40 tick 冷却 |
| **vanish 重复计数** | 主手/副手在 inventory 与 equippable 重复扫描 → 盔甲只用 equippable；`dedupeVanishStashItems`；死亡优先 live 采集，勿 `cached.length > live.length` |
| **强制复位命令** | 聊天 `!mypack reset` / `!潜影贝复位` 或 `/scriptevent my_pack:reset_flags` → 清 `shulker_deployed`、vanish stash/pending |
| **多人归属** | `isTamedShulkerOwnedBy` 末尾勿 `return true`；vanish 存入 / 氧化铜 / 装桶均须 **owner id 匹配** |

### 实现要点（经验总结）

1. **消失诅咒**：Bedrock 附魔 id 为 `vanishing`；每 5 tick `refreshVanishPreview`（pending=false，不写 keepOnDeath）；死亡 `entityDie` → strip + pending + 单次「已缓存」；靠近 **自有** 潜影贝 `processVanishStash`。
2. **摔落误判**：`afterEvents.entityHurt` 伤害已结算，**禁止** `currentHealth <= damage` 判致命，非致命 hurt 只刷新预览。
3. **manifest 版本**：`pack_export.py` 同步 BP/RP `[major,minor,patch]`，否则导入报重复包。
4. **潜影贝唯一性**：限制「放出」不限制「拥有」——可同时持桶，但场上仅一只；末影珍珠驯服前检查 `playerOwnsLiveShulker`。
5. **展示**：开壳期间每 5 tick 重试；`isLiveEntity()` 兼容 property/method；勿用 `beforeEvents.entityHurt`。

### E. 潜影贝展示（v2.0.85–93 实测）

| 坑 | 说明 |
|----|------|
| **开壳时玩家太近** | 抛竿/开壳后玩家常在 3 格内 → 一次性威胁判定永远失败；需 **开壳期间每 5 tick 重试**，50% 每轮开壳只掷一次 |
| **`isValid` 是属性不是方法** | `entity.isValid()` 会崩溃；用 `isLiveEntity()` 兼容 property / method |
| **`getProperty` 不可靠** | 壳开/坐下状态用 **Map 跟踪** + script sitting DP，勿单靠 entity property |
| **勿用 `beforeEvents.entityHurt`** | `@minecraft/server` 1.17.0 下易导致脚本加载失败；展示与 vanish 均改 `afterEvents` |
| **`event.damage` 可能 undefined** | 参与 `health - damage` 得 NaN，破坏整条逻辑链 |
| **展示测试法** | 开壳 → **后退 3+ 格** → 等 50% 展示 |

### F. 消失诅咒缓存（v2.0.90–97）

| 坑 | 说明 |
|----|------|
| **测错物品** | `fish_vanishing_curse` 是材料，须用已附魔 vanishing 的装备 |
| **Bedrock 附魔 id** | 优先 `vanishing`；`getEnchantment("curse_of_vanishing")` 会 throw |
| **manifest 版本** | `pack_export.py` 同步 `[2,0,N]`，否则导入报重复包 |
| **keepOnDeath tooltip** | 脚本设 `keepOnDeath` 会显示「此物品不会因死亡而丢失」；v2.0.97 起已移除 |
| **摔落误缓存** | `afterEvents.entityHurt` 伤害已结算，勿用「当前血量 <= 本次伤害」判致命（如 1 血承受 9 伤害会误判）；仅 `currentValue <= 0` 且仍应交给 `entityDie` 处理，hurt 只刷新预览 |
| **死亡提示重复** | 见上文 §G |
| **v2.0.98+ 作废** | 勿再基于 98–99 错误迭代包开发；v2.1.0 为当前 manifest |

---

## 参考

- 本仓库：`Advanced Fishing BP/entities/fishing_hook.json`
- Realistic Biomes：探针 + `queue_command` tag、`getBiome`（需高版本 API）
- [has_biome_tag](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/filters/has_biome_tag)
