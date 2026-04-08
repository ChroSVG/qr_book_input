#!/bin/bash

########################################
# Cloudflare Tunnel Setup Script
# Usage: ./setup-cloudflare-tunnel.sh
########################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================"
echo "  Cloudflare Tunnel Setup"
echo "========================================"
echo -e "${NC}"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}✗ cloudflared is not installed!${NC}"
    echo ""
    echo "Installing cloudflared..."
    echo ""
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "Detected Linux OS"
        curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
        chmod +x cloudflared
        sudo mv cloudflared /usr/local/bin/
        print_status "cloudflared installed to /usr/local/bin/"
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        echo "Detected macOS"
        if command -v brew &> /dev/null; then
            brew install cloudflared
        else
            echo "Homebrew not installed. Please install from: https://brew.sh"
            exit 1
        fi
        
    else
        echo "Unsupported OS. Please install manually from:"
        echo "https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/"
        exit 1
    fi
    
    echo ""
fi

echo -e "${GREEN}✓ cloudflared installed: $(cloudflared --version)${NC}"
echo ""

# Ask for tunnel type
echo "Select tunnel type:"
echo "1) Quick Tunnel (temporary, good for testing)"
echo "2) Named Tunnel (permanent, production-ready)"
echo ""
read -p "Choice [1/2]: " TUNNEL_TYPE

if [ "$TUNNEL_TYPE" = "1" ]; then
    # Quick Tunnel
    echo ""
    echo -e "${BLUE}Starting quick tunnel...${NC}"
    echo ""
    echo -e "${YELLOW}Tunnel will be available at a random URL${NC}"
    echo ""
    
    # Ask for port
    read -p "Backend port [8001]: " PORT
    PORT=${PORT:-8001}
    
    echo ""
    echo -e "${GREEN}Starting tunnel to port $PORT...${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop the tunnel${NC}"
    echo ""
    
    cloudflared tunnel --url http://localhost:$PORT
    
else
    # Named Tunnel
    echo ""
    echo -e "${BLUE}Setting up named tunnel...${NC}"
    echo ""
    
    # Check if already logged in
    if [ ! -d "$HOME/.cloudflared" ]; then
        echo "First time setup. Opening browser for authentication..."
        echo ""
        cloudflared tunnel login
    fi
    
    echo ""
    read -p "Tunnel name [qr-app]: " TUNNEL_NAME
    TUNNEL_NAME=${TUNNEL_NAME:-qr-app}
    
    echo ""
    read -p "Backend port [8001]: " PORT
    PORT=${PORT:-8001}
    
    echo ""
    read -p "Domain/hostname (e.g., app.yourdomain.com): " DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        echo -e "${RED}Domain is required for named tunnel!${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${BLUE}Creating tunnel: $TUNNEL_NAME${NC}"
    
    # Create tunnel
    cloudflared tunnel create $TUNNEL_NAME
    
    echo ""
    echo -e "${GREEN}✓ Tunnel created${NC}"
    echo ""
    
    # Create config
    CONFIG_FILE="$HOME/.cloudflared/config.yml"
    
    echo -e "${BLUE}Creating config at: $CONFIG_FILE${NC}"
    
    cat > $CONFIG_FILE << EOF
tunnel: $TUNNEL_NAME
credentials-file: $HOME/.cloudflared/$TUNNEL_NAME.json

ingress:
  - hostname: $DOMAIN
    service: http://localhost:$PORT
  - service: http_status:404
EOF
    
    print_status "Config created"
    echo ""
    
    # Route DNS
    echo -e "${BLUE}Routing DNS for $DOMAIN${NC}"
    cloudflared tunnel route dns $TUNNEL_NAME $DOMAIN
    
    print_status "DNS routed"
    echo ""
    
    # Create systemd service
    echo -e "${BLUE}Creating systemd service...${NC}"
    
    read -p "Install as systemd service? [y/n]: " INSTALL_SERVICE
    
    if [[ "$INSTALL_SERVICE" =~ ^[Yy]$ ]]; then
        sudo cat > /etc/systemd/system/cloudflared.service << 'EOF'
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel run
Restart=always
RestartSec=5
Environment=CLOUDFLARED_HOME=/root/.cloudflared

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable cloudflared
        sudo systemctl start cloudflared
        
        echo ""
        print_status "Systemd service installed and started"
        echo ""
        echo "Service status:"
        sudo systemctl status cloudflared --no-pager
    else
        echo ""
        echo -e "${YELLOW}To run tunnel manually:${NC}"
        echo "  cloudflared tunnel run $TUNNEL_NAME"
    fi
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Named Tunnel Setup Complete! 🚀${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Your app is now accessible at:"
    echo "  https://$DOMAIN"
    echo ""
    echo "Useful commands:"
    echo "  • Start tunnel:   cloudflared tunnel run $TUNNEL_NAME"
    echo "  • Stop tunnel:    sudo systemctl stop cloudflared"
    echo "  • View logs:      sudo journalctl -u cloudflared -f"
    echo "  • List tunnels:   cloudflared tunnel list"
    echo ""
fi
