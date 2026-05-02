import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    try:
        client = AsyncIOMotorClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000)
        databases = await client.list_database_names()
        print(f"Connected successfully. Databases: {databases}")
        
        db = client['fitatlas']
        collections = await db.list_collection_names()
        print(f"Collections in 'fitatlas': {collections}")
        
        users = await db['users'].count_documents({})
        exercises = await db['exercises'].count_documents({})
        print(f"Users count: {users}, Exercises count: {exercises}")
        
    except Exception as e:
        print(f"Connection failed: {e}")

asyncio.run(main())
