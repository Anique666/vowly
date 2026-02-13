#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime, timezone
import uuid

# Backend configuration
BACKEND_URL = "https://guest-rsvp.preview.emergentagent.com/api"

class WeddingAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        # Test data storage
        self.test_wedding_id = None
        self.test_results = {
            'create_wedding': False,
            'get_wedding': False,
            'guest_rsvp': False,
            'send_invites': False
        }
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results[test_name] = success
        return success
    
    def test_1_create_wedding(self):
        """Test POST /api/wedding/create"""
        print("\n=== Testing Wedding Creation ===")
        
        # Prepare test data with 3 days and multiple events
        wedding_data = {
            "name": "Test Wedding 2026",
            "location": "Mumbai, India",
            "startDate": "2026-08-15",
            "endDate": "2026-08-17",
            "days": [
                {
                    "dayIndex": 1,
                    "date": "2026-08-15",
                    "events": [
                        {
                            "name": "Mehendi Ceremony",
                            "time": "14:00",
                            "venue": "Garden Area, Mumbai"
                        },
                        {
                            "name": "Sangeet Night",
                            "time": "19:00", 
                            "venue": "Main Hall, Mumbai"
                        }
                    ]
                },
                {
                    "dayIndex": 2,
                    "date": "2026-08-16",
                    "events": [
                        {
                            "name": "Haldi Ceremony",
                            "time": "10:00",
                            "venue": "Courtyard, Mumbai"
                        },
                        {
                            "name": "Wedding Ceremony",
                            "time": "18:00",
                            "venue": "Temple Hall, Mumbai"
                        }
                    ]
                },
                {
                    "dayIndex": 3,
                    "date": "2026-08-17",
                    "events": [
                        {
                            "name": "Reception",
                            "time": "19:00",
                            "venue": "Banquet Hall, Mumbai"
                        }
                    ]
                }
            ]
        }
        
        try:
            response = self.session.post(f"{self.base_url}/wedding/create", json=wedding_data)
            
            if response.status_code == 201:
                result = response.json()
                self.test_wedding_id = result.get('id')
                
                # Verify response structure
                required_fields = ['id', 'name', 'location', 'startDate', 'endDate', 'days']
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    return self.log_test('create_wedding', False, f"Missing fields: {missing_fields}")
                
                # Verify data integrity
                if result['name'] != wedding_data['name']:
                    return self.log_test('create_wedding', False, "Wedding name mismatch")
                
                if len(result['days']) != 3:
                    return self.log_test('create_wedding', False, f"Expected 3 days, got {len(result['days'])}")
                
                total_events = sum(len(day['events']) for day in result['days'])
                if total_events != 5:
                    return self.log_test('create_wedding', False, f"Expected 5 events, got {total_events}")
                
                return self.log_test('create_wedding', True, f"Wedding created with ID: {self.test_wedding_id}")
            else:
                return self.log_test('create_wedding', False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            return self.log_test('create_wedding', False, f"Exception: {str(e)}")
    
    def test_2_get_wedding(self):
        """Test GET /api/wedding/{wedding_id}"""
        print("\n=== Testing Wedding Retrieval ===")
        
        if not self.test_wedding_id:
            return self.log_test('get_wedding', False, "No wedding ID from previous test")
        
        try:
            response = self.session.get(f"{self.base_url}/wedding/{self.test_wedding_id}")
            
            if response.status_code == 200:
                result = response.json()
                
                # Verify the wedding data matches what we created
                if result.get('id') != self.test_wedding_id:
                    return self.log_test('get_wedding', False, "Wedding ID mismatch")
                
                if result.get('name') != "Test Wedding 2026":
                    return self.log_test('get_wedding', False, "Wedding name mismatch")
                
                if result.get('location') != "Mumbai, India":
                    return self.log_test('get_wedding', False, "Wedding location mismatch")
                
                if len(result.get('days', [])) != 3:
                    return self.log_test('get_wedding', False, "Days count mismatch")
                
                return self.log_test('get_wedding', True, "Wedding retrieved successfully")
            else:
                return self.log_test('get_wedding', False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            return self.log_test('get_wedding', False, f"Exception: {str(e)}")
    
    def test_3_guest_rsvp(self):
        """Test POST /api/guest/rsvp"""
        print("\n=== Testing Guest RSVP ===")
        
        if not self.test_wedding_id:
            return self.log_test('guest_rsvp', False, "No wedding ID from previous test")
        
        # Test data for guest RSVP
        guest_data = {
            "weddingId": self.test_wedding_id,
            "name": "Priya Sharma",
            "email": "priya.sharma@example.com",
            "attendingDays": [True, True, False],  # 3 days to match wedding
            "dietary": "veg",
            "accommodation": True
        }
        
        try:
            response = self.session.post(f"{self.base_url}/guest/rsvp", json=guest_data)
            
            if response.status_code == 201:
                result = response.json()
                
                # Verify response structure
                required_fields = ['id', 'weddingId', 'name', 'email', 'attendingDays', 'dietary', 'accommodation']
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    return self.log_test('guest_rsvp', False, f"Missing fields: {missing_fields}")
                
                # Verify data integrity
                if result['weddingId'] != self.test_wedding_id:
                    return self.log_test('guest_rsvp', False, "Wedding ID mismatch")
                
                if result['name'] != guest_data['name']:
                    return self.log_test('guest_rsvp', False, "Guest name mismatch")
                
                if len(result['attendingDays']) != 3:
                    return self.log_test('guest_rsvp', False, f"Expected 3 attending days, got {len(result['attendingDays'])}")
                
                return self.log_test('guest_rsvp', True, f"Guest RSVP created with ID: {result['id']}")
            else:
                return self.log_test('guest_rsvp', False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            return self.log_test('guest_rsvp', False, f"Exception: {str(e)}")
    
    def test_4_send_invites(self):
        """Test POST /api/email/send-invites"""
        print("\n=== Testing Send Invites ===")
        
        if not self.test_wedding_id:
            return self.log_test('send_invites', False, "No wedding ID from previous test")
        
        # Test data for sending invites
        invite_data = {
            "weddingId": self.test_wedding_id,
            "guestEmails": [
                "guest1@example.com",
                "guest2@example.com",
                "guest3@example.com"
            ]
        }
        
        try:
            response = self.session.post(f"{self.base_url}/email/send-invites", json=invite_data)
            
            if response.status_code == 200:
                result = response.json()
                
                # Verify response structure
                required_fields = ['status', 'message', 'emailsSent', 'failed']
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    return self.log_test('send_invites', False, f"Missing fields: {missing_fields}")
                
                # Since we're using a dummy API key, the emails might not actually send,
                # but the API should respond properly
                if result['status'] not in ['success', 'failed']:
                    return self.log_test('send_invites', False, f"Invalid status: {result['status']}")
                
                return self.log_test('send_invites', True, 
                    f"Invite API responded: {result['emailsSent']} sent, {len(result['failed'])} failed")
            else:
                return self.log_test('send_invites', False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            return self.log_test('send_invites', False, f"Exception: {str(e)}")
    
    def test_validation_scenarios(self):
        """Test validation scenarios"""
        print("\n=== Testing Validation Scenarios ===")
        
        validation_results = []
        
        # Test 1: Empty wedding name
        try:
            response = self.session.post(f"{self.base_url}/wedding/create", json={
                "name": "",
                "location": "Test Location",
                "startDate": "2026-08-15",
                "endDate": "2026-08-17",
                "days": []
            })
            
            if response.status_code == 400:
                validation_results.append("✅ Empty name validation works")
            else:
                validation_results.append("❌ Empty name validation failed")
        except Exception as e:
            validation_results.append(f"❌ Empty name test error: {e}")
        
        # Test 2: No days provided
        try:
            response = self.session.post(f"{self.base_url}/wedding/create", json={
                "name": "Test Wedding",
                "location": "Test Location", 
                "startDate": "2026-08-15",
                "endDate": "2026-08-17",
                "days": []
            })
            
            if response.status_code == 400:
                validation_results.append("✅ No days validation works")
            else:
                validation_results.append("❌ No days validation failed")
        except Exception as e:
            validation_results.append(f"❌ No days test error: {e}")
        
        # Test 3: No events provided
        try:
            response = self.session.post(f"{self.base_url}/wedding/create", json={
                "name": "Test Wedding",
                "location": "Test Location",
                "startDate": "2026-08-15",
                "endDate": "2026-08-17",
                "days": [{"dayIndex": 1, "date": "2026-08-15", "events": []}]
            })
            
            if response.status_code == 400:
                validation_results.append("✅ No events validation works")
            else:
                validation_results.append("❌ No events validation failed")
        except Exception as e:
            validation_results.append(f"❌ No events test error: {e}")
        
        # Test 4: Invalid wedding ID for RSVP
        if self.test_wedding_id:
            try:
                response = self.session.post(f"{self.base_url}/guest/rsvp", json={
                    "weddingId": "non-existent-wedding-id",
                    "name": "Test Guest",
                    "email": "test@example.com",
                    "attendingDays": [True],
                    "dietary": "veg",
                    "accommodation": False
                })
                
                if response.status_code == 404:
                    validation_results.append("✅ Invalid wedding ID validation works")
                else:
                    validation_results.append("❌ Invalid wedding ID validation failed")
            except Exception as e:
                validation_results.append(f"❌ Invalid wedding ID test error: {e}")
        
        for result in validation_results:
            print(f"   {result}")
        
        return len([r for r in validation_results if "✅" in r]) == len(validation_results)
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🧪 Starting Wedding API Backend Tests")
        print(f"Backend URL: {self.base_url}")
        
        # Test the main workflow
        success_count = 0
        total_tests = 4
        
        if self.test_1_create_wedding():
            success_count += 1
            
        if self.test_2_get_wedding():
            success_count += 1
            
        if self.test_3_guest_rsvp():
            success_count += 1
            
        if self.test_4_send_invites():
            success_count += 1
        
        # Test validation scenarios
        print()
        validation_success = self.test_validation_scenarios()
        
        # Summary
        print(f"\n=== TEST SUMMARY ===")
        print(f"Main Tests: {success_count}/{total_tests} passed")
        print(f"Validation Tests: {'✅ PASS' if validation_success else '❌ FAIL'}")
        
        if success_count == total_tests and validation_success:
            print("🎉 All tests passed! Backend APIs are working correctly.")
            return True
        else:
            print("❌ Some tests failed. Check the details above.")
            return False

if __name__ == "__main__":
    tester = WeddingAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)