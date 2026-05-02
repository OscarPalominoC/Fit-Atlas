import asyncio
from app.database import init_db
from app.models import User, Exercise

async def main():
    await init_db()
    users = await User.find_all().to_list()
    print(f"Found {len(users)} users:")
    for u in users:
        print(f"- {u.name} ({u.email}) created at {u.created_at}")
        
    ex_count = await Exercise.find_all().count()
    print(f"Found {ex_count} exercises.")

asyncio.run(main())
