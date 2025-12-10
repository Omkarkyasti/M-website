import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_database():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Clearing existing data...")
    await db.users.delete_many({})
    await db.movies.delete_many({})
    await db.theaters.delete_many({})
    await db.shows.delete_many({})
    await db.bookings.delete_many({})
    await db.payment_transactions.delete_many({})
    
    print("Creating admin user...")
    admin_user = {
        "id": str(uuid.uuid4()),
        "email": "admin@cinebook.com",
        "name": "Admin User",
        "password_hash": pwd_context.hash("admin123"),
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_user)
    print(f"Admin created: {admin_user['email']} / admin123")
    
    print("Creating test user...")
    test_user = {
        "id": str(uuid.uuid4()),
        "email": "user@test.com",
        "name": "Test User",
        "password_hash": pwd_context.hash("password123"),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(test_user)
    print(f"Test user created: {test_user['email']} / password123")
    
    print("Creating movies...")
    movies = [
        {
            "id": str(uuid.uuid4()),
            "title": "Quantum Nexus",
            "description": "A thrilling sci-fi adventure that explores parallel dimensions and the consequences of quantum entanglement. A team of scientists must prevent a catastrophic collapse of reality itself.",
            "genre": "Sci-Fi",
            "duration": 142,
            "rating": "PG-13",
            "poster_url": "https://images.unsplash.com/photo-1679573105903-724c7c2f9074?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwzfHxjaW5lbWF0aWMlMjBtb3ZpZSUyMHNjZW5lcyUyMGFjdGlvbiUyMHNjaS1maSUyMGRyYW1hfGVufDB8fHx8MTc2NTM2MDg0M3ww&ixlib=rb-4.1.0&q=85",
            "backdrop_url": "https://images.unsplash.com/photo-1653045474061-075ba29db54f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBtb3ZpZSUyMHNjZW5lcyUyMGFjdGlvbiUyMHNjaS1maSUyMGRyYW1hfGVufDB8fHx8MTc2NTM2MDg0M3ww&ixlib=rb-4.1.0&q=85",
            "release_date": "2025-01-15",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Velocity Rush",
            "description": "High-octane action meets street racing in this adrenaline-fueled thriller. A former champion returns to settle old scores in the underground racing scene.",
            "genre": "Action",
            "duration": 128,
            "rating": "PG-13",
            "poster_url": "https://images.unsplash.com/photo-1551651031-12f795db9e1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHxjaW5lbWF0aWMlMjBtb3ZpZSUyMHNjZW5lcyUyMGFjdGlvbiUyMHNjaS1maSUyMGRyYW1hfGVufDB8fHx8MTc2NTM2MDg0M3ww&ixlib=rb-4.1.0&q=85",
            "backdrop_url": "https://images.unsplash.com/photo-1653045474061-075ba29db54f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBtb3ZpZSUyMHNjZW5lcyUyMGFjdGlvbiUyMHNjaS1maSUyMGRyYW1hfGVufDB8fHx8MTc2NTM2MDg0M3ww&ixlib=rb-4.1.0&q=85",
            "release_date": "2025-02-01",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Crimson Shadows",
            "description": "A psychological thriller about a detective haunted by unsolved cases. As reality blurs, she must confront her darkest fears to uncover the truth.",
            "genre": "Thriller",
            "duration": 115,
            "rating": "R",
            "poster_url": "https://images.unsplash.com/photo-1696479670605-aeeb206e1fcb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHw0fHxjaW5lbWF0aWMlMjBtb3ZpZSUyMHNjZW5lcyUyMGFjdGlvbiUyMHNjaS1maSUyMGRyYW1hfGVufDB8fHx8MTc2NTM2MDg0M3ww&ixlib=rb-4.1.0&q=85",
            "backdrop_url": "https://images.unsplash.com/photo-1696479670605-aeeb206e1fcb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHw0fHxjaW5lbWF0aWMlMjBtb3ZpZSUyMHNjZW5lcyUyMGFjdGlvbiUyMHNjaS1maSUyMGRyYW1hfGVufDB8fHx8MTc2NTM2MDg0M3ww&ixlib=rb-4.1.0&q=85",
            "release_date": "2025-01-22",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Starbound Heroes",
            "description": "An epic space adventure where unlikely heroes band together to save the galaxy from an ancient cosmic threat. Friendship, courage, and destiny collide.",
            "genre": "Adventure",
            "duration": 156,
            "rating": "PG",
            "poster_url": "https://images.pexels.com/photos/8104843/pexels-photo-8104843.jpeg",
            "backdrop_url": "https://images.unsplash.com/photo-1653045474061-075ba29db54f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBtb3ZpZSUyMHNjZW5lcyUyMGFjdGlvbiUyMHNjaS1maSUyMGRyYW1hfGVufDB8fHx8MTc2NTM2MDg0M3ww&ixlib=rb-4.1.0&q=85",
            "release_date": "2025-03-05",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.movies.insert_many(movies)
    print(f"Created {len(movies)} movies")
    
    print("Creating theaters...")
    theaters = [
        {
            "id": str(uuid.uuid4()),
            "name": "Grand Cinema Plaza",
            "location": "Downtown, Main Street",
            "screens": [
                {
                    "screen_number": 1,
                    "total_seats": 50,
                    "seat_layout": {
                        "rows": ["A", "B", "C", "D", "E"],
                        "seats_per_row": 10
                    }
                },
                {
                    "screen_number": 2,
                    "total_seats": 40,
                    "seat_layout": {
                        "rows": ["A", "B", "C", "D"],
                        "seats_per_row": 10
                    }
                }
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Starlight Theater",
            "location": "Westside, Oak Avenue",
            "screens": [
                {
                    "screen_number": 1,
                    "total_seats": 60,
                    "seat_layout": {
                        "rows": ["A", "B", "C", "D", "E", "F"],
                        "seats_per_row": 10
                    }
                }
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.theaters.insert_many(theaters)
    print(f"Created {len(theaters)} theaters")
    
    print("Creating shows...")
    shows = []
    today = datetime.now(timezone.utc).date()
    
    for i in range(7):
        show_date = (today + timedelta(days=i)).isoformat()
        
        for movie in movies[:2]:
            for theater in theaters:
                shows.append({
                    "id": str(uuid.uuid4()),
                    "movie_id": movie["id"],
                    "theater_id": theater["id"],
                    "screen_number": 1,
                    "start_time": "14:00",
                    "end_time": "16:30",
                    "price": 12.50,
                    "date": show_date,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
                
                shows.append({
                    "id": str(uuid.uuid4()),
                    "movie_id": movie["id"],
                    "theater_id": theater["id"],
                    "screen_number": 1,
                    "start_time": "18:00",
                    "end_time": "20:30",
                    "price": 15.00,
                    "date": show_date,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
    
    await db.shows.insert_many(shows)
    print(f"Created {len(shows)} shows")
    
    print("\n=== Seed Data Summary ===")
    print(f"Admin: admin@cinebook.com / admin123")
    print(f"User: user@test.com / password123")
    print(f"Movies: {len(movies)}")
    print(f"Theaters: {len(theaters)}")
    print(f"Shows: {len(shows)}")
    print("=========================\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
