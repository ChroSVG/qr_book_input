#!/bin/bash

########################################
# QR Input GPT - Environment Deployment
# Usage: ./deploy-env.sh [input|arraayah|staging]
########################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT=${1:-input}
ENV_FILE=".env.${ENVIRONMENT}"

echo -e "${BLUE}"
echo "========================================"
echo "  QR Input GPT - Environment Deploy"
echo "========================================"
echo -e "${NC}"

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}✗ Environment file not found: $ENV_FILE${NC}"
    echo -e "${YELLOW}Available environments: input, arraayah, staging${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Deploying environment: $ENVIRONMENT${NC}"
echo -e "${BLUE}Using config: $ENV_FILE${NC}"
echo ""

# Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
podman compose down 2>/dev/null || true

# Build and deploy
echo -e "${BLUE}Building and deploying...${NC}"
podman compose --env-file "$ENV_FILE" up -d --build

echo ""
echo -e "${GREEN}========================================"
echo "  Deployment Complete! 🚀"
echo "========================================${NC}"
echo ""
echo -e "${BLUE}Container status:${NC}"
podman compose ps

echo ""
echo -e "${BLUE}Access points:${NC}"
if [ "$ENVIRONMENT" = "input" ]; then
    echo "  • Frontend:    http://localhost:3000"
    echo "  • Backend API: http://localhost:8001"
    echo "  • API Docs:    http://localhost:8001/docs"
    echo ""
    echo -e "${YELLOW}Domain: https://input.arraayah.my.id${NC}"
elif [ "$ENVIRONMENT" = "arraayah" ]; then
    echo "  • Frontend:    http://localhost:3000"
    echo "  • Backend API: http://localhost:8001"
    echo "  • API Docs:    http://localhost:8001/docs"
    echo ""
    echo -e "${YELLOW}Domain: https://arraayah.my.id${NC}"
elif [ "$ENVIRONMENT" = "staging" ]; then
    echo "  • Frontend:    http://localhost:3000"
    echo "  • Backend API: http://localhost:8001"
    echo "  • API Docs:    http://localhost:8001/docs"
    echo ""
    echo -e "${YELLOW}Environment: Staging${NC}"
fi

echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  • View logs:         podman compose logs -f"
echo "  • Backend logs:      podman logs qr-backend -f"
echo "  • Frontend logs:     podman logs qr-frontend -f"
echo "  • Restart:           podman compose restart"
echo "  • Stop:              podman compose down"
echo ""
