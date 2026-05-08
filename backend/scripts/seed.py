import asyncio
import json
import os
from app.database import init_db
from app.models import MuscleGroup, Exercise, Stretch, MovementPattern, LocalizedList, ExerciseMedia
from scripts.exercises_data import exercises_data
from scripts.stretches_data import stretches_data

try:
    from scripts.exercise_media_assets import EXERCISE_MEDIA_BY_SLUG
except ImportError:
    EXERCISE_MEDIA_BY_SLUG = {}

async def seed():
    await init_db()
    
    # Migrate legacy array fields to LocalizedList structure before Beanie queries them
    from motor.motor_asyncio import AsyncIOMotorClient
    import os
    client = AsyncIOMotorClient(os.getenv("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.getenv("DATABASE_NAME", "fitatlas")]
    exercise_coll = db["exercises"]
    
    await exercise_coll.update_many(
        {"movement_patterns": {"$type": "array"}},
        {"$set": {"movement_patterns": {"en": [], "es": []}}}
    )
    await exercise_coll.update_many(
        {"instructions": {"$type": "array"}},
        {"$set": {"instructions": {"en": [], "es": []}}}
    )
    
    print("Checking Muscles...")
    muscles = [
        MuscleGroup(name="Chest", region="upper", svg_region_id="chest_region"),
        MuscleGroup(name="Back", region="upper", svg_region_id="back_region"),
        MuscleGroup(name="Quads", region="lower", svg_region_id="quads_region"),
        MuscleGroup(name="Hamstrings", region="lower", svg_region_id="hams_region"),
        MuscleGroup(name="Biceps", region="upper", svg_region_id="biceps_region"),
        MuscleGroup(name="Triceps", region="upper", svg_region_id="triceps_region"),
        MuscleGroup(name="Shoulders", region="upper", svg_region_id="shoulders_region"),
        MuscleGroup(name="Abs", region="core", svg_region_id="abs_region"),
        MuscleGroup(name="Forearm", region="upper", svg_region_id="forearm_region"),
        MuscleGroup(name="Traps", region="upper", svg_region_id="traps_region"),
        MuscleGroup(name="Lower Back", region="core", svg_region_id="lower_back_region"),
        MuscleGroup(name="Obliques", region="core", svg_region_id="obliques_region"),
        MuscleGroup(name="Glutes", region="lower", svg_region_id="glutes_region"),
        MuscleGroup(name="Adductors", region="lower", svg_region_id="adductors_region"),
        MuscleGroup(name="Abductors", region="lower", svg_region_id="abductors_region"),
        MuscleGroup(name="Calves", region="lower", svg_region_id="calves_region"),
        MuscleGroup(name="Full Body", region="full", svg_region_id="full_body_region"),
        MuscleGroup(name="Cardio", region="full", svg_region_id="cardio_region"),
    ]
    for muscle in muscles:
        existing = await MuscleGroup.find_one(MuscleGroup.name == muscle.name)
        if not existing:
            await muscle.insert()
    
    print("Seeding/Updating Exercises...")
    for ex in exercises_data:
        slug = ex["name"].lower().replace(" ", "-").replace("/", "-")
        difficulty = 3 if "intermediate" in ex["tags"] else 5 if "advanced" in ex["tags"] else 1
        
        # Build the Localized models
        mov_pat = LocalizedList(en=ex["movement_patterns"]["en"], es=ex["movement_patterns"]["es"])
        inst = LocalizedList(en=ex["instructions"]["en"], es=ex["instructions"]["es"])

        existing_ex = await Exercise.find_one(Exercise.slug == slug)
        media_data = EXERCISE_MEDIA_BY_SLUG.get(slug)
        if existing_ex:
            # Update fields
            updated = False
            if existing_ex.secondary_muscles != ex["secondary"]:
                existing_ex.secondary_muscles = ex["secondary"]
                updated = True
            if existing_ex.equipment != ex["equipment"]:
                existing_ex.equipment = ex["equipment"]
                updated = True
            if existing_ex.movement_patterns != mov_pat:
                existing_ex.movement_patterns = mov_pat
                updated = True
            if existing_ex.instructions != inst:
                existing_ex.instructions = inst
                updated = True
            if existing_ex.tags != ex["tags"]:
                existing_ex.tags = ex["tags"]
                updated = True
            if media_data and existing_ex.media.gif != media_data.get("gif"):
                existing_ex.media = ExerciseMedia(**media_data)
                updated = True

            if updated:
                await existing_ex.save()
        else:
            # Create new
            new_ex = Exercise(
                name=ex["name"],
                slug=slug,
                primary_muscles=ex["primary"],
                secondary_muscles=ex["secondary"],
                movement_patterns=mov_pat,
                equipment=ex["equipment"],
                difficulty=difficulty,
                tags=ex["tags"],
                instructions=inst,
                media=ExerciseMedia(**media_data) if media_data else ExerciseMedia()
            )
            await new_ex.insert()
            
    print("Seeding/Updating Stretches...")
    for st in stretches_data:
        slug = st["name"].lower().replace(" ", "-").replace("/", "-")
        inst = LocalizedList(en=st["instructions"]["en"], es=st["instructions"]["es"])
        
        existing_st = await Stretch.find_one(Stretch.slug == slug)
        if existing_st:
            existing_st.instructions = inst
            existing_st.hold_duration_seconds = st["hold_duration_seconds"]
            existing_st.recovery_score = st["recovery_score"]
            existing_st.media = ExerciseMedia(**st["media"])
            await existing_st.save()
        else:
            new_st = Stretch(
                name=st["name"],
                slug=slug,
                primary_muscles=st["primary_muscles"],
                secondary_muscles=st["secondary_muscles"],
                stretch_type=st["stretch_type"],
                body_region=st["body_region"],
                difficulty=st["difficulty"],
                hold_duration_seconds=st["hold_duration_seconds"],
                instructions=inst,
                media=ExerciseMedia(**st["media"]),
                recovery_score=st["recovery_score"]
            )
            await new_st.insert()

    print("Fetching all exercises for frontend export...")
    all_exercises = await Exercise.find_all().to_list()
    
    # Generate JavaScript Dictionary
    frontend_dict = {}
    for ex in all_exercises:
        frontend_dict[str(ex.id)] = {
            "id": str(ex.id),
            "name": ex.name,
            "slug": ex.slug,
            "primary_muscles": ex.primary_muscles,
            "secondary_muscles": ex.secondary_muscles,
            "equipment": ex.equipment,
            "difficulty": ex.difficulty,
            "tags": ex.tags,
            "media": ex.media.model_dump(),
            "translations": {
                "en": {
                    "movement_patterns": ex.movement_patterns.en,
                    "instructions": ex.instructions.en
                },
                "es": {
                    "movement_patterns": ex.movement_patterns.es,
                    "instructions": ex.instructions.es
                }
            }
        }
    
    frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "src", "data", "exercises.ts"))
    os.makedirs(os.path.dirname(frontend_path), exist_ok=True)
    
    with open(frontend_path, "w", encoding="utf-8") as f:
        f.write("// Auto-generated exercise dictionary. Do not edit manually.\n")
        f.write("export const exercises: any = ")
        f.write(json.dumps(frontend_dict, ensure_ascii=False, indent=4))
        f.write(";\n")
    
    print(f"Database seeded/updated successfully! Frontend file saved to {frontend_path}")

    print("Exporting stretches for frontend...")
    all_stretches = await Stretch.find_all().to_list()
    stretches_dict = {}
    for st in all_stretches:
        stretches_dict[str(st.id)] = {
            "id": str(st.id),
            "name": st.name,
            "slug": st.slug,
            "primary_muscles": st.primary_muscles,
            "secondary_muscles": st.secondary_muscles,
            "stretch_type": st.stretch_type,
            "body_region": st.body_region,
            "difficulty": st.difficulty,
            "hold_duration_seconds": st.hold_duration_seconds,
            "recovery_score": st.recovery_score,
            "media": st.media.model_dump(),
            "translations": {
                "en": {
                    "instructions": st.instructions.en
                },
                "es": {
                    "instructions": st.instructions.es
                }
            }
        }
    
    frontend_stretches_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "src", "data", "stretches.ts"))
    with open(frontend_stretches_path, "w", encoding="utf-8") as f:
        f.write("// Auto-generated stretches dictionary. Do not edit manually.\n")
        f.write("export const stretches: any = ")
        f.write(json.dumps(stretches_dict, ensure_ascii=False, indent=4))
        f.write(";\n")
    
    print(f"Stretches exported successfully to {frontend_stretches_path}")

if __name__ == "__main__":
    asyncio.run(seed())
