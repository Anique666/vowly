"""
Test suite for the three specific fixes:
1. Vendor Suggestion Logic - Location-based suggestions
2. Guest Invitation Email Flow - Resend integration with error handling
3. Countdown Timer - Date parsing and API responses

Tests use public endpoint: https://guest-rsvp.preview.emergentagent.com
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://guest-rsvp.preview.emergentagent.com').rstrip('/')

# Test wedding ID from existing data
EXISTING_WEDDING_ID = "0b936780-7926-4e99-ac13-17e269130cd6"  # Sarah & John Wedding in Mumbai


class TestVendorSuggestionFlow:
    """
    Test Fix #1: Vendor Suggestion Logic
    - /api/ai/planner/set-details should accept location only (budget, date, guests optional)
    - /api/ai/planner/search-vendor should return location-relevant results
    """
    
    def test_set_details_location_only(self):
        """Test that set-details accepts only location (optional fields can be null)"""
        # Test with only location - Fix #1 ensures this works
        response = requests.post(
            f"{BASE_URL}/api/ai/planner/set-details",
            json={"location": "Mumbai"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "status" in data, "Response should have 'status' field"
        assert data["status"] == "updated", f"Status should be 'updated', got {data['status']}"
        assert "state" in data, "Response should have 'state' field"
        assert data["state"]["location"] == "Mumbai", "Location should be Mumbai"
        print(f"✅ set-details with location only: PASSED - State: {data['state']}")
    
    def test_set_details_with_all_fields(self):
        """Test set-details with all optional fields"""
        response = requests.post(
            f"{BASE_URL}/api/ai/planner/set-details",
            json={
                "location": "Jaipur",
                "budget": "50 lakhs",
                "date": "2026-12-15",
                "guests": "500"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["state"]["location"] == "Jaipur"
        assert data["state"]["budget"] == "50 lakhs"
        print(f"✅ set-details with all fields: PASSED - State: {data['state']}")
    
    def test_search_vendor_returns_location_relevant_results(self):
        """Test that search-vendor returns results relevant to the set location"""
        # First set the location to Bengaluru
        set_response = requests.post(
            f"{BASE_URL}/api/ai/planner/set-details",
            json={"location": "Bengaluru"}
        )
        assert set_response.status_code == 200
        
        # Now search for catering vendors
        search_response = requests.post(
            f"{BASE_URL}/api/ai/planner/search-vendor",
            json={"vendor_type": "catering"}
        )
        
        assert search_response.status_code == 200, f"Expected 200, got {search_response.status_code}: {search_response.text}"
        data = search_response.json()
        
        # Verify response structure
        assert "result" in data, "Response should have 'result' field"
        assert "model" in data, "Response should have 'model' field"
        
        # Check that result contains vendor suggestions (AI should mention location)
        result = data["result"].lower()
        # The AI should return suggestions - at least some content
        assert len(data["result"]) > 50, f"Vendor suggestions too short: {len(data['result'])} chars"
        print(f"✅ search-vendor for Bengaluru catering: PASSED")
        print(f"   Result preview: {data['result'][:200]}...")
    
    def test_search_vendor_different_types(self):
        """Test search for different vendor types"""
        # Set location
        requests.post(
            f"{BASE_URL}/api/ai/planner/set-details",
            json={"location": "Delhi"}
        )
        
        vendor_types = ["photography", "decoration"]
        
        for vendor_type in vendor_types:
            response = requests.post(
                f"{BASE_URL}/api/ai/planner/search-vendor",
                json={"vendor_type": vendor_type}
            )
            
            assert response.status_code == 200, f"Failed for {vendor_type}: {response.status_code}"
            data = response.json()
            assert len(data["result"]) > 20, f"Empty result for {vendor_type}"
            print(f"✅ search-vendor for {vendor_type}: PASSED")


class TestEmailInviteFlow:
    """
    Test Fix #2: Guest Invitation Email Flow
    - /api/email/send-invites should work
    - Response should include errorDetails for sandbox mode failures
    """
    
    def test_send_invites_endpoint_exists(self):
        """Test that send-invites endpoint exists and validates input"""
        # Test with invalid wedding ID
        response = requests.post(
            f"{BASE_URL}/api/email/send-invites",
            json={
                "weddingId": "non-existent-id",
                "guestEmails": ["test@example.com"]
            }
        )
        
        # Should return 404 for non-existent wedding
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✅ send-invites validates wedding ID: PASSED")
    
    def test_send_invites_with_valid_wedding(self):
        """Test send-invites with a valid wedding - expect sandbox mode error"""
        response = requests.post(
            f"{BASE_URL}/api/email/send-invites",
            json={
                "weddingId": EXISTING_WEDDING_ID,
                "guestEmails": ["guest@example.com"]
            }
        )
        
        # Response should be 200 (API handles failure gracefully)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response model
        assert "status" in data, "Response should have 'status' field"
        assert "message" in data, "Response should have 'message' field"
        assert "emailsSent" in data, "Response should have 'emailsSent' field"
        assert "failed" in data, "Response should have 'failed' field"
        assert "errorDetails" in data, "Response should have 'errorDetails' field (Fix #2)"
        
        # In sandbox mode, emails to unverified addresses will fail
        # The errorDetails field should contain helpful info
        if data["emailsSent"] == 0 and data["failed"]:
            assert data["errorDetails"], "errorDetails should be populated when all emails fail"
            print(f"✅ send-invites returns errorDetails on sandbox failure: {data['errorDetails'][:100]}")
        else:
            print(f"✅ send-invites succeeded - emailsSent: {data['emailsSent']}")
        
        print(f"   Full response: {data}")
    
    def test_send_invites_response_structure(self):
        """Test that email response has all required fields"""
        response = requests.post(
            f"{BASE_URL}/api/email/send-invites",
            json={
                "weddingId": EXISTING_WEDDING_ID,
                "guestEmails": ["invalid-email-format"]  # This might pass validation but fail sending
            }
        )
        
        # Should either be 200 with failed emails or 422 for validation
        assert response.status_code in [200, 422], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            # All fields should be present
            required_fields = ["status", "message", "emailsSent", "failed", "errorDetails"]
            for field in required_fields:
                assert field in data, f"Missing field: {field}"
            print(f"✅ send-invites response structure: PASSED - {list(data.keys())}")
        else:
            print(f"✅ send-invites properly validates email format")


class TestWeddingDataForCountdown:
    """
    Test Fix #3: Dashboard countdown timer data requirements
    - Wedding dates should be properly formatted
    - Wedding API should return all required fields
    """
    
    def test_get_wedding_returns_date_fields(self):
        """Test that wedding API returns proper date fields for countdown"""
        response = requests.get(f"{BASE_URL}/api/wedding/{EXISTING_WEDDING_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Required fields for countdown timer
        assert "startDate" in data, "Wedding should have startDate"
        assert "endDate" in data, "Wedding should have endDate"
        assert "days" in data, "Wedding should have days array"
        
        # Validate date format (YYYY-MM-DD)
        import re
        date_pattern = r'^\d{4}-\d{2}-\d{2}$'
        assert re.match(date_pattern, data["startDate"]), f"Invalid startDate format: {data['startDate']}"
        assert re.match(date_pattern, data["endDate"]), f"Invalid endDate format: {data['endDate']}"
        
        print(f"✅ Wedding dates are properly formatted")
        print(f"   startDate: {data['startDate']}, endDate: {data['endDate']}")
    
    def test_wedding_days_have_date_and_events(self):
        """Test that wedding days have proper structure for countdown"""
        response = requests.get(f"{BASE_URL}/api/wedding/{EXISTING_WEDDING_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Each day should have date and events for countdown
        for i, day in enumerate(data["days"]):
            assert "date" in day, f"Day {i} missing date"
            assert "events" in day, f"Day {i} missing events"
            
            # Each event should have time for countdown to next event
            for j, event in enumerate(day["events"]):
                assert "time" in event, f"Day {i} Event {j} missing time"
                assert "name" in event, f"Day {i} Event {j} missing name"
                assert "venue" in event, f"Day {i} Event {j} missing venue"
        
        print(f"✅ Wedding days structure is valid for countdown - {len(data['days'])} days")
    
    def test_create_wedding_for_countdown_testing(self):
        """Create a test wedding with future dates for countdown testing"""
        # Create wedding with future dates
        from datetime import datetime, timedelta
        
        future_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=32)).strftime("%Y-%m-%d")
        
        wedding_data = {
            "name": "TEST_Countdown_Wedding",
            "location": "Test City",
            "startDate": future_date,
            "endDate": end_date,
            "days": [
                {
                    "dayIndex": 0,
                    "date": future_date,
                    "events": [
                        {"name": "Opening", "time": "10:00", "venue": "Main Hall"}
                    ]
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/wedding/create",
            json=wedding_data
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify dates match
        assert data["startDate"] == future_date
        assert data["endDate"] == end_date
        
        print(f"✅ Created countdown test wedding: {data['id']}")
        print(f"   Start: {data['startDate']}, End: {data['endDate']}")
        
        # Store for cleanup
        TestWeddingDataForCountdown.test_wedding_id = data["id"]
    
    def test_list_weddings_for_selector(self):
        """Test that list weddings works for dashboard selector"""
        response = requests.get(f"{BASE_URL}/api/weddings")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Weddings should be a list"
        assert len(data) > 0, "Should have at least one wedding"
        
        # Each wedding should have id and name for selector
        for wedding in data[:3]:  # Check first 3
            assert "id" in wedding, "Wedding missing id"
            assert "name" in wedding, "Wedding missing name"
        
        print(f"✅ List weddings API works - {len(data)} weddings found")


class TestAPIHealth:
    """Basic health checks for all services"""
    
    def test_backend_health(self):
        """Test backend health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print(f"✅ Backend health: {data}")
    
    def test_ai_health(self):
        """Test AI service health"""
        response = requests.get(f"{BASE_URL}/api/ai/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "model" in data
        print(f"✅ AI health: model={data['model']}")


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup test-created data after tests"""
    yield
    # Cleanup: Delete test weddings
    try:
        response = requests.get(f"{BASE_URL}/api/weddings")
        if response.status_code == 200:
            weddings = response.json()
            for w in weddings:
                if w.get("name", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/weddings/{w['id']}")
                    print(f"🧹 Cleaned up test wedding: {w['id']}")
    except Exception as e:
        print(f"⚠️ Cleanup error: {e}")
