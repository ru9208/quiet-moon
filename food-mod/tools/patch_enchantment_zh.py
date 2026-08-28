"""Patch BetterEnch enchantment lines: Chinese names + spear/hammer icons."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

LANG_DIRS = [
    ROOT / "_backup" / "better_ench" / "BetterEnch" / "subpacks" / "decimal" / "texts",
    ROOT / "_backup" / "better_ench" / "BetterEnch" / "subpacks" / "roman" / "texts",
    ROOT / "_backup" / "better_ench" / "BetterEnch" / "subpacks" / "chromai" / "texts",
    ROOT / "_backup" / "better_ench" / "BetterEnch" / "subpacks" / "chroma1" / "texts",
]

# U+255C spear (src 0xBC), U+255D hammer (src 0xBD)
ZH_ENCHANTS: dict[str, str] = {
    "enchantment.arrowDamage": "╚ 力量",
    "enchantment.arrowFire": "╚ 火矢",
    "enchantment.arrowInfinite": "╚ 无限",
    "enchantment.arrowKnockback": "╚ 冲击",
    "enchantment.crossbowMultishot": "╣ 多重射击",
    "enchantment.crossbowPiercing": "╣ 穿透",
    "enchantment.crossbowQuickCharge": "╣ 快速装填",
    "enchantment.curse.binding": "┬ 绑定诅咒",
    "enchantment.curse.vanishing": "┬ 消失诅咒",
    "enchantment.damage.all": "│ 锋利",
    "enchantment.damage.arthropods": "│ 节肢杀手",
    "enchantment.damage.undead": "│ 亡灵杀手",
    "enchantment.digging": "■ 效率",
    "enchantment.durability": "┴ 耐久",
    "enchantment.fire": "│ 火焰附加",
    "enchantment.fishingSpeed": "║ 饵钓",
    "enchantment.frostwalker": "├ 冰霜行者",
    "enchantment.knockback": "│ 击退",
    "enchantment.lootBonus": "│ 抢夺",
    "enchantment.lootBonusDigger": "■ 时运",
    "enchantment.lootBonusFishing": "║ 海之眷顾",
    "enchantment.mending": "┴ 经验修补",
    "enchantment.oxygen": "± 水下呼吸",
    "enchantment.protect.all": "┤ 保护",
    "enchantment.protect.explosion": "┤ 爆炸保护",
    "enchantment.protect.fall": "├ 摔落保护",
    "enchantment.protect.fire": "┤ 火焰保护",
    "enchantment.protect.projectile": "┤ 弹射物保护",
    "enchantment.soul_speed": "├ 灵魂疾行",
    "enchantment.thorns": "┤ 荆棘",
    "enchantment.untouching": "■ 精准采集",
    "enchantment.waterWalker": "├ 深海探索者",
    "enchantment.waterWorker": "± 水下速掘",
    "enchantment.tridentChanneling": "╗ 引雷",
    "enchantment.tridentLoyalty": "╗ 忠诚",
    "enchantment.tridentRiptide": "╗ 激流",
    "enchantment.tridentImpaling": "╗ 穿刺",
    "enchantment.swift_sneak": "├ 迅捷潜行",
    "enchantment.heavy_weapon.breach": "╝ 破甲",
    "enchantment.heavy_weapon.density": "╝ 致密",
    "enchantment.heavy_weapon.windburst": "╝ 风爆",
    "enchantment.lunge": "╜ 突进",
}

EN_NEW: dict[str, str] = {
    "enchantment.swift_sneak": "├ Swift Sneak",
    "enchantment.heavy_weapon.breach": "╝ Breach",
    "enchantment.heavy_weapon.density": "╝ Density",
    "enchantment.heavy_weapon.windburst": "╝ Wind Burst",
    "enchantment.lunge": "╜ Lunge",
}


def patch_zh(path: Path) -> int:
    chroma = any("chroma" in part for part in path.parts)
    lines = path.read_text(encoding="utf-8").splitlines()
    out: list[str] = []
    seen: set[str] = set()
    changed = 0
    insert_after = "enchantment.tridentImpaling"

    for line in lines:
        if not line.startswith("enchantment.") or "=" not in line:
            out.append(line)
            continue
        key, _ = line.split("=", 1)
        if key in seen:
            changed += 1
            continue
        if key not in ZH_ENCHANTS:
            out.append(line)
            seen.add(key)
            continue
        value = ZH_ENCHANTS[key]
        if chroma and key.startswith("enchantment.curse."):
            value = f"§f{value.split(' ', 1)[0]} §c{value.split(' ', 1)[1]}"
        new_line = f"{key}={value}"
        if new_line != line:
            changed += 1
        out.append(new_line)
        seen.add(key)
        if key == insert_after:
            for extra_key, extra_val in ZH_ENCHANTS.items():
                if not extra_key.startswith(("enchantment.swift", "enchantment.heavy", "enchantment.lunge")):
                    continue
                if extra_key in seen:
                    continue
                out.append(f"{extra_key}={extra_val}")
                seen.add(extra_key)
                changed += 1

    path.write_text("\n".join(out) + "\n", encoding="utf-8")
    return changed


def patch_en_us(path: Path) -> int:
    lines = path.read_text(encoding="utf-8").splitlines()
    if any(line.startswith("enchantment.lunge=") for line in lines):
        return 0
    out: list[str] = []
    changed = 0
    for line in lines:
        out.append(line)
        if line.startswith("enchantment.tridentImpaling="):
            for key, value in EN_NEW.items():
                out.append(f"{key}={value}")
                changed += 1
    path.write_text("\n".join(out) + "\n", encoding="utf-8")
    return changed


def main() -> None:
    total = 0
    for lang_dir in LANG_DIRS:
        zh = lang_dir / "zh_CN.lang"
        if zh.exists():
            n = patch_zh(zh)
            if n:
                print(f"{zh.relative_to(ROOT)}: {n} lines")
                total += n
    en = ROOT / "RP" / "texts" / "en_US.lang"
    if en.exists():
        n = patch_en_us(en)
        if n:
            print(f"{en.relative_to(ROOT)}: +{n} new lines")
            total += n
    print(f"Done ({total} changes)")


if __name__ == "__main__":
    main()
