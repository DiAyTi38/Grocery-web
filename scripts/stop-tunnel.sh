#!/bin/bash
# ==============================================================================
# Script dừng phát sóng Cloudflare Tunnel (Smart Grocery)
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

echo "⏹️ Đang dừng Cloudflare Tunnel..."
docker compose stop tunnel >/dev/null 2>&1
docker compose rm -f tunnel >/dev/null 2>&1

echo "✅ Đã đóng đường hầm Cloudflare Tunnel thành công!"
