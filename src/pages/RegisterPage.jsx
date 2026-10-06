
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    setError("");

    // Kiểm tra bỏ trống
    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError(
        "Vui lòng nhập đầy đủ thông tin."
      );
      return;
    }

    // Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
      setError(
        "Mật khẩu phải có ít nhất 6 ký tự."
      );
      return;
    }

    // Kiểm tra mật khẩu xác nhận
    if (password !== confirmPassword) {
      setError(
        "Mật khẩu xác nhận không khớp."
      );
      return;
    }

    // Gọi chức năng đăng ký
    const result = register(
      name,
      email,
      password
    );

    // Đăng ký thất bại
    if (!result.success) {
      setError(result.message);
      return;
    }

    // Đăng ký thành công
    navigate("/login", {
      replace: true,
    });
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
            CREATE ACCOUNT
          </span>

          <h1>Đăng ký</h1>

          <p>
            Tạo tài khoản Smart Grocery để bắt đầu
            mua sắm các sản phẩm yêu thích.
          </p>
        </div>

        {/* Form */}
        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          {/* Họ tên */}
          <label htmlFor="register-name">
            Họ và tên
          </label>

          <input
            id="register-name"
            type="text"
            placeholder="Nhập họ và tên"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            autoComplete="name"
          />

          {/* Email */}
          <label htmlFor="register-email">
            Email
          </label>

          <input
            id="register-email"
            type="email"
            placeholder="Nhập email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            autoComplete="email"
          />

          {/* Mật khẩu */}
          <label htmlFor="register-password">
            Mật khẩu
          </label>

          <input
            id="register-password"
            type="password"
            placeholder="Tạo mật khẩu"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            autoComplete="new-password"
          />

          {/* Xác nhận mật khẩu */}
          <label htmlFor="register-confirm-password">
            Xác nhận mật khẩu
          </label>

          <input
            id="register-confirm-password"
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            autoComplete="new-password"
          />

          {/* Lỗi */}
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {/* Nút đăng ký */}
          <button
            type="submit"
            className="auth-primary auth-submit"
          >
            Tạo tài khoản
          </button>
        </form>

        {/* Đăng nhập */}
        <div className="auth-switch">
          Đã có tài khoản?{" "}
          <Link to="/login">
            Đăng nhập
          </Link>
        </div>

        {/* Quay lại */}
        <Link
          to="/login"
          className="back-home"
        >
          ← Quay lại đăng nhập
        </Link>

      </div>
    </div>
  );
}
