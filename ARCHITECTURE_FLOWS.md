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

## Luồng 6: Tích hợp AI Gợi ý mua hàng (AI Service) (Đã hoàn thành & Tối ưu hóa)
- **Mục tiêu:** Gợi ý các sản phẩm đến chu kỳ cần mua tiếp theo (bổ sung kho) hoặc top sản phẩm bán chạy.
- **Kiến trúc:** Microservices kết hợp.
  - Java Backend (Port 8080): Chứa Core API, DB MySQL, WebClient Reactive Client.
  - Python FastAPI (Port 8000): Chạy Machine Learning Model (Random Forest suy luận chu kỳ và độ tin cậy động).
- **Quy trình:**
  1. User gọi `POST /api/ai/refresh` (Từ Frontend).
  2. Java truy vấn toàn bộ lịch sử mua hàng (bảng `purchase_history`), gom nhóm theo sản phẩm. Lọc ra các sản phẩm mua từ 2 lần trở lên, trích xuất đặc trưng `categoryType` và `reminderIntervalDays` động từ danh mục.
  3. **Gọi song song Non-blocking Reactive (`AiServiceClient.predictParallel`):**
     - Sử dụng `Flux.fromIterable(requests).flatMap(..., concurrency = 8)` chạy trực tiếp trên Netty EventLoop.
     - **Triệt tiêu lỗi Thread Starvation:** Tuyệt đối không dùng `CompletableFuture.supplyAsync()` vì ngầm định chiếm dụng `ForkJoinPool.commonPool()` của toàn bộ JVM cho tác vụ Blocking Network I/O.
     - **Kiểm soát tải (Throttling):** Giới hạn tối đa 8 requests đồng thời sang Python FastAPI để tránh nghẽn socket.
     - **Khả năng chịu lỗi (Fault-Tolerance):** Mỗi request có timeout 5s, nếu 1 sản phẩm gặp lỗi/timeout sẽ được bắt qua `onErrorResume` và bỏ qua, không làm gián đoạn các sản phẩm thành công còn lại.
  4. Lưu kết quả từ Python trả về vào DB (`ai_predictions`) với ràng buộc `UNIQUE (user_id, product_id)` chống trùng lặp dữ liệu (Flyway V10), và clear/cập nhật bản ghi tương ứng.
- **Kiểm soát Trạng thái Sản phẩm (Active/Inactive Enforcement):**
  - *Luồng Cache (`getRecommendations`):* Query `findAllByUserIdOrderByConfidenceDesc` ràng buộc `p.active = TRUE`, đảm bảo sản phẩm đã ngừng kinh doanh (inactive) không bao giờ hiển thị trên UI gợi ý của người dùng.
  - *Luồng Làm mới (`refreshPredictions`):* Lọc bỏ hoàn toàn các sản phẩm `p.active = false` trước khi phân nhóm và gửi sang AI, tránh lãng phí tài nguyên suy luận của mô hình cho mặt hàng không thể bán.

- **Cơ chế Fallback Đa tầng (Cascading Fallback Architecture):**
  Khi xảy ra sự cố hoặc người dùng thiếu dữ liệu, hệ thống tự động kích hoạt Fallback theo các cấp độ:

  1. **Fallback Cấp Sản phẩm (Per-Product Fallback):**
     - Áp dụng khi Python AI sập cho 1 mặt hàng cụ thể, hoặc sản phẩm chỉ mới mua 1 lần (< 2 đơn hàng).
     - Hệ thống tự động chuyển sang thuật toán nội tại Java (`calculateNextReplenishmentDate`), tính toán chu kỳ dựa trên `reminderIntervalDays` động của danh mục (Ví dụ: Rau củ 3 ngày, Đồ khô 14 ngày).

  2. **Fallback Cấp Hệ thống (System-Wide Fallback - `getFallbackTopSelling`):**
     - **Điều kiện kích hoạt:**
       - Người dùng mới chưa từng có lịch sử mua hàng (Cold Start tuyệt đối).
       - Người dùng từng mua hàng nhưng toàn bộ mặt hàng đó đã bị vô hiệu hóa (`active = false`).
       - Dịch vụ Python AI sập (`healthCheck() == false`) hoặc timeout mạng > 10s.
     - **Quy trình xử lý 2 tầng (Two-Tier Cascading):**
       - **Tầng 1 (Best-selling Active Products):**
         - Truy vấn `purchase_history` bằng SQL Native tối ưu:
           ```sql
           SELECT ph.product_id, SUM(ph.quantity) AS total_qty
           FROM purchase_history ph
           INNER JOIN products p ON ph.product_id = p.id
           WHERE p.active = 1
           GROUP BY ph.product_id
           ORDER BY total_qty DESC
           LIMIT :limit
           ```
         - Ràng buộc `p.active = 1` được thực thi trực tiếp tại MySQL. Điều này giải quyết triệt để lỗi hụt số lượng (nếu lọc bằng Java sau khi `LIMIT 5`, danh sách có thể bị rớt xuống còn 2-3 sản phẩm hoặc 0 sản phẩm nếu các mặt hàng bán chạy nhất lịch sử đã ngừng bán).
         - Kiểm tra an toàn lớp hai: `product != null && product.isActive()`.
       - **Tầng 2 (Catalog Active Supplemental - Chống cạn kiệt Cold Start):**
         - Nếu kết quả Tầng 1 trả về `< 5` sản phẩm (do hệ thống mới khởi tạo hoặc ít giao dịch), hệ thống tự động gọi `productRepository.findTop5ByActiveTrueOrderByIdDesc()` để lấy các sản phẩm active mới nhất trong kho hàng.
         - Sử dụng cấu trúc `Set<Long> productIds` để **khử trùng lặp (Deduplication)**, lần lượt bù đắp các sản phẩm active mới vào danh sách cho đến khi đủ 5 sản phẩm.
     - **Quy chuẩn DTO Fallback trả về:**
       - `predictedNextDate = LocalDate.now().plusDays(7)`
       - `predictedDays = 7.0`
       - `confidence = 0.5` (Độ tin cậy mức trung bình)
       - `type = "RECOMMENDATION"` (Phân biệt rõ với type `"REPLENISHMENT"` do AI cá nhân hóa).

- **Bộ 3 Quy tắc Xử lý Hạn dùng & Quá hạn Dự báo (Staleness & Overdue Triple-Layer Policy):**
  Khi ngày dự kiến mua lại (`predictedNextDate`) trôi về quá khứ so với thời gian thực tế (`LocalDate.now()`), hệ thống áp dụng cơ chế 3 tầng xử lý:

  1. **Quy tắc 1 (Overdue Cut-off Threshold):**
     - Thiết lập ngưỡng cắt `MAX_OVERDUE_DAYS = 7`.
     - Nếu một sản phẩm đã quá hạn dự kiến vượt quá 7 ngày (`predictedDays < -7`), sản phẩm đó bị coi là **thói quen tiêu dùng đã chấm dứt (Churned Habit)** và bị loại bỏ hoàn toàn khỏi khối "Nhắc mua lại định kỳ". Không bao giờ hiển thị các con số ngày âm sâu phi lý (`-30 ngày`, `-60 ngày`) lên giao diện người dùng.

  2. **Quy tắc 2 (Time-Decay Penalty on Confidence):**
     - Xử lý trực tiếp tại tầng chuyển đổi DTO của Backend (`toDto`) để bảo đảm tính **thời gian thực tuyệt đối**:
       $$\text{Confidence}_{\text{hiệu lực}} = \text{Base Confidence} \times \max\left(0, 1 - \frac{|\text{predictedDays}|}{7.0}\right)$$
     - Khi sản phẩm trễ từ 1 đến 7 ngày, độ tin cậy bị khấu trừ tuyến tính theo từng ngày trôi qua (Badge UI tự động chuyển dần từ xanh lá $\rightarrow$ xanh dương $\rightarrow$ cam hổ phách).

  3. **Quy tắc 3 (Fallback Replacement & Quản lý vòng đời):**
     - Khi các sản phẩm quá hạn bị loại bỏ khiến danh sách gợi ý còn ít hơn 5 sản phẩm, hệ thống tự động kích hoạt Fallback Đa tầng để bù đắp các sản phẩm bán chạy đang hoạt động (Top-Selling Active) vào danh sách, đảm bảo khách hàng luôn nhận đủ 5 gợi ý chất lượng.
     - **Theo dõi thời gian cập nhật:** Bổ sung cột `updated_at TIMESTAMP` trên bảng `ai_predictions` (Flyway Migration V11) để theo dõi chính xác mốc thời gian cập nhật dự đoán gần nhất của từng bản ghi.

## Luồng 7: Khách hàng thân thiết (Loyalty Module) (Đang triển khai)
- **Mục tiêu:** Tích điểm mua hàng và thăng hạng thành viên.
- **Thành phần:** `LoyaltyAccount`, `LoyaltyTransaction`.
- **Bộ quy tắc (Reward Rules):**
  - **Tích điểm:** 10,000 VNĐ chi tiêu = 1 Điểm.
  - **Hạng (Tier):** MEMBER (mặc định), SILVER (Đạt tổng chi tiêu 5.000.000đ), GOLD (Đạt 20.000.000đ).
  - **Quà thăng hạng:** Tặng 50đ khi lên SILVER, 200đ khi lên GOLD.
- **Cơ chế:** Ví điểm được tự động tạo ngầm (Auto-provision) khi user lần đầu gọi API xem điểm, tránh lỗi null. Điểm và hạng tự động được tính toán dựa trên tổng chi tiêu.
