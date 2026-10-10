import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }

    setLoading(true);

    try {
      const result = await login(username, password);

      if (!result.success) {
        setError(result.message);
        return;
      }

      navigate("/", { replace: true });
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
          <span className="auth-eyebrow"></span>

          <h1>Đăng nhập</h1>

          <p>
            Chào mừng bạn quay lại Smart Grocery. Đăng nhập để tiếp tục mua sắm.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-username">Tên đăng nhập</label>

          <input
            id="login-username"
            type="text"
            placeholder="Nhập tên đăng nhập"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="login-password">Mật khẩu</label>

          <input
            id="login-password"
            type="password"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          <div className="login-forgot">
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-primary auth-submit"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="auth-switch">
          <span>Chưa có tài khoản?</span>
          <Link to="/register">Đăng ký ngay</Link>
        </div>

        <button
          type="button"
          className="admin-login-link"
          onClick={() => navigate("/admin/login")}
        >
          🔐 Đăng nhập dành cho Admin
        </button>
      </div>
    </div>
  );
}
