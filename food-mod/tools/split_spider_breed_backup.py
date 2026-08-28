"""Copy spider breed/baby/leash into a standalone backup pack, then restore official spider in Food."""
import json
import shutil
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FOOD = ROOT / "food mod"
BACKUP = ROOT / "spider_breed_backup"
BP_SRC = FOOD / "BP"
RP_SRC = FOOD / "RP"
OFFICIAL_SPIDER = (
    "https://raw.githubusercontent.com/Mojang/bedrock-samples/"
    "v1.21.130.3/behavior_pack/entities/spider.json"
)

BP_UUID = "7c4e2b91-6a18-4f5d-b3c0-9d8e1a47f602"
BP_MOD = "2a9f6d14-8c3b-4e70-a1d5-6b0c9e8f3471"
RP_UUID = "e5b8d0c3-1f47-4a96-8e2b-5c7d9a0f1843"
RP_MOD = "91c4a7e2-3d58-4b1f-9e06-8a2f5c7d4b90"


def write_lang(path: Path, name: str, description: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"pack.name={name}\npack.description={description}\n", encoding="utf-8")


def create_backup() -> None:
    if BACKUP.exists():
        shutil.rmtree(BACKUP)

    copies = [
        (BP_SRC / "entities" / "spider.json", BACKUP / "BP" / "entities" / "spider.json"),
        (RP_SRC / "entity" / "spider.entity.json", BACKUP / "RP" / "entity" / "spider.entity.json"),
        (RP_SRC / "models" / "entity" / "spider.geo.json", BACKUP / "RP" / "models" / "entity" / "spider.geo.json"),
        (
            RP_SRC / "models" / "entity" / "spider_baby.geo.json",
            BACKUP / "RP" / "models" / "entity" / "spider_baby.geo.json",
        ),
        (
            RP_SRC / "render_controllers" / "spider.render_controllers.json",
            BACKUP / "RP" / "render_controllers" / "spider.render_controllers.json",
        ),
        (
            RP_SRC / "textures" / "entity" / "spider" / "spider_baby.png",
            BACKUP / "RP" / "textures" / "entity" / "spider" / "spider_baby.png",
        ),
        (
            RP_SRC / "textures" / "entity" / "spider" / "spider_baby_eyes.png",
            BACKUP / "RP" / "textures" / "entity" / "spider" / "spider_baby_eyes.png",
        ),
    ]
    for src, dst in copies:
        if not src.exists():
            raise FileNotFoundError(src)
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)

    icon = FOOD / "pack_icon.png"
    if icon.exists():
        for dest in (BACKUP / "BP" / "pack_icon.png", BACKUP / "RP" / "pack_icon.png", BACKUP / "pack_icon.png"):
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(icon, dest)

    (BACKUP / "BP" / "manifest.json").write_text(
        json.dumps(
            {
                "format_version": 2,
                "header": {
                    "name": "pack.name",
                    "description": "pack.description",
                    "uuid": BP_UUID,
                    "version": [1, 0, 0],
                    "min_engine_version": [1, 21, 130],
                },
                "modules": [
                    {
                        "description": "Behavior",
                        "type": "data",
                        "uuid": BP_MOD,
                        "version": [1, 0, 0],
                    }
                ],
                "dependencies": [{"uuid": RP_UUID, "version": [1, 0, 0]}],
                "metadata": {"product_type": "addon"},
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    (BACKUP / "RP" / "manifest.json").write_text(
        json.dumps(
            {
                "format_version": 2,
                "header": {
                    "name": "pack.name",
                    "description": "pack.description",
                    "uuid": RP_UUID,
                    "version": [1, 0, 0],
                    "min_engine_version": [1, 21, 130],
                },
                "modules": [
                    {
                        "description": "Resources",
                        "type": "resources",
                        "uuid": RP_MOD,
                        "version": [1, 0, 0],
                    }
                ],
                "capabilities": ["pbr"],
                "metadata": {"product_type": "addon"},
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    write_lang(
        BACKUP / "BP" / "texts" / "en_US.lang",
        "My Pack Spider Breed (Backup)",
        "Backup: rotten-flesh breeding, baby spiders, and leash. Put this pack above Food if you want the old spider back.",
    )
    write_lang(
        BACKUP / "BP" / "texts" / "zh_CN.lang",
        "My Pack 蜘蛛繁殖（备份）",
        "备份：腐肉繁殖、幼年蜘蛛、栓绳。若要恢复旧蜘蛛，把本包放在食物包之上。",
    )
    write_lang(
        BACKUP / "RP" / "texts" / "en_US.lang",
        "My Pack Spider Breed (Backup)",
        "Backup: rotten-flesh breeding, baby spiders, and leash.",
    )
    write_lang(
        BACKUP / "RP" / "texts" / "zh_CN.lang",
        "My Pack 蜘蛛繁殖（备份）",
        "备份：腐肉繁殖、幼年蜘蛛、栓绳。",
    )
    (BACKUP / "RP" / "texts" / "languages.json").write_text('[\n  "en_US",\n  "zh_CN"\n]\n', encoding="utf-8")

    spider = json.loads((BACKUP / "BP" / "entities" / "spider.json").read_text(encoding="utf-8"))
    comps = spider["minecraft:entity"]["components"]
    groups = spider["minecraft:entity"]["component_groups"]
    assert "minecraft:leashable" in comps
    assert "minecraft:spider_baby" in groups
    assert "minecraft:breedable" in groups["minecraft:spider_adult"]


def restore_food_spider() -> None:
    dest = BP_SRC / "entities" / "spider.json"
    with urllib.request.urlopen(OFFICIAL_SPIDER, timeout=30) as resp:
        dest.write_bytes(resp.read())
    official = json.loads(dest.read_text(encoding="utf-8"))
    comps = official["minecraft:entity"]["components"]
    groups = official["minecraft:entity"]["component_groups"]
    assert "minecraft:leashable" not in comps
    assert "minecraft:spider_baby" not in groups
    assert "minecraft:breedable" not in json.dumps(official)

    rp_remove = [
        RP_SRC / "entity" / "spider.entity.json",
        RP_SRC / "models" / "entity" / "spider.geo.json",
        RP_SRC / "models" / "entity" / "spider_baby.geo.json",
        RP_SRC / "render_controllers" / "spider.render_controllers.json",
        RP_SRC / "textures" / "entity" / "spider" / "spider_baby.png",
        RP_SRC / "textures" / "entity" / "spider" / "spider_baby_eyes.png",
    ]
    for path in rp_remove:
        if path.exists():
            path.unlink()
    spider_tex = RP_SRC / "textures" / "entity" / "spider"
    if spider_tex.exists() and not any(spider_tex.iterdir()):
        spider_tex.rmdir()
    models_entity = RP_SRC / "models" / "entity"
    if models_entity.exists() and not any(models_entity.iterdir()):
        models_entity.rmdir()
        models = RP_SRC / "models"
        if models.exists() and not any(models.iterdir()):
            models.rmdir()
    entity_dir = RP_SRC / "entity"
    if entity_dir.exists() and not any(entity_dir.iterdir()):
        entity_dir.rmdir()
    rc_dir = RP_SRC / "render_controllers"
    if rc_dir.exists() and not any(rc_dir.iterdir()):
        rc_dir.rmdir()


def patch_food_descriptions() -> None:
    replacements = [
        (
            FOOD / "BP" / "texts" / "en_US.lang",
            "Potion stews, baby spiders, mob tweaks, and piglin reputation.",
            "Potion stews, mob tweaks, and piglin reputation.",
        ),
        (
            FOOD / "RP" / "texts" / "en_US.lang",
            "Potion stews, baby spiders, mob tweaks, and piglin reputation.",
            "Potion stews, mob tweaks, and piglin reputation.",
        ),
        (
            FOOD / "BP" / "texts" / "zh_CN.lang",
            "药剂炖菜、幼年蜘蛛、怪物调整与猪灵声望。",
            "药剂炖菜、怪物调整与猪灵声望。",
        ),
        (
            FOOD / "RP" / "texts" / "zh_CN.lang",
            "药剂炖菜、幼年蜘蛛、怪物调整与猪灵声望。",
            "药剂炖菜、怪物调整与猪灵声望。",
        ),
    ]
    for path, old, new in replacements:
        text = path.read_text(encoding="utf-8")
        if old not in text:
            raise ValueError(f"missing description in {path}")
        path.write_text(text.replace(old, new, 1), encoding="utf-8")


def bump_food_version() -> None:
    bp = json.loads((FOOD / "BP" / "manifest.json").read_text(encoding="utf-8"))
    bp["header"]["version"] = [1, 0, 34]
    for module in bp["modules"]:
        module["version"] = [1, 0, 34]
    for dep in bp["dependencies"]:
        if "uuid" in dep:
            dep["version"] = [1, 0, 34]
    (FOOD / "BP" / "manifest.json").write_text(json.dumps(bp, indent=2) + "\n", encoding="utf-8")

    rp = json.loads((FOOD / "RP" / "manifest.json").read_text(encoding="utf-8"))
    rp["header"]["version"] = [1, 0, 34]
    (FOOD / "RP" / "manifest.json").write_text(json.dumps(rp, indent=2) + "\n", encoding="utf-8")

    export_py = FOOD / "tools" / "pack_export.py"
    text = export_py.read_text(encoding="utf-8")
    export_py.write_text(text.replace('VERSION = "1.0.33"', 'VERSION = "1.0.34"'), encoding="utf-8")


def write_backup_export() -> None:
    (BACKUP / "tools").mkdir(parents=True, exist_ok=True)
    (BACKUP / "tools" / "pack_export.py").write_text(
        '''"""Pack spider breed backup BP + RP into export/."""
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BP = ROOT / "BP"
RP = ROOT / "RP"
EXPORT = ROOT / "export"
VERSION = "1.0.0"
PREFIX = f"My_Pack_Spider_Breed_Backup_v{VERSION}"
BP_MCPACK = EXPORT / f"{PREFIX}_BP.mcpack"
RP_MCPACK = EXPORT / f"{PREFIX}_RP.mcpack"
MCADDON = EXPORT / f"{PREFIX}.mcaddon"


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


def main() -> None:
    EXPORT.mkdir(parents=True, exist_ok=True)
    zip_dir(BP, BP_MCPACK)
    zip_dir(RP, RP_MCPACK)
    zip_files([BP_MCPACK, RP_MCPACK], MCADDON)
    with zipfile.ZipFile(BP_MCPACK) as zf:
        spider = zf.read("entities/spider.json").decode("utf-8")
        assert "minecraft:leashable" in spider
        assert "minecraft:spider_baby" in spider
        assert "breedable" in spider
    print(f"Packed {MCADDON}")
    print(f"  BP  {BP_MCPACK} ({BP_MCPACK.stat().st_size} bytes)")
    print(f"  RP  {RP_MCPACK} ({RP_MCPACK.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
''',
        encoding="utf-8",
    )


def main() -> None:
    create_backup()
    write_backup_export()
    restore_food_spider()
    patch_food_descriptions()
    bump_food_version()
    print(f"backup: {BACKUP}")
    print("food spider restored to official 1.21.130")


if __name__ == "__main__":
    main()
