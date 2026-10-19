#!/bin/bash
# ==============================================================================
# Script phục hồi dữ liệu MySQL từ bản sao lưu (Smart Grocery)
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

# Đọc cấu hình từ .env nếu có
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

DB_NAME="${MYSQL_DATABASE:-smart_grocery}"
ROOT_PASS="${MYSQL_ROOT_PASSWORD:-root}"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Nếu người dùng truyền vào tham số file cụ thể, sử dụng file đó
# Nếu không, tự động tìm file backup .sql mới nhất trong thư mục backups
RESTORE_FILE="$1"

if [ -z "$RESTORE_FILE" ]; then
    RESTORE_FILE=$(ls -t "$BACKUP_DIR"/grocery_backup_*.sql 2>/dev/null | head -n 1)
fi

if [ -z "$RESTORE_FILE" ] || [ ! -f "$RESTORE_FILE" ]; then
    echo "❌ Lỗi: Không tìm thấy file backup hợp lệ!"
    echo "👉 Cách dùng: ./scripts/restore-db.sh [đường_dẫn_file_sql]"
    echo "   Ví dụ: ./scripts/restore-db.sh backups/grocery_backup_20261015_213000.sql"
    exit 1
fi

echo "=========================================================="
echo "⚠️  CẢNH BÁO: Phục hồi database sẽ GHI ĐÈ dữ liệu hiện tại!"
echo "📦 Database mục tiêu: $DB_NAME"
echo "📄 File phục hồi: $RESTORE_FILE"
echo "=========================================================="

# Kiểm tra container mysql-db có đang chạy không
if ! docker compose ps mysql-db | grep -q "Up"; then
    echo "❌ Lỗi: Container 'mysql-db' chưa khởi động!"
    echo "👉 Hãy chạy 'docker compose up -d mysql-db' trước khi restore."
    exit 1
fi

read -p "❓ Bạn có chắc chắn muốn tiếp tục phục hồi? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "⏹️ Đã hủy thao tác phục hồi dữ liệu."
    exit 0
fi

echo "⏳ Đang nạp dữ liệu vào database '$DB_NAME'..."
docker compose exec -T mysql-db mysql -u root -p"$ROOT_PASS" "$DB_NAME" < "$RESTORE_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Phục hồi dữ liệu thành công từ file: $RESTORE_FILE"
    echo "=========================================================="
else
    echo "❌ Phục hồi thất bại! Vui lòng kiểm tra lại tính toàn vẹn của file backup."
    exit 1
fi
