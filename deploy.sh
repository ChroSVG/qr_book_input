#!/bin/bash

########################################
# QR Input GPT - Deployment Script
# Usage: ./deploy.sh [staging|production]
########################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
ENVIRONMENT=${1:-staging}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

echo -e "${BLUE}"
echo "========================================"
echo "  QR Input GPT - Deployment Script"
echo "========================================"
echo -e "${NC}"
echo ""

# Function: Print status
print_status() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function: Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        echo "Install with: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi
    print_status "Docker installed"
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed!"
        exit 1
    fi
    print_status "Docker Compose installed"
    
    # Check if running as root or in docker group
    if [ "$(id -u)" -ne 0 ] && ! groups | grep -q docker; then
        print_warning "Not running as root or in docker group"
        print_warning "You may need to use 'sudo' for docker commands"
    fi
    
    echo ""
}

# Function: Backup database
backup_database() {
    echo -e "${BLUE}Backing up database...${NC}"
    
    # Create backup directory
    mkdir -p $BACKUP_DIR
    
    # Check if backend container is running
    if docker ps | grep -q qr-backend; then
        # Backup from running container
        docker cp qr-backend:/app/data/data.db $BACKUP_DIR/data.db.backup.$TIMESTAMP
        
        if [ -f "$BACKUP_DIR/data.db.backup.$TIMESTAMP" ]; then
            print_status "Database backed up to: $BACKUP_DIR/data.db.backup.$TIMESTAMP"
            
            # Compress backup
            cd $BACKUP_DIR
            tar czf data.db.backup.$TIMESTAMP.tar.gz data.db.backup.$TIMESTAMP
            rm data.db.backup.$TIMESTAMP
            cd ..
            
            print_status "Backup compressed: $BACKUP_DIR/data.db.backup.$TIMESTAMP.tar.gz"
        else
            print_warning "Database backup failed, continuing anyway..."
        fi
    else
        print_warning "Backend container not running, skipping backup"
    fi
    
    echo ""
}

# Function: Pull latest code
pull_latest_code() {
    echo -e "${BLUE}Pulling latest code...${NC}"
    
    # Check if git repository
    if [ -d ".git" ]; then
        git pull
        print_status "Latest code pulled"
    else
        print_warning "Not a git repository, skipping pull"
    fi
    
    echo ""
}

# Function: Build images
build_images() {
    echo -e "${BLUE}Building Docker images...${NC}"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker compose -f docker-compose.yml -f docker-compose.prod.yml build
    else
        docker compose -f docker-compose.yml -f docker-compose.staging.yml build
    fi
    
    print_status "Docker images built successfully"
    echo ""
}

# Function: Deploy
deploy() {
    echo -e "${BLUE}Deploying $ENVIRONMENT environment...${NC}"
    
    # Stop old containers
    print_status "Stopping old containers..."
    docker compose -f docker-compose.yml down
    
    # Start new containers
    if [ "$ENVIRONMENT" = "production" ]; then
        print_status "Starting production environment..."
        docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    else
        print_status "Starting staging environment..."
        docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d
    fi
    
    print_status "Containers started"
    echo ""
}

# Function: Health check
health_check() {
    echo -e "${BLUE}Running health checks...${NC}"
    
    # Wait for services to start
    echo "Waiting 15 seconds for services to initialize..."
    sleep 15
    
    # Check container status
    print_status "Container status:"
    docker compose -f docker-compose.yml ps
    
    echo ""
    
    # Backend health check
    echo "Testing backend API..."
    if curl -f -s http://localhost:8001/api/data/?page=1&limit=1 > /dev/null 2>&1; then
        print_status "Backend API is accessible"
    else
        print_warning "Backend API not accessible yet, waiting more..."
        sleep 10
        
        if curl -f -s http://localhost:8001/api/data/?page=1&limit=1 > /dev/null 2>&1; then
            print_status "Backend API is accessible (delayed)"
        else
            print_error "Backend API health check failed!"
            print_error "Check logs with: docker compose logs backend"
        fi
    fi
    
    # Frontend check
    echo "Testing frontend..."
    if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend is accessible"
    else
        print_warning "Frontend health check failed"
    fi
    
    echo ""
}

# Function: Show logs
show_logs() {
    echo -e "${BLUE}Recent logs (last 20 lines):${NC}"
    echo ""
    
    echo "--- Backend Logs ---"
    docker compose logs --tail=20 backend
    
    echo ""
    echo "--- Frontend Logs ---"
    docker compose logs --tail=20 frontend
    
    echo ""
}

# Function: Post-deployment info
show_info() {
    echo -e "${GREEN}"
    echo "========================================"
    echo "  Deployment Complete! 🚀"
    echo "========================================"
    echo -e "${NC}"
    echo ""
    echo "Access points:"
    echo "  • Frontend:    http://localhost:3000"
    echo "  • Backend API: http://localhost:8001"
    echo "  • API Docs:    http://localhost:8001/docs"
    echo ""
    echo "Useful commands:"
    echo "  • View logs:         docker compose logs -f"
    echo "  • Restart services:  docker compose restart"
    echo "  • Stop services:     docker compose down"
    echo "  • Backup database:   docker cp qr-backend:/app/data/data.db ./backup.db"
    echo ""
    
    if [ "$ENVIRONMENT" = "production" ]; then
        print_warning "Remember to:"
        echo "  1. Update CORS_ORIGINS in docker-compose.prod.yml"
        echo "  2. Setup SSL/HTTPS (Cloudflare Tunnel or Let's Encrypt)"
        echo "  3. Configure automated backups"
        echo "  4. Setup monitoring"
        echo ""
    fi
}

# Main execution

# Step 1: Check prerequisites
check_prerequisites

# Step 2: Confirm deployment
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
read -p "Continue with deployment? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled"
    exit 0
fi

echo ""

# Step 3: Backup
backup_database

# Step 4: Pull latest code
pull_latest_code

# Step 5: Build
build_images

# Step 6: Deploy
deploy

# Step 7: Health check
health_check

# Step 8: Show logs
show_logs

# Step 9: Show info
show_info

print_status "Deployment script completed successfully!"
exit 0
