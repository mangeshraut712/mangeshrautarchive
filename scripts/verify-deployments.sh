#!/bin/bash
# Deployment Verification Script
# Ensures both GitHub Pages and Vercel deployments are healthy and synchronized

echo "🔍 Starting Deployment Verification..."
echo "======================================"

GITHUB_URL="https://mangeshraut712.github.io/mangeshrautarchive/"
VERCEL_URL="https://mangeshraut.pro/"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check deployment health
check_deployment() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}

    echo -n "Checking $name ($url)... "

    # Use curl with timeout and follow redirects
    local response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" \
        --max-time 10 \
        -L \
        -A "Deployment-Verification/1.0" \
        "$url" 2>/dev/null)

    local http_status=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://' | sed -e 's/;TIME.*//')
    local response_time=$(echo "$response" | tr -d '\n' | sed -e 's/.*TIME://')

    if [ "$http_status" = "$expected_status" ]; then
        local time_ms=$(echo "scale=0; $response_time * 1000" | bc 2>/dev/null || echo "0")
        echo -e "${GREEN}✅ Healthy (${time_ms}ms)${NC}"
        return 0
    else
        echo -e "${RED}❌ Unhealthy (HTTP $http_status, ${response_time}s)${NC}"
        return 1
    fi
}

# Function to get version from deployment
get_version() {
    local url=$1
    local name=$2

    # For Vercel, manifest.json is at root due to rewrites
    # For GitHub Pages, it's at /manifest.json
    if [ "$name" = "vercel" ]; then
        local version_url="${url}manifest.json"
    else
        local version_url="${url}manifest.json"
    fi

    local version=$(curl -s "$version_url" 2>/dev/null | grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
    echo "$version"
}

# Function to check API health
check_api_health() {
    local name=$1
    local api_url=$2

    echo -n "Checking $name API... "

    local response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        --max-time 10 \
        -H "Accept: application/json" \
        "$api_url" 2>/dev/null)

    local http_status=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

    if [ "$http_status" = "200" ]; then
        local status=$(echo "$response" | sed 's/HTTPSTATUS.*//')
        local health_status=$(echo "$status" | grep -o '"status"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
        if [ "$health_status" = "healthy" ]; then
            echo -e "${GREEN}✅ Healthy${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  Degraded${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Unavailable (HTTP $http_status)${NC}"
        return 1
    fi
}

# Main verification
echo "🌐 Deployment Health Checks"
echo "---------------------------"

# Check GitHub Pages
GITHUB_HEALTHY=0
check_deployment "GitHub Pages" "$GITHUB_URL" || GITHUB_HEALTHY=$?

# Check Vercel
VERCEL_HEALTHY=0
check_deployment "Vercel" "$VERCEL_URL" || VERCEL_HEALTHY=$?

echo ""
echo "🔗 API Health Checks"
echo "--------------------"

# Check Vercel API (GitHub Pages doesn't have API endpoints)
check_api_health "Vercel" "${VERCEL_URL}api/health"

echo ""
echo "🔄 Version Synchronization"
echo "---------------------------"

# Get versions
GITHUB_VERSION=$(get_version "$GITHUB_URL")
VERCEL_VERSION=$(get_version "$VERCEL_URL")

echo "GitHub Pages version: ${GITHUB_VERSION:-Unknown}"
echo "Vercel version: ${VERCEL_VERSION:-Unknown}"

# Check synchronization
if [ -z "$GITHUB_VERSION" ] && [ -z "$VERCEL_VERSION" ]; then
    echo -e "${YELLOW}⚠️  Version info not available yet (deployments may be updating)${NC}"
    SYNC_STATUS=2  # Unknown status
elif [ -n "$GITHUB_VERSION" ] && [ -n "$VERCEL_VERSION" ] && [ "$GITHUB_VERSION" = "$VERCEL_VERSION" ]; then
    echo -e "${GREEN}✅ Deployments are synchronized${NC}"
    SYNC_STATUS=0
else
    echo -e "${RED}❌ Deployments are out of sync${NC}"
    SYNC_STATUS=1
fi

echo ""
echo "📊 Summary"
echo "----------"

OVERALL_HEALTHY=0

if [ $GITHUB_HEALTHY -eq 0 ]; then
    echo -e "GitHub Pages: ${GREEN}✅ Healthy${NC}"
else
    echo -e "GitHub Pages: ${RED}❌ Unhealthy${NC}"
    OVERALL_HEALTHY=1
fi

if [ $VERCEL_HEALTHY -eq 0 ]; then
    echo -e "Vercel: ${GREEN}✅ Healthy${NC}"
else
    echo -e "Vercel: ${RED}❌ Unhealthy${NC}"
    OVERALL_HEALTHY=1
fi

if [ $SYNC_STATUS -eq 0 ]; then
    echo -e "Synchronization: ${GREEN}✅ In Sync${NC}"
elif [ $SYNC_STATUS -eq 2 ]; then
    echo -e "Synchronization: ${YELLOW}⚠️  Unknown (updating)${NC}"
else
    echo -e "Synchronization: ${RED}❌ Out of Sync${NC}"
    OVERALL_HEALTHY=1
fi

echo ""
if [ $OVERALL_HEALTHY -eq 0 ]; then
    echo -e "${GREEN}🎉 All deployments are healthy and synchronized!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Deployment issues detected. Check the details above.${NC}"
    exit 1
fi