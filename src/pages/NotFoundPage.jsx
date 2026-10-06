
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="not-found">

      {/* Icon */}
      <span>🔎</span>

      {/* Mã lỗi */}
      <h1>404</h1>

      {/* Tiêu đề */}
      <h2>
        Không tìm thấy trang
      </h2>

      {/* Mô tả */}
      <p>
        Đường dẫn bạn truy cập không tồn tại
        hoặc trang đã được di chuyển.
      </p>

      {/* Quay lại */}
      <Link
        to="/"
        className="auth-primary"
      >
        Quay lại trang chủ
      </Link>

    </section>
  );
}