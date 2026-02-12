"""
Unified AI routes powered by Groq LLM API.

Includes:
1. Health Check
2. Summarize Guests
3. Generate Vendor Brief
4. Host/Guest Chat
5. Guest Day Suggestions
6. Ops Agent - Handle Issue
7. Planner - Set Basic Details
8. Planner - Search Vendor (AI summarization)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
import os
import logging
import json
from datetime import datetime
import smtplib
from email.message import EmailMessage

from groq import Groq

from models.wedding_models import Wedding, Guest, Vendor
from utils.file_utils import get_from_collection, list_collection

logger = logging.getLogger(__name__)
ai_router = APIRouter(prefix="/api/ai", tags=["AI"])

# -------------------------------------------------------------------
# Groq Setup
# -------------------------------------------------------------------

_groq_client: Optional[Groq] = None
GROQ_MODEL = "llama-3.1-8b-instant"
GROQ_TIMEOUT = 30

EMAIL_ADDRESS = os.getenv("ALERT_EMAIL")
EMAIL_PASSWORD = os.getenv("ALERT_EMAIL_PASSWORD")

def _get_groq_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="GROQ_API_KEY not set")
        _groq_client = Groq(api_key=api_key, timeout=GROQ_TIMEOUT)
    return _groq_client

def _call_groq(system_prompt: str, user_prompt: str, max_tokens: int = 1024) -> str:
    try:
        client = _get_groq_client()
        res = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.5,
            max_tokens=max_tokens,
        )
        return res.choices[0].message.content
    except Exception as e:
        logger.error(f"Groq error: {e}")
        raise HTTPException(status_code=502, detail="AI service unavailable")

# -------------------------------------------------------------------
# Context Builders
# -------------------------------------------------------------------

def _wedding_context(wedding: Wedding) -> str:
    lines = [
        f"Wedding: {wedding.name}",
        f"Location: {wedding.location}",
        f"Dates: {wedding.startDate} to {wedding.endDate}",
    ]
    for day in wedding.days:
        lines.append(f"\nDay {day.dayIndex + 1} ({day.date}):")
        for ev in day.events:
            lines.append(f"- {ev.name} at {ev.time}, Venue: {ev.venue}")
    return "\n".join(lines)

def _guests_context(guests: list[dict]) -> str:
    return json.dumps(guests, indent=2) if guests else "No guests yet."

def _vendors_context(vendors: list[dict]) -> str:
    return json.dumps(vendors, indent=2) if vendors else "No vendors yet."

def _load_wedding_data(wedding_id: str):
    try:
        wedding_data = get_from_collection("wedding.json", "weddings", wedding_id)
        wedding = Wedding(**wedding_data)
    except ValueError:
        raise HTTPException(status_code=404, detail="Wedding not found")

    guests = list_collection("guests.json", "guests", {"weddingId": wedding_id})
    vendors = list_collection("vendors.json", "vendors", {"weddingId": wedding_id})
    return wedding, guests, vendors

# -------------------------------------------------------------------
# Request Models
# -------------------------------------------------------------------

class WeddingIdRequest(BaseModel):
    weddingId: str

class ChatRequest(BaseModel):
    weddingId: str
    message: str
    role: str = "host"

class GuestDaySuggestionsRequest(BaseModel):
    weddingId: str
    dayIndex: Optional[int] = 0

class OpsIssueRequest(BaseModel):
    issue: str
    confirm: Optional[bool] = False

class PlannerSetDetailsRequest(BaseModel):
    location: str
    budget: str
    date: str
    guests: str

class PlannerSearchRequest(BaseModel):
    vendor_type: str

class AIResponse(BaseModel):
    result: str
    model: str = GROQ_MODEL
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# -------------------------------------------------------------------
# In-memory Planner State
# -------------------------------------------------------------------

wedding_state = {
    "location": None,
    "budget": None,
    "date": None,
    "guests": None,
}

# -------------------------------------------------------------------
# 1️⃣ Health Check
# -------------------------------------------------------------------

@ai_router.get("/health")
async def ai_health():
    client = _get_groq_client()
    res = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": "Reply OK"}],
        max_tokens=5,
    )
    return {"status": "ok", "model": GROQ_MODEL, "reply": res.choices[0].message.content}

# -------------------------------------------------------------------
# 2️⃣ Summarize Guests
# -------------------------------------------------------------------

@ai_router.post("/summarize-guests", response_model=AIResponse)
async def summarize_guests(req: WeddingIdRequest):
    wedding, guests, _ = _load_wedding_data(req.weddingId)
    system = "You are a wedding planning assistant."
    user = f"{_wedding_context(wedding)}\nGuests:\n{_guests_context(guests)}"
    result = _call_groq(system, user)
    return AIResponse(result=result)

# -------------------------------------------------------------------
# 3️⃣ Generate Vendor Brief
# -------------------------------------------------------------------

@ai_router.post("/generate-vendor-brief", response_model=AIResponse)
async def generate_vendor_brief(req: WeddingIdRequest):
    wedding, guests, vendors = _load_wedding_data(req.weddingId)
    system = "You are a professional wedding coordinator writing a vendor brief."
    user = f"{_wedding_context(wedding)}\nGuests:\n{_guests_context(guests)}\nVendors:\n{_vendors_context(vendors)}"
    result = _call_groq(system, user, max_tokens=2048)
    return AIResponse(result=result)

# -------------------------------------------------------------------
# 4️⃣ AI Chat
# -------------------------------------------------------------------

@ai_router.post("/chat", response_model=AIResponse)
async def ai_chat(req: ChatRequest):
    wedding, guests, vendors = _load_wedding_data(req.weddingId)
    system = "You are an AI wedding copilot."
    context = f"{_wedding_context(wedding)}\nGuests:\n{_guests_context(guests)}\nVendors:\n{_vendors_context(vendors)}"
    result = _call_groq(system, f"{context}\nUser: {req.message}")
    return AIResponse(result=result)

# -------------------------------------------------------------------
# 5️⃣ Guest Day Suggestions
# -------------------------------------------------------------------

@ai_router.post("/guest-day-suggestions", response_model=AIResponse)
async def guest_day_suggestions(req: GuestDaySuggestionsRequest):
    wedding, _, _ = _load_wedding_data(req.weddingId)
    day = wedding.days[req.dayIndex or 0]
    system = "You are a friendly wedding concierge."
    user = f"{_wedding_context(wedding)}\nEvents for the day:\n{json.dumps(day.model_dump(), indent=2)}"
    result = _call_groq(system, user)
    return AIResponse(result=result)

# -------------------------------------------------------------------
# 6️⃣ Ops Agent
# -------------------------------------------------------------------

@ai_router.post("/ops/handle-issue", response_model=Dict)
async def handle_ops_issue(req: OpsIssueRequest):
    system = "You are an AI wedding operations coordinator."
    user = f"Issue: {req.issue}\nReturn JSON with role, priority, action, message."
    raw = _call_groq(system, user)
    try:
        data = json.loads(raw[raw.index("{"):raw.rindex("}")+1])
        return data
    except Exception:
        raise HTTPException(status_code=500, detail="Invalid AI response")

# -------------------------------------------------------------------
# 7️⃣ Planner - Set Details
# -------------------------------------------------------------------

@ai_router.post("/planner/set-details")
async def planner_set_details(req: PlannerSetDetailsRequest):
    wedding_state.update(req.model_dump())
    return {"status": "updated", "state": wedding_state}

# -------------------------------------------------------------------
# 8️⃣ Planner - Search Vendor (AI summary)
# -------------------------------------------------------------------

@ai_router.post("/planner/search-vendor", response_model=AIResponse)
async def planner_search_vendor(req: PlannerSearchRequest):
    system = "You are a wedding planner assistant."
    user = f"Suggest top 3 {req.vendor_type} options in {wedding_state['location']} with brief summaries."
    result = _call_groq(system, user)
    return AIResponse(result=result)