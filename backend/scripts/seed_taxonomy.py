import asyncio
import logging
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy import select  # noqa: E402
from src.core.database import async_session_factory  # noqa: E402
from src.modules.catalog.models import CategoryModel, TagModel  # noqa: E402
from src.modules.catalog.schemas import slugify  # noqa: E402

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("seed_taxonomy")


def find_taxonomy_file(filename: str) -> Path:
    candidates = [
        Path.cwd() / "data" / "taxonomy" / filename,
        backend_dir.parent / "data" / "taxonomy" / filename,
        backend_dir / "data" / "taxonomy" / filename,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"Could not locate taxonomy file: {filename}")


async def seed_categories() -> int:
    cat_file = find_taxonomy_file("source-taxonomy-categories.txt")
    logger.info(f"Reading categories from {cat_file}")

    with open(cat_file, "r", encoding="utf-8") as f:
        raw_lines = f.readlines()

    clean_names = []
    seen_slugs = set()

    for line in raw_lines:
        line = line.strip()
        if not line or line == "|":
            continue
        slug = slugify(line)
        if not slug or slug in seen_slugs:
            continue
        seen_slugs.add(slug)
        clean_names.append((line, slug))

    logger.info(f"Found {len(clean_names)} unique categories to verify/seed")

    seeded_count = 0
    async with async_session_factory() as session:
        for idx, (name, slug) in enumerate(clean_names, start=1):
            stmt = select(CategoryModel).where(CategoryModel.slug == slug)
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()

            if not existing:
                category = CategoryModel(
                    name=name,
                    slug=slug,
                    description=f"Curated {name} AI tools, workflows, and software solutions.",
                    seo_title=f"Best AI Tools for {name} (2026) | AIToolsFinder",
                    seo_description=f"Discover, compare, and choose the top AI tools for {name}. In-depth feature benchmarks and verified pricing.",
                    is_active=True,
                    sort_order=idx * 10,
                )
                session.add(category)
                seeded_count += 1
            else:
                # Update sort_order and name if necessary
                existing.is_active = True
                existing.sort_order = idx * 10

        await session.commit()

    logger.info(f"Successfully processed categories: {seeded_count} newly inserted.")
    return seeded_count


async def seed_tags() -> int:
    tag_file = find_taxonomy_file("source-taxonomy-tags.txt")
    logger.info(f"Reading tags from {tag_file}")

    with open(tag_file, "r", encoding="utf-8") as f:
        raw_lines = f.readlines()

    clean_tags = []
    seen_slugs = set()

    for line in raw_lines:
        line = line.strip()
        if not line:
            continue
        if line.startswith("#"):
            line = line[1:].strip()
        if not line:
            continue
        slug = slugify(line)
        if not slug or slug in seen_slugs:
            continue
        seen_slugs.add(slug)
        clean_tags.append((line, slug))

    logger.info(f"Found {len(clean_tags)} unique tags to verify/seed")

    seeded_count = 0
    async with async_session_factory() as session:
        for name, slug in clean_tags:
            stmt = select(TagModel).where(TagModel.slug == slug)
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()

            if not existing:
                tag = TagModel(name=name, slug=slug)
                session.add(tag)
                seeded_count += 1

        await session.commit()

    logger.info(f"Successfully processed tags: {seeded_count} newly inserted.")
    return seeded_count


async def main():
    logger.info("Starting Taxonomy Seeding for https://aitoolsfinder.cloud...")
    try:
        await seed_categories()
        await seed_tags()
        logger.info("Taxonomy seeding completed successfully!")
    except Exception as e:
        logger.error(f"Error seeding taxonomy: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
