import asyncio
import uuid
from datetime import datetime, timezone
from pathlib import Path

import bcrypt

from lib.db import db, ensure_indexes

DEMO_CUSTOMER_EMAIL = "demo@client.com"
DEMO_CUSTOMER_PASSWORD = "client2026"


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


GALLERY_SEED = [
    {"title": "Sindoor & Silk", "category": "Wedding", "caption": "A regal Kundapura wedding wrapped in bokeh and gold.", "location": "Kundapura", "meta": "85mm · f/1.8 · 1/250s", "image_url": "https://images.unsplash.com/photo-1722952934708-749c22eb2e58?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"title": "Riverside Vows", "category": "Wedding", "caption": "Traditional attire against the river rocks near the ghats.", "location": "Agumbe", "meta": "35mm · f/2.8 · 1/500s", "image_url": "https://images.unsplash.com/photo-1630526720753-aa4e71acf67d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"title": "Crimson & Ivory", "category": "Wedding", "caption": "A quiet forehead kiss before the muhurta.", "location": "Udupi", "meta": "50mm · f/1.4 · 1/320s", "image_url": "https://images.unsplash.com/photo-1599462616558-2b75fd26a283?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"title": "Forest Whisper", "category": "Pre-Wedding", "caption": "Walking the woods where the highway meets the ghats.", "location": "Agumbe", "meta": "35mm · f/2.0 · 1/400s", "image_url": "https://images.unsplash.com/photo-1735052712464-9d24b69be5f5?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"title": "Mountain Promise", "category": "Pre-Wedding", "caption": "Golden light over the ridgelines of Kodachadri.", "location": "Kodachadri", "meta": "24mm · f/4 · 1/640s", "image_url": "https://images.unsplash.com/photo-1776458026414-8b84103bf315?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"title": "Pine Trail", "category": "Pre-Wedding", "caption": "A run through the pines, hand in hand.", "location": "Agumbe", "meta": "50mm · f/2.2 · 1/500s", "image_url": "https://images.unsplash.com/photo-1785033156337-6d4910b405e6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"title": "Marigold Garden", "category": "Pre-Wedding", "caption": "Orange blooms and easy laughter.", "location": "Kundapura", "meta": "85mm · f/2.0 · 1/400s", "image_url": "https://images.unsplash.com/photo-1781145859040-26f2de37b37a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"title": "Golden Hour Us", "category": "Candid", "caption": "Foreheads touching as the sun dips at Malpe.", "location": "Malpe", "meta": "85mm · f/1.8 · 1/800s", "image_url": "https://images.unsplash.com/photo-1776458026426-804f19253669?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"title": "Coastal Dance", "category": "Candid", "caption": "Barefoot joy on the Arabian Sea shore.", "location": "Malpe Beach", "meta": "35mm · f/2.8 · 1/1000s", "image_url": "https://images.unsplash.com/photo-1745148521468-d2df1052fce4?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"title": "Ethnic Meadow", "category": "Pre-Wedding", "caption": "South Indian silk in a sea of green.", "location": "Udupi", "meta": "50mm · f/2.8 · 1/500s", "image_url": "https://images.unsplash.com/photo-1715285977619-6d9357168f46?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"title": "The Craft", "category": "Studio", "caption": "Bodies, primes and patience — the studio bench.", "location": "Balkur Studio", "meta": "Flat lay · studio strobes", "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"title": "Through the Lens", "category": "Studio", "caption": "Cinema glass, up close.", "location": "Balkur Studio", "meta": "Macro · f/8", "image_url": "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
]

async def seed_data():
    if await db.gallery.count_documents({}) == 0:
        now = _ts()
        docs = [
            {
                "id": str(uuid.uuid4()),
                **item,
                "storage_path": None,
                "visible": True,
                "is_deleted": False,
                "created_at": now,
            }
            for item in GALLERY_SEED
        ]
        await db.gallery.insert_many(docs)
        print(f"Seeded {len(docs)} gallery items")


if __name__ == "__main__":
    asyncio.run(ensure_indexes())
    asyncio.run(seed_data())
    print("Seed complete")
