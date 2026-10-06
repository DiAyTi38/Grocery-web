
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    setError("");

    // Kiểm tra dữ liệu
    if (!email.trim() || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    // Gọi chức năng đăng nhập từ AuthContext
    const result = login(email, password);

    // Đăng nhập thất bại
    if (!result.success) {
      setError(result.message);
      return;
    }

    // Đăng nhập thành công
    navigate("/", { replace: true });
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo */}
        <Link to="/login" className="auth-brand">
          🛒 Smart Grocery
        </Link>

        {/* Tiêu đề */}
        <div className="auth-heading">
          <span className="auth-eyebrow">
            GROCERY STORE
          </span>

          <h1>Đăng nhập</h1>

          <p>
            Chào mừng bạn quay lại Smart Grocery.
            Đăng nhập để tiếp tục mua sắm.
          </p>
        </div>

        {/* Form */}
        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          {/* Email */}
          <label htmlFor="login-email">
            Email
          </label>

          <input
            id="login-email"
            type="email"
            placeholder="Nhập email của bạn"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            autoComplete="email"
          />

          {/* Mật khẩu */}
          <label htmlFor="login-password">
            Mật khẩu
          </label>

          <input
            id="login-password"
            type="password"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            autoComplete="current-password"
          />

          {/* Quên mật khẩu */}
          <div style={{ textAlign: "right" }}>
            <Link
              to="/forgot-password"
              style={{
                color: "#08a66a",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {/* Nút đăng nhập */}
          <button
            type="submit"
            className="auth-primary auth-submit"
          >
            Đăng nhập
          </button>
        </form>

        {/* Đăng ký */}
        <div className="auth-switch">
          Chưa có tài khoản?{" "}
          <Link to="/register">
            Đăng ký ngay
          </Link>
        </div>

        {/* Quay lại */}
        <Link
          to="/"
          className="back-home"
        >
          ← Quay lại trang chủ
        </Link>

      </div>
    </div>
  );
}