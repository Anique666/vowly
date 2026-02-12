from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List
import uuid
from datetime import datetime, timezone
import asyncio
import resend

# Import wedding models and utilities
from models.wedding_models import (
    Wedding, WeddingCreate,
    Guest, GuestCreate,
    Vendor, VendorCreate,
    Photo, PhotoCreate
)
from utils.file_utils import (
    read_json_file,
    append_to_collection,
    update_in_collection,
    delete_from_collection,
    get_from_collection,
    list_collection
)
from routes.ai_routes import ai_router
from routes.photo_routes import photo_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend API configuration
resend.api_key = os.environ.get('RESEND_API_KEY', 're_dummy_key')
# Use Resend's sandbox domain for testing - works without domain verification
# For production, use a verified domain email
_env_sender = os.environ.get('SENDER_EMAIL', '')
SENDER_EMAIL = 'onboarding@resend.dev' if not _env_sender or '@gmail' in _env_sender or '@yahoo' in _env_sender else _env_sender

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class HealthResponse(BaseModel):
    status: str
    message: str
    timestamp: str

# Health check endpoint
@api_router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        message="Backend is running",
        timestamp=datetime.now(timezone.utc).isoformat()
    )

# Example routes
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# ============================================================================
# WEDDING MANAGEMENT ENDPOINTS
# ============================================================================

# Wedding Endpoints with Validation
@api_router.post("/wedding/create", response_model=Wedding, status_code=201)
async def create_wedding(wedding_data: WeddingCreate):
    """
    Create a new wedding with validation:
    - Wedding name is required
    - At least one day required
    - At least one event required
    """
    try:
        # Validation: Check wedding name
        if not wedding_data.name or not wedding_data.name.strip():
            raise HTTPException(
                status_code=400,
                detail="Wedding name is required"
            )
        
        # Validation: Check at least one day
        if not wedding_data.days or len(wedding_data.days) == 0:
            raise HTTPException(
                status_code=400,
                detail="At least one day is required"
            )
        
        # Validation: Check at least one event across all days
        total_events = sum(len(day.events) for day in wedding_data.days)
        if total_events == 0:
            raise HTTPException(
                status_code=400,
                detail="At least one event is required"
            )
        
        # Create wedding object
        wedding = Wedding(**wedding_data.model_dump())
        result = append_to_collection('wedding.json', 'weddings', wedding.model_dump())
        logger.info(f"Created wedding: {wedding.id} - {wedding.name}")
        
        return Wedding(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating wedding: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@api_router.get("/wedding/{wedding_id}", response_model=Wedding)
async def get_wedding_by_id(wedding_id: str):
    """Get a specific wedding by ID with proper error handling"""
    try:
        wedding = get_from_collection('wedding.json', 'weddings', wedding_id)
        return Wedding(**wedding)
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=f"Wedding with id '{wedding_id}' not found"
        )
    except Exception as e:
        logger.error(f"Error getting wedding: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Keep existing wedding endpoints for compatibility
@api_router.post("/weddings", response_model=Wedding)
async def create_wedding_legacy(wedding_data: WeddingCreate):
    """Legacy endpoint - redirects to /wedding/create"""
    return await create_wedding(wedding_data)

@api_router.get("/weddings", response_model=List[Wedding])
async def list_weddings():
    """List all weddings"""
    try:
        weddings = list_collection('wedding.json', 'weddings')
        return [Wedding(**w) for w in weddings]
    except Exception as e:
        logger.error(f"Error listing weddings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/weddings/{wedding_id}", response_model=Wedding)
async def get_wedding(wedding_id: str):
    """Get a specific wedding by ID"""
    try:
        wedding = get_from_collection('wedding.json', 'weddings', wedding_id)
        return Wedding(**wedding)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting wedding: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/weddings/{wedding_id}", response_model=Wedding)
async def update_wedding(wedding_id: str, wedding_data: WeddingCreate):
    """Update a wedding"""
    try:
        wedding = Wedding(id=wedding_id, **wedding_data.model_dump())
        result = update_in_collection('wedding.json', 'weddings', wedding_id, wedding.model_dump())
        logger.info(f"Updated wedding: {wedding_id}")
        return Wedding(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating wedding: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/weddings/{wedding_id}")
async def delete_wedding(wedding_id: str):
    """Delete a wedding"""
    try:
        delete_from_collection('wedding.json', 'weddings', wedding_id)
        logger.info(f"Deleted wedding: {wedding_id}")
        return {"message": "Wedding deleted successfully", "id": wedding_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting wedding: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Guest Endpoints with Validation
@api_router.post("/guest/rsvp", response_model=Guest, status_code=201)
async def guest_rsvp(guest_data: GuestCreate):
    """
    Create guest RSVP with validation:
    - Email format is validated by Pydantic
    - attendingDays length must match number of wedding days
    """
    try:
        # Get the wedding to validate attendingDays length
        try:
            wedding = get_from_collection('wedding.json', 'weddings', guest_data.weddingId)
            wedding_obj = Wedding(**wedding)
        except ValueError:
            raise HTTPException(
                status_code=404,
                detail=f"Wedding with id '{guest_data.weddingId}' not found"
            )
        
        # Validation: Check attendingDays length matches wedding days
        num_wedding_days = len(wedding_obj.days)
        num_attending_days = len(guest_data.attendingDays)
        
        if num_attending_days != num_wedding_days:
            raise HTTPException(
                status_code=400,
                detail=f"attendingDays length ({num_attending_days}) must match number of wedding days ({num_wedding_days})"
            )
        
        # Create guest
        guest = Guest(**guest_data.model_dump())
        result = append_to_collection('guests.json', 'guests', guest.model_dump())
        logger.info(f"Created guest RSVP: {guest.id} - {guest.name} for wedding {guest.weddingId}")
        
        return Guest(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating guest RSVP: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@api_router.get("/guest/list", response_model=list[Guest])
async def list_guests_by_wedding(weddingId: str):
    """
    Get all guests for a specific wedding
    Query parameter: weddingId (required)
    """
    try:
        # Validate wedding exists
        try:
            get_from_collection('wedding.json', 'weddings', weddingId)
        except ValueError:
            raise HTTPException(
                status_code=404,
                detail=f"Wedding with id '{weddingId}' not found"
            )
        
        # Get guests filtered by weddingId
        guests = list_collection('guests.json', 'guests', {"weddingId": weddingId})
        logger.info(f"Retrieved {len(guests)} guests for wedding {weddingId}")
        
        return [Guest(**g) for g in guests]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing guests: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Legacy guest endpoints for compatibility
@api_router.post("/guests", response_model=Guest)
async def create_guest(guest_data: GuestCreate):
    """Legacy endpoint - redirects to /guest/rsvp"""
    return await guest_rsvp(guest_data)

@api_router.get("/guests", response_model=List[Guest])
async def list_guests(wedding_id: str = None):
    """List all guests, optionally filtered by wedding_id"""
    try:
        filter_by = {"weddingId": wedding_id} if wedding_id else None
        guests = list_collection('guests.json', 'guests', filter_by)
        return [Guest(**g) for g in guests]
    except Exception as e:
        logger.error(f"Error listing guests: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/guests/{guest_id}", response_model=Guest)
async def get_guest(guest_id: str):
    """Get a specific guest by ID"""
    try:
        guest = get_from_collection('guests.json', 'guests', guest_id)
        return Guest(**guest)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting guest: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/guests/{guest_id}", response_model=Guest)
async def update_guest(guest_id: str, guest_data: GuestCreate):
    """Update a guest"""
    try:
        guest = Guest(id=guest_id, **guest_data.model_dump())
        result = update_in_collection('guests.json', 'guests', guest_id, guest.model_dump())
        logger.info(f"Updated guest: {guest_id}")
        return Guest(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating guest: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/guests/{guest_id}")
async def delete_guest(guest_id: str):
    """Delete a guest"""
    try:
        delete_from_collection('guests.json', 'guests', guest_id)
        logger.info(f"Deleted guest: {guest_id}")
        return {"message": "Guest deleted successfully", "id": guest_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting guest: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Vendor Endpoints with Validation
@api_router.get("/vendor/list", response_model=list[Vendor])
async def list_vendors_by_wedding(weddingId: str):
    """
    Get all vendors for a specific wedding
    Query parameter: weddingId (required)
    """
    try:
        # Validate wedding exists
        try:
            get_from_collection('wedding.json', 'weddings', weddingId)
        except ValueError:
            raise HTTPException(
                status_code=404,
                detail=f"Wedding with id '{weddingId}' not found"
            )
        
        # Get vendors filtered by weddingId
        vendors = list_collection('vendors.json', 'vendors', {"weddingId": weddingId})
        logger.info(f"Retrieved {len(vendors)} vendors for wedding {weddingId}")
        
        return [Vendor(**v) for v in vendors]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing vendors: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@api_router.post("/vendor/respond", response_model=Vendor, status_code=201)
async def vendor_respond(vendor_data: VendorCreate):
    """
    Create vendor availability response with validation:
    - Email format is validated by Pydantic
    - attendingDays length must match number of wedding days
    """
    try:
        # Get the wedding to validate attendingDays length
        try:
            wedding = get_from_collection('wedding.json', 'weddings', vendor_data.weddingId)
            wedding_obj = Wedding(**wedding)
        except ValueError:
            raise HTTPException(
                status_code=404,
                detail=f"Wedding with id '{vendor_data.weddingId}' not found"
            )
        
        # Validation: Check attendingDays length matches wedding days
        num_wedding_days = len(wedding_obj.days)
        num_attending_days = len(vendor_data.attendingDays)
        
        if num_attending_days != num_wedding_days:
            raise HTTPException(
                status_code=400,
                detail=f"attendingDays length ({num_attending_days}) must match number of wedding days ({num_wedding_days})"
            )
        
        # Create vendor
        vendor = Vendor(**vendor_data.model_dump())
        result = append_to_collection('vendors.json', 'vendors', vendor.model_dump())
        logger.info(f"Created vendor response: {vendor.id} - {vendor.name} ({vendor.serviceType}) for wedding {vendor.weddingId}")
        
        return Vendor(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating vendor response: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Legacy vendor endpoints for compatibility
@api_router.post("/vendors", response_model=Vendor)
async def create_vendor(vendor_data: VendorCreate):
    """Legacy endpoint - redirects to /vendor/respond"""
    return await vendor_respond(vendor_data)

@api_router.get("/vendors", response_model=List[Vendor])
async def list_vendors(wedding_id: str = None):
    """List all vendors, optionally filtered by wedding_id"""
    try:
        filter_by = {"weddingId": wedding_id} if wedding_id else None
        vendors = list_collection('vendors.json', 'vendors', filter_by)
        return [Vendor(**v) for v in vendors]
    except Exception as e:
        logger.error(f"Error listing vendors: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/vendors/{vendor_id}", response_model=Vendor)
async def get_vendor(vendor_id: str):
    """Get a specific vendor by ID"""
    try:
        vendor = get_from_collection('vendors.json', 'vendors', vendor_id)
        return Vendor(**vendor)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting vendor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/vendors/{vendor_id}", response_model=Vendor)
async def update_vendor(vendor_id: str, vendor_data: VendorCreate):
    """Update a vendor"""
    try:
        vendor = Vendor(id=vendor_id, **vendor_data.model_dump())
        result = update_in_collection('vendors.json', 'vendors', vendor_id, vendor.model_dump())
        logger.info(f"Updated vendor: {vendor_id}")
        return Vendor(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating vendor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/vendors/{vendor_id}")
async def delete_vendor(vendor_id: str):
    """Delete a vendor"""
    try:
        delete_from_collection('vendors.json', 'vendors', vendor_id)
        logger.info(f"Deleted vendor: {vendor_id}")
        return {"message": "Vendor deleted successfully", "id": vendor_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting vendor: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Photo Endpoints
@api_router.post("/photos", response_model=Photo)
async def create_photo(photo_data: PhotoCreate):
    """Create a new photo entry"""
    try:
        photo = Photo(**photo_data.model_dump())
        result = append_to_collection('photos.json', 'photos', photo.model_dump())
        logger.info(f"Created photo: {photo.id}")
        return Photo(**result)
    except Exception as e:
        logger.error(f"Error creating photo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/photos", response_model=List[Photo])
async def list_photos(wedding_id: str = None):
    """List all photos, optionally filtered by wedding_id"""
    try:
        filter_by = {"weddingId": wedding_id} if wedding_id else None
        photos = list_collection('photos.json', 'photos', filter_by)
        return [Photo(**p) for p in photos]
    except Exception as e:
        logger.error(f"Error listing photos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/photos/{photo_id}", response_model=Photo)
async def get_photo(photo_id: str):
    """Get a specific photo by ID"""
    try:
        photo = get_from_collection('photos.json', 'photos', photo_id)
        return Photo(**photo)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting photo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/photos/{photo_id}")
async def delete_photo(photo_id: str):
    """Delete a photo"""
    try:
        delete_from_collection('photos.json', 'photos', photo_id)
        logger.info(f"Deleted photo: {photo_id}")
        return {"message": "Photo deleted successfully", "id": photo_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting photo: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# EMAIL ENDPOINTS (RESEND INTEGRATION)
# ============================================================================

# Email Request Models
class SendInvitesRequest(BaseModel):
    weddingId: str
    guestEmails: List[EmailStr]

class SendThankYouRequest(BaseModel):
    weddingId: str

class EmailResponse(BaseModel):
    status: str
    message: str
    emailsSent: int
    failed: List[str] = Field(default_factory=list)
    errorDetails: str = ""

def create_invite_email_html(wedding: Wedding, guest_email: str) -> str:
    """Create HTML content for wedding invitation email"""
    days_text = f"{len(wedding.days)} day" if len(wedding.days) == 1 else f"{len(wedding.days)} days"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <!-- Header with gold accent -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #f5c842 0%, #d4a017 100%); padding: 40px 30px; text-align: center;">
                                <h1 style="margin: 0; color: #000000; font-size: 32px; font-weight: bold;">
                                    You're Invited!
                                </h1>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">
                                    {wedding.name}
                                </h2>
                                
                                <p style="margin: 0 0 15px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                                    We are delighted to invite you to our special celebration!
                                </p>
                                
                                <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                    <tr>
                                        <td style="padding: 15px; background-color: #f9f9f9; border-radius: 4px;">
                                            <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px; font-weight: bold;">
                                                📍 Location
                                            </p>
                                            <p style="margin: 0; color: #666666; font-size: 14px;">
                                                {wedding.location}
                                            </p>
                                        </td>
                                    </tr>
                                    <tr><td style="height: 10px;"></td></tr>
                                    <tr>
                                        <td style="padding: 15px; background-color: #f9f9f9; border-radius: 4px;">
                                            <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px; font-weight: bold;">
                                                📅 Duration
                                            </p>
                                            <p style="margin: 0; color: #666666; font-size: 14px;">
                                                {wedding.startDate} to {wedding.endDate} ({days_text})
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- RSVP Button -->
                                <table role="presentation" style="margin: 30px 0;">
                                    <tr>
                                        <td align="center">
                                            <a href="https://your-app-url.com/rsvp?weddingId={wedding.id}&email={guest_email}" 
                                               style="display: inline-block; padding: 15px 40px; background-color: #f5c842; color: #000000; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
                                                RSVP Now
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                                    We look forward to celebrating with you!
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 30px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #eeeeee;">
                                <p style="margin: 0; color: #999999; font-size: 12px;">
                                    Wedding Management System
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    return html

def create_thankyou_email_html(wedding: Wedding, guest_name: str) -> str:
    """Create HTML content for thank you email"""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #f5c842 0%, #d4a017 100%); padding: 40px 30px; text-align: center;">
                                <h1 style="margin: 0; color: #000000; font-size: 32px; font-weight: bold;">
                                    Thank You! 💛
                                </h1>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">
                                    Dear {guest_name},
                                </h2>
                                
                                <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                                    Thank you for being part of our special celebration at <strong>{wedding.name}</strong>. 
                                    Your presence made our wedding truly memorable!
                                </p>
                                
                                <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                                    We are grateful for your love, support, and the wonderful memories we created together 
                                    in {wedding.location}.
                                </p>
                                
                                <table role="presentation" style="width: 100%; margin: 30px 0;">
                                    <tr>
                                        <td style="padding: 20px; background-color: #fff9e6; border-left: 4px solid #f5c842; border-radius: 4px;">
                                            <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6; font-style: italic;">
                                                "The best thing to hold onto in life is each other."
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6;">
                                    With warmest regards,<br>
                                    <strong>The Wedding Party</strong>
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 30px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #eeeeee;">
                                <p style="margin: 0; color: #999999; font-size: 12px;">
                                    Wedding Management System
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    return html

@api_router.post("/email/send-invites", response_model=EmailResponse)
async def send_wedding_invites(request: SendInvitesRequest):
    """
    Send wedding invitation emails to specified guests
    - Fetches wedding information
    - Sends personalized invites with RSVP link
    """
    try:
        # Fetch wedding information
        try:
            wedding_data = get_from_collection('wedding.json', 'weddings', request.weddingId)
            wedding = Wedding(**wedding_data)
        except ValueError:
            raise HTTPException(
                status_code=404,
                detail=f"Wedding with id '{request.weddingId}' not found"
            )
        
        # Send emails to each guest
        failed_emails = []
        successful_count = 0
        
        for guest_email in request.guestEmails:
            try:
                html_content = create_invite_email_html(wedding, guest_email)
                
                params = {
                    "from": SENDER_EMAIL,
                    "to": [guest_email],
                    "subject": f"You're Invited: {wedding.name}",
                    "html": html_content
                }
                
                # Send email using asyncio.to_thread for non-blocking operation
                email_response = await asyncio.to_thread(resend.Emails.send, params)
                successful_count += 1
                logger.info(f"Sent invitation to {guest_email} - Email ID: {email_response.get('id')}")
                
            except Exception as e:
                error_str = str(e)
                logger.error(f"Failed to send invitation to {guest_email}: {error_str}")
                failed_emails.append(guest_email)
                # Store the last error for user feedback
                if "verify a domain" in error_str.lower():
                    last_error = "Resend sandbox mode: Can only send to verified account email. Verify a domain at resend.com/domains for full access."
                else:
                    last_error = error_str[:200]
        
        # Build response with helpful error details
        error_detail = ""
        if failed_emails and successful_count == 0:
            error_detail = last_error if 'last_error' in dir() else "Email delivery failed. Check Resend configuration."
        
        return EmailResponse(
            status="success" if successful_count > 0 else "failed",
            message=f"Sent {successful_count} invitation(s) for {wedding.name}",
            emailsSent=successful_count,
            failed=failed_emails,
            errorDetails=error_detail
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending invitations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send invitations: {str(e)}")

@api_router.post("/email/send-thankyou", response_model=EmailResponse)
async def send_thankyou_emails(request: SendThankYouRequest):
    """
    Send thank you emails to all guests of a wedding
    - Fetches wedding and guest information
    - Sends personalized thank you emails
    """
    try:
        # Fetch wedding information
        try:
            wedding_data = get_from_collection('wedding.json', 'weddings', request.weddingId)
            wedding = Wedding(**wedding_data)
        except ValueError:
            raise HTTPException(
                status_code=404,
                detail=f"Wedding with id '{request.weddingId}' not found"
            )
        
        # Fetch all guests for the wedding
        guests = list_collection('guests.json', 'guests', {"weddingId": request.weddingId})
        
        if not guests:
            raise HTTPException(
                status_code=404,
                detail=f"No guests found for wedding '{request.weddingId}'"
            )
        
        # Send thank you emails
        failed_emails = []
        successful_count = 0
        
        for guest_data in guests:
            guest = Guest(**guest_data)
            
            # Skip guests without email
            if not guest.email:
                logger.info(f"Skipping guest {guest.name} - no email address")
                continue
            
            try:
                html_content = create_thankyou_email_html(wedding, guest.name)
                
                params = {
                    "from": SENDER_EMAIL,
                    "to": [guest.email],
                    "subject": f"Thank You from {wedding.name}",
                    "html": html_content
                }
                
                # Send email using asyncio.to_thread for non-blocking operation
                email_response = await asyncio.to_thread(resend.Emails.send, params)
                successful_count += 1
                logger.info(f"Sent thank you to {guest.email} - Email ID: {email_response.get('id')}")
                
            except Exception as e:
                logger.error(f"Failed to send thank you to {guest.email}: {str(e)}")
                failed_emails.append(guest.email)
        
        return EmailResponse(
            status="success" if successful_count > 0 else "failed",
            message=f"Sent {successful_count} thank you email(s) for {wedding.name}",
            emailsSent=successful_count,
            failed=failed_emails
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending thank you emails: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send thank you emails: {str(e)}")


# Include the router in the main app
app.include_router(api_router)
app.include_router(ai_router)

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
