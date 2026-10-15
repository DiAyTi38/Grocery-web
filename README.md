# Smart Grocery E-commerce

Dự án Hệ thống thương mại điện tử Smart Grocery tích hợp AI (Nhóm 4).

## 🛠 Yêu cầu hệ thống (Prerequisites)
Để chạy được dự án này trên máy cá nhân, bạn cần cài đặt sẵn:
- **Java 17+** (JDK)
- **Maven**
- **Docker Desktop** (Bắt buộc để chạy Database thống nhất cho cả team, không dùng XAMPP hay cài MySQL rời).
- **Git**
- IDE: IntelliJ IDEA, Eclipse, hoặc VS Code.

---

## 🚀 Hướng dẫn khởi chạy hệ thống (Dành cho Team)

Toàn bộ hệ thống (Frontend, Backend, AI Service, Database) đã được tự động hóa tại thư mục gốc bằng **Docker Compose**. Bạn không cần cài MySQL cục bộ.

### Bước 1: Cấu hình môi trường
Mở Terminal tại thư mục gốc `groceryweb` và sao chép file cấu hình mẫu:
```bash
cp .env.example .env
```

---

### Bước 2: Khởi chạy hệ thống

Tùy vào mục đích làm việc, bạn chọn **1 trong 2 cách** sau:

#### Cách 1: Khởi chạy TOÀN BỘ hệ thống (Dành cho Demo / Test E2E)
Chỉ cần 1 lệnh duy nhất tại thư mục gốc để build và chạy 4 container:
```bash
docker compose up --build -d
```
* **Frontend:** `http://localhost:3000` (Giao diện React E-commerce)
* **Backend API:** `http://localhost:8080/api/products` (Spring Boot)
* **AI Service:** `http://localhost:8000/health` (FastAPI Prediction Engine)
* **MySQL Database:** `localhost:3306`

Kiểm tra trạng thái các container:
```bash
docker compose ps
docker compose logs -f backend
```

---

#### Cách 2: Khởi chạy linh hoạt theo vai trò phát triển (Dành cho Developer)

- **Dành cho Backend Dev (chỉ muốn bật DB để debug trên IDE):**
  ```bash
  # Chỉ bật MySQL (không bật FE/BE/AI trong Docker):
  docker compose up -d mysql-db

  # Sau đó chạy Spring Boot bằng IntelliJ hoặc Terminal:
  cd backend && ./mvnw spring-boot:run
  ```

- **Dành cho Frontend Dev (bật sẵn Backend + DB + AI để test giao diện):**
  ```bash
  docker compose up -d mysql-db backend ai-service
  cd frontend && npm run dev
  ```

- **Dành cho AI Dev (bật DB + Backend để test tích hợp model):**
  ```bash
  docker compose up -d mysql-db backend
  cd ai-service && uvicorn src.main:app --port 8000 --reload
  ```

- **Cách 2 (Bằng IDE):**
  1. Mở thư mục `backend` bằng IntelliJ IDEA hoặc VS Code.
  2. Cập nhật thư viện Maven (Reload Project).
  3. Chạy file `GroceryBackendApplication.java`.

🚨 **LƯU Ý CỰC KỲ QUAN TRỌNG VỀ DATABASE:**
Hệ thống sử dụng **Flyway Migration**. Ngay khi Spring Boot khởi động, nó sẽ tự động chạy các file `.sql` trong thư mục `backend/src/main/resources/db/migration/` để **tự tạo bảng**. Docker MySQL không chứa script tạo schema riêng.
- **TUYỆT ĐỐI KHÔNG** vào database để tạo hay sửa bảng bằng tay.
- Khi cần thêm cột hay tạo bảng mới, phải báo cho Đạt (Backend Lead) để viết file `.sql` mới (ví dụ `V2__add_table.sql`). Không được sửa nội dung file `V1` cũ sau khi nó đã được chạy.

---

## 🌿 Quy tắc làm việc nhóm (Git Flow)

Toàn bộ team phải tuân thủ quy tắc chia nhánh (branch) sau để tránh hỏng code của nhau:

- `main`: Nhánh chứa code ổn định cuối cùng để báo cáo/demo. Không ai được code trực tiếp lên nhánh này.
- `develop`: Nhánh tích hợp chung. 
- `feature/*`: Nhánh làm việc hàng ngày của mọi người.
  - Bạn làm backend: Tạo nhánh `feature/backend-<tên-chức-năng>` (VD: `feature/backend-auth`).
  - Bạn làm frontend: Tạo nhánh `feature/frontend-<tên-chức-năng>`.
  - Bạn làm AI: Tạo nhánh `feature/ai-<tên-chức-năng>`.

**Quy trình chuẩn:** 
1. `git pull origin develop` (Lấy code mới nhất).
2. `git checkout -b feature/tên-nhánh-của-bạn` (Tạo nhánh mới và code).
3. Khi xong việc: Báo cho Lead để tạo Pull Request (PR) merge vào nhánh `develop`.

---

## 🔄 Tích hợp liên tục (CI/CD Pipeline)

Dự án sử dụng **GitHub Actions** (`.github/workflows/ci.yml`) để tự động kiểm thử mỗi khi có `push` hoặc `pull_request` vào nhánh `develop` hoặc `main`:
1. **Backend Check:** Khởi tạo container MySQL 8.0 dịch vụ trên GitHub Runner, biên dịch Spring Boot và chạy toàn bộ unit/integration test (`mvn test`).
2. **Frontend Check:** Cài đặt dependencies (`npm ci`) và build thử bản production của React Vite (`npm run build`).
3. **AI Service Check:** Thiết lập môi trường Python 3.10, kiểm tra cú pháp mã nguồn và xác minh tính toàn vẹn của mô hình scikit-learn (`purchase_model.joblib`).

---

## 💾 Sao lưu & Phục hồi cơ sở dữ liệu (Disaster Recovery)

Tại thư mục gốc, hệ thống đã trang bị sẵn bộ công cụ tự động sao lưu và phục hồi:

- **Sao lưu dữ liệu (Backup):**
  ```bash
  ./scripts/backup-db.sh
  ```
  File dump SQL dạng nén sẽ được tự động tạo và lưu trữ tại thư mục `backups/grocery_backup_<timestamp>.sql`.

- **Phục hồi dữ liệu (Restore):**
  ```bash
  # Phục hồi từ bản sao lưu gần nhất:
  ./scripts/restore-db.sh

  # Hoặc chỉ định rõ file sao lưu cần nạp:
  ./scripts/restore-db.sh backups/grocery_backup_20261015_213548.sql
  ```

---

## 🐛 Khắc phục sự cố thường gặp (Troubleshooting)

- **Lỗi "Cannot connect to database":** 
  👉 Chắc chắn Docker Desktop đang mở. Chạy `docker compose ps` tại thư mục gốc để kiểm tra container `mysql-db` phải ở trạng thái `healthy`.
- **Lỗi Flyway Checksum Mismatch:** 
  👉 Do bạn đã "lỡ tay" sửa nội dung một file `.sql` đã được chạy trước đó. Để reset sạch volume database trên local: chạy `docker compose down -v` tại thư mục gốc, rồi chạy lại `docker compose up --build -d`.
- **Lỗi cổng 3306, 8080, 8000 hoặc 3000 đã được sử dụng:**
  👉 Tắt các phần mềm hoặc container cũ đang chiếm dụng cổng trên máy.

