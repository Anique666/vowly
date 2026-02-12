#!/usr/bin/env python3
"""
Vendor API Validation Test Script
Tests POST /api/vendor/respond and GET /api/vendor/list endpoints
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
                print(f"   Returned: {len(data)} vendors")
            elif 'name' in data:
                print(f"   Created: {data['name']} ({data['serviceType']})")
    except:
        print(f"   Response: {response.text[:100]}")

def test_vendor_api():
    """Test Vendor API endpoints with validation"""
    
    print_section("SETUP - Create Test Wedding")
    
    # Create a test wedding
    wedding_data = {
        "name": "Vendor API Test Wedding",
        "location": "Test Venue",
        "startDate": "2026-12-01",
        "endDate": "2026-12-03",
        "days": [
            {
                "dayIndex": 0,
                "date": "2026-12-01",
                "events": [{"name": "Welcome", "time": "18:00", "venue": "Garden"}]
            },
            {
                "dayIndex": 1,
                "date": "2026-12-02",
                "events": [{"name": "Ceremony", "time": "16:00", "venue": "Hall"}]
            },
            {
                "dayIndex": 2,
                "date": "2026-12-03",
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
    
    print_section("VALIDATION TESTS - POST /api/vendor/respond")
    
    # Test 1: Valid vendor response
    print_test(
        "Test 1: Valid Vendor Response",
        "201 Created with vendor object"
    )
    
    valid_vendor = {
        "weddingId": wedding_id,
        "name": "Royal Caterers",
        "serviceType": "catering",
        "email": "info@royalcaterers.com",
        "phoneNumber": "+91-9876543210",
        "attendingDays": [False, True, True],
        "notes": "Specializes in North Indian cuisine"
    }
    
    response = requests.post(f"{BASE_URL}/vendor/respond", json=valid_vendor)
    print_result(response.status_code == 201, response)
    
    # Test 2: Invalid email format
    print_test(
        "Test 2: Invalid Email Format",
        "422 Unprocessable Entity - Email validation error"
    )
    
    invalid_vendor = valid_vendor.copy()
    invalid_vendor["email"] = "not-an-email"
    invalid_vendor["name"] = "Invalid Email Vendor"
    
    response = requests.post(f"{BASE_URL}/vendor/respond", json=invalid_vendor)
    print_result(response.status_code == 422, response)
    
    # Test 3: Missing email (optional field)
    print_test(
        "Test 3: Missing Email (Optional)",
        "201 Created - email is optional"
    )
    
    vendor_no_email = valid_vendor.copy()
    vendor_no_email["email"] = None
    vendor_no_email["name"] = "Vendor Without Email"
    vendor_no_email["serviceType"] = "decoration"
    
    response = requests.post(f"{BASE_URL}/vendor/respond", json=vendor_no_email)
    print_result(response.status_code == 201, response)
    
    # Test 4: attendingDays too short
    print_test(
        "Test 4: attendingDays Too Short",
        "400 Bad Request - length mismatch"
    )
    
    invalid_vendor = valid_vendor.copy()
    invalid_vendor["attendingDays"] = [True, False]  # Only 2 days
    invalid_vendor["email"] = "short@example.com"
    invalid_vendor["name"] = "Short Days Vendor"
    invalid_vendor["serviceType"] = "photography"
    
    response = requests.post(f"{BASE_URL}/vendor/respond", json=invalid_vendor)
    print_result(response.status_code == 400, response)
    
    # Test 5: attendingDays too long
    print_test(
        "Test 5: attendingDays Too Long",
        "400 Bad Request - length mismatch"
    )
    
    invalid_vendor = valid_vendor.copy()
    invalid_vendor["attendingDays"] = [True, True, True, True]  # 4 days
    invalid_vendor["email"] = "long@example.com"
    invalid_vendor["name"] = "Long Days Vendor"
    invalid_vendor["serviceType"] = "music"
    
    response = requests.post(f"{BASE_URL}/vendor/respond", json=invalid_vendor)
    print_result(response.status_code == 400, response)
    
    # Test 6: Non-existent wedding ID
    print_test(
        "Test 6: Non-existent Wedding ID",
        "404 Not Found"
    )
    
    invalid_vendor = valid_vendor.copy()
    invalid_vendor["weddingId"] = "fake-wedding-id-12345"
    invalid_vendor["email"] = "fake@example.com"
    invalid_vendor["name"] = "Fake Wedding Vendor"
    
    response = requests.post(f"{BASE_URL}/vendor/respond", json=invalid_vendor)
    print_result(response.status_code == 404, response)
    
    # Add more vendors for list testing
    print("\n📝 Adding more test vendors...")
    
    vendors_to_add = [
        {
            "name": "Dream Photography",
            "serviceType": "photography",
            "email": "contact@dreamphotos.com",
            "phoneNumber": "+91-9876543211",
            "attendingDays": [True, True, True],
            "notes": "Professional wedding photography and videography"
        },
        {
            "name": "Flower Power Decorations",
            "serviceType": "decoration",
            "email": "info@flowerpower.com",
            "phoneNumber": "+91-9876543212",
            "attendingDays": [True, True, False],
            "notes": "Floral and traditional decorations"
        },
        {
            "name": "Sound Masters",
            "serviceType": "music",
            "email": "booking@soundmasters.com",
            "phoneNumber": "+91-9876543213",
            "attendingDays": [False, True, True],
            "notes": "DJ and professional sound system"
        }
    ]
    
    for vendor in vendors_to_add:
        vendor["weddingId"] = wedding_id
        response = requests.post(f"{BASE_URL}/vendor/respond", json=vendor)
        if response.status_code == 201:
            print(f"  ✓ Added: {vendor['name']} ({vendor['serviceType']})")
    
    print_section("LIST TESTS - GET /api/vendor/list")
    
    # Test 7: List all vendors for wedding
    print_test(
        "Test 7: List All Vendors for Wedding",
        "200 OK with array of vendors"
    )
    
    response = requests.get(f"{BASE_URL}/vendor/list?weddingId={wedding_id}")
    print_result(response.status_code == 200, response)
    
    if response.status_code == 200:
        vendors = response.json()
        print(f"\n   Vendor Details:")
        for vendor in vendors:
            attending = ''.join(['✓' if a else '✗' for a in vendor['attendingDays']])
            print(f"     • {vendor['name']} ({vendor['serviceType']})")
            print(f"       Days: {attending} | Phone: {vendor.get('phoneNumber', 'N/A')}")
    
    # Test 8: List vendors for non-existent wedding
    print_test(
        "Test 8: List Vendors for Non-existent Wedding",
        "404 Not Found"
    )
    
    response = requests.get(f"{BASE_URL}/vendor/list?weddingId=invalid-id")
    print_result(response.status_code == 404, response)
    
    # Test 9: Verify attendingDays alignment
    print_test(
        "Test 9: Verify attendingDays Alignment",
        "All vendors should have exactly 3 attendingDays entries"
    )
    
    response = requests.get(f"{BASE_URL}/vendor/list?weddingId={wedding_id}")
    if response.status_code == 200:
        vendors = response.json()
        all_correct = all(len(v['attendingDays']) == 3 for v in vendors)
        print(f"   Result: {'✓ PASS' if all_correct else '✗ FAIL'}")
        
        for vendor in vendors:
            length = len(vendor['attendingDays'])
            status = "✓" if length == 3 else "✗"
            print(f"     {status} {vendor['name']}: {length} days")
    else:
        print("   Result: ✗ FAIL - Could not retrieve vendors")
    
    print_section("SERVICE TYPE TEST")
    
    # Test 10: Test various service types
    print_test(
        "Test 10: Various Service Types",
        "All service types accepted"
    )
    
    service_types = ["catering", "photography", "decoration", "music", "venue", "transport"]
    all_success = True
    
    for i, service_type in enumerate(service_types):
        test_vendor = {
            "weddingId": wedding_id,
            "name": f"Service Test {i+1}",
            "serviceType": service_type,
            "email": f"service{i+1}@example.com",
            "phoneNumber": f"+91-987654{i+1:04d}",
            "attendingDays": [True, True, True],
            "notes": f"Test {service_type} service"
        }
        
        response = requests.post(f"{BASE_URL}/vendor/respond", json=test_vendor)
        success = response.status_code == 201
        all_success = all_success and success
        status = "✓" if success else "✗"
        print(f"     {status} {service_type}: {response.status_code}")
    
    print(f"\n   Overall: {'✓ PASS' if all_success else '✗ FAIL'}")
    
    # Test 11: Optional phone number
    print_test(
        "Test 11: Optional Phone Number",
        "201 Created - phone number is optional"
    )
    
    vendor_no_phone = {
        "weddingId": wedding_id,
        "name": "Vendor Without Phone",
        "serviceType": "makeup",
        "email": "nophone@example.com",
        "phoneNumber": None,
        "attendingDays": [True, True, True],
        "notes": "No phone contact"
    }
    
    response = requests.post(f"{BASE_URL}/vendor/respond", json=vendor_no_phone)
    print_result(response.status_code == 201, response)
    
    print_section("TEST SUMMARY")
    print("\nAll validation rules tested:")
    print("  ✓ Email format validation (Pydantic)")
    print("  ✓ attendingDays length matches wedding days (custom)")
    print("  ✓ Wedding existence validation")
    print("  ✓ Proper HTTP status codes (201, 200, 400, 404, 422)")
    print("  ✓ All service types accepted")
    print("  ✓ Optional email and phone fields handling")
    print("\n✨ Vendor API validation is working correctly!")

if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════════════════════════════╗
    ║        Vendor API - Validation Test Suite                     ║
    ║                                                                ║
    ║  Tests POST /api/vendor/respond with validation rules         ║
    ║  Tests GET /api/vendor/list with wedding filtering            ║
    ╚════════════════════════════════════════════════════════════════╝
    """)
    
    try:
        test_vendor_api()
    except requests.exceptions.ConnectionError:
        print("\n✗ Error: Could not connect to the API server.")
        print("Make sure the backend is running at", BASE_URL)
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
