"""
AI routes powered by Groq LLM API.
Provides endpoints for guest summaries, vendor briefs, chat, and guest day suggestions.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import logging
import json
from datetime import datetime

from groq import Groq

from models.wedding_models import Wedding, Guest, Vendor
from utils.file_utils import get_from_collection, list_collection

logger = logging.getLogger(__name__)

ai_router = APIRouter(prefix="/api/ai", tags=["AI"])

# ---------------------------------------------------------------------------
# Groq client – lazy-init so the module can import even if key is missing
# ---------------------------------------------------------------------------
_groq_client: Optional[Groq] = None
GROQ_MODEL = "llama-3.1-8b-instant"
GROQ_TIMEOUT = 30  # seconds


def _get_groq_client() -> Groq:
    """Return a cached Groq client, creating it on first call."""
    global _groq_client
    if _groq_client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="GROQ_API_KEY environment variable is not set"
            )
        _groq_client = Groq(api_key=api_key, timeout=GROQ_TIMEOUT)
    return _groq_client


def _call_groq(system_prompt: str, user_prompt: str, max_tokens: int = 1024) -> str:
    """
    Call Groq chat completion with timeout and error handling.
    Returns the assistant message content.
    """
    try:
        client = _get_groq_client()
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=max_tokens,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"AI service unavailable: {str(e)}"
        )


# ---------------------------------------------------------------------------
# Helpers – build context strings from data
# ---------------------------------------------------------------------------

def _wedding_context(wedding: Wedding) -> str:
    """Build a human-readable summary of a wedding for prompts."""
    lines = [
        f"Wedding: {wedding.name}",
        f"Location: {wedding.location}",
        f"Dates: {wedding.startDate} to {wedding.endDate}",
        f"Number of days: {len(wedding.days)}",
    ]
    for day in wedding.days:
        lines.append(f"\n  Day {day.dayIndex + 1} ({day.date}):")
        for ev in day.events:
            lines.append(f"    - {ev.name} at {ev.time}, Venue: {ev.venue}")
    return "\n".join(lines)


def _guests_context(guests: list[dict]) -> str:
    """Build a summary of guest data for prompts."""
    if not guests:
        return "No guests have RSVP'd yet."
    lines = [f"Total guests: {len(guests)}"]
    dietary_counts: dict[str, int] = {}
    accommodation_count = 0
    day_counts: dict[int, int] = {}

    for g in guests:
        diet = g.get("dietary", "unknown")
        dietary_counts[diet] = dietary_counts.get(diet, 0) + 1
        if g.get("accommodation"):
            accommodation_count += 1
        for i, attending in enumerate(g.get("attendingDays", [])):
            if attending:
                day_counts[i] = day_counts.get(i, 0) + 1

    lines.append(f"Dietary breakdown: {json.dumps(dietary_counts)}")
    lines.append(f"Accommodation needed: {accommodation_count}")
    lines.append(f"Guests per day: {json.dumps(day_counts)}")

    lines.append("\nGuest list:")
    for g in guests:
        lines.append(
            f"  - {g['name']} | diet: {g.get('dietary','N/A')} | "
            f"attending: {g.get('attendingDays',[])} | "
            f"accommodation: {g.get('accommodation', False)}"
        )
    return "\n".join(lines)


def _vendors_context(vendors: list[dict]) -> str:
    """Build a summary of vendor data for prompts."""
    if not vendors:
        return "No vendors registered yet."
    lines = [f"Total vendors: {len(vendors)}"]
    for v in vendors:
        lines.append(
            f"  - {v['name']} ({v.get('serviceType','N/A')}) | "
            f"email: {v.get('email','N/A')} | phone: {v.get('phoneNumber','N/A')} | "
            f"available days: {v.get('attendingDays',[])} | "
            f"notes: {v.get('notes','')}"
        )
    return "\n".join(lines)


def _load_wedding_data(wedding_id: str):
    """Load wedding, guests, and vendors for a given wedding ID."""
    try:
        wedding_data = get_from_collection('wedding.json', 'weddings', wedding_id)
        wedding = Wedding(**wedding_data)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Wedding '{wedding_id}' not found")

    guests = list_collection('guests.json', 'guests', {"weddingId": wedding_id})
    vendors = list_collection('vendors.json', 'vendors', {"weddingId": wedding_id})
    return wedding, guests, vendors


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class WeddingIdRequest(BaseModel):
    weddingId: str

class ChatRequest(BaseModel):
    weddingId: str
    message: str
    role: str = Field(default="host", description="'host' or 'guest'")

class GuestDaySuggestionsRequest(BaseModel):
    weddingId: str
    guestId: Optional[str] = None
    dayIndex: Optional[int] = None

class AIResponse(BaseModel):
    result: str
    model: str = GROQ_MODEL
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ---------------------------------------------------------------------------
# AI Health Check
# ---------------------------------------------------------------------------

@ai_router.get("/health")
async def ai_health_check():
    """Verify Groq API connectivity with a tiny request."""
    try:
        client = _get_groq_client()
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": "Reply with OK"}],
            max_tokens=5,
        )
        reply = response.choices[0].message.content
        return {
            "status": "ok",
            "model": GROQ_MODEL,
            "test_reply": reply,
            "timestamp": datetime.utcnow().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI health check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"AI service unavailable: {str(e)}"
        )


# ---------------------------------------------------------------------------
# POST /api/ai/summarize-guests
# ---------------------------------------------------------------------------

@ai_router.post("/summarize-guests", response_model=AIResponse)
async def summarize_guests(req: WeddingIdRequest):
    """
    Summarize guest RSVP data for the host dashboard.
    Returns counts, dietary breakdown, accommodation needs, and insights.
    """
    wedding, guests, _ = _load_wedding_data(req.weddingId)

    system_prompt = (
        "You are a wedding planning assistant. Provide a clear, concise summary "
        "of guest RSVP data for the wedding host. Include key statistics, dietary "
        "breakdown, accommodation needs, and any notable patterns. "
        "Format your response with sections and bullet points for readability."
    )

    user_prompt = (
        f"Please summarize the guest data for this wedding:\n\n"
        f"{_wedding_context(wedding)}\n\n"
        f"Guest Data:\n{_guests_context(guests)}"
    )

    result = _call_groq(system_prompt, user_prompt, max_tokens=1024)
    return AIResponse(result=result)


# ---------------------------------------------------------------------------
# POST /api/ai/generate-vendor-brief
# ---------------------------------------------------------------------------

@ai_router.post("/generate-vendor-brief", response_model=AIResponse)
async def generate_vendor_brief(req: WeddingIdRequest):
    """
    Generate a professional vendor brief document based on wedding, guest, and vendor data.
    Useful for sending to vendors so they understand requirements.
    """
    wedding, guests, vendors = _load_wedding_data(req.weddingId)

    system_prompt = (
        "You are a professional wedding coordinator. Generate a detailed vendor brief "
        "document that can be shared with all vendors. The brief should include:\n"
        "1. Wedding overview (name, dates, location, schedule)\n"
        "2. Guest count per day\n"
        "3. Dietary requirements breakdown (important for caterers)\n"
        "4. Accommodation statistics\n"
        "5. Vendor assignments and availability summary\n"
        "6. Key logistics and notes\n"
        "Format it professionally with clear headings and sections."
    )

    user_prompt = (
        f"Generate a vendor brief for this wedding:\n\n"
        f"{_wedding_context(wedding)}\n\n"
        f"Guest Data:\n{_guests_context(guests)}\n\n"
        f"Vendor Data:\n{_vendors_context(vendors)}"
    )

    result = _call_groq(system_prompt, user_prompt, max_tokens=2048)
    return AIResponse(result=result)


# ---------------------------------------------------------------------------
# POST /api/ai/chat
# ---------------------------------------------------------------------------

@ai_router.post("/chat", response_model=AIResponse)
async def ai_chat(req: ChatRequest):
    """
    AI copilot chat for hosts and guests.
    - Host mode: answer operational questions about the wedding.
    - Guest mode: answer guest queries about schedule, venues, logistics.
    """
    wedding, guests, vendors = _load_wedding_data(req.weddingId)

    if req.role == "host":
        system_prompt = (
            "You are an AI wedding operations copilot assisting the HOST of a multi-day "
            "Indian wedding. You have full access to wedding details, guest RSVPs, and "
            "vendor information. Help the host with operational questions, planning "
            "decisions, drafting messages to vendors or guests, and any logistics queries. "
            "Be concise but thorough. If asked to draft a message, make it professional "
            "and warm."
        )
    else:
        system_prompt = (
            "You are an AI wedding concierge assisting a GUEST at a multi-day Indian "
            "wedding. Help the guest with questions about the schedule, venues, dress code, "
            "what to expect at each event, and general wedding etiquette. Be friendly, "
            "warm, and helpful. Do NOT reveal private host operational details or other "
            "guests' personal information."
        )

    context = f"Wedding Info:\n{_wedding_context(wedding)}\n\n"
    if req.role == "host":
        context += f"Guest Data:\n{_guests_context(guests)}\n\n"
        context += f"Vendor Data:\n{_vendors_context(vendors)}\n\n"

    user_prompt = f"{context}User question: {req.message}"

    result = _call_groq(system_prompt, user_prompt, max_tokens=1024)
    return AIResponse(result=result)


# ---------------------------------------------------------------------------
# POST /api/ai/guest-day-suggestions
# ---------------------------------------------------------------------------

@ai_router.post("/guest-day-suggestions", response_model=AIResponse)
async def guest_day_suggestions(req: GuestDaySuggestionsRequest):
    """
    Generate activity suggestions for a guest between wedding events.
    Takes into account venue, time gaps, and local area.
    """
    wedding, guests, _ = _load_wedding_data(req.weddingId)

    # Determine which day to suggest for
    day_index = req.dayIndex if req.dayIndex is not None else 0
    if day_index < 0 or day_index >= len(wedding.days):
        raise HTTPException(
            status_code=400,
            detail=f"dayIndex {day_index} is out of range (0-{len(wedding.days) - 1})"
        )

    target_day = wedding.days[day_index]

    # Optionally get guest info
    guest_info = ""
    if req.guestId:
        try:
            guest_data = get_from_collection('guests.json', 'guests', req.guestId)
            guest = Guest(**guest_data)
            guest_info = (
                f"\nGuest: {guest.name} | Dietary: {guest.dietary} | "
                f"Accommodation: {guest.accommodation}"
            )
        except ValueError:
            guest_info = ""

    # Build event timeline for the day
    events_text = ""
    for ev in target_day.events:
        events_text += f"  - {ev.name} at {ev.time}, Venue: {ev.venue}\n"

    system_prompt = (
        "You are a friendly AI concierge for a multi-day Indian wedding. "
        "Suggest activities, rest breaks, and things to do between wedding events. "
        "Consider the venue/location, time gaps between events, and that guests may "
        "want to explore the area, rest, or prepare for the next event. "
        "Give practical, fun, and culturally appropriate suggestions. "
        "Format as a timeline-style day plan."
    )

    user_prompt = (
        f"Suggest a day plan for Day {day_index + 1} ({target_day.date}) of this wedding:\n\n"
        f"Wedding: {wedding.name}\n"
        f"Location: {wedding.location}\n"
        f"\nEvents for the day:\n{events_text}"
        f"{guest_info}\n\n"
        f"Please suggest what the guest can do between events, including rest time, "
        f"local activities, preparation tips, and any other helpful suggestions."
    )

    result = _call_groq(system_prompt, user_prompt, max_tokens=1024)
    return AIResponse(result=result)
