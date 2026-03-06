import requests
import sys
import time
import json
from datetime import datetime

class ReviewBoosterAPITester:
    def __init__(self, base_url="https://chili-reviews.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.admin_authenticated = False
        self.test_client_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")
        if success:
            self.tests_passed += 1

    def test_api_health(self):
        """Test basic API connectivity"""
        try:
            response = self.session.get(f"{self.base_url}/api/")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'N/A')}"
            self.log_test("API Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("API Health Check", False, f"Connection error: {str(e)}")
            return False

    def test_admin_check_unauthenticated(self):
        """Test admin auth check when not authenticated"""
        try:
            response = self.session.get(f"{self.base_url}/api/admin/check")
            success = response.status_code == 200
            if success:
                data = response.json()
                success = not data.get('authenticated', True)
                details = f"Authenticated status: {data.get('authenticated')}"
            else:
                details = f"Status: {response.status_code}"
            self.log_test("Admin Check (Unauthenticated)", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Check (Unauthenticated)", False, str(e))
            return False

    def test_admin_login_invalid(self):
        """Test admin login with wrong password"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/admin/login",
                json={"password": "wrongpassword"}
            )
            success = response.status_code == 401
            details = f"Status: {response.status_code}"
            if not success:
                details += f", Response: {response.text[:100]}"
            self.log_test("Admin Login (Invalid)", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Login (Invalid)", False, str(e))
            return False

    def test_admin_login_valid(self):
        """Test admin login with correct password"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/admin/login",
                json={"password": "admin123"}
            )
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get('success', False)
                self.admin_authenticated = success
                details = f"Login success: {success}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("Admin Login (Valid)", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Login (Valid)", False, str(e))
            return False

    def test_admin_check_authenticated(self):
        """Test admin auth check when authenticated"""
        try:
            response = self.session.get(f"{self.base_url}/api/admin/check")
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get('authenticated', False)
                details = f"Authenticated status: {data.get('authenticated')}"
            else:
                details = f"Status: {response.status_code}"
            self.log_test("Admin Check (Authenticated)", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Check (Authenticated)", False, str(e))
            return False

    def test_get_clients_empty(self):
        """Test getting clients when list is empty"""
        try:
            response = self.session.get(f"{self.base_url}/api/admin/clients")
            success = response.status_code == 200
            if success:
                data = response.json()
                success = isinstance(data, list)
                details = f"Got {len(data)} clients"
            else:
                details = f"Status: {response.status_code}"
            self.log_test("Get Clients (Initial)", success, details)
            return success, data if success else []
        except Exception as e:
            self.log_test("Get Clients (Initial)", False, str(e))
            return False, []

    def test_create_client(self):
        """Test creating a new client"""
        try:
            client_data = {
                "slug": "test-business",
                "businessName": "Test Business Corp",
                "reviewLink": "https://g.page/r/test-business-review-link",
                "defaultTone": "friendly"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/admin/clients",
                json=client_data
            )
            success = response.status_code == 201
            if success:
                data = response.json()
                self.test_client_id = data.get('id')
                success = all(key in data for key in ['id', 'slug', 'businessName', 'reviewLink'])
                details = f"Created client ID: {self.test_client_id}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            self.log_test("Create Client", success, details)
            return success
        except Exception as e:
            self.log_test("Create Client", False, str(e))
            return False

    def test_get_client_by_slug_public(self):
        """Test getting client by slug (public endpoint)"""
        try:
            response = self.session.get(f"{self.base_url}/api/clients/test-business")
            success = response.status_code == 200
            if success:
                data = response.json()
                expected_fields = ['slug', 'businessName', 'reviewLink', 'defaultTone']
                success = all(field in data for field in expected_fields)
                details = f"Business: {data.get('businessName')}, Slug: {data.get('slug')}"
            else:
                details = f"Status: {response.status_code}"
            self.log_test("Get Client by Slug (Public)", success, details)
            return success
        except Exception as e:
            self.log_test("Get Client by Slug (Public)", False, str(e))
            return False

    def test_get_client_nonexistent(self):
        """Test getting non-existent client"""
        try:
            response = self.session.get(f"{self.base_url}/api/clients/nonexistent-slug")
            success = response.status_code == 404
            details = f"Status: {response.status_code}"
            self.log_test("Get Nonexistent Client", success, details)
            return success
        except Exception as e:
            self.log_test("Get Nonexistent Client", False, str(e))
            return False

    def test_update_client(self):
        """Test updating a client"""
        if not self.test_client_id:
            self.log_test("Update Client", False, "No test client ID available")
            return False
            
        try:
            update_data = {
                "businessName": "Test Business Corp Updated",
                "defaultTone": "professional"
            }
            
            response = self.session.put(
                f"{self.base_url}/api/admin/clients/{self.test_client_id}",
                json=update_data
            )
            success = response.status_code == 200
            if success:
                data = response.json()
                success = (data.get('businessName') == 'Test Business Corp Updated' and 
                          data.get('defaultTone') == 'professional')
                details = f"Updated business name and tone"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            self.log_test("Update Client", success, details)
            return success
        except Exception as e:
            self.log_test("Update Client", False, str(e))
            return False

    def test_get_clients_with_data(self):
        """Test getting clients when data exists"""
        try:
            response = self.session.get(f"{self.base_url}/api/admin/clients")
            success = response.status_code == 200
            if success:
                data = response.json()
                success = len(data) >= 1
                details = f"Found {len(data)} clients"
            else:
                details = f"Status: {response.status_code}"
            self.log_test("Get Clients (With Data)", success, details)
            return success
        except Exception as e:
            self.log_test("Get Clients (With Data)", False, str(e))
            return False

    def test_delete_client(self):
        """Test deleting a client"""
        if not self.test_client_id:
            self.log_test("Delete Client", False, "No test client ID available")
            return False
            
        try:
            response = self.session.delete(
                f"{self.base_url}/api/admin/clients/{self.test_client_id}"
            )
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get('success', False)
                details = f"Deleted successfully: {success}"
            else:
                details = f"Status: {response.status_code}"
            self.log_test("Delete Client", success, details)
            return success
        except Exception as e:
            self.log_test("Delete Client", False, str(e))
            return False

    def test_admin_logout(self):
        """Test admin logout"""
        try:
            response = self.session.post(f"{self.base_url}/api/admin/logout")
            success = response.status_code == 200
            if success:
                data = response.json()
                success = data.get('success', False)
                details = f"Logout success: {success}"
                if success:
                    self.admin_authenticated = False
            else:
                details = f"Status: {response.status_code}"
            self.log_test("Admin Logout", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Logout", False, str(e))
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🧪 Starting Smoking Chili Media Review Booster API Tests")
        print("=" * 60)
        
        # Basic connectivity
        if not self.test_api_health():
            print("\n❌ API not accessible. Stopping tests.")
            return False
        
        # Authentication flow tests
        self.test_admin_check_unauthenticated()
        self.test_admin_login_invalid()
        
        if not self.test_admin_login_valid():
            print("\n❌ Cannot authenticate admin. Stopping protected endpoint tests.")
            return False
        
        self.test_admin_check_authenticated()
        
        # CRUD operations
        success, initial_clients = self.test_get_clients_empty()
        self.test_create_client()
        self.test_get_client_by_slug_public()
        self.test_get_client_nonexistent()
        self.test_update_client()
        self.test_get_clients_with_data()
        self.test_delete_client()
        
        # Cleanup and logout
        self.test_admin_logout()
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check logs above for details.")
            return False

def main():
    tester = ReviewBoosterAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())