#!/bin/bash
# ==============================================================================
# Script phát sóng hệ thống Smart Grocery ra Internet qua Cloudflare Tunnel
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

echo "=========================================================="
echo "🚀 Đang chuẩn bị phát sóng Smart Grocery qua Cloudflare Tunnel..."
echo "=========================================================="

# 1. Kiểm tra Docker
if ! docker info >/dev/null 2>&1; then
    echo "❌ Lỗi: Docker Desktop chưa được bật!"
    echo "👉 Vui lòng mở Docker Desktop trước khi chạy tunnel."
    exit 1
fi

# 2. Đảm bảo stack chính (frontend, backend, mysql, ai) đang chạy
if ! docker compose ps frontend | grep -q "Up"; then
    echo "⏳ Khởi động toàn bộ stack hệ thống..."
    docker compose up -d
fi

# 3. Khởi động container tunnel (xóa container cũ để tránh session expired và log cũ)
echo "⏳ Đang kết nối đường hầm bảo mật Cloudflare..."
docker compose --profile tunnel rm -sf tunnel >/dev/null 2>&1
docker compose --profile tunnel up -d tunnel >/dev/null 2>&1

# 4. Trích xuất URL công khai từ logs (chờ tối đa 20 giây)
TUNNEL_URL=""
MAX_RETRIES=20
COUNT=0

while [ -z "$TUNNEL_URL" ] && [ $COUNT -lt $MAX_RETRIES ]; do
    sleep 1
    TUNNEL_URL=$(docker compose logs tunnel 2>/dev/null | grep -o 'https://[-a-zA-Z0-9@:%._\+~#=]*\.trycloudflare\.com' | tail -n 1)
    COUNT=$((COUNT + 1))
    printf "."
done
echo ""

if [ -n "$TUNNEL_URL" ]; then
    QR_URL="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=$TUNNEL_URL"
    echo "=========================================================="
    echo "🎉 PHÁT SÓNG THÀNH CÔNG!"
    echo "=========================================================="
    echo "🌐 Đường link Demo công khai (HTTPS):"
    echo "👉 $TUNNEL_URL"
    echo ""
    echo "📱 Link tạo ảnh mã QR cho slide thuyết trình:"
    echo "👉 $QR_URL"
    echo ""
    echo "⚠️  LƯU Ý QUAN TRỌNG KHI DEMO:"
    echo "1. Giữ laptop luôn cắm sạc pin và không gập màn hình (Sleep)."
    echo "2. Để ngăn máy tự động ngủ, mở thêm một tab terminal gõ: caffeinate -d"
    echo "3. Khi muốn dừng phát sóng, chạy lệnh: ./scripts/stop-tunnel.sh"
    echo "=========================================================="
else
    echo "❌ Không thể lấy đường link tunnel sau 20 giây!"
    echo "👉 Kiểm tra log chi tiết: docker compose logs tunnel"
    exit 1
fi
