# 🛒 Smart Grocery E-commerce with AI & Loyalty System

> Hệ thống thương mại điện tử bách hóa thông minh tích hợp gợi ý mua sắm cá nhân hóa bằng Trí tuệ nhân tạo (AI Machine Learning), hệ thống tích điểm và xếp hạng thành viên (Loyalty Tiering), cùng hạ tầng hỗ trợ trình diễn trực tiếp qua Internet (Cloudflare Tunnel).

---

## 📋 Mục lục
1. [Tổng quan kiến trúc & Công nghệ](#-tổng-quan-kiến-trúc--công-nghệ)
2. [Tài khoản Demo có sẵn (Seed Data)](#-tài-khoản-demo-có-sẵn-seed-data)
3. [Yêu cầu hệ thống (Prerequisites)](#-yêu-cầu-hệ-thống-prerequisites)
4. [Hướng dẫn khởi chạy 1-Click (Khuyên dùng)](#-hướng-dẫn-khởi-chạy-1-click-khuyên-dùng)
5. [Hướng dẫn khởi chạy linh hoạt cho Developer](#-hướng-dẫn-khởi-chạy-linh-hoạt-cho-developer)
6. [Phát sóng Demo ra Internet & Mobile (Cloudflare Tunnel)](#-phát-sóng-demo-ra-internet--mobile-cloudflare-tunnel)
7. [Sao lưu & Phục hồi cơ sở dữ liệu (Disaster Recovery)](#-sao-lưu--phục-hồi-cơ-sở-dữ-liệu-disaster-recovery)
8. [Quy trình kiểm thử tự động (Automated Testing)](#-quy-trình-kiểm-thử-tự-động-automated-testing)
9. [Cảnh báo & Khắc phục sự cố thường gặp (Troubleshooting)](#-cảnh-báo--khắc-phục-sự-cố-thường-gặp-troubleshooting)

---

## 🏛 Tổng quan kiến trúc & Công nghệ

Hệ thống được thiết kế theo kiến trúc Microservices phân tách độc lập, đóng gói hoàn chỉnh bằng Docker:

```text
                     [ Người dùng / Trình duyệt / Mobile Phone ]
                                        │
                                        ▼ (Port 3000 / HTTPS Cloudflare)
                            ┌───────────────────────┐
                            │    Nginx (Proxy &     │
                            │   React 19 SPA)       │
                            └───────────┬───────────┘
                                        │ /api/
                                        ▼ (Port 8080)
                            ┌───────────────────────┐
                            │  Spring Boot Backend  │
                            │ (Security, JWT, JPA)  │
                            └───┬───────────────┬───┘
               SQL Connection   │               │ WebClient (HTTP REST)
                                ▼               ▼ (Port 8000)
                    ┌──────────────────┐  ┌──────────────────┐
                    │ MySQL 8.0 DB     │  │ Python FastAPI   │
                    │ Flyway (V1 - V14)│  │ (Scikit-Learn AI)│
                    └──────────────────┘  └──────────────────┘
```

| Phân hệ | Công nghệ chủ đạo | Vai trò chính |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, React Router 7, Nginx | Giao diện Responsive (Web/Mobile), Canvas nén ảnh đại diện tự động, Reverse Proxy API. |
| **Backend** | Java 17+, Spring Boot 3.4/4.1, Spring Security (JWT), Hibernate, Flyway | Xác thực, xử lý đơn hàng, ví điểm Loyalty, đổi/quên mật khẩu, hồ sơ người dùng. |
| **AI Service** | Python 3.10+, FastAPI, Scikit-Learn, Pandas | Dự đoán xác suất mua lại sản phẩm và cá nhân hóa danh sách gợi ý. |
| **Database** | MySQL 8.0, Flyway Migrations | Quản lý dữ liệu quan hệ, lịch sử đơn hàng, giao dịch tích điểm, schema versioning tự động. |
| **Tunnel** | Cloudflare Tunnel (`cloudflared`) | Tạo URL HTTPS công khai ra Internet và sinh mã QR quét trực tiếp từ điện thoại. |

---

## 👥 Tài khoản Demo có sẵn (Seed Data)

Dữ liệu đã được nạp tự động qua Flyway Migration (`V8` & `V14`). Bạn có thể đăng nhập ngay mà không cần tạo mới:

| Loại tài khoản | Tên đăng nhập (Username) | Email | Mật khẩu | Quyền hạn (Role) | Chức năng kiểm thử chính |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Quản trị viên** | `admin` | `admin@example.com` | `password123` | `ROLE_ADMIN` | Quản lý sản phẩm, đơn hàng, điều chỉnh điểm Loyalty (cộng/trừ điểm thủ công kèm lý do CSKH). |
| **Khách hàng** | `dattran` | `dattran@example.com` | `password123` | `ROLE_USER` | Mua hàng, tích điểm tự động theo đơn, nâng hạng Thành viên, đổi mật khẩu, upload avatar cá nhân (tối đa 10MB). |

---

## 🛠 Yêu cầu hệ thống (Prerequisites)

* **Docker Desktop**: Bắt buộc (đã bật và đang chạy daemon).
* **Git**: Dùng để quản lý mã nguồn.
* *(Tùy chọn - chỉ cần nếu chạy từng phần không qua Docker)*:
  * Java 17+ (JDK) & Maven 3.8+
  * Node.js 20+ & npm
  * Python 3.10+ & pip

---

## 🚀 Hướng dẫn khởi chạy 1-Click (Khuyên dùng)

Đây là phương thức tiêu chuẩn, nhanh nhất để chạy toàn bộ hệ thống cho buổi báo cáo hoặc kiểm thử End-to-End.

### Bước 1: Chuẩn bị biến môi trường
Mở Terminal tại thư mục gốc của dự án (`groceryweb`) và tạo file cấu hình:
```bash
cp .env.example .env
```
*(File `.env` mặc định đã được cấu hình sẵn các cổng và mật khẩu chuẩn, bạn có thể giữ nguyên).*

### Bước 2: Build và khởi động toàn bộ dịch vụ
```bash
docker compose up --build -d
```
Quá trình này sẽ tự động khởi động 4 container:
* 🌐 **Frontend (Giao diện mua sắm & cá nhân):** [http://localhost:3000](http://localhost:3000)
* ⚙️ **Backend (Spring Boot REST API):** [http://localhost:8080/api/products](http://localhost:8080/api/products)
* 🧠 **AI Service (FastAPI & Swagger Docs):** [http://localhost:8000/docs](http://localhost:8000/docs)
* 🗄️ **MySQL Database:** `localhost:3306`

### Bước 3: Kiểm tra trạng thái hệ thống
```bash
docker compose ps
```
Đảm bảo tất cả 4 container (`grocery_mysql`, `grocery_ai`, `grocery_backend`, `grocery_frontend`) đều ở trạng thái `running` hoặc `healthy`.

Để theo dõi log thời gian thực của Backend:
```bash
docker compose logs -f backend
```

### Bước 4: Tắt hệ thống khi kết thúc
* Dừng và giữ nguyên dữ liệu:
  ```bash
  docker compose down
  ```
* Dừng và **xóa sạch toàn bộ dữ liệu** để reset ban đầu:
  ```bash
  docker compose down -v
  ```

---

## 💻 Hướng dẫn khởi chạy linh hoạt cho Developer

Dành cho các thành viên trong nhóm muốn debug từng phân hệ trên IDE (IntelliJ, VS Code):

### 1. Dành cho Backend Developer
Chỉ chạy Database trên Docker, chạy Spring Boot trên máy để debug:
```bash
# 1. Bật container MySQL
docker compose up -d mysql-db

# 2. Khởi chạy Spring Boot
cd backend
./mvnw spring-boot:run
```

### 2. Dành cho Frontend Developer
Bật toàn bộ Backend + AI + DB trong Docker, chỉ chạy hot-reload React:
```bash
# 1. Bật các dịch vụ phụ trợ
docker compose up -d mysql-db backend ai-service

# 2. Chạy React Vite dev server
cd frontend
npm install
npm run dev
```
Truy cập qua địa chỉ Vite local: `http://localhost:5173`.

### 3. Dành cho AI Developer
Bật DB và Backend để kiểm tra tương thích mô hình Machine Learning:
```bash
# 1. Bật DB và Backend
docker compose up -d mysql-db backend

# 2. Khởi chạy FastAPI
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🌐 Phát sóng Demo ra Internet & Mobile (Cloudflare Tunnel)

Hệ thống đã tích hợp sẵn công cụ phát sóng đường hầm HTTPS ra ngoài Internet thông qua Cloudflare Tunnel. Giảng viên hoặc thành viên hội đồng có thể dùng điện thoại cá nhân (bật 4G/5G) để quét mã QR và trực tiếp trải nghiệm mà không cần chung mạng WiFi.

### 1. Bật phát sóng
Chạy script tự động tại thư mục gốc:
```bash
./scripts/start-tunnel.sh
```
* Script sẽ tự động kết nối và in ra đường link HTTPS công khai (Ví dụ: `https://xxxx-xxxx.trycloudflare.com`).
* Đồng thời hiển thị link tạo mã QR để người khác quét trực tiếp từ camera điện thoại.

### 2. Tắt phát sóng
Khi buổi thuyết trình kết thúc, chạy lệnh:
```bash
./scripts/stop-tunnel.sh
```

---

## 💾 Sao lưu & Phục hồi cơ sở dữ liệu (Disaster Recovery)

Nhằm đảm bảo an toàn dữ liệu trước các sự cố trong buổi báo cáo hoặc khi demo, bộ công cụ backup đã được lập trình sẵn:

* **Tạo bản sao lưu ngay lập tức (Backup):**
  ```bash
  ./scripts/backup-db.sh
  ```
  File sao lưu SQL sẽ được tạo tự động trong thư mục `backups/grocery_backup_<timestamp>.sql`.

* **Phục hồi dữ liệu (Restore):**
  ```bash
  # Tự động nạp bản sao lưu mới nhất trong thư mục backups:
  ./scripts/restore-db.sh

  # Hoặc chỉ định một file sao lưu cụ thể:
  ./scripts/restore-db.sh backups/grocery_backup_20261015_213548.sql
  ```

---

## 🧪 Quy trình kiểm thử tự động (Automated Testing)

Dự án duy trì bộ kiểm thử tự động toàn diện nhằm ngăn chặn hồi quy (Regression Bugs):

### 1. Kiểm thử Backend (Spring Boot & JUnit 5)
Bao gồm 40 bài kiểm thử tích hợp và đơn vị (Authentication, Loyalty Tiering, Profile, Order Service, AI Client Fallback):
```bash
cd backend
mvn test -DDB_PASSWORD=change_this_root_password
```
*(Kết quả yêu cầu: `Tests run: 40, Failures: 0, Errors: 0, Skipped: 0` - `BUILD SUCCESS`).*

### 2. Kiểm thử AI Engine (Pytest)
Kiểm thử 5 kịch bản API dự đoán và cấu trúc dữ liệu đầu vào:
```bash
cd ai-service
pytest tests/test_api.py
```
*(Kết quả yêu cầu: `5 passed`).*

### 3. Kiểm thử Frontend Build (Vite)
Xác minh tính đúng đắn của toàn bộ cú pháp React JSX và bundle CSS:
```bash
cd frontend
npm run build
```

---

## ⚠️ Cảnh báo & Khắc phục sự cố thường gặp (Troubleshooting)

> [!CAUTION]
> **1. Quy tắc bất biến về Database Migration (Flyway):**
> * Khi Spring Boot khởi chạy, Flyway sẽ tự động kiểm tra checksum của các file từ `V1` đến `V14` trong thư mục `backend/src/main/resources/db/migration/`.
> * **TUYỆT ĐỐI KHÔNG** chỉnh sửa nội dung của các file `.sql` đã chạy. Nếu sửa, Flyway sẽ báo lỗi `Checksum Mismatch` và Backend sẽ từ chối khởi động.
> * Nếu cần thêm bảng hoặc cột mới, **luôn tạo file mới** với số hiệu kế tiếp (ví dụ: `V15__ten_chuc_nang_moi.sql`).
> * Nếu lỡ tay làm hỏng cấu trúc DB local, hãy chạy `docker compose down -v` để xóa volume rồi chạy lại `docker compose up --build -d`.

> [!WARNING]
> **2. Lỗi xung đột cổng (Port Conflict):**
> * Nếu máy tính cá nhân đang cài sẵn MySQL cục bộ chiếm cổng `3306`, hoặc ứng dụng khác chiếm cổng `8080`, `3000`, `8000`:
>   * Hãy tắt dịch vụ MySQL trên máy hoặc chỉnh sửa các cổng ánh xạ trong file `.env` (Ví dụ: `MYSQL_PORT=3307`, `FRONTEND_PORT=3001`).

> [!NOTE]
> **3. Quyền thực thi các script (`Permission Denied`):**
> * Nếu chạy `./scripts/*.sh` trên Linux/macOS báo lỗi không có quyền, hãy cấp quyền thực thi một lần duy nhất:
>   ```bash
>   chmod +x scripts/*.sh
>   ```

> [!TIP]
> **4. Dung lượng ảnh Avatar và Nginx:**
> * Cấu hình Nginx đã được thiết lập `client_max_body_size 20M` và Frontend đã có sẵn bộ tự động nén Canvas ($600 \times 600\text{px}$). Bạn có thể thoải mái chọn ảnh chụp trực tiếp từ điện thoại (kể cả ảnh nặng 5MB – 10MB) mà không gặp lỗi `413 Request Entity Too Large`.

---
*Chúc nhóm thực hiện buổi thuyết trình và vận hành hệ thống thành công tốt đẹp!*
