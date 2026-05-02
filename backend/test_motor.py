import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['fitatlas']
    
    count = await db['exercises'].count_documents({})
    print(f"Raw exercises count: {count}")
    
    docs = await db['exercises'].find().to_list(2)
    print(f"Sample docs: {docs}")

asyncio.run(main())
