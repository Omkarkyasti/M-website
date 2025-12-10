from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, show_id: str):
        await websocket.accept()
        if show_id not in self.active_connections:
            self.active_connections[show_id] = []
        self.active_connections[show_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, show_id: str):
        if show_id in self.active_connections:
            self.active_connections[show_id].remove(websocket)
    
    async def broadcast(self, show_id: str, message: dict):
        if show_id in self.active_connections:
            for connection in self.active_connections[show_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str

class Movie(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    genre: str
    duration: int
    rating: str
    poster_url: str
    backdrop_url: str
    release_date: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MovieCreate(BaseModel):
    title: str
    description: str
    genre: str
    duration: int
    rating: str
    poster_url: str
    backdrop_url: str
    release_date: str

class Theater(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str
    screens: List[dict]
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TheaterCreate(BaseModel):
    name: str
    location: str
    screens: List[dict]

class Show(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    movie_id: str
    theater_id: str
    screen_number: int
    start_time: str
    end_time: str
    price: float
    date: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ShowCreate(BaseModel):
    movie_id: str
    theater_id: str
    screen_number: int
    start_time: str
    end_time: str
    price: float
    date: str

class BookingCreate(BaseModel):
    show_id: str
    seats: List[str]
    
class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    show_id: str
    seats: List[str]
    total_amount: float
    status: str
    booking_time: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    payment_session_id: Optional[str] = None

@api_router.post("/auth/register")
async def register(user: UserRegister):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "name": user.name,
        "password_hash": hashed_password,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(new_user)
    
    access_token = create_access_token({"sub": new_user["id"], "role": new_user["role"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": new_user["id"], "email": new_user["email"], "name": new_user["name"], "role": new_user["role"]}
    }

@api_router.post("/auth/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token({"sub": db_user["id"], "role": db_user["role"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": db_user["id"], "email": db_user["email"], "name": db_user["name"], "role": db_user["role"]}
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

@api_router.get("/movies", response_model=List[Movie])
async def get_movies():
    movies = await db.movies.find({}, {"_id": 0}).to_list(1000)
    return movies

@api_router.get("/movies/{movie_id}", response_model=Movie)
async def get_movie(movie_id: str):
    movie = await db.movies.find_one({"id": movie_id}, {"_id": 0})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie

@api_router.get("/theaters", response_model=List[Theater])
async def get_theaters():
    theaters = await db.theaters.find({}, {"_id": 0}).to_list(1000)
    return theaters

@api_router.get("/theaters/{theater_id}", response_model=Theater)
async def get_theater(theater_id: str):
    theater = await db.theaters.find_one({"id": theater_id}, {"_id": 0})
    if not theater:
        raise HTTPException(status_code=404, detail="Theater not found")
    return theater

@api_router.get("/shows")
async def get_shows(movie_id: Optional[str] = None, date: Optional[str] = None, theater_id: Optional[str] = None):
    query = {}
    if movie_id:
        query["movie_id"] = movie_id
    if date:
        query["date"] = date
    if theater_id:
        query["theater_id"] = theater_id
    
    shows = await db.shows.find(query, {"_id": 0}).to_list(1000)
    return shows

@api_router.get("/shows/{show_id}")
async def get_show(show_id: str):
    show = await db.shows.find_one({"id": show_id}, {"_id": 0})
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
    return show

@api_router.get("/shows/{show_id}/seats")
async def get_seats(show_id: str):
    show = await db.shows.find_one({"id": show_id}, {"_id": 0})
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
    
    theater = await db.theaters.find_one({"id": show["theater_id"]}, {"_id": 0})
    screen = next((s for s in theater["screens"] if s["screen_number"] == show["screen_number"]), None)
    
    bookings = await db.bookings.find({"show_id": show_id, "status": {"$in": ["confirmed", "pending"]}}, {"_id": 0}).to_list(1000)
    booked_seats = []
    for booking in bookings:
        booked_seats.extend(booking["seats"])
    
    seat_layout = screen["seat_layout"]
    seats = []
    for row in seat_layout["rows"]:
        row_seats = []
        for i in range(seat_layout["seats_per_row"]):
            seat_number = f"{row}{i+1}"
            status = "booked" if seat_number in booked_seats else "available"
            row_seats.append({"seat_number": seat_number, "status": status})
        seats.append(row_seats)
    
    return {"show_id": show_id, "seats": seats, "price": show["price"]}

@app.websocket("/ws/seats/{show_id}")
async def websocket_endpoint(websocket: WebSocket, show_id: str):
    await manager.connect(websocket, show_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, show_id)

@api_router.post("/bookings")
async def create_booking(booking: BookingCreate, current_user: dict = Depends(get_current_user)):
    show = await db.shows.find_one({"id": booking.show_id}, {"_id": 0})
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
    
    bookings = await db.bookings.find({"show_id": booking.show_id, "status": {"$in": ["confirmed", "pending"]}}, {"_id": 0}).to_list(1000)
    booked_seats = []
    for b in bookings:
        booked_seats.extend(b["seats"])
    
    for seat in booking.seats:
        if seat in booked_seats:
            raise HTTPException(status_code=400, detail=f"Seat {seat} is already booked")
    
    total_amount = len(booking.seats) * show["price"]
    
    new_booking = Booking(
        user_id=current_user["id"],
        show_id=booking.show_id,
        seats=booking.seats,
        total_amount=total_amount,
        status="pending"
    )
    
    await db.bookings.insert_one(new_booking.model_dump())
    
    await manager.broadcast(booking.show_id, {
        "type": "seat_update",
        "seats": booking.seats,
        "status": "booked"
    })
    
    return new_booking.model_dump()

@api_router.get("/bookings/my")
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    bookings = await db.bookings.find({"user_id": current_user["id"]}, {"_id": 0}).sort("booking_time", -1).to_list(1000)
    
    for booking in bookings:
        show = await db.shows.find_one({"id": booking["show_id"]}, {"_id": 0})
        if show:
            movie = await db.movies.find_one({"id": show["movie_id"]}, {"_id": 0})
            theater = await db.theaters.find_one({"id": show["theater_id"]}, {"_id": 0})
            booking["show"] = show
            booking["movie"] = movie
            booking["theater"] = theater
    
    return bookings

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    show = await db.shows.find_one({"id": booking["show_id"]}, {"_id": 0})
    movie = await db.movies.find_one({"id": show["movie_id"]}, {"_id": 0})
    theater = await db.theaters.find_one({"id": show["theater_id"]}, {"_id": 0})
    
    booking["show"] = show
    booking["movie"] = movie
    booking["theater"] = theater
    
    return booking

@api_router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if booking["status"] == "cancelled":
        raise HTTPException(status_code=400, detail="Booking already cancelled")
    
    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": "cancelled"}})
    
    await manager.broadcast(booking["show_id"], {
        "type": "seat_update",
        "seats": booking["seats"],
        "status": "available"
    })
    
    return {"message": "Booking cancelled successfully"}

@api_router.post("/payments/checkout")
async def create_checkout_session(request: Request, booking_id: str, origin_url: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if booking["status"] != "pending":
        raise HTTPException(status_code=400, detail="Booking already processed")
    
    stripe_api_key = os.getenv("STRIPE_API_KEY")
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    success_url = f"{origin_url}/booking/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/booking/{booking['show_id']}"
    
    checkout_request = CheckoutSessionRequest(
        amount=booking["total_amount"],
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"booking_id": booking_id, "user_id": current_user["id"]}
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "booking_id": booking_id,
        "user_id": current_user["id"],
        "amount": booking["total_amount"],
        "currency": "usd",
        "status": "pending",
        "payment_status": "pending",
        "metadata": {"booking_id": booking_id},
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.bookings.update_one({"id": booking_id}, {"$set": {"payment_session_id": session.session_id}})
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, current_user: dict = Depends(get_current_user)):
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction["payment_status"] == "paid":
        return transaction
    
    stripe_api_key = os.getenv("STRIPE_API_KEY")
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
    
    checkout_status = await stripe_checkout.get_checkout_status(session_id)
    
    if checkout_status.payment_status == "paid" and transaction["payment_status"] != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": "complete", "payment_status": "paid"}}
        )
        
        await db.bookings.update_one(
            {"id": transaction["booking_id"]},
            {"$set": {"status": "confirmed"}}
        )
        
        transaction["status"] = "complete"
        transaction["payment_status"] = "paid"
    
    return transaction

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_api_key = os.getenv("STRIPE_API_KEY")
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id}, {"_id": 0})
            if transaction and transaction["payment_status"] != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"status": "complete", "payment_status": "paid"}}
                )
                
                await db.bookings.update_one(
                    {"id": transaction["booking_id"]},
                    {"$set": {"status": "confirmed"}}
                )
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/admin/movies", response_model=Movie)
async def create_movie(movie: MovieCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_movie = Movie(**movie.model_dump())
    await db.movies.insert_one(new_movie.model_dump())
    return new_movie

@api_router.put("/admin/movies/{movie_id}", response_model=Movie)
async def update_movie(movie_id: str, movie: MovieCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    existing_movie = await db.movies.find_one({"id": movie_id})
    if not existing_movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    await db.movies.update_one({"id": movie_id}, {"$set": movie.model_dump()})
    updated_movie = await db.movies.find_one({"id": movie_id}, {"_id": 0})
    return Movie(**updated_movie)

@api_router.delete("/admin/movies/{movie_id}")
async def delete_movie(movie_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.movies.delete_one({"id": movie_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    return {"message": "Movie deleted successfully"}

@api_router.post("/admin/theaters", response_model=Theater)
async def create_theater(theater: TheaterCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_theater = Theater(**theater.model_dump())
    await db.theaters.insert_one(new_theater.model_dump())
    return new_theater

@api_router.put("/admin/theaters/{theater_id}", response_model=Theater)
async def update_theater(theater_id: str, theater: TheaterCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    existing_theater = await db.theaters.find_one({"id": theater_id})
    if not existing_theater:
        raise HTTPException(status_code=404, detail="Theater not found")
    
    await db.theaters.update_one({"id": theater_id}, {"$set": theater.model_dump()})
    updated_theater = await db.theaters.find_one({"id": theater_id}, {"_id": 0})
    return Theater(**updated_theater)

@api_router.delete("/admin/theaters/{theater_id}")
async def delete_theater(theater_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.theaters.delete_one({"id": theater_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Theater not found")
    
    return {"message": "Theater deleted successfully"}

@api_router.post("/admin/shows", response_model=Show)
async def create_show(show: ShowCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_show = Show(**show.model_dump())
    await db.shows.insert_one(new_show.model_dump())
    return new_show

@api_router.put("/admin/shows/{show_id}", response_model=Show)
async def update_show(show_id: str, show: ShowCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    existing_show = await db.shows.find_one({"id": show_id})
    if not existing_show:
        raise HTTPException(status_code=404, detail="Show not found")
    
    await db.shows.update_one({"id": show_id}, {"$set": show.model_dump()})
    updated_show = await db.shows.find_one({"id": show_id}, {"_id": 0})
    return Show(**updated_show)

@api_router.delete("/admin/shows/{show_id}")
async def delete_show(show_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.shows.delete_one({"id": show_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Show not found")
    
    return {"message": "Show deleted successfully"}

@api_router.get("/admin/bookings")
async def get_all_bookings(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    bookings = await db.bookings.find({}, {"_id": 0}).sort("booking_time", -1).to_list(1000)
    return bookings

@api_router.get("/admin/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    total_bookings = await db.bookings.count_documents({})
    confirmed_bookings = await db.bookings.count_documents({"status": "confirmed"})
    total_revenue = 0
    bookings = await db.bookings.find({"status": "confirmed"}, {"_id": 0}).to_list(10000)
    for booking in bookings:
        total_revenue += booking["total_amount"]
    
    total_movies = await db.movies.count_documents({})
    total_theaters = await db.theaters.count_documents({})
    total_shows = await db.shows.count_documents({})
    
    return {
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "total_revenue": total_revenue,
        "total_movies": total_movies,
        "total_theaters": total_theaters,
        "total_shows": total_shows
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()