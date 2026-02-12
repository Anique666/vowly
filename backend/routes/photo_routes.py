"""
Photo Gallery Routes with Manual Tagging and AI-Assisted Search

This module provides endpoints for:
- Photo upload (multipart/form-data)
- Photo tagging (manual tag management)
- AI-powered search intent extraction
- Gallery listing with tag filtering

No face recognition or ML models required - uses manual tagging + LLM for search.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
import logging
import json
import httpx

logger = logging.getLogger(__name__)

# Photo routes with /api prefix
photo_router = APIRouter(prefix="/api")

# Paths
ROOT_DIR = Path(__file__).parent.parent
UPLOAD_DIR = ROOT_DIR / "uploads"
DATA_DIR = ROOT_DIR / "data"
PHOTOS_JSON = DATA_DIR / "photos.json"

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Common tags for wedding photos (used for AI suggestions)
COMMON_TAGS = [
    "bride", "groom", "couple", "family", "friends", "guests",
    "mehendi", "sangeet", "wedding", "reception", "ceremony",
    "decorations", "food", "cake", "dance", "group", "candid",
    "portraits", "kids", "elders", "priest", "venue"
]


# ============================================================================
# MODELS
# ============================================================================

class PhotoMetadata(BaseModel):
    """Photo metadata stored in photos.json"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    weddingId: str
    filename: str
    tags: List[str] = Field(default_factory=list)
    caption: Optional[str] = None
    uploadedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    url: Optional[str] = None  # Will be set dynamically


class PhotoUploadResponse(BaseModel):
    """Response for photo upload"""
    id: str
    filename: str
    url: str
    tags: List[str]
    uploadedAt: str


class PhotoTagRequest(BaseModel):
    """Request to update photo tags"""
    photoId: str
    tags: List[str]


class PhotoSearchRequest(BaseModel):
    """Request for AI-powered search"""
    query: str  # Natural language query like "photos with bride and family"


class PhotoSearchResponse(BaseModel):
    """Response from AI search - extracted tags"""
    query: str
    extractedTags: List[str]
    suggestedTags: List[str]  # Additional related tags


class PhotoListResponse(BaseModel):
    """Photo with full URL for gallery display"""
    id: str
    weddingId: str
    filename: str
    tags: List[str]
    caption: Optional[str]
    uploadedAt: str
    url: str


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def read_photos_json() -> dict:
    """Read photos.json safely"""
    if not PHOTOS_JSON.exists():
        return {"photos": []}
    try:
        with open(PHOTOS_JSON, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading photos.json: {e}")
        return {"photos": []}


def write_photos_json(data: dict) -> bool:
    """Write photos.json safely"""
    try:
        temp_path = PHOTOS_JSON.with_suffix('.tmp')
        with open(temp_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        temp_path.replace(PHOTOS_JSON)
        return True
    except Exception as e:
        logger.error(f"Error writing photos.json: {e}")
        return False


def get_photo_url(wedding_id: str, filename: str) -> str:
    """Generate URL for a photo (relative path that frontend can use)"""
    # This returns a path that the frontend can construct into a full URL
    # The actual file serving is handled by a static files endpoint
    return f"/api/photos/file/{wedding_id}/{filename}"


def get_photo_by_id(photo_id: str) -> Optional[dict]:
    """Get a photo by ID from photos.json"""
    data = read_photos_json()
    for photo in data.get("photos", []):
        if photo.get("id") == photo_id:
            return photo
    return None


def update_photo_in_json(photo_id: str, updates: dict) -> Optional[dict]:
    """Update a photo in photos.json"""
    data = read_photos_json()
    for i, photo in enumerate(data.get("photos", [])):
        if photo.get("id") == photo_id:
            data["photos"][i].update(updates)
            write_photos_json(data)
            return data["photos"][i]
    return None


async def extract_search_tags_with_ai(query: str) -> dict:
    """
    Use the existing Groq LLM to extract search tags from natural language.
    Returns extracted tags and suggestions.
    """
    groq_api_key = os.environ.get('GROQ_API_KEY')
    if not groq_api_key:
        logger.warning("GROQ_API_KEY not set, using basic extraction")
        # Fallback: basic keyword extraction
        words = query.lower().split()
        extracted = [w for w in words if w in COMMON_TAGS]
        return {"extracted": extracted, "suggested": COMMON_TAGS[:5]}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "mixtral-8x7b-32768",
                    "messages": [
                        {
                            "role": "system",
                            "content": f"""You are a photo search assistant for a wedding photo gallery.
Given a natural language search query, extract relevant tags that would match photos.

Available tags: {', '.join(COMMON_TAGS)}

Respond ONLY with a JSON object in this exact format:
{{"extracted": ["tag1", "tag2"], "suggested": ["related_tag1", "related_tag2"]}}

- "extracted": Tags directly mentioned or strongly implied by the query
- "suggested": Related tags that might also be relevant

Only use tags from the available tags list. If no matching tags, return empty arrays."""
                        },
                        {
                            "role": "user",
                            "content": f"Search query: {query}"
                        }
                    ],
                    "temperature": 0.1,
                    "max_tokens": 200
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                # Parse JSON from response
                try:
                    parsed = json.loads(content)
                    return {
                        "extracted": parsed.get("extracted", []),
                        "suggested": parsed.get("suggested", [])
                    }
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse AI response: {content}")
    except Exception as e:
        logger.error(f"Error calling Groq API: {e}")
    
    # Fallback on any error
    words = query.lower().split()
    extracted = [w for w in words if w in COMMON_TAGS]
    return {"extracted": extracted, "suggested": []}


# ============================================================================
# ENDPOINTS
# ============================================================================

@photo_router.post("/photos/upload", response_model=List[PhotoUploadResponse])
async def upload_photos(
    weddingId: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """
    Upload one or multiple photos for a wedding.
    
    - Creates upload directory: backend/uploads/{weddingId}/
    - Stores photo metadata in photos.json
    - Returns list of uploaded photos with URLs
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    # Create wedding-specific upload directory
    wedding_upload_dir = UPLOAD_DIR / weddingId
    wedding_upload_dir.mkdir(parents=True, exist_ok=True)
    
    uploaded_photos = []
    data = read_photos_json()
    
    for file in files:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            logger.warning(f"Skipping non-image file: {file.filename}")
            continue
        
        try:
            # Generate unique filename to avoid collisions
            ext = Path(file.filename).suffix.lower() or '.jpg'
            unique_filename = f"{uuid.uuid4()}{ext}"
            file_path = wedding_upload_dir / unique_filename
            
            # Save file
            with open(file_path, 'wb') as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Create photo metadata
            photo_id = str(uuid.uuid4())
            photo_metadata = {
                "id": photo_id,
                "weddingId": weddingId,
                "filename": unique_filename,
                "tags": [],  # Empty tags initially - user will add manually
                "caption": None,
                "uploadedAt": datetime.now(timezone.utc).isoformat()
            }
            
            # Add to photos.json
            if "photos" not in data:
                data["photos"] = []
            data["photos"].append(photo_metadata)
            
            # Build response
            uploaded_photos.append(PhotoUploadResponse(
                id=photo_id,
                filename=unique_filename,
                url=get_photo_url(weddingId, unique_filename),
                tags=[],
                uploadedAt=photo_metadata["uploadedAt"]
            ))
            
            logger.info(f"Uploaded photo: {unique_filename} for wedding {weddingId}")
            
        except Exception as e:
            logger.error(f"Error uploading file {file.filename}: {e}")
            continue
    
    if uploaded_photos:
        write_photos_json(data)
    
    if not uploaded_photos:
        raise HTTPException(status_code=400, detail="No valid image files uploaded")
    
    return uploaded_photos


@photo_router.post("/photos/tag")
async def tag_photo(request: PhotoTagRequest):
    """
    Update tags for a specific photo.
    
    - photoId: ID of the photo to update
    - tags: Array of tag strings (e.g., ["bride", "family", "ceremony"])
    """
    photo = get_photo_by_id(request.photoId)
    if not photo:
        raise HTTPException(status_code=404, detail=f"Photo {request.photoId} not found")
    
    # Normalize tags: lowercase, strip whitespace, remove duplicates
    normalized_tags = list(set(tag.lower().strip() for tag in request.tags if tag.strip()))
    
    updated = update_photo_in_json(request.photoId, {"tags": normalized_tags})
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update photo tags")
    
    logger.info(f"Updated tags for photo {request.photoId}: {normalized_tags}")
    
    return {
        "status": "success",
        "photoId": request.photoId,
        "tags": normalized_tags
    }


@photo_router.get("/wedding/{wedding_id}/photos", response_model=List[PhotoListResponse])
async def get_wedding_photos(wedding_id: str):
    """
    Get all photos for a specific wedding with full URLs.
    
    Returns photo metadata + URLs for gallery display.
    """
    data = read_photos_json()
    photos = []
    
    for photo in data.get("photos", []):
        if photo.get("weddingId") == wedding_id:
            photos.append(PhotoListResponse(
                id=photo["id"],
                weddingId=photo["weddingId"],
                filename=photo["filename"],
                tags=photo.get("tags", []),
                caption=photo.get("caption"),
                uploadedAt=photo.get("uploadedAt", ""),
                url=get_photo_url(wedding_id, photo["filename"])
            ))
    
    # Sort by upload date, newest first
    photos.sort(key=lambda p: p.uploadedAt, reverse=True)
    
    return photos


@photo_router.post("/ai/photo-search", response_model=PhotoSearchResponse)
async def ai_photo_search(request: PhotoSearchRequest):
    """
    AI-powered search intent extraction.
    
    Input: Free-text query (e.g., "photos with the bride and family")
    Output: Structured search intent with normalized tags
    
    The frontend uses these extracted tags to filter the gallery client-side.
    """
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Search query is required")
    
    query = request.query.strip()
    
    # Use AI to extract tags
    result = await extract_search_tags_with_ai(query)
    
    return PhotoSearchResponse(
        query=query,
        extractedTags=result.get("extracted", []),
        suggestedTags=result.get("suggested", [])
    )


@photo_router.get("/photos/tags")
async def get_available_tags():
    """
    Get list of common/suggested tags for tagging UI.
    
    Returns predefined tags plus any custom tags used in existing photos.
    """
    data = read_photos_json()
    
    # Collect all unique tags from existing photos
    used_tags = set()
    for photo in data.get("photos", []):
        for tag in photo.get("tags", []):
            used_tags.add(tag.lower())
    
    # Combine with common tags
    all_tags = list(set(COMMON_TAGS) | used_tags)
    all_tags.sort()
    
    return {
        "commonTags": COMMON_TAGS,
        "usedTags": list(used_tags),
        "allTags": all_tags
    }


@photo_router.delete("/photos/{photo_id}")
async def delete_photo(photo_id: str):
    """
    Delete a photo and its file.
    """
    photo = get_photo_by_id(photo_id)
    if not photo:
        raise HTTPException(status_code=404, detail=f"Photo {photo_id} not found")
    
    # Delete file
    file_path = UPLOAD_DIR / photo["weddingId"] / photo["filename"]
    if file_path.exists():
        file_path.unlink()
        logger.info(f"Deleted file: {file_path}")
    
    # Remove from photos.json
    data = read_photos_json()
    data["photos"] = [p for p in data.get("photos", []) if p.get("id") != photo_id]
    write_photos_json(data)
    
    logger.info(f"Deleted photo: {photo_id}")
    
    return {"status": "success", "photoId": photo_id}
