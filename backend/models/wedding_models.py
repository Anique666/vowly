from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
import uuid

# Event Model
class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    time: str
    venue: str

# Day Model
class Day(BaseModel):
    dayIndex: int
    date: str
    events: List[Event] = Field(default_factory=list)

# Vendor Reference in Wedding
class WeddingVendor(BaseModel):
    vendorId: str
    serviceType: str

# Wedding Model
class Wedding(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str
    startDate: str
    endDate: str
    days: List[Day] = Field(default_factory=list)
    vendors: List[WeddingVendor] = Field(default_factory=list)
    creatorId: Optional[str] = None

class WeddingCreate(BaseModel):
    name: str
    location: str
    startDate: str
    endDate: str
    days: List[Day] = Field(default_factory=list)

# Guest Model
class Guest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    weddingId: str
    name: str
    email: Optional[EmailStr] = None
    attendingDays: List[bool] = Field(default_factory=list)
    dietary: str = Field(default="non-veg")  # veg / non-veg / jain / vegan
    accommodation: bool = False

class GuestCreate(BaseModel):
    weddingId: str
    name: str
    email: Optional[EmailStr] = None
    attendingDays: List[bool] = Field(default_factory=list)
    dietary: str = Field(default="non-veg")
    accommodation: bool = False

# Vendor Model
class Vendor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    weddingId: str
    name: str
    serviceType: str  # e.g., catering, photography, decoration, music
    email: Optional[EmailStr] = None
    phoneNumber: Optional[str] = None
    attendingDays: List[bool] = Field(default_factory=list)
    notes: Optional[str] = None

class VendorCreate(BaseModel):
    weddingId: str
    name: str
    serviceType: str
    email: Optional[EmailStr] = None
    phoneNumber: Optional[str] = None
    attendingDays: List[bool] = Field(default_factory=list)
    notes: Optional[str] = None

# Photo Model
class Photo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    weddingId: str
    dayIndex: Optional[int] = None
    eventId: Optional[str] = None
    url: str
    caption: Optional[str] = None
    uploadedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class PhotoCreate(BaseModel):
    weddingId: str
    dayIndex: Optional[int] = None
    eventId: Optional[str] = None
    url: str
    caption: Optional[str] = None
