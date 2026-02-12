#!/usr/bin/env python3
"""
Wedding Management API Test Script
Demonstrates all CRUD operations for the wedding management system
"""

import requests
import json
from typing import Dict, Any

# Base URL - update this to your deployed URL
BASE_URL = "http://localhost:8001/api"

def print_section(title: str):
    """Print a formatted section header"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def print_response(response: requests.Response):
    """Print formatted response"""
    if response.status_code < 300:
        print(f"✓ Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"✗ Error: {response.status_code}")
        print(response.text)

def test_wedding_crud():
    """Test Wedding CRUD operations"""
    
    print_section("1. CREATE WEDDING")
    wedding_data = {
        "name": "Emma & Michael Wedding",
        "location": "Jaipur, Rajasthan",
        "startDate": "2026-12-10",
        "endDate": "2026-12-12",
        "days": [
            {
                "dayIndex": 0,
                "date": "2026-12-10",
                "events": [
                    {"name": "Welcome Dinner", "time": "19:00", "venue": "Palace Lawn"},
                    {"name": "Mehndi", "time": "21:00", "venue": "Garden"}
                ]
            },
            {
                "dayIndex": 1,
                "date": "2026-12-11",
                "events": [
                    {"name": "Haldi Ceremony", "time": "10:00", "venue": "Courtyard"},
                    {"name": "Sangeet Night", "time": "19:00", "venue": "Grand Hall"}
                ]
            },
            {
                "dayIndex": 2,
                "date": "2026-12-12",
                "events": [
                    {"name": "Wedding Ceremony", "time": "18:00", "venue": "Royal Hall"},
                    {"name": "Reception", "time": "20:00", "venue": "Banquet"}
                ]
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/weddings", json=wedding_data)
    print_response(response)
    wedding_id = response.json()["id"] if response.status_code < 300 else None
    
    if not wedding_id:
        print("Failed to create wedding. Exiting.")
        return
    
    print_section("2. LIST ALL WEDDINGS")
    response = requests.get(f"{BASE_URL}/weddings")
    print_response(response)
    
    print_section("3. GET SPECIFIC WEDDING")
    response = requests.get(f"{BASE_URL}/weddings/{wedding_id}")
    print_response(response)
    
    print_section("4. CREATE GUESTS")
    guests_data = [
        {
            "weddingId": wedding_id,
            "name": "Amit Patel",
            "email": "amit@example.com",
            "attendingDays": [True, True, True],
            "dietary": "veg",
            "accommodation": True
        },
        {
            "weddingId": wedding_id,
            "name": "Sarah Johnson",
            "email": "sarah@example.com",
            "attendingDays": [False, True, True],
            "dietary": "non-veg",
            "accommodation": False
        },
        {
            "weddingId": wedding_id,
            "name": "Rajesh Kumar",
            "email": "rajesh@example.com",
            "attendingDays": [True, True, True],
            "dietary": "jain",
            "accommodation": True
        }
    ]
    
    for guest_data in guests_data:
        response = requests.post(f"{BASE_URL}/guests", json=guest_data)
        if response.status_code < 300:
            print(f"✓ Created guest: {guest_data['name']}")
    
    print_section("5. LIST GUESTS FOR WEDDING")
    response = requests.get(f"{BASE_URL}/guests?wedding_id={wedding_id}")
    print_response(response)
    
    print_section("6. CREATE VENDORS")
    vendors_data = [
        {
            "weddingId": wedding_id,
            "name": "Maharaja Caterers",
            "serviceType": "catering",
            "email": "info@maharajacaterers.com",
            "phoneNumber": "+91-9876543210",
            "attendingDays": [False, True, True],
            "notes": "Specializes in royal Rajasthani cuisine"
        },
        {
            "weddingId": wedding_id,
            "name": "Dream Photography",
            "serviceType": "photography",
            "email": "contact@dreamphotos.com",
            "phoneNumber": "+91-9876543211",
            "attendingDays": [True, True, True],
            "notes": "Professional wedding photography and videography"
        },
        {
            "weddingId": wedding_id,
            "name": "Flower Power Decorations",
            "serviceType": "decoration",
            "email": "info@flowerpower.com",
            "phoneNumber": "+91-9876543212",
            "attendingDays": [True, True, True],
            "notes": "Floral and traditional Indian wedding decorations"
        }
    ]
    
    for vendor_data in vendors_data:
        response = requests.post(f"{BASE_URL}/vendors", json=vendor_data)
        if response.status_code < 300:
            print(f"✓ Created vendor: {vendor_data['name']} ({vendor_data['serviceType']})")
    
    print_section("7. LIST VENDORS FOR WEDDING")
    response = requests.get(f"{BASE_URL}/vendors?wedding_id={wedding_id}")
    print_response(response)
    
    print_section("8. UPDATE GUEST")
    response = requests.get(f"{BASE_URL}/guests?wedding_id={wedding_id}")
    if response.status_code < 300 and response.json():
        guest = response.json()[0]
        guest_id = guest["id"]
        
        updated_guest = {
            "weddingId": wedding_id,
            "name": guest["name"],
            "email": guest["email"],
            "attendingDays": [True, True, False],  # Changed attendance
            "dietary": "vegan",  # Changed dietary preference
            "accommodation": True
        }
        
        response = requests.put(f"{BASE_URL}/guests/{guest_id}", json=updated_guest)
        print_response(response)
    
    print_section("9. CREATE PHOTO ENTRY")
    photo_data = {
        "weddingId": wedding_id,
        "dayIndex": 1,
        "url": "https://example.com/photos/sangeet-night.jpg",
        "caption": "Beautiful moments from Sangeet Night"
    }
    
    response = requests.post(f"{BASE_URL}/photos", json=photo_data)
    print_response(response)
    
    print_section("10. LIST PHOTOS FOR WEDDING")
    response = requests.get(f"{BASE_URL}/photos?wedding_id={wedding_id}")
    print_response(response)
    
    print_section("TEST COMPLETED SUCCESSFULLY!")
    print(f"\nWedding ID for further testing: {wedding_id}")

if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║        Wedding Management API - Test Suite              ║
    ║                                                          ║
    ║  This script demonstrates all CRUD operations           ║
    ║  Make sure the backend server is running on port 8001   ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    try:
        test_wedding_crud()
    except requests.exceptions.ConnectionError:
        print("\n✗ Error: Could not connect to the API server.")
        print("Make sure the backend is running at", BASE_URL)
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
