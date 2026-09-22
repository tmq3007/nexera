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

# 2. Tạo bộ nhớ Swap (CỰC KỲ QUAN TRỌNG cho VPS 1GB RAM để không bị tràn RAM khi build Next.js)
SWAP_EXISTS=$(free -m | awk '/^Swap:/ {print $2}')
if [ "$SWAP_EXISTS" -lt 1024 ]; then
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
    echo "✅ Máy chủ đã có bộ nhớ Swap."
fi

# 3. Kiểm tra & Cài đặt Docker nếu chưa có
if ! command -v docker &> /dev/null; then
    echo "📦 Đang cài đặt Docker Engine..."
    apt-get update
    apt-get install -y curl ufw git
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm -f get-docker.sh
    echo "✅ Docker đã được cài đặt thành công!"
fi

# 4. Mở cổng Firewall cơ bản
echo "🛡️ Cấu hình tường lửa UFW..."
ufw allow 22/tcp
ufw allow 24700/tcp       # Cổng SSH của OnePortal
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 4. Kiểm tra & Cài đặt Nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 Đang cài đặt Nginx và Certbot..."
    apt-get update
    apt-get install -y nginx certbot python3-certbot-nginx
    systemctl enable nginx
    systemctl start nginx
fi

# 5. Cài đặt file cấu hình Nginx
echo "⚙️ Thiết lập cấu hình Nginx cho nexeragroup.vn..."
if [ -f "nginx/nexeragroup.vn.conf" ]; then
    cp nginx/nexeragroup.vn.conf /etc/nginx/sites-available/nexeragroup.vn.conf
    ln -sf /etc/nginx/sites-available/nexeragroup.vn.conf /etc/nginx/sites-enabled/
    nginx -t
    systemctl reload nginx
    echo "✅ Nginx đã nạp cấu hình thành công!"
fi

# 6. Khởi chạy Docker Compose (Frontend & Backend)
echo "🐳 Đang build và chạy Docker Containers..."
docker compose down || true
docker compose up -d --build

echo "=========================================================="
echo "🎉 DEPLOY THÀNH CÔNG!"
echo "👉 Frontend (Port 3000): http://127.0.0.1:3000"
echo "👉 Backend (Port 4000):  http://127.0.0.1:4000"
echo "=========================================================="
echo ""
echo "🔐 ĐỂ BẬT SSL HTTPS MIỄN PHÍ CHO DOMAIN (Sau khi đã trỏ DNS xong):"
echo "Chạy lệnh sau:"
echo "sudo certbot --nginx -d nexeragroup.vn -d www.nexeragroup.vn -d api.nexeragroup.vn"
echo "=========================================================="
