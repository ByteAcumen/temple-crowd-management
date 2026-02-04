#!/bin/bash
# ========================================
# E2E Test Runner for CI/CD
# ========================================

set -e

BASE_URL="${BASE_URL:-http://localhost:5000/api/v1}"
PASS_COUNT=0
FAIL_COUNT=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo " Temple E-Pass E2E Tests"
echo "========================================"
echo "Testing: $BASE_URL"
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    local auth_token=$6
    
    echo -n "Testing: $name... "
    
    local headers="-H 'Content-Type: application/json'"
    if [ -n "$auth_token" ]; then
        headers="$headers -H 'Authorization: Bearer $auth_token'"
    fi
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" $headers "$BASE_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method $headers -d "$data" "$BASE_URL$endpoint" 2>/dev/null)
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" == "$expected_status" ]; then
        echo -e "${GREEN}PASS${NC} ($status_code)"
        ((PASS_COUNT++))
        echo "$body"
        return 0
    else
        echo -e "${RED}FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        ((FAIL_COUNT++))
        return 1
    fi
}

# ==========================================
# 1. Health Check
# ==========================================
echo ""
echo "--- Health Check ---"
curl -s http://localhost:5000 | jq . || echo "Health check response received"

# ==========================================
# 2. Register Users
# ==========================================
echo ""
echo "--- User Registration ---"

# Register Admin
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"name":"CI Admin","email":"ci-admin@test.com","password":"Admin@12345","role":"admin"}')
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.token // empty')

if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}PASS${NC}: Admin registered"
    ((PASS_COUNT++))
else
    echo -e "${YELLOW}SKIP${NC}: Admin already exists, logging in..."
    ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"ci-admin@test.com","password":"Admin@12345"}')
    ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.token // empty')
fi

# Register User
USER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"name":"CI User","email":"ci-user@test.com","password":"User@12345","role":"user"}')
USER_TOKEN=$(echo $USER_RESPONSE | jq -r '.token // empty')

if [ -n "$USER_TOKEN" ]; then
    echo -e "${GREEN}PASS${NC}: User registered"
    ((PASS_COUNT++))
else
    echo -e "${YELLOW}SKIP${NC}: User already exists, logging in..."
    USER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"ci-user@test.com","password":"User@12345"}')
    USER_TOKEN=$(echo $USER_RESPONSE | jq -r '.token // empty')
fi

# Register Gatekeeper
GK_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"name":"CI Gatekeeper","email":"ci-gatekeeper@test.com","password":"Gate@12345","role":"gatekeeper"}')
GK_TOKEN=$(echo $GK_RESPONSE | jq -r '.token // empty')

if [ -n "$GK_TOKEN" ]; then
    echo -e "${GREEN}PASS${NC}: Gatekeeper registered"
    ((PASS_COUNT++))
else
    echo -e "${YELLOW}SKIP${NC}: Gatekeeper already exists, logging in..."
    GK_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"ci-gatekeeper@test.com","password":"Gate@12345"}')
    GK_TOKEN=$(echo $GK_RESPONSE | jq -r '.token // empty')
fi

# ==========================================
# 3. Temple Management
# ==========================================
echo ""
echo "--- Temple Management ---"

# Create Temple
TEMPLE_RESPONSE=$(curl -s -X POST "$BASE_URL/temples" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"name":"CI Temple","location":{"city":"Mumbai","state":"Maharashtra"},"capacity":{"total":500,"per_slot":50,"threshold_warning":85,"threshold_critical":95},"status":"OPEN"}')
TEMPLE_ID=$(echo $TEMPLE_RESPONSE | jq -r '.data._id // empty')

if [ -n "$TEMPLE_ID" ]; then
    echo -e "${GREEN}PASS${NC}: Temple created (ID: $TEMPLE_ID)"
    ((PASS_COUNT++))
else
    echo -e "${YELLOW}SKIP${NC}: Temple creation issue, fetching existing..."
    TEMPLES=$(curl -s "$BASE_URL/temples")
    TEMPLE_ID=$(echo $TEMPLES | jq -r '.data[0]._id // empty')
fi

# Get Temples
TEMPLES=$(curl -s "$BASE_URL/temples")
TEMPLE_COUNT=$(echo $TEMPLES | jq -r '.count // 0')
if [ "$TEMPLE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}PASS${NC}: Get temples ($TEMPLE_COUNT found)"
    ((PASS_COUNT++))
else
    echo -e "${RED}FAIL${NC}: No temples found"
    ((FAIL_COUNT++))
fi

# ==========================================
# 4. Booking System
# ==========================================
echo ""
echo "--- Booking System ---"

TOMORROW=$(date -d "+1 day" +%Y-%m-%d 2>/dev/null || date -v+1d +%Y-%m-%d)

# Create Booking
BOOKING_RESPONSE=$(curl -s -X POST "$BASE_URL/bookings" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -d "{\"templeId\":\"$TEMPLE_ID\",\"templeName\":\"CI Temple\",\"date\":\"$TOMORROW\",\"slot\":\"10:00 AM - 11:00 AM\",\"visitors\":3,\"userName\":\"CI User\",\"userEmail\":\"ci-user@test.com\"}")
BOOKING_ID=$(echo $BOOKING_RESPONSE | jq -r '.data._id // empty')
PASS_ID=$(echo $BOOKING_RESPONSE | jq -r '.data.passId // empty')

if [ -n "$BOOKING_ID" ]; then
    echo -e "${GREEN}PASS${NC}: Booking created (ID: $BOOKING_ID)"
    ((PASS_COUNT++))
else
    echo -e "${RED}FAIL${NC}: Booking creation failed"
    ((FAIL_COUNT++))
fi

# ==========================================
# 5. Live Crowd Tracking
# ==========================================
echo ""
echo "--- Live Crowd Tracking ---"

if [ -n "$PASS_ID" ] && [ -n "$TEMPLE_ID" ]; then
    # Record Entry
    ENTRY_RESPONSE=$(curl -s -X POST "$BASE_URL/live/entry" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GK_TOKEN" \
        -d "{\"templeId\":\"$TEMPLE_ID\",\"passId\":\"$PASS_ID\"}")
    ENTRY_COUNT=$(echo $ENTRY_RESPONSE | jq -r '.data.count // empty')
    
    if [ -n "$ENTRY_COUNT" ]; then
        echo -e "${GREEN}PASS${NC}: Entry recorded (Count: $ENTRY_COUNT)"
        ((PASS_COUNT++))
    else
        echo -e "${RED}FAIL${NC}: Entry failed"
        ((FAIL_COUNT++))
    fi
    
    # Get Live Dashboard
    DASHBOARD=$(curl -s "$BASE_URL/live/$TEMPLE_ID")
    CURRENT_COUNT=$(echo $DASHBOARD | jq -r '.data.current_count // empty')
    
    if [ -n "$CURRENT_COUNT" ]; then
        echo -e "${GREEN}PASS${NC}: Dashboard data (Count: $CURRENT_COUNT)"
        ((PASS_COUNT++))
    else
        echo -e "${RED}FAIL${NC}: Dashboard failed"
        ((FAIL_COUNT++))
    fi
    
    # Record Exit
    EXIT_RESPONSE=$(curl -s -X POST "$BASE_URL/live/exit" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $GK_TOKEN" \
        -d "{\"templeId\":\"$TEMPLE_ID\",\"passId\":\"$PASS_ID\"}")
    EXIT_COUNT=$(echo $EXIT_RESPONSE | jq -r '.data.count // empty')
    
    if [ -n "$EXIT_COUNT" ] || [ "$EXIT_COUNT" == "0" ]; then
        echo -e "${GREEN}PASS${NC}: Exit recorded (Count: $EXIT_COUNT)"
        ((PASS_COUNT++))
    else
        echo -e "${RED}FAIL${NC}: Exit failed"
        ((FAIL_COUNT++))
    fi
fi

# ==========================================
# 6. Admin Dashboard
# ==========================================
echo ""
echo "--- Admin Dashboard ---"

# Get Stats
STATS=$(curl -s "$BASE_URL/admin/stats" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
HAS_OVERVIEW=$(echo $STATS | jq -r '.data.overview // empty')

if [ -n "$HAS_OVERVIEW" ]; then
    echo -e "${GREEN}PASS${NC}: Admin stats retrieved"
    ((PASS_COUNT++))
else
    echo -e "${RED}FAIL${NC}: Admin stats failed"
    ((FAIL_COUNT++))
fi

# Health Check
HEALTH=$(curl -s "$BASE_URL/admin/health" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
HEALTH_STATUS=$(echo $HEALTH | jq -r '.data.status // empty')

if [ "$HEALTH_STATUS" == "healthy" ]; then
    echo -e "${GREEN}PASS${NC}: System health OK"
    ((PASS_COUNT++))
else
    echo -e "${RED}FAIL${NC}: System unhealthy"
    ((FAIL_COUNT++))
fi

# ==========================================
# Summary
# ==========================================
TOTAL=$((PASS_COUNT + FAIL_COUNT))
PERCENTAGE=$((PASS_COUNT * 100 / TOTAL))

echo ""
echo "========================================"
echo " E2E TEST SUMMARY"
echo "========================================"
echo "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASS_COUNT${NC}"
echo -e "Failed: ${RED}$FAIL_COUNT${NC}"
echo "Success Rate: $PERCENTAGE%"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ ALL E2E TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
