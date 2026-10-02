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

Môi trường Backend đã được tự động hóa. Không ai được phép tự tạo Database bằng tay. Hãy làm theo đúng thứ tự 2 bước dưới đây:

### Bước 1: Khởi động Database bằng Docker
1. Mở phần mềm **Docker Desktop** trên máy tính của bạn và đợi nó khởi động xong.
2. Mở Terminal (hoặc Command Prompt/Git Bash) tại thư mục `backend`.
3. Gõ lệnh sau để tạo và chạy Database:
   ```bash
   docker compose up -d
   ```
   *Giải thích: Lệnh này sẽ tải MySQL 8.0, tự động tạo database `smart_grocery`, thiết lập tài khoản `root` và mật khẩu `root` ở cổng `3306`. Dữ liệu sẽ không bị mất khi tắt máy tính.*

### Bước 2: Chạy Backend (Spring Boot)
1. Mở thư mục `backend` bằng IDE của bạn.
2. Cập nhật thư viện Maven (Reload Project / Sync).
3. Chạy file `GroceryBackendApplication.java`.

🚨 **LƯU Ý CỰC KỲ QUAN TRỌNG VỀ DATABASE:**
Hệ thống sử dụng **Flyway Migration**. Ngay khi Spring Boot khởi động, nó sẽ tự động chạy các file `.sql` trong thư mục `backend/src/main/resources/db/migration/` để **tự tạo bảng**. 
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

## 🐛 Khắc phục sự cố thường gặp (Troubleshooting)

- **Lỗi "Cannot connect to database":** 
  👉 Chắc chắn Docker Desktop đang mở. Mở terminal gõ `docker ps` để kiểm tra xem container `grocery_mysql` có đang chạy hay không.
- **Lỗi Flyway Checksum Mismatch:** 
  👉 Do bạn đã "lỡ tay" sửa nội dung một file `.sql` đã được chạy trước đó. Giải pháp tạm thời (cho local): Xóa container Docker và volume (`docker compose down -v`), sau đó chạy lại lệnh `up -d` để khởi tạo lại DB từ đầu.
- **Lỗi cổng 3306 hoặc 8080 đã được sử dụng:**
  👉 Tắt các phần mềm đang chiếm dụng cổng (như XAMPP, Skype, hoặc một project Spring Boot khác đang bật).
