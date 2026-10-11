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

          <input
            id="register-password"
            type="password"
            placeholder="Tạo mật khẩu"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />

          <label htmlFor="register-confirm-password">Xác nhận mật khẩu</label>

          <input
            id="register-confirm-password"
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
          />

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
