"""Migrate image-metadata-cache.json to new Cloudinary emakimono/ public_ids."""

from __future__ import annotations

import json
import os
import re
import shutil
from collections import defaultdict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CACHE_PATH = REPO_ROOT / "src/data/image-metadata-cache/image-metadata-cache.json"
ENV_PATH = REPO_ROOT / ".env.local"

TITLEEN_TO_PREFIX = {
    "Chōjū-jinbutsu-giga_first": "choju-giga-yamazaki-kou",
    "Chōjū-jinbutsu-giga_second": "choju-giga-yamazaki-otu",
    "Chōjū-jinbutsu-giga_third": "choju-giga-yamazaki-hei",
    "Chōjū-jinbutsu-giga_fourth": "choju-giga-yamazaki-tei",
    "kusouzumaki": "kuso-zu-emaki",
    "kusouzu_kobayasieieitaku": "kusouzu-eitaku",
    "kusoushiemaki": "kusoushi-emaki",
    "nine-stages-of-decay-empress-danrin": "kusouzu-honolulu",
}

SORT_TAIL_RE = re.compile(r"_(\d+)_(\d+)__(\d+)$")
SORT_STD_RE = re.compile(r"_(\d+)_(\d+)_(\d+)$")


def load_env() -> None:
    with open(ENV_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip()


def sort_key(public_id: str) -> tuple[int, int, int]:
    local = public_id.replace("emakimono/", "", 1)
    if "__" in local:
        local = local.split("__", 1)[1]
    m = SORT_TAIL_RE.search(local) or SORT_STD_RE.search(local)
    if m:
        return (int(m.group(1)), int(m.group(2)), int(m.group(3)))
    return (999, 999, 999)


def belongs_to_prefix(public_id: str, prefix: str) -> bool:
    return prefix in public_id


def make_src(resource: dict) -> str:
    pid = resource["public_id"]
    fmt = resource.get("format") or "jpg"
    version = resource.get("version")
    if version:
        return f"v{version}/{pid}.{fmt}"
    return f"{pid}.{fmt}"


def is_visual_image_slot(entry: dict) -> bool:
    if entry.get("cat") == "image":
        return True
    if entry.get("cat") == "ekotoba" and entry.get("src"):
        return True
    if entry.get("config") == "cloudinary" and entry.get("src"):
        return True
    return False


def make_image_entry(res: dict) -> dict:
    return {
        "cat": "image",
        "chapter": "",
        "config": "cloudinary",
        "src": make_src(res),
        "name": res["public_id"].replace("emakimono/", "", 1),
        "srcWidth": res.get("width") or 0,
        "srcHeight": res.get("height") or 0,
    }


def apply_cloud_image(entry: dict, res: dict) -> None:
    entry["config"] = "cloudinary"
    entry["src"] = make_src(res)
    entry["name"] = res["public_id"].replace("emakimono/", "", 1)
    entry["srcWidth"] = res.get("width") or 0
    entry["srcHeight"] = res.get("height") or 0


def update_cache_entry(entry: dict, cloud_images: list[dict]) -> dict:
    emakis = entry.get("emakis", [])
    slot_indices = [i for i, e in enumerate(emakis) if is_visual_image_slot(e)]

    if len(cloud_images) != len(slot_indices):
        print(
            f"  WARN {entry['titleen']}: {len(slot_indices)} visual slots, "
            f"Cloudinary {len(cloud_images)} images"
        )

    for idx, emaki_idx in enumerate(slot_indices):
        if idx >= len(cloud_images):
            emakis[emaki_idx]["config"] = ""
            emakis[emaki_idx]["src"] = ""
            continue
        apply_cloud_image(emakis[emaki_idx], cloud_images[idx])

    for res in cloud_images[len(slot_indices):]:
        emakis.append(make_image_entry(res))
        print(f"    + appended: {make_src(res)[:65]}...")

    entry["emakis"] = emakis
    return entry


def fetch_all_resources() -> list[dict]:
    import cloudinary
    import cloudinary.api

    cloudinary.config(
        cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
        api_key=os.environ["CLOUDINARY_API_KEY"],
        api_secret=os.environ["CLOUDINARY_API_SECRET"],
    )

    all_resources: list[dict] = []
    next_cursor = None
    while True:
        kwargs: dict = {"type": "upload", "prefix": "emakimono/", "max_results": 500}
        if next_cursor:
            kwargs["next_cursor"] = next_cursor
        result = cloudinary.api.resources(**kwargs)
        all_resources.extend(result.get("resources", []))
        next_cursor = result.get("next_cursor")
        if not next_cursor:
            break
    return all_resources


def group_by_titleen(resources: list[dict]) -> dict[str, list[dict]]:
    groups: dict[str, list[dict]] = defaultdict(list)
    for res in resources:
        pid = res["public_id"]
        for titleen, prefix in TITLEEN_TO_PREFIX.items():
            if belongs_to_prefix(pid, prefix):
                groups[titleen].append(res)
                break
    for titleen in groups:
        groups[titleen].sort(key=lambda r: sort_key(r["public_id"]))
    return groups


def main() -> None:
    load_env()
    resources = fetch_all_resources()
    print(f"Fetched {len(resources)} resources from emakimono/")

    groups = group_by_titleen(resources)
    for titleen, imgs in sorted(groups.items()):
        print(f"  {titleen}: {len(imgs)} images")

    # Restore from pre-migrate backup if present (idempotent re-run)
    bak = CACHE_PATH.with_suffix(".json.pre-migrate.bak")
    source = bak if bak.exists() else CACHE_PATH
    with open(source, encoding="utf-8") as f:
        cache = json.load(f)
    print(f"Source: {source.name}")

    updated = 0
    for entry in cache:
        titleen = entry.get("titleen", "")
        if titleen not in TITLEEN_TO_PREFIX:
            continue
        if titleen not in groups:
            print(f"  SKIP {titleen}: no Cloudinary images")
            continue
        cloud_images = groups[titleen]
        update_cache_entry(entry, cloud_images)
        sample = make_src(cloud_images[0])[:70]
        print(f"  UPDATED {titleen} ({len(cloud_images)} imgs) sample={sample}...")
        updated += 1

    shutil.copy2(CACHE_PATH, CACHE_PATH.with_suffix(".json.pre-migrate2.bak"))
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

    print(f"\nDone: {updated} entries updated → {CACHE_PATH}")


if __name__ == "__main__":
    main()
