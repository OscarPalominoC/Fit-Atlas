import asyncio
from app.database import init_db
from app.models import Exercise, User

async def main():
    await init_db()
    count = await Exercise.find_all().count()
    users = await User.find_all().count()
    print(f"Beanie sees {count} exercises and {users} users.")

asyncio.run(main())
