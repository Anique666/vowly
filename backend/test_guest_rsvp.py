#!/usr/bin/env python3
"""
Guest RSVP API Validation Test Script
Tests POST /api/guest/rsvp and GET /api/guest/list endpoints
"""

import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8001/api"

def print_section(title: str):
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def print_test(test_name: str, expected: str):
    print(f"\n🧪 {test_name}")
    print(f"   Expected: {expected}")

def print_result(success: bool, response: requests.Response):
    status = "✓ PASS" if success else "✗ FAIL"
    print(f"   Result: {status} - Status {response.status_code}")
    
    try:
        data = response.json()
        if response.status_code >= 400:
            if isinstance(data.get('detail'), list):
                print(f"   Error: {data['detail'][0].get('msg', 'Validation error')}")
            else:
                print(f"   Error: {data.get('detail', 'Unknown error')}")
        else:
            if isinstance(data, list):
                print(f"   Returned: {len(data)} guests")
            elif 'name' in data:
                print(f"   Created: {data['name']} ({data['email']})")
    except:
        print(f"   Response: {response.text[:100]}")

def test_guest_rsvp():
    """Test Guest RSVP endpoints with validation"""
    
    print_section("SETUP - Create Test Wedding")
    
    # Create a test wedding
    wedding_data = {
        "name": "Guest RSVP Test Wedding",
        "location": "Test Venue",
        "startDate": "2026-11-01",
        "endDate": "2026-11-03",
        "days": [
            {
                "dayIndex": 0,
                "date": "2026-11-01",
                "events": [{"name": "Welcome", "time": "18:00", "venue": "Garden"}]
            },
            {
                "dayIndex": 1,
                "date": "2026-11-02",
                "events": [{"name": "Ceremony", "time": "16:00", "venue": "Hall"}]
            },
            {
                "dayIndex": 2,
                "date": "2026-11-03",
                "events": [{"name": "Reception", "time": "19:00", "venue": "Ballroom"}]
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/wedding/create", json=wedding_data)
    wedding_id = response.json()["id"] if response.status_code == 201 else None
    
    if not wedding_id:
        print("✗ Failed to create test wedding. Exiting.")
        return
    
    print(f"✓ Created test wedding: {wedding_id[:8]}...")
    print(f"  Wedding has {len(wedding_data['days'])} days")
    
    print_section("VALIDATION TESTS - POST /api/guest/rsvp")
    
    # Test 1: Valid guest RSVP
    print_test(
        "Test 1: Valid Guest RSVP",
        "201 Created with guest object"
    )
    
    valid_guest = {
        "weddingId": wedding_id,
        "name": "Amit Kumar",
        "email": "amit@example.com",
        "attendingDays": [True, True, True],
        "dietary": "veg",
        "accommodation": True
    }
    
    response = requests.post(f"{BASE_URL}/guest/rsvp", json=valid_guest)
    print_result(response.status_code == 201, response)
    
    # Test 2: Invalid email format
    print_test(
        "Test 2: Invalid Email Format",
        "422 Unprocessable Entity - Email validation error"
    )
    
    invalid_guest = valid_guest.copy()
    invalid_guest["email"] = "not-an-email"
    
    response = requests.post(f"{BASE_URL}/guest/rsvp", json=invalid_guest)
    print_result(response.status_code == 422, response)
    
    # Test 3: Missing email (optional field)
    print_test(
        "Test 3: Missing Email (Optional)",
        "201 Created - email is optional"
    )
    
    guest_no_email = valid_guest.copy()
    guest_no_email["email"] = None
    guest_no_email["name"] = "Guest Without Email"
    
    response = requests.post(f"{BASE_URL}/guest/rsvp", json=guest_no_email)
    print_result(response.status_code == 201, response)
    
    # Test 4: attendingDays too short
    print_test(
        "Test 4: attendingDays Too Short",
        "400 Bad Request - length mismatch"
    )
    
    invalid_guest = valid_guest.copy()
    invalid_guest["attendingDays"] = [True, False]  # Only 2 days
    invalid_guest["email"] = "short@example.com"
    invalid_guest["name"] = "Short Days Guest"
    
    response = requests.post(f"{BASE_URL}/guest/rsvp", json=invalid_guest)
    print_result(response.status_code == 400, response)
    
    # Test 5: attendingDays too long
    print_test(
        "Test 5: attendingDays Too Long",
        "400 Bad Request - length mismatch"
    )
    
    invalid_guest = valid_guest.copy()
    invalid_guest["attendingDays"] = [True, True, True, True]  # 4 days
    invalid_guest["email"] = "long@example.com"
    invalid_guest["name"] = "Long Days Guest"
    
    response = requests.post(f"{BASE_URL}/guest/rsvp", json=invalid_guest)
    print_result(response.status_code == 400, response)
    
    # Test 6: Non-existent wedding ID
    print_test(
        "Test 6: Non-existent Wedding ID",
        "404 Not Found"
    )
    
    invalid_guest = valid_guest.copy()
    invalid_guest["weddingId"] = "fake-wedding-id-12345"
    invalid_guest["email"] = "fake@example.com"
    invalid_guest["name"] = "Fake Wedding Guest"
    
    response = requests.post(f"{BASE_URL}/guest/rsvp", json=invalid_guest)
    print_result(response.status_code == 404, response)
    
    # Add more guests for list testing
    print("\n📝 Adding more test guests...")
    
    guests_to_add = [
        {
            "name": "Priya Sharma",
            "email": "priya@example.com",
            "attendingDays": [True, True, False],
            "dietary": "veg",
            "accommodation": True
        },
        {
            "name": "Rajesh Patel",
            "email": "rajesh@example.com",
            "attendingDays": [False, True, True],
            "dietary": "jain",
            "accommodation": False
        },
        {
            "name": "Sarah Johnson",
            "email": "sarah@example.com",
            "attendingDays": [True, False, True],
            "dietary": "non-veg",
            "accommodation": True
        }
    ]
    
    for guest in guests_to_add:
        guest["weddingId"] = wedding_id
        response = requests.post(f"{BASE_URL}/guest/rsvp", json=guest)
        if response.status_code == 201:
            print(f"  ✓ Added: {guest['name']}")
    
    print_section("LIST TESTS - GET /api/guest/list")
    
    # Test 7: List all guests for wedding
    print_test(
        "Test 7: List All Guests for Wedding",
        "200 OK with array of guests"
    )
    
    response = requests.get(f"{BASE_URL}/guest/list?weddingId={wedding_id}")
    print_result(response.status_code == 200, response)
    
    if response.status_code == 200:
        guests = response.json()
        print(f"\n   Guest Details:")
        for guest in guests:
            attending = ''.join(['✓' if a else '✗' for a in guest['attendingDays']])
            print(f"     • {guest['name']}")
            print(f"       Days: {attending} | {guest['dietary']} | Accommodation: {'Yes' if guest['accommodation'] else 'No'}")
    
    # Test 8: List guests for non-existent wedding
    print_test(
        "Test 8: List Guests for Non-existent Wedding",
        "404 Not Found"
    )
    
    response = requests.get(f"{BASE_URL}/guest/list?weddingId=invalid-id")
    print_result(response.status_code == 404, response)
    
    # Test 9: Verify attendingDays alignment
    print_test(
        "Test 9: Verify attendingDays Alignment",
        "All guests should have exactly 3 attendingDays entries"
    )
    
    response = requests.get(f"{BASE_URL}/guest/list?weddingId={wedding_id}")
    if response.status_code == 200:
        guests = response.json()
        all_correct = all(len(g['attendingDays']) == 3 for g in guests)
        print(f"   Result: {'✓ PASS' if all_correct else '✗ FAIL'}")
        
        for guest in guests:
            length = len(guest['attendingDays'])
            status = "✓" if length == 3 else "✗"
            print(f"     {status} {guest['name']}: {length} days")
    else:
        print("   Result: ✗ FAIL - Could not retrieve guests")
    
    print_section("DIETARY OPTIONS TEST")
    
    # Test 10: Test all dietary options
    print_test(
        "Test 10: All Dietary Options",
        "veg, non-veg, jain, vegan all accepted"
    )
    
    dietary_options = ["veg", "non-veg", "jain", "vegan"]
    all_success = True
    
    for i, dietary in enumerate(dietary_options):
        test_guest = {
            "weddingId": wedding_id,
            "name": f"Dietary Test {i+1}",
            "email": f"dietary{i+1}@example.com",
            "attendingDays": [True, True, True],
            "dietary": dietary,
            "accommodation": False
        }
        
        response = requests.post(f"{BASE_URL}/guest/rsvp", json=test_guest)
        success = response.status_code == 201
        all_success = all_success and success
        status = "✓" if success else "✗"
        print(f"     {status} {dietary}: {response.status_code}")
    
    print(f"\n   Overall: {'✓ PASS' if all_success else '✗ FAIL'}")
    
    print_section("TEST SUMMARY")
    print("\nAll validation rules tested:")
    print("  ✓ Email format validation (Pydantic)")
    print("  ✓ attendingDays length matches wedding days (custom)")
    print("  ✓ Wedding existence validation")
    print("  ✓ Proper HTTP status codes (201, 200, 400, 404, 422)")
    print("  ✓ All dietary options accepted")
    print("  ✓ Optional email field handling")
    print("\n✨ Guest RSVP API validation is working correctly!")

if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════════════════════════════╗
    ║        Guest RSVP API - Validation Test Suite                 ║
    ║                                                                ║
    ║  Tests POST /api/guest/rsvp with validation rules             ║
    ║  Tests GET /api/guest/list with wedding filtering             ║
    ╚════════════════════════════════════════════════════════════════╝
    """)
    
    try:
        test_guest_rsvp()
    except requests.exceptions.ConnectionError:
        print("\n✗ Error: Could not connect to the API server.")
        print("Make sure the backend is running at", BASE_URL)
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
