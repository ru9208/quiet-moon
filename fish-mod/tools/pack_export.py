"""Pack fish_mod BP + Rp into export/ (iOS-compatible mcaddon)."""
import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BP = ROOT / "BP"
RP = ROOT / "Rp"
PACK_ICON = ROOT / "pack_icon.png"
EXPORT = ROOT.parent / "export"
RELEASE = ROOT.parent / "release"
VERSION = "2.1.19"
PREFIX = f"Pets_EnchantFish_v{VERSION}"
BP_MCPACK = EXPORT / f"{PREFIX}_BP.mcpack"
RP_MCPACK = EXPORT / f"{PREFIX}_RP.mcpack"
MCADDON = EXPORT / f"{PREFIX}.mcaddon"
BP_UUID = "e1f4a6b8-2c3d-4e5f-9a7b-8c1d2e3f4a5b"
RP_UUID = "d9c8e7f6-5a4b-3c2d-1e0f-a9b8c7d6e5f4"


def version_triple(version: str) -> list[int]:
    major, minor, patch = (version.split(".") + ["0", "0"])[:3]
    return [int(major), int(minor), int(patch)]


def sync_manifest_versions(version: str) -> None:
    ver = version_triple(version)
    bp_name = f"Pets & Enchant Fish BP v{version}"
    rp_name = f"Pets & Enchant Fish RP v{version}"

    bp_path = BP / "manifest.json"
    bp = json.loads(bp_path.read_text(encoding="utf-8"))
    bp["header"]["version"] = ver
    bp["header"]["name"] = bp_name
    for mod in bp.get("modules", []):
        mod["version"] = ver
    for dep in bp.get("dependencies", []):
        if "uuid" in dep:
            dep["version"] = ver
    bp_path.write_text(
        json.dumps(bp, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    rp_path = RP / "manifest.json"
    rp = json.loads(rp_path.read_text(encoding="utf-8"))
    rp["header"]["version"] = ver
    rp["header"]["name"] = rp_name
    for mod in rp.get("modules", []):
        mod["version"] = ver
    rp_path.write_text(
        json.dumps(rp, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def zip_dir(src: Path, dest: Path) -> None:
    if dest.exists():
        dest.unlink()
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in src.rglob("*"):
            if path.is_file():
                zf.write(path, path.relative_to(src).as_posix())


def zip_files(files: list[Path], dest: Path) -> None:
    if dest.exists():
        dest.unlink()
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in files:
            zf.write(path, path.name)


def sync_pack_icons() -> None:
    if not PACK_ICON.exists():
        fallback = RP / "pack_icon.png"
        if fallback.exists():
            shutil.copy2(fallback, PACK_ICON)
        else:
            raise FileNotFoundError(f"Missing pack icon: {PACK_ICON}")
    for target in (BP / "pack_icon.png", RP / "pack_icon.png"):
        shutil.copy2(PACK_ICON, target)


def export_ios_folders() -> None:
    ios_root = EXPORT / "manual_ios"
    ios_bp = ios_root / "behavior_pack"
    ios_rp = ios_root / "resource_pack"
    for folder in (ios_bp, ios_rp):
        if folder.exists():
            shutil.rmtree(folder)
    shutil.copytree(BP, ios_bp)
    shutil.copytree(RP, ios_rp)


def publish_release() -> None:
    RELEASE.mkdir(parents=True, exist_ok=True)
    dest = RELEASE / MCADDON.name
    shutil.copy2(MCADDON, dest)


def verify() -> None:
    with zipfile.ZipFile(BP_MCPACK) as zf:
        names = zf.namelist()
        assert "manifest.json" in names, "BP missing manifest.json at root"
        script = zf.read("scripts/pets.js").decode("utf-8")
        assert 'PACK_VERSION = "2.1.19"' in script, "pets.js PACK_VERSION mismatch"
        fishing = zf.read("scripts/fishing_biome.js").decode("utf-8")
        assert "isFullMoon" in fishing, "fishing_biome.js must gate loot on full moon"
        assert "belowInWater" in fishing, "probe must spawn below hook/player, not on the hook"
        assert "HOOK_FLY_TICKS" in fishing, "must wait for hook to fly before probing"
        lush_day = zf.read("loot_tables/gameplay/fishing/lush_fish_day.json").decode(
            "utf-8"
        )
        assert "fish_swift_sneak" in lush_day, "enchant fish must drop regardless of moon"
        quiet_food = json.loads(zf.read("loot_tables/gameplay/fishing_day.json"))
        quiet_entries = quiet_food["pools"][0]["entries"]
        quiet_blob = json.dumps(quiet_food)
        assert "salmon" not in quiet_blob, "salmon food must not be in quiet fishing table"
        assert "cod" not in quiet_blob, "cod food must not be in quiet fishing table"
        assert any(
            e.get("weight") == 65 and str(e.get("name", "")).endswith("junk.json")
            for e in quiet_entries
        ), "quiet moon must fill the 65% fish slot with junk"
        full_food = zf.read(
            "loot_tables/gameplay/fishing/vanilla_freshwater_fish_fullmoon.json"
        ).decode("utf-8")
        assert "minecraft:salmon" in full_food
        assert "minecraft:cod" in full_food
        jungle_quiet = zf.read(
            "loot_tables/gameplay/fishing/vanilla_jungle_fish.json"
        ).decode("utf-8")
        assert "minecraft:tropical_fish" in jungle_quiet
        assert "minecraft:salmon" not in jungle_quiet
        hook = zf.read("entities/fishing_hook.json").decode("utf-8")
        assert "apply_loot_default_day_fullmoon" in hook
        assert '"moon_phase"' not in hook, "hook JSON moon_phase does not work; gating is script-only"
        assert "keepOnDeath" not in script, "pets.js must not set keepOnDeath"
        assert "minecraft:oxidized_copper" in script, "pets.js must use oxidized copper"
        assert "minecraft:copper_block" not in script, "pets.js must not use copper_block"
        manifest_data = json.loads(zf.read("manifest.json").decode("utf-8"))
        assert manifest_data["header"]["version"] == version_triple(VERSION)
        assert "entities/squid.json" in names, "BP missing squid breeding"
        assert "entities/glow_squid.json" in names, "BP missing glow squid breeding"
        squid = zf.read("entities/squid.json").decode("utf-8")
        assert "nautilus_shell" in squid, "squid must breed with nautilus shell"
    with zipfile.ZipFile(RP_MCPACK) as zf:
        rp_manifest = json.loads(zf.read("manifest.json").decode("utf-8"))
        assert rp_manifest["header"]["version"] == version_triple(VERSION)


def main() -> None:
    EXPORT.mkdir(parents=True, exist_ok=True)
    sync_manifest_versions(VERSION)
    sync_pack_icons()
    zip_dir(BP, BP_MCPACK)
    zip_dir(RP, RP_MCPACK)
    zip_files([BP_MCPACK, RP_MCPACK], MCADDON)
    export_ios_folders()
    EXPORT.joinpath("VERSION.txt").write_text(
        f"宠物与附魔鱼 v{VERSION}\nBP {BP_UUID}\nRP {RP_UUID}\n",
        encoding="utf-8",
    )
    verify()
    publish_release()
    print(f"Packed {MCADDON}")
    print(f"  Release copy: {RELEASE / MCADDON.name}")


if __name__ == "__main__":
    main()
