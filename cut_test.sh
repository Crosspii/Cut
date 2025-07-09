#!/bin/bash

echo "🧪 CUT APP - COMPLETE API TESTING SUITE"
echo "======================================="
echo "Time: $(date)"
echo ""

# Base URL
BASE_URL="http://localhost:3000/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
PASSED=0
FAILED=0

test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local headers="$5"
    local expected_status="$6"
    
    echo -e "${BLUE}Testing: $name${NC}"
    echo "URL: $method $url"
    
    # Build curl command
    local curl_cmd="curl -s -w 'HTTPSTATUS:%{http_code}'"
    
    if [ "$method" != "GET" ]; then
        curl_cmd="$curl_cmd -X $method"
    fi
    
    if [ -n "$headers" ]; then
        curl_cmd="$curl_cmd $headers"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$url'"
    
    # Execute curl command
    response=$(eval $curl_cmd)
    
    # Extract status code and body
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS - Status: $status_code${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL - Expected: $expected_status, Got: $status_code${NC}"
        FAILED=$((FAILED + 1))
    fi
    
    # Show response body (truncated)
    if [ -n "$body" ]; then
        echo "Response: $(echo "$body" | head -c 200)"
        if [ ${#body} -gt 200 ]; then
            echo "..."
        fi
    fi
    
    echo ""
    echo "---"
}

# Variables to store tokens and IDs
CUSTOMER_TOKEN=""
BARBER_TOKEN=""
BOOKING_ID=""
BARBER_ID=""

echo "🚀 PHASE 1: HEALTH & BASIC ENDPOINTS"
echo "====================================="

test_endpoint "Health Check" "GET" "$BASE_URL/health" "" "" "200"
test_endpoint "API Test" "GET" "$BASE_URL/test" "" "" "200"
test_endpoint "Invalid Endpoint" "GET" "$BASE_URL/invalid" "" "" "404"

echo ""
echo "👤 PHASE 2: AUTHENTICATION ENDPOINTS"
echo "====================================="

# Test Registration
echo -e "${YELLOW}Registering test customer...${NC}"
CUSTOMER_REG_DATA='{"name":"Test Customer","email":"test-customer@demo.com","password":"test123","role":"customer"}'
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST -H "Content-Type: application/json" -d "$CUSTOMER_REG_DATA" "$BASE_URL/auth/register")
status_code=$(echo $response | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
if [ "$status_code" = "201" ] || [ "$status_code" = "400" ]; then
    echo -e "${GREEN}✅ Customer registration endpoint working${NC}"
else
    echo -e "${RED}❌ Customer registration failed: $status_code${NC}"
fi

echo -e "${YELLOW}Registering test barber...${NC}"
BARBER_REG_DATA='{"name":"Test Barber","email":"test-barber@demo.com","password":"test123","role":"barber"}'
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST -H "Content-Type: application/json" -d "$BARBER_REG_DATA" "$BASE_URL/auth/register")
status_code=$(echo $response | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
if [ "$status_code" = "201" ] || [ "$status_code" = "400" ]; then
    echo -e "${GREEN}✅ Barber registration endpoint working${NC}"
else
    echo -e "${RED}❌ Barber registration failed: $status_code${NC}"
fi

# Test Login
echo -e "${YELLOW}Logging in customer...${NC}"
CUSTOMER_LOGIN_DATA='{"email":"test-customer@demo.com","password":"test123"}'
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST -H "Content-Type: application/json" -d "$CUSTOMER_LOGIN_DATA" "$BASE_URL/auth/login")
status_code=$(echo $response | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
body=$(echo $response | sed -E 's/HTTPSTATUS:[0-9]*$//')

if [ "$status_code" = "200" ]; then
    # Extract token from the correct path in the response
    CUSTOMER_TOKEN=$(echo $body | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$CUSTOMER_TOKEN" ]; then
        echo -e "${GREEN}✅ Customer login successful${NC}"
        echo "Customer Token: ${CUSTOMER_TOKEN:0:20}..."
    else
        echo -e "${RED}❌ Customer login failed: No token received${NC}"
        echo "Response: $body"
    fi
else
    echo -e "${RED}❌ Customer login failed: $status_code${NC}"
    echo "Response: $body"
fi

echo -e "${YELLOW}Logging in barber...${NC}"
BARBER_LOGIN_DATA='{"email":"test-barber@demo.com","password":"test123"}'
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST -H "Content-Type: application/json" -d "$BARBER_LOGIN_DATA" "$BASE_URL/auth/login")
status_code=$(echo $response | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
body=$(echo $response | sed -E 's/HTTPSTATUS:[0-9]*$//')

if [ "$status_code" = "200" ]; then
    # Extract token from the correct path in the response
    BARBER_TOKEN=$(echo $body | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$BARBER_TOKEN" ]; then
        echo -e "${GREEN}✅ Barber login successful${NC}"
        echo "Barber Token: ${BARBER_TOKEN:0:20}..."
    else
        echo -e "${RED}❌ Barber login failed: No token received${NC}"
        echo "Response: $body"
    fi
else
    echo -e "${RED}❌ Barber login failed: $status_code${NC}"
    echo "Response: $body"
fi

# Test invalid credentials
test_endpoint "Invalid Login" "POST" "$BASE_URL/auth/login" '{"email":"wrong@email.com","password":"wrong"}' "-H 'Content-Type: application/json'" "400"

echo ""
echo "🏪 PHASE 3: BARBER ENDPOINTS"
echo "============================"

# Test without auth
test_endpoint "Get Barbers (No Auth)" "GET" "$BASE_URL/barbers" "" "" "200"

# Test with auth
if [ -n "$CUSTOMER_TOKEN" ]; then
    test_endpoint "Get Barbers (With Auth)" "GET" "$BASE_URL/barbers" "" "-H 'Authorization: Bearer $CUSTOMER_TOKEN'" "200"
    
    # Get a barber ID for further testing
    response=$(curl -s -H "Authorization: Bearer $CUSTOMER_TOKEN" "$BASE_URL/barbers")
    BARBER_ID=$(echo $response | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
    if [ -n "$BARBER_ID" ]; then
        echo "Found Barber ID: $BARBER_ID"
        test_endpoint "Get Specific Barber" "GET" "$BASE_URL/barbers/$BARBER_ID" "" "-H 'Authorization: Bearer $CUSTOMER_TOKEN'" "200"
        test_endpoint "Get Barber Availability" "GET" "$BASE_URL/barbers/$BARBER_ID/availability?date=2025-07-15" "" "-H 'Authorization: Bearer $CUSTOMER_TOKEN'" "200"
    else
        echo "No barber ID found in response"
    fi
fi

# Test barber profile creation
if [ -n "$BARBER_TOKEN" ]; then
    PROFILE_DATA='{"business_name":"Test Barber Shop","address":"123 Test Street","city":"Test City","phone":"0612345678","description":"Test description"}'
    test_endpoint "Create/Update Barber Profile" "POST" "$BASE_URL/barbers/profile" "$PROFILE_DATA" "-H 'Content-Type: application/json' -H 'Authorization: Bearer $BARBER_TOKEN'" "201"
    
    test_endpoint "Get My Barber Profile" "GET" "$BASE_URL/barbers/profile/me" "" "-H 'Authorization: Bearer $BARBER_TOKEN'" "200"
fi

echo ""
echo "📅 PHASE 4: BOOKING ENDPOINTS"
echo "============================="

if [ -n "$CUSTOMER_TOKEN" ] && [ -n "$BARBER_ID" ]; then
    # Create booking
    BOOKING_DATA="{\"barber_id\":$BARBER_ID,\"service_name\":\"Test Haircut\",\"service_price\":50,\"service_duration\":30,\"appointment_date\":\"2025-07-15\",\"appointment_time\":\"10:00\",\"notes\":\"Test booking\"}"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" -d "$BOOKING_DATA" "$BASE_URL/bookings")
    status_code=$(echo $response | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo $response | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$status_code" = "201" ]; then
        BOOKING_ID=$(echo $body | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
        echo -e "${GREEN}✅ Booking created successfully - ID: $BOOKING_ID${NC}"
    else
        echo -e "${RED}❌ Booking creation failed: $status_code${NC}"
        echo "$body"
    fi
    
    # Test booking endpoints
    test_endpoint "Get My Bookings" "GET" "$BASE_URL/bookings/my-bookings" "" "-H 'Authorization: Bearer $CUSTOMER_TOKEN'" "200"
    test_endpoint "Get Booking Statistics" "GET" "$BASE_URL/bookings/statistics" "" "-H 'Authorization: Bearer $CUSTOMER_TOKEN'" "200"
    test_endpoint "Get Upcoming Appointments" "GET" "$BASE_URL/bookings/upcoming" "" "-H 'Authorization: Bearer $CUSTOMER_TOKEN'" "200"
    
    if [ -n "$BOOKING_ID" ]; then
        test_endpoint "Get Specific Booking" "GET" "$BASE_URL/bookings/$BOOKING_ID" "" "-H 'Authorization: Bearer $CUSTOMER_TOKEN'" "200"
    fi
fi

# Test without auth
test_endpoint "Create Booking (No Auth)" "POST" "$BASE_URL/bookings" "$BOOKING_DATA" "-H 'Content-Type: application/json'" "401"

echo ""
echo "⭐ PHASE 5: REVIEW ENDPOINTS"
echo "==========================="

# Public endpoints (no auth required)
if [ -n "$BARBER_ID" ]; then
    test_endpoint "Get Barber Reviews (Public)" "GET" "$BASE_URL/reviews/barber/$BARBER_ID" "" "" "200"
    test_endpoint "Get Barber Stats (Public)" "GET" "$BASE_URL/reviews/barber/$BARBER_ID/stats" "" "" "200"
fi

# Authenticated endpoints
if [ -n "$CUSTOMER_TOKEN" ]; then
    test_endpoint "Get My Reviews" "GET" "$BASE_URL/reviews/my-reviews" "" "-H 'Authorization: Bearer $CUSTOMER_TOKEN'" "200"
    
    if [ -n "$BOOKING_ID" ]; then
        test_endpoint "Check Can Review" "GET" "$BASE_URL/reviews/can-review/$BOOKING_ID" "" "-H 'Authorization: Bearer $CUSTOMER_TOKEN'" "200"
        
        # Try to create a review (might fail if booking not completed)
        REVIEW_DATA="{\"booking_id\":$BOOKING_ID,\"rating\":5,\"comment\":\"Test review\"}"
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" -d "$REVIEW_DATA" "$BASE_URL/reviews")
        status_code=$(echo $response | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        if [ "$status_code" = "201" ]; then
            echo -e "${GREEN}✅ Review created successfully${NC}"
        else
            echo -e "${YELLOW}⚠️  Review creation failed (expected - booking might not be completed): $status_code${NC}"
        fi
    fi
fi

echo ""
echo "🚫 PHASE 6: ERROR HANDLING TESTS"
echo "================================"

test_endpoint "Malformed JSON" "POST" "$BASE_URL/auth/login" "invalid json" "-H 'Content-Type: application/json'" "500"
test_endpoint "Missing Content-Type" "POST" "$BASE_URL/auth/login" '{"test":"data"}' "" "400"
test_endpoint "Invalid Token" "GET" "$BASE_URL/bookings/my-bookings" "" "-H 'Authorization: Bearer invalid_token'" "401"
test_endpoint "Nonexistent Barber" "GET" "$BASE_URL/barbers/99999" "" "" "404"

echo ""
echo "📱 PHASE 7: FRONTEND PAGES TEST"
echo "==============================="

FRONTEND_BASE="http://localhost:3000"

# Test all frontend pages
pages=(
    "/"
    "/barbers.html"
    "/login.html"
    "/register.html"
    "/dashboard.html"
    "/barber-dashboard.html"
    "/my-bookings.html"
    "/booking.html"
    "/barber-profile.html"
)

for page in "${pages[@]}"; do
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$FRONTEND_BASE$page")
    status_code=$(echo $response | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✅ $page - Status: $status_code${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ $page - Status: $status_code${NC}"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo "📊 TEST RESULTS SUMMARY"
echo "======================="
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Your app is working perfectly!${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the details above.${NC}"
fi

echo ""
echo "🔧 QUICK MANUAL TESTS TO DO:"
echo "1. Open http://localhost:3000 in browser"
echo "2. Register a new user"
echo "3. Login and navigate around"
echo "4. Try booking an appointment"
echo "5. Check mobile responsiveness"
echo "6. Test all buttons and forms"

echo ""
echo "Test completed at: $(date)"
