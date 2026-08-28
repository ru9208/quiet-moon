"""Pack food mod BP + RP into export/ (iOS-compatible mcaddon)."""
import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BP = ROOT / "BP"
RP = ROOT / "RP"
PACK_ICON = ROOT / "pack_icon.png"
EXPORT = ROOT / "export"
RELEASE = ROOT.parent / "release"
VERSION = "1.0.48"
PREFIX = f"Food_v{VERSION}"
BP_MCPACK = EXPORT / f"{PREFIX}_BP.mcpack"
RP_MCPACK = EXPORT / f"{PREFIX}_RP.mcpack"
MCADDON = EXPORT / f"{PREFIX}.mcaddon"
BP_UUID = "d3a00784-394f-4224-bf5b-c06b2eb026a3"
RP_UUID = "012a54fc-4ef2-4377-b70f-f30bd3da34a2"


def version_triple(version: str) -> list[int]:
    major, minor, patch = (version.split(".") + ["0", "0"])[:3]
    return [int(major), int(minor), int(patch)]


def sync_manifest_versions(version: str) -> None:
    ver = version_triple(version)
    bp_name = f"Food BP v{version}"
    rp_name = f"Food RP v{version}"

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


def sync_pack_icons() -> None:
    if not PACK_ICON.exists():
        return
    shutil.copy2(PACK_ICON, BP / "pack_icon.png")
    shutil.copy2(PACK_ICON, RP / "pack_icon.png")


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
        stew = zf.read("items/rejuvenating_honeyroot_stew.json").decode("utf-8")
        assert '"nutrition": 20' in stew, "honeyroot stew nutrition not updated"
        assert '"saturation_modifier": 0.5' in stew, "honeyroot stew saturation not updated"
        assert '"heal": 10' in stew, "honeyroot stew instant heal missing"
        assert "regeneration" not in stew, "honeyroot stew still has regeneration"
        spider_eye = zf.read("items/spider_eye.json").decode("utf-8")
        assert '"minecraft:max_stack_size": 64' in spider_eye, "spider_eye stack not 64"
        beef = zf.read("items/beef.json").decode("utf-8")
        assert '"minecraft:max_stack_size": 64' in beef, "raw beef stack not 64"
        cooked_beef = zf.read("items/cooked_beef.json").decode("utf-8")
        assert '"minecraft:max_stack_size": 1' in cooked_beef, "cooked beef stack not 1"
        potato = zf.read("items/potato.json").decode("utf-8")
        assert '"minecraft:max_stack_size": 64' in potato, "potato stack not restored to 64"
        cookie = zf.read("items/cookie.json").decode("utf-8")
        assert '"minecraft:max_stack_size": 64' in cookie, "cookie stack not restored to 64"
        bread = zf.read("items/bread.json").decode("utf-8")
        assert '"minecraft:max_stack_size": 16' in bread, "bread stack should stay 16"
        assert '"saturation_modifier": "poor"' in bread, "bread saturation not poor"
        carrot = zf.read("items/carrot.json").decode("utf-8")
        assert '"saturation_modifier": "poor"' in carrot, "carrot saturation not poor"
        golden_carrot = zf.read("items/golden_carrot.json").decode("utf-8")
        assert '"saturation_modifier": "low"' in golden_carrot, "golden carrot saturation not low"
        chicken = zf.read("entities/chicken.json").decode("utf-8")
        assert '"min_wait_time": 1200' in chicken, "chicken egg min wait not 1200s"
        assert '"max_wait_time": 2400' in chicken, "chicken egg max wait not 2400s"
        assert '"min_wait_time": 300' not in chicken, "chicken still uses vanilla egg timer"
        hunger_mobs = zf.read("scripts/hunger_mobs.js").decode("utf-8")
        assert "isSleeping" in hunger_mobs, "wake hunger isSleeping poll missing"
        assert "skippedNight" in hunger_mobs, "wake hunger night-skip gate missing"
        assert "minecraft:player.saturation" in hunger_mobs, "wake hunger saturation drain missing"
        assert "effect @s hunger" in hunger_mobs, "wake hunger command fallback missing"
        skeleton_spawn = zf.read("spawn_rules/minecraft/skeleton.json").decode("utf-8")
        assert '"default": 60' in skeleton_spawn, "skeleton overworld weight not 60"
        assert '"max_size": 1' in skeleton_spawn, "skeleton herd not 1"
        witch_spawn = zf.read("spawn_rules/minecraft/witch.json").decode("utf-8")
        assert '"default": 50' in witch_spawn, "witch weight not 50"
        ghast_spawn = zf.read("spawn_rules/minecraft/ghast.json").decode("utf-8")
        assert '"default": 80' in ghast_spawn, "ghast weight not 80"
        pigman_spawn = zf.read("spawn_rules/minecraft/zombie_pigman.json").decode("utf-8")
        assert '"default": 60' in pigman_spawn, "zombified piglin weight not 60"
        magma_spawn = zf.read("spawn_rules/minecraft/magma_cube.json").decode("utf-8")
        assert '"max_size": 2' in magma_spawn, "magma cube herd not 1-2"
        phantom_loot = zf.read("loot_tables/entities/phantom.json").decode("utf-8")
        assert "phantom_membrane" in phantom_loot, "phantom membrane missing"
        assert "minecraft:bone" not in phantom_loot, "phantom loot still drops bones"
        zombie = zf.read("entities/zombie.json").decode("utf-8")
        assert "minecraft:behavior.hurt_by_target" in zombie, "zombie retaliation missing"
        assert "minecraft:spawn_as_rider" in zombie, "zombie horse rider event missing"
        zombie_spawn = zf.read("spawn_rules/minecraft/zombie.json").decode("utf-8")
        assert '"moon_phase"' not in zombie_spawn, "spawn_rules moon_phase does not work; gating is script-only"
        assert '"default": 100' in zombie_spawn, "overworld zombie spawn weight was zeroed"
        nether_spawn = zf.read("spawn_rules/minecraft/wither_skeleton.json").decode("utf-8")
        assert '"moon_phase"' not in nether_spawn, "nether spawn should not use moon phase"
        scripts = zf.read("scripts/fullmoon_spawns.js").decode("utf-8")
        assert "doMobSpawning" in scripts, "full moon doMobSpawning gate missing"
        assert "enterQuietMoon" in scripts, "quiet moon spawn gate missing"
        assert "isQuietMoon" in scripts, "isQuietMoon export missing"
        assert 'applyLevel("peaceful")' not in scripts, "should not switch peaceful difficulty"
        assert "entitySpawn" not in scripts, "quiet moon should not cull spawned entities"
        breed = zf.read("scripts/quiet_moon_breed.js").decode("utf-8")
        assert "playerInteractWithEntity" in breed, "quiet moon meat-animal breed block missing"
        assert "MEAT_ANIMAL_BREED_FEEDS" in breed, "meat animal breed feed table missing"
        horse = zf.read("entities/zombie_horse.json").decode("utf-8")
        assert "minecraft:spawn_adult_with_rider" in horse or "spawn_as_rider" in horse, "zombie horse missing rider"
        zombie_villager = zf.read("entities/zombie_villager_v2.json").decode("utf-8")
        assert "minecraft:behavior.hurt_by_target" in zombie_villager, "zombie villager retaliation missing"
        for hunter in ("entities/zombie.json", "entities/husk.json", "entities/drowned.json"):
            hunter_json = zf.read(hunter).decode("utf-8")
            assert '"value": "illager"' in hunter_json, f"{hunter} missing illager hunt"
            assert '"value": "witch"' in hunter_json, f"{hunter} missing witch hunt"
        for convert in (
            "entities/witch.json",
            "entities/pillager.json",
            "entities/vindicator.json",
            "entities/evocation_illager.json",
        ):
            convert_json = zf.read(convert).decode("utf-8")
            assert '"cause": "entity_attack"' in convert_json, f"{convert} conversion must require entity attack"
            assert '"value": "minecraft:zombie"' not in convert_json, f"{convert} conversion should not use loose is_type checks"
        spider = zf.read("entities/spider.json").decode("utf-8")
        assert "breedable" not in spider, "food pack spider should not keep breeding"
        assert "leashable" not in spider, "food pack spider should not keep leash"
        assert "spider_baby" not in spider, "food pack spider should not keep baby group"
        ghast = zf.read("entities/ghast.json").decode("utf-8")
        assert "has_ranged_weapon" in ghast, "ghast should only aggro on bow/crossbow"
        assert '"trident"' in ghast, "ghast should aggro on trident"
        assert "minecraft:behavior.hurt_by_target" in ghast, "ghast retaliation missing"
        assert "minecraft:shooter" in ghast, "ghast fireball shooter missing"
    with zipfile.ZipFile(RP_MCPACK) as zf:
        rp_manifest = json.loads(zf.read("manifest.json").decode("utf-8"))
        rp_text = zf.read("manifest.json").decode("utf-8")
        assert '"product_type"' in rp_text and '"addon"' in rp_text, "RP missing addon product_type for Vibrant Visuals"
        assert '"pbr"' in rp_text, "RP missing pbr capability for Vibrant Visuals"
        assert rp_manifest["header"]["version"] == version_triple(VERSION)
        bp_manifest = json.loads(zipfile.ZipFile(BP_MCPACK).read("manifest.json").decode("utf-8"))
        assert bp_manifest["header"]["name"] != rp_manifest["header"]["name"], "BP/RP must use distinct manifest names"
        rp_lang = zf.read("texts/en_US.lang").decode("utf-8")
        assert "Arpeggy" not in rp_lang, "RP still contains Arpeggy BetterEnch tips"
        assert "enchantment.arrowDamage" not in rp_lang, "RP still contains BetterEnch enchantment prefixes"
        assert "\uE1F0" not in rp_lang, "RP still contains hunger glyphs"
    assert not (RP / "font").exists(), "RP font/ (BetterEnch glyphs) must stay out of the live pack"
    assert MCADDON.stat().st_size > 1024, "mcaddon too small"


def main() -> None:
    EXPORT.mkdir(parents=True, exist_ok=True)
    sync_manifest_versions(VERSION)
    sync_pack_icons()
    zip_dir(BP, BP_MCPACK)
    zip_dir(RP, RP_MCPACK)
    zip_files([BP_MCPACK, RP_MCPACK], MCADDON)
    export_ios_folders()
    (EXPORT / "VERSION.txt").write_text(
        f"食物包 v{VERSION}\nBP {BP_UUID}\nRP {RP_UUID}\n",
        encoding="utf-8",
    )
    verify()
    publish_release()
    print(f"Packed {MCADDON}")
    print(f"  Release copy: {RELEASE / MCADDON.name}")
    print(f"  BP  {BP_MCPACK} ({BP_MCPACK.stat().st_size} bytes)")
    print(f"  RP  {RP_MCPACK} ({RP_MCPACK.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
