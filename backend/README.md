# Hướng Dẫn Khởi Chạy Backend (Spring Boot) Bằng Terminal

Tài liệu hướng dẫn khởi chạy dịch vụ Backend cho dự án Smart Grocery trực tiếp từ Terminal (Dòng lệnh).

---

## 1. Yêu cầu tiên quyết
- Đã cài đặt **Java 17+** (Kiểm tra: `java -version`).
- Container MySQL đang chạy (Kiểm tra: `docker ps`).

---

## 2. Các lệnh khởi chạy Backend từ Terminal

### Cách 1: Chạy trực tiếp bằng Maven Wrapper (Khuyên dùng cho phát triển)
Mở Terminal tại thư mục `backend` và chạy lệnh:

- **Trên macOS / Linux:**
  ```bash
  ./mvnw spring-boot:run
  ```

- **Trên Windows (Command Prompt / PowerShell):**
  ```cmd
  mvnw.cmd spring-boot:run
  ```

*Ghi chú: Lệnh này sẽ tự động tải các dependencies cần thiết, biên dịch mã nguồn và khởi động Spring Boot trên cổng `8080` với tính năng Spring DevTools (tự reload).*

---

### Cách 2: Đóng gói thành file JAR rồi chạy (Môi trường Production/Thực tế)

1. **Biên dịch và đóng gói (bỏ qua unit tests nếu cần chạy nhanh):**
   ```bash
   ./mvnw clean package -DskipTests
   ```

2. **Chạy file JAR vừa tạo:**
   ```bash
   java -jar target/grocery-backend-0.0.1-SNAPSHOT.jar
   ```

---

### Cách 3: Chạy toàn bộ qua Docker Compose
Nếu muốn chạy cả MySQL và Backend cùng lúc trong container:
```bash
docker compose up --build -d
```
Xem log của Backend đang chạy:
```bash
docker compose logs -f backend
```

---

## 3. Kiểm tra Backend đã chạy thành công hay chưa
Sau khi chạy một trong các lệnh trên, hãy mở trình duyệt hoặc Terminal để kiểm tra:
- **Kiểm tra API Danh mục:**
  ```bash
  curl http://localhost:8080/api/categories
  ```
  *(Nếu trả về mã JSON danh sách sản phẩm/danh mục là Backend đã sẵn sàng 100%).*
