#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class LinkedInIntelligenceAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def test_health_endpoint(self):
        """Test GET /api/health endpoint"""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                expected_keys = ["status", "serper_key_set", "apify_token_set"]
                
                if all(key in data for key in expected_keys):
                    if data.get("serper_key_set") and data.get("apify_token_set"):
                        self.log_test("Health endpoint with API keys", True, f"Response: {data}")
                        return True
                    else:
                        self.log_test("Health endpoint with API keys", False, f"API keys not set: {data}")
                        return False
                else:
                    self.log_test("Health endpoint with API keys", False, f"Missing keys in response: {data}")
                    return False
            else:
                self.log_test("Health endpoint with API keys", False, f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Health endpoint with API keys", False, f"Exception: {str(e)}")
            return False

    def test_search_endpoint_basic(self):
        """Test POST /api/search with basic keywords"""
        try:
            # Test with a simple hashtag
            payload = {"keywords": ["#AI"]}
            response = requests.post(
                f"{self.api_url}/search", 
                json=payload, 
                timeout=120  # Extended timeout for real API calls
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_keys = ["posts", "totalPosts", "searchKeywords"]
                
                if all(key in data for key in expected_keys):
                    posts_count = len(data.get("posts", []))
                    total_posts = data.get("totalPosts", 0)
                    keywords = data.get("searchKeywords", [])
                    
                    self.log_test("Search endpoint basic functionality", True, 
                                f"Found {posts_count} posts, total: {total_posts}, keywords: {keywords}")
                    return True, data
                else:
                    self.log_test("Search endpoint basic functionality", False, 
                                f"Missing keys in response: {data}")
                    return False, {}
            else:
                self.log_test("Search endpoint basic functionality", False, 
                            f"Status {response.status_code}: {response.text}")
                return False, {}
                
        except Exception as e:
            self.log_test("Search endpoint basic functionality", False, f"Exception: {str(e)}")
            return False, {}

    def test_search_endpoint_validation(self):
        """Test POST /api/search validation"""
        try:
            # Test with empty keywords
            payload = {"keywords": []}
            response = requests.post(f"{self.api_url}/search", json=payload, timeout=30)
            
            if response.status_code == 400:
                self.log_test("Search endpoint validation (empty keywords)", True, 
                            f"Correctly rejected empty keywords: {response.status_code}")
                return True
            else:
                self.log_test("Search endpoint validation (empty keywords)", False, 
                            f"Should return 400 for empty keywords, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Search endpoint validation (empty keywords)", False, f"Exception: {str(e)}")
            return False

    def test_search_endpoint_multiple_keywords(self):
        """Test POST /api/search with multiple keywords"""
        try:
            # Test with multiple keywords
            payload = {"keywords": ["#AI", "@Microsoft"]}
            response = requests.post(f"{self.api_url}/search", json=payload, timeout=120)
            
            if response.status_code == 200:
                data = response.json()
                if "searchKeywords" in data and len(data["searchKeywords"]) == 2:
                    self.log_test("Search endpoint multiple keywords", True, 
                                f"Processed {len(data['searchKeywords'])} keywords")
                    return True
                else:
                    self.log_test("Search endpoint multiple keywords", False, 
                                f"Keywords not properly processed: {data.get('searchKeywords', [])}")
                    return False
            else:
                self.log_test("Search endpoint multiple keywords", False, 
                            f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Search endpoint multiple keywords", False, f"Exception: {str(e)}")
            return False

    def test_root_endpoint(self):
        """Test GET /api/ root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Root API endpoint", True, f"Response: {data}")
                    return True
                else:
                    self.log_test("Root API endpoint", False, f"No message in response: {data}")
                    return False
            else:
                self.log_test("Root API endpoint", False, f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Root API endpoint", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting LinkedIn Intelligence API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test basic connectivity
        self.test_root_endpoint()
        
        # Test health endpoint
        health_success = self.test_health_endpoint()
        
        # Test search functionality
        if health_success:
            print("\n🔍 Testing search functionality...")
            self.test_search_endpoint_validation()
            search_success, search_data = self.test_search_endpoint_basic()
            
            if search_success:
                self.test_search_endpoint_multiple_keywords()
                
                # Analyze search results if available
                if search_data.get("posts"):
                    print(f"\n📊 Sample post analysis:")
                    sample_post = search_data["posts"][0]
                    print(f"   - Author: {sample_post.get('authorName', 'N/A')}")
                    print(f"   - Likes: {sample_post.get('likesCount', 0)}")
                    print(f"   - Hashtags: {len(sample_post.get('hashtags', []))}")
                    print(f"   - Post URL: {bool(sample_post.get('postUrl'))}")
        else:
            print("⚠️  Skipping search tests due to health check failure")
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📈 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed. Check the details above.")
            return 1

def main():
    tester = LinkedInIntelligenceAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())