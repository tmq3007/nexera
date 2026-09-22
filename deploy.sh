#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🚀 TIẾN HÀNH DEPLOY DỰ ÁN NEXERA LÊN NGINX & DOCKER"
echo "🌐 Domain: nexeragroup.vn | api.nexeragroup.vn"
echo "=========================================================="

# 1. Kiểm tra quyền root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Vui lòng chạy script với quyền sudo hoặc root: sudo bash deploy.sh"
  exit 1
fi

# Phát hiện Package Manager
PKG_MANAGER=""
if command -v apt-get &> /dev/null; then
    PKG_MANAGER="apt"
elif command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
fi
echo "🐧 Hệ thống sử dụng trình quản lý gói: $PKG_MANAGER"

# 2. Tạo bộ nhớ Swap (CỰC KỲ QUAN TRỌNG cho VPS để không bị tràn RAM khi build Next.js)
SWAP_EXISTS=$(free -m | awk '/^Swap:/ {print $2}')
if [ -z "$SWAP_EXISTS" ] || [ "$SWAP_EXISTS" -lt 1024 ]; then
    echo "🧠 Đang tạo 3GB bộ nhớ Swap để tránh lỗi tràn RAM khi build..."
    fallocate -l 3G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=3072
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    if ! grep -q "/swapfile" /etc/fstab; then
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    echo "✅ Đã tạo thành công 3GB Swap!"
else
    echo "✅ Máy chủ đã có bộ nhớ Swap ($SWAP_EXISTS MB)."
fi

# 3. Cài đặt các công cụ cơ bản & Docker
if ! command -v git &> /dev/null || ! command -v curl &> /dev/null; then
    echo "📦 Đang cài đặt git, curl..."
    if [ "$PKG_MANAGER" = "apt" ]; then
        apt-get update && apt-get install -y git curl
    else
        $PKG_MANAGER install -y git curl
    fi
fi

if ! command -v docker &> /dev/null; then
    echo "📦 Đang cài đặt Docker Engine..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm -f get-docker.sh
    echo "✅ Docker đã được cài đặt thành công!"
fi

# 4. Mở cổng Firewall
if command -v ufw &> /dev/null; then
    echo "🛡️ Cấu hình tường lửa UFW..."
    ufw allow 22/tcp
    ufw allow 24700/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable || true
elif command -v firewall-cmd &> /dev/null; then
    echo "🛡️ Cấu hình tường lửa Firewalld..."
    firewall-cmd --permanent --add-port=22/tcp || true
    firewall-cmd --permanent --add-port=24700/tcp || true
    firewall-cmd --permanent --add-service=http || true
    firewall-cmd --permanent --add-service=https || true
    firewall-cmd --reload || true
fi

# 5. Cài đặt Nginx & Certbot
if ! command -v nginx &> /dev/null; then
    echo "📦 Đang cài đặt Nginx và Certbot..."
    if [ "$PKG_MANAGER" = "apt" ]; then
        apt-get update
        apt-get install -y nginx certbot python3-certbot-nginx
    else
        $PKG_MANAGER install -y epel-release || true
        $PKG_MANAGER install -y nginx certbot python3-certbot-nginx
    fi
    systemctl enable nginx
    systemctl start nginx
fi

# 6. Cài đặt file cấu hình Nginx
echo "⚙️ Thiết lập cấu hình Nginx cho nexeragroup.vn..."
if [ -f "nginx/nexeragroup.vn.conf" ]; then
    if [ -d "/etc/nginx/sites-available" ]; then
        cp nginx/nexeragroup.vn.conf /etc/nginx/sites-available/nexeragroup.vn.conf
        mkdir -p /etc/nginx/sites-enabled
        ln -sf /etc/nginx/sites-available/nexeragroup.vn.conf /etc/nginx/sites-enabled/
    else
        mkdir -p /etc/nginx/conf.d
        cp nginx/nexeragroup.vn.conf /etc/nginx/conf.d/nexeragroup.vn.conf
    fi
    nginx -t
    systemctl reload nginx
    echo "✅ Nginx đã nạp cấu hình thành công!"
fi

# 7. Khởi chạy Docker Compose (Frontend & Backend)
echo "🐳 Đang build và chạy Docker Containers..."
docker compose down || true
if [ -f ".env.production" ]; then
    echo "📄 Tìm thấy file .env.production, sử dụng cấu hình Production..."
    docker compose --env-file .env.production up -d --build
else
    echo "⚠️ Không tìm thấy .env.production, sử dụng cấu hình mặc định (.env)..."
    docker compose up -d --build
fi

echo "=========================================================="
echo "🎉 DEPLOY THÀNH CÔNG!"
echo "👉 Frontend (Port 3000): http://127.0.0.1:3000"
echo "👉 Backend (Port 4000):  http://127.0.0.1:4000"
echo "=========================================================="
echo ""
echo "🔐 ĐỂ BẬT SSL HTTPS CHO DOMAIN (Sau khi đã trỏ DNS):"
echo "Chạy lệnh sau:"
echo "sudo certbot --nginx -d nexeragroup.vn -d www.nexeragroup.vn -d api.nexeragroup.vn"
echo "=========================================================="
