from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request
from fastapi.security import HTTPBasic
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Admin password from environment
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

# Session storage (in-memory for simplicity)
active_sessions = {}

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============================================
# Models
# ============================================

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    businessName: str
    reviewLink: str
    defaultTone: str = "friendly"
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClientCreate(BaseModel):
    slug: str
    businessName: str
    reviewLink: str
    defaultTone: str = "friendly"

class ClientUpdate(BaseModel):
    slug: Optional[str] = None
    businessName: Optional[str] = None
    reviewLink: Optional[str] = None
    defaultTone: Optional[str] = None

class AdminLogin(BaseModel):
    password: str

class ClientPublic(BaseModel):
    slug: str
    businessName: str
    reviewLink: str
    defaultTone: str

# ============================================
# Helper Functions
# ============================================

def generate_slug(business_name: str) -> str:
    """Generate a URL-friendly slug from business name"""
    slug = business_name.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_-]+', '-', slug)
    slug = slug.strip('-')
    return slug

def verify_session(request: Request) -> bool:
    """Verify if the request has a valid session"""
    session_token = request.cookies.get("admin_session")
    if not session_token:
        return False
    return session_token in active_sessions

async def get_current_admin(request: Request):
    """Dependency to check admin authentication"""
    if not verify_session(request):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return True

# ============================================
# Admin Auth Routes
# ============================================

@api_router.post("/admin/login")
async def admin_login(login: AdminLogin, response: Response):
    """Admin login endpoint"""
    if login.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Generate session token
    session_token = secrets.token_urlsafe(32)
    active_sessions[session_token] = {
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Set cookie
    response.set_cookie(
        key="admin_session",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=86400  # 24 hours
    )
    
    return {"success": True, "message": "Logged in successfully"}

@api_router.post("/admin/logout")
async def admin_logout(request: Request, response: Response):
    """Admin logout endpoint"""
    session_token = request.cookies.get("admin_session")
    if session_token and session_token in active_sessions:
        del active_sessions[session_token]
    
    response.delete_cookie(key="admin_session")
    return {"success": True, "message": "Logged out successfully"}

@api_router.get("/admin/check")
async def check_admin_auth(request: Request):
    """Check if admin is authenticated"""
    is_authenticated = verify_session(request)
    return {"authenticated": is_authenticated}

# ============================================
# Client CRUD Routes (Protected)
# ============================================

@api_router.get("/admin/clients", response_model=List[Client])
async def get_all_clients(admin: bool = Depends(get_current_admin)):
    """Get all clients (admin only)"""
    clients = await db.clients.find({}, {"_id": 0}).to_list(1000)
    
    for client_doc in clients:
        if isinstance(client_doc.get('createdAt'), str):
            client_doc['createdAt'] = datetime.fromisoformat(client_doc['createdAt'])
    
    return clients

@api_router.post("/admin/clients", response_model=Client, status_code=201)
async def create_client(client_data: ClientCreate, admin: bool = Depends(get_current_admin)):
    """Create a new client (admin only)"""
    # Check if slug already exists
    existing = await db.clients.find_one({"slug": client_data.slug}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    # Create client object
    client_obj = Client(
        slug=client_data.slug.lower(),
        businessName=client_data.businessName,
        reviewLink=client_data.reviewLink,
        defaultTone=client_data.defaultTone
    )
    
    # Convert to dict for MongoDB
    doc = client_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    
    await db.clients.insert_one(doc)
    return client_obj

@api_router.put("/admin/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, client_data: ClientUpdate, admin: bool = Depends(get_current_admin)):
    """Update a client (admin only)"""
    # Find the client
    existing = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Build update dict
    update_dict = {}
    if client_data.slug is not None:
        # Check if new slug conflicts
        if client_data.slug != existing['slug']:
            slug_exists = await db.clients.find_one({"slug": client_data.slug, "id": {"$ne": client_id}})
            if slug_exists:
                raise HTTPException(status_code=400, detail="Slug already exists")
        update_dict['slug'] = client_data.slug.lower()
    if client_data.businessName is not None:
        update_dict['businessName'] = client_data.businessName
    if client_data.reviewLink is not None:
        update_dict['reviewLink'] = client_data.reviewLink
    if client_data.defaultTone is not None:
        update_dict['defaultTone'] = client_data.defaultTone
    
    if update_dict:
        await db.clients.update_one({"id": client_id}, {"$set": update_dict})
    
    # Return updated client
    updated = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if isinstance(updated.get('createdAt'), str):
        updated['createdAt'] = datetime.fromisoformat(updated['createdAt'])
    return updated

@api_router.delete("/admin/clients/{client_id}")
async def delete_client(client_id: str, admin: bool = Depends(get_current_admin)):
    """Delete a client (admin only)"""
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"success": True, "message": "Client deleted"}

@api_router.get("/admin/generate-slug")
async def generate_slug_endpoint(business_name: str, admin: bool = Depends(get_current_admin)):
    """Generate a slug from business name (admin only)"""
    return {"slug": generate_slug(business_name)}

# ============================================
# Public Routes
# ============================================

@api_router.get("/clients/{slug}", response_model=ClientPublic)
async def get_client_by_slug(slug: str):
    """Get client by slug (public)"""
    client_doc = await db.clients.find_one({"slug": slug.lower()}, {"_id": 0})
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return ClientPublic(
        slug=client_doc['slug'],
        businessName=client_doc['businessName'],
        reviewLink=client_doc['reviewLink'],
        defaultTone=client_doc['defaultTone']
    )

@api_router.get("/")
async def root():
    return {"message": "Smoking Chili Media Review Booster API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
