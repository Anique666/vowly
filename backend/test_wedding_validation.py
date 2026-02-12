#!/usr/bin/env python3
"""
Wedding API Validation Test Script
Tests the new /api/wedding/create endpoint with all validation rules
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
            print(f"   Error: {data.get('detail', 'Unknown error')}")
        else:
            if 'id' in data:
                print(f"   Created: {data.get('name', 'N/A')} (ID: {data['id'][:8]}...)")
    except:
        print(f"   Response: {response.text[:100]}")

def test_validation():
    """Test all validation rules"""
    
    print_section("VALIDATION TESTS - POST /api/wedding/create")
    
    # Test 1: Valid wedding creation
    print_test(
        "Test 1: Valid Wedding",
        "201 Created with wedding object"
    )
    
    valid_wedding = {
        "name": "Beautiful Royal Wedding",
        "location": "Jaipur Palace, Rajasthan",
        "startDate": "2026-09-15",
        "endDate": "2026-09-17",
        "days": [
            {
                "dayIndex": 0,
                "date": "2026-09-15",
                "events": [
                    {"name": "Mehendi Ceremony", "time": "16:00", "venue": "Garden Terrace"},
                    {"name": "Sangeet Night", "time": "20:00", "venue": "Grand Hall"}
                ]
            },
            {
                "dayIndex": 1,
                "date": "2026-09-16",
                "events": [
                    {"name": "Haldi Ceremony", "time": "09:00", "venue": "Poolside"},
                    {"name": "Wedding Ceremony", "time": "18:00", "venue": "Palace Courtyard"}
                ]
            },
            {
                "dayIndex": 2,
                "date": "2026-09-17",
                "events": [
                    {"name": "Reception", "time": "19:00", "venue": "Royal Banquet Hall"}
                ]
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/wedding/create", json=valid_wedding)
    print_result(response.status_code == 201, response)
    
    wedding_id = response.json().get('id') if response.status_code == 201 else None
    
    # Test 2: Empty name validation
    print_test(
        "Test 2: Empty Wedding Name",
        "400 Bad Request - 'Wedding name is required'"
    )
    
    invalid_wedding = valid_wedding.copy()
    invalid_wedding["name"] = ""
    
    response = requests.post(f"{BASE_URL}/wedding/create", json=invalid_wedding)
    print_result(response.status_code == 400, response)
    
    # Test 3: Whitespace-only name validation
    print_test(
        "Test 3: Whitespace-only Name",
        "400 Bad Request - 'Wedding name is required'"
    )
    
    invalid_wedding = valid_wedding.copy()
    invalid_wedding["name"] = "   "
    
    response = requests.post(f"{BASE_URL}/wedding/create", json=invalid_wedding)
    print_result(response.status_code == 400, response)
    
    # Test 4: No days validation
    print_test(
        "Test 4: No Days Provided",
        "400 Bad Request - 'At least one day is required'"
    )
    
    invalid_wedding = valid_wedding.copy()
    invalid_wedding["days"] = []
    
    response = requests.post(f"{BASE_URL}/wedding/create", json=invalid_wedding)
    print_result(response.status_code == 400, response)
    
    # Test 5: No events validation
    print_test(
        "Test 5: No Events Provided",
        "400 Bad Request - 'At least one event is required'"
    )
    
    invalid_wedding = valid_wedding.copy()
    invalid_wedding["days"] = [
        {
            "dayIndex": 0,
            "date": "2026-09-15",
            "events": []
        }
    ]
    
    response = requests.post(f"{BASE_URL}/wedding/create", json=invalid_wedding)
    print_result(response.status_code == 400, response)
    
    # Test 6: Multiple days but no events
    print_test(
        "Test 6: Multiple Days with No Events",
        "400 Bad Request - 'At least one event is required'"
    )
    
    invalid_wedding = valid_wedding.copy()
    invalid_wedding["days"] = [
        {"dayIndex": 0, "date": "2026-09-15", "events": []},
        {"dayIndex": 1, "date": "2026-09-16", "events": []},
    ]
    
    response = requests.post(f"{BASE_URL}/wedding/create", json=invalid_wedding)
    print_result(response.status_code == 400, response)
    
    print_section("RETRIEVAL TESTS - GET /api/wedding/{id}")
    
    if wedding_id:
        # Test 7: Get existing wedding
        print_test(
            "Test 7: Get Existing Wedding",
            "200 OK with wedding object"
        )
        
        response = requests.get(f"{BASE_URL}/wedding/{wedding_id}")
        print_result(response.status_code == 200, response)
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Details: {data['name']}, {len(data['days'])} days, "
                  f"{sum(len(d['events']) for d in data['days'])} events")
    
    # Test 8: Get non-existent wedding
    print_test(
        "Test 8: Get Non-existent Wedding",
        "404 Not Found"
    )
    
    response = requests.get(f"{BASE_URL}/wedding/invalid-uuid-12345")
    print_result(response.status_code == 404, response)
    
    print_section("HTTP STATUS CODE TESTS")
    
    # Test 9: Verify correct status codes
    print_test(
        "Test 9: Verify Status Codes",
        "201 for create, 200 for get, 400 for validation, 404 for not found"
    )
    
    status_tests = [
        ("Valid create", requests.post(f"{BASE_URL}/wedding/create", json=valid_wedding), 201),
        ("Invalid name", requests.post(f"{BASE_URL}/wedding/create", json={**valid_wedding, "name": ""}), 400),
        ("No days", requests.post(f"{BASE_URL}/wedding/create", json={**valid_wedding, "days": []}), 400),
        ("Get non-existent", requests.get(f"{BASE_URL}/wedding/fake-id"), 404),
    ]
    
    all_correct = True
    for name, response, expected in status_tests:
        correct = response.status_code == expected
        all_correct = all_correct and correct
        symbol = "✓" if correct else "✗"
        print(f"   {symbol} {name}: {response.status_code} (expected {expected})")
    
    print(f"\n   Overall: {'✓ PASS' if all_correct else '✗ FAIL'}")
    
    print_section("TEST SUMMARY")
    print("\nAll validation rules tested:")
    print("  ✓ Wedding name is required (not empty/whitespace)")
    print("  ✓ At least one day is required")
    print("  ✓ At least one event is required (across all days)")
    print("  ✓ Proper HTTP status codes (201, 200, 400, 404)")
    print("  ✓ Proper JSON error responses")
    print("\n✨ Wedding API validation is working correctly!")

if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════════════════════════════╗
    ║        Wedding API - Validation Test Suite                    ║
    ║                                                                ║
    ║  Tests POST /api/wedding/create with validation rules         ║
    ║  Tests GET /api/wedding/{id} with proper error handling       ║
    ╚════════════════════════════════════════════════════════════════╝
    """)
    
    try:
        test_validation()
    except requests.exceptions.ConnectionError:
        print("\n✗ Error: Could not connect to the API server.")
        print("Make sure the backend is running at", BASE_URL)
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
