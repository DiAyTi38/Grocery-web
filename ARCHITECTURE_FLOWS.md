# Tài liệu Luồng Hệ thống (System Architecture & Flows)

*Tài liệu này lưu trữ các luồng nghiệp vụ và luồng hệ thống cốt lõi đã được chốt của dự án Smart Grocery. Tài liệu sẽ được cập nhật liên tục khi có luồng mới được phê duyệt.*

---

## 1. Luồng Khởi tạo Hệ thống & Database (Đã hoàn thành)
- **Mục tiêu:** Đồng bộ môi trường phát triển (DB, Server) cho toàn bộ team, tránh tình trạng xung đột môi trường.
- **Luồng hoạt động:**
  1. Developer chạy lệnh `docker compose up -d`.
  2. Docker khởi tạo container MySQL 8.0, thiết lập database `smart_grocery` tại cổng 3306.
  3. Khi Backend (Spring Boot) khởi động, công cụ **Flyway Migration** được kích hoạt.
  4. Flyway tự động quét thư mục `db/migration` và thực thi các file kịch bản `.sql` (VD: `V1__init_schema.sql`).
  5. Cấu trúc CSDL (các bảng, cột) được tạo/cập nhật tự động. Spring Boot kết nối thành công.

---

## 2. Luồng Xác thực & Phân quyền (Auth + JWT + RBAC) (Đã hoàn thành)
- **Mục tiêu:** Quản lý tài khoản, đăng nhập/đăng ký và bảo vệ các API bằng JWT (kiến trúc Stateless phù hợp với React).
- **Luồng hoạt động chi tiết:**

### A. Đăng ký (Register)
  1. Client gửi request `POST /api/auth/register` (Username, Email, Password, FullName).
  2. `AuthController` nhận request.
  3. Gọi `UserRepository` để kiểm tra trùng lặp Username hoặc Email.
  4. Sử dụng `BCryptPasswordEncoder` để băm (hash) mật khẩu.
  5. Tạo entity `User`, gán quyền mặc định là `ROLE_USER` và lưu xuống DB.

### B. Đăng nhập (Login)
  1. Client gửi request `POST /api/auth/login` (Username, Password).
  2. `AuthenticationManager` của Spring Security tiếp nhận.
  3. Gọi `UserDetailsServiceImpl` để truy vấn CSDL lấy thông tin User đã lưu.
  4. Nếu mật khẩu khớp, `JwtUtils` sẽ tạo ra một chuỗi **JWT (JSON Web Token)**.
  5. Trả về cho Client chuỗi JWT kèm thông tin cơ bản của User.

### C. Truy cập API được bảo vệ (Authorization)
  1. Client gọi các API nghiệp vụ (VD: Xem giỏ hàng), bắt buộc đính kèm header: `Authorization: Bearer <jwt_token>`.
  2. Request bị chặn bởi tấm khiên `AuthTokenFilter`.
  3. Filter bóc tách chuỗi token, giao cho `JwtUtils` kiểm tra chữ ký số và hạn sử dụng.
  4. Nếu Token giả hoặc hết hạn: `AuthEntryPointJwt` chặn đứng và trả về lỗi `401 Unauthorized`.
  5. Nếu Token hợp lệ: Trích xuất Username/Role, đưa vào `SecurityContext` và cho phép request đi tiếp vào Controller xử lý logic.

---

## 3. Luồng Quản lý Hồ sơ & Người dùng (User/Profile API) (Đã hoàn thành)
- **Mục tiêu:** Cung cấp API cho người dùng tự quản lý thông tin giao hàng cá nhân và API cho Admin quản lý hệ thống tài khoản.
- **Luồng hoạt động chi tiết:**

### A. Người dùng tự quản lý hồ sơ (Role: USER/ADMIN)
  1. **Xem hồ sơ (`GET /api/users/profile`):**
     - Client gửi request mang theo JWT.
     - Hệ thống bóc tách người dùng trực tiếp từ JWT (SecurityContext) -> Không cần truyền ID trên URL để tránh lỗ hổng IDOR.
     - Trả về thông tin hồ sơ (ẩn Password), gồm `role` và `enabled`.
  2. **Cập nhật hồ sơ (`PUT /api/users/profile`):**
     - Dữ liệu cho phép sửa: `fullName`, `phone`, `address`.
     - Không cho phép sửa `username` và `email` thông qua API này.

### B. Admin quản lý người dùng (Role: ADMIN)
  1. **Xem danh sách toàn bộ người dùng (`GET /api/users`):**
     - Hệ thống kiểm tra Role từ JWT. Nếu không phải `ROLE_ADMIN` -> Trả về `403 Forbidden`.
     - Trả về mảng danh sách người dùng (không gồm password).
  2. **Vô hiệu hóa người dùng (`DELETE /api/users/{id}`):**
     - Chỉ `ROLE_ADMIN` được gọi. Admin không thể tự vô hiệu hóa chính mình.
     - Tài khoản bị chuyển `enabled = false` (không xóa cứng) để giữ lịch sử đơn hàng.
     - User bị vô hiệu hóa không đăng nhập được.
  3. **Cập nhật trạng thái (`PATCH /api/users/{id}/status`):**
     - Body: `{ "enabled": true | false }` để vô hiệu hóa hoặc kích hoạt lại tài khoản.
     - Admin không thể đổi trạng thái của chính mình.

## Luồng 4: Quản lý Giỏ hàng (Cart API) (Đã hoàn thành)
- **Mục tiêu:** Chức năng cho phép User thêm/sửa/xóa sản phẩm trong giỏ hàng.
- **Thành phần:** `Cart`, `CartItem` Entities.
- **Bảo mật:** Lấy ID User từ JWT (thông qua `Authentication.getName()`) để tránh IDOR. Tự động cộng dồn số lượng nếu sản phẩm đã có.

## Luồng 5: Đặt Hàng & Checkout (Order API) (Đã hoàn thành)
- **Mục tiêu:** Chốt đơn hàng từ Giỏ hàng sang Đơn hàng, quản lý tồn kho và lịch sử mua hàng.
- **Đặc tả logic:** Không tích hợp cổng thanh toán phức tạp (trả tiền mặt khi nhận hàng/thanh toán nội bộ).
- **Quy trình `@Transactional`:**
  1. Lấy toàn bộ CartItem của User.
  2. Kiểm tra tồn kho trong bảng `inventory`. Nếu không đủ -> Rollback, báo lỗi.
  3. Trừ tồn kho tương ứng.
  4. Tạo bản ghi bảng `orders` (trạng thái PENDING) và các `order_items`.
  5. Xóa sạch giỏ hàng.

## Luồng 6: Tích hợp AI Gợi ý mua hàng (AI Service) (Đã hoàn thành)
- **Mục tiêu:** Gợi ý các sản phẩm đến chu kỳ cần mua tiếp theo (bổ sung kho) hoặc top sản phẩm bán chạy.
- **Kiến trúc:** Microservices kết hợp.
  - Java Backend (Port 8080): Chứa Core API, DB MySQL.
  - Python FastAPI (Port 8000): Chạy Machine Learning Model.
- **Quy trình:**
  1. User gọi `POST /api/ai/refresh` (Từ Frontend).
  2. Java truy vấn toàn bộ lịch sử mua hàng (bảng `purchase_history`), gom nhóm theo sản phẩm. Lọc ra các sản phẩm mua từ 2 lần trở lên.
  3. Dùng `WebClient` (CompletableFuture) gọi **song song** sang Python API (`/api/ai/predict`) cho từng sản phẩm để tránh nghẽn.
  4. Lưu kết quả từ Python trả về vào DB (`ai_predictions`) và clear lịch sử cũ.
- **Fallback (Chống lỗi):** Nếu Python Server sập, hoặc User không đủ data, Java sẽ tự động query TOP 5 sản phẩm bán chạy nhất từ `purchase_history` để trả về (Dạng Recommendation).

## Luồng 7: Khách hàng thân thiết (Loyalty Module) (Đang triển khai)
- **Mục tiêu:** Tích điểm mua hàng và thăng hạng thành viên.
- **Thành phần:** `LoyaltyAccount`, `LoyaltyTransaction`.
- **Bộ quy tắc (Reward Rules):**
  - **Tích điểm:** 10,000 VNĐ chi tiêu = 1 Điểm.
  - **Hạng (Tier):** MEMBER (mặc định), SILVER (Đạt tổng chi tiêu 5.000.000đ), GOLD (Đạt 20.000.000đ).
  - **Quà thăng hạng:** Tặng 50đ khi lên SILVER, 200đ khi lên GOLD.
- **Cơ chế:** Ví điểm được tự động tạo ngầm (Auto-provision) khi user lần đầu gọi API xem điểm, tránh lỗi null. Điểm và hạng tự động được tính toán dựa trên tổng chi tiêu.
