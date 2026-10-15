#!/bin/bash
# ==============================================================================
# Script sao lưu dữ liệu MySQL từ Docker container (Smart Grocery)
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
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/grocery_backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "=========================================================="
echo "📦 Đang tiến hành sao lưu database '$DB_NAME'..."
echo "=========================================================="

# Kiểm tra container mysql-db có đang chạy không
if ! docker compose ps mysql-db | grep -q "Up"; then
    echo "❌ Lỗi: Container 'mysql-db' chưa khởi động!"
    echo "👉 Hãy chạy 'docker compose up -d mysql-db' trước khi backup."
    exit 1
fi

docker compose exec -T mysql-db mysqldump -u root -p"$ROOT_PASS" "$DB_NAME" > "$FILENAME"

if [ $? -eq 0 ] && [ -s "$FILENAME" ]; then
    FILE_SIZE=$(du -h "$FILENAME" | cut -f1)
    echo "✅ Sao lưu thành công!"
    echo "📁 File lưu tại: $FILENAME ($FILE_SIZE)"
    echo "=========================================================="
else
    echo "❌ Sao lưu thất bại hoặc file rỗng!"
    rm -f "$FILENAME"
    exit 1
fi
