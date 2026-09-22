#!/usr/bin/env bash
# ==============================================================
# remote-setup.sh
# Chạy tự động trên server 162.4.176.246 (Ubuntu/Debian)
# Được gọi bởi build-and-deploy.ps1 qua SSH
# ==============================================================
set -e

CERTBOT_EMAIL="${1:-}"
DEPLOY_DIR="/tmp/nexera-deploy"
APP_DIR="/opt/nexera"
DOMAIN_FRONTEND="nexeragroup.vn"
DOMAIN_WWW="www.nexeragroup.vn"
DOMAIN_API="api.nexeragroup.vn"
SERVER_IP="162.4.176.246"

echo ""
echo "=========================================================="
echo "  🖥️  NEXERA SERVER SETUP"
echo "  Domain: $DOMAIN_FRONTEND | $DOMAIN_API"
echo "=========================================================="
echo ""

# ── 1. Tạo Swap nếu cần ─────────────────────────────────────
SWAP_MB=$(free -m | awk '/^Swap:/ {print $2}')
if [ -z "$SWAP_MB" ] || [ "$SWAP_MB" -lt 1024 ]; then
    echo "🧠 Tạo 2GB Swap (phòng ngừa OOM)..."
    if [ ! -f /swapfile ]; then
        fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
        chmod 600 /swapfile
        mkswap /swapfile
    fi
    swapon /swapfile 2>/dev/null || true
    grep -q "/swapfile" /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "✅ Swap 2GB đã được kích hoạt!"
else
    echo "✅ Swap: ${SWAP_MB}MB (đã có sẵn)"
fi

# ── 2. Cài Docker ────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    echo ""
    echo "📦 Cài đặt Docker Engine..."
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
        > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker --now
    echo "✅ Docker đã cài đặt!"
else
    echo "✅ Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"
fi

# ── 3. Mở Firewall ───────────────────────────────────────────
echo ""
echo "🛡️  Cấu hình Firewall..."
if command -v ufw &>/dev/null; then
    ufw allow 24700/tcp comment "SSH Nexera" 2>/dev/null || true
    ufw allow 80/tcp   comment "HTTP" 2>/dev/null || true
    ufw allow 443/tcp  comment "HTTPS" 2>/dev/null || true
    ufw --force enable 2>/dev/null || true
fi
echo "✅ Firewall OK"

# ── 4. Cài Nginx & Certbot ───────────────────────────────────
if ! command -v nginx &>/dev/null; then
    echo ""
    echo "📦 Cài đặt Nginx & Certbot..."
    apt-get update -qq
    apt-get install -y -qq nginx certbot python3-certbot-nginx
    systemctl enable nginx --now
    echo "✅ Nginx & Certbot đã cài đặt!"
else
    echo "✅ Nginx: $(nginx -v 2>&1 | cut -d'/' -f2)"
fi

# ── 5. Tạo thư mục ứng dụng ─────────────────────────────────
echo ""
echo "📁 Chuẩn bị thư mục $APP_DIR..."
mkdir -p "$APP_DIR/nginx"

# Di chuyển file cấu hình
cp "$DEPLOY_DIR/docker-compose.yml"        "$APP_DIR/"
cp "$DEPLOY_DIR/.env"                      "$APP_DIR/" 2>/dev/null || true
cp "$DEPLOY_DIR/nexeragroup.vn.conf"       "$APP_DIR/nginx/"

# ── 6. Load Docker Images ────────────────────────────────────
echo ""
echo "🐳 Đang load Docker images..."

echo "   Đang load nexera-backend..."
docker load -i "$DEPLOY_DIR/nexera-backend.tar"
echo "✅ nexera-backend:latest loaded!"

echo "   Đang load nexera-frontend..."
docker load -i "$DEPLOY_DIR/nexera-frontend.tar"
echo "✅ nexera-frontend:latest loaded!"

# ── 7. Khởi chạy Containers ─────────────────────────────────
echo ""
echo "🚀 Khởi chạy Docker Compose..."
cd "$APP_DIR"
docker compose down --remove-orphans 2>/dev/null || true
docker compose up -d

echo ""
echo "⏳ Chờ containers khởi động (10 giây)..."
sleep 10

# Kiểm tra containers
echo ""
echo "📊 Trạng thái containers:"
docker compose ps

# ── 8. Cài đặt Nginx Config ──────────────────────────────────
echo ""
echo "⚙️  Thiết lập Nginx..."

NGINX_CONF_SRC="$APP_DIR/nginx/nexeragroup.vn.conf"

if [ -d "/etc/nginx/sites-available" ]; then
    cp "$NGINX_CONF_SRC" "/etc/nginx/sites-available/nexeragroup.vn.conf"
    ln -sf "/etc/nginx/sites-available/nexeragroup.vn.conf" "/etc/nginx/sites-enabled/"
    # Xóa default nếu còn
    rm -f /etc/nginx/sites-enabled/default
else
    mkdir -p /etc/nginx/conf.d
    cp "$NGINX_CONF_SRC" "/etc/nginx/conf.d/nexeragroup.vn.conf"
fi

nginx -t && systemctl reload nginx
echo "✅ Nginx đã nạp cấu hình!"

# ── 9. Certbot SSL ───────────────────────────────────────────
echo ""
echo "🔐 Kiểm tra DNS & cấp SSL..."

# Kiểm tra DNS có trỏ về IP này chưa
RESOLVED_IP=$(dig +short "$DOMAIN_FRONTEND" 2>/dev/null | tail -1 || nslookup "$DOMAIN_FRONTEND" 2>/dev/null | awk '/^Address: / { print $2 }' | tail -1 || echo "")

if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
    echo "✅ DNS $DOMAIN_FRONTEND → $RESOLVED_IP (đúng!)"

    if [ -n "$CERTBOT_EMAIL" ] && [ "$CERTBOT_EMAIL" != "your@email.com" ]; then
        echo "🔐 Đang cấp SSL certificate..."
        certbot --nginx \
            -d "$DOMAIN_FRONTEND" \
            -d "$DOMAIN_WWW" \
            -d "$DOMAIN_API" \
            --non-interactive \
            --agree-tos \
            -m "$CERTBOT_EMAIL" \
            --redirect \
            2>&1 || echo "⚠️  Certbot: Kiểm tra lại DNS hoặc thử lại sau."
        echo "✅ SSL đã được cấp thành công!"
    else
        echo "⚠️  CERTBOT_EMAIL chưa điền → bỏ qua SSL."
        echo "   Điền email vào .deploy.env rồi chạy lại script."
    fi
else
    echo "⚠️  DNS chưa trỏ về $SERVER_IP (hiện tại: ${RESOLVED_IP:-'không phân giải được'})"
    echo "   → Bỏ qua SSL. Sau khi DNS trỏ đúng, chạy lại script deploy."
    echo "   Hoặc thủ công chạy trên server:"
    echo "   certbot --nginx -d $DOMAIN_FRONTEND -d $DOMAIN_WWW -d $DOMAIN_API"
fi

# ── 10. Dọn dẹp ─────────────────────────────────────────────
echo ""
echo "🧹 Dọn dẹp file tạm..."
rm -rf "$DEPLOY_DIR"
docker image prune -f 2>/dev/null || true
echo "✅ Dọn dẹp xong!"

# ── 11. Tổng kết ─────────────────────────────────────────────
echo ""
echo "=========================================================="
echo "  🎉 SERVER SETUP HOÀN TẤT!"
echo "=========================================================="
echo "  🌐 HTTP  Frontend : http://$DOMAIN_FRONTEND"
echo "  🔧 HTTP  Backend  : http://$DOMAIN_API"
echo ""
if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
echo "  🔒 HTTPS Frontend : https://$DOMAIN_FRONTEND"
echo "  🔒 HTTPS Backend  : https://$DOMAIN_API"
fi
echo ""
echo "  📋 Xem logs:"
echo "     docker compose -f $APP_DIR/docker-compose.yml logs -f"
echo "=========================================================="
echo ""
