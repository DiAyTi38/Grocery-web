import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (
      !name.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (username.trim().length < 3) {
      setError("Tên đăng nhập phải có ít nhất 3 ký tự.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      const result = await register(name, email, password, username);

      if (!result.success) {
        setError(result.message);
        return;
      }

      navigate("/login", {
        replace: true,
        state: {
          message: "Đăng ký thành công! Hãy đăng nhập để tiếp tục.",
        },
      });
    } catch {
      setError("Không thể đăng ký. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/login" className="auth-brand">
          🛒 Smart Grocery
        </Link>

        <div className="auth-heading">
          <span className="auth-eyebrow">CREATE ACCOUNT</span>

          <h1>Đăng ký</h1>

          <p>
            Tạo tài khoản Smart Grocery để bắt đầu mua sắm các sản phẩm yêu
            thích.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="register-name">Họ và tên</label>

          <input
            id="register-name"
            type="text"
            placeholder="Nhập họ và tên"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
          />

          <label htmlFor="register-username">Tên đăng nhập</label>

          <input
            id="register-username"
            type="text"
            placeholder="Ví dụ: cuong123"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            minLength={3}
            maxLength={50}
            required
          />

          <label htmlFor="register-email">Email</label>

          <input
            id="register-email"
            type="email"
            placeholder="Nhập email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="register-password">Mật khẩu</label>

          <div className="password-input-wrapper">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              placeholder="Tạo mật khẩu"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={6}
              disabled={loading}
              required
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              tabIndex={-1}
              disabled={loading}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              )}
            </button>
          </div>

          <label htmlFor="register-confirm-password">Xác nhận mật khẩu</label>

          <div className="password-input-wrapper">
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              disabled={loading}
              required
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              tabIndex={-1}
              disabled={loading}
            >
              {showConfirmPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              )}
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-primary auth-submit"
            disabled={loading}
          >
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>
        </form>

        <div className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </div>

        <Link to="/login" className="back-home">
          ← Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
