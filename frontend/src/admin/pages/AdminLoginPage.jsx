import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function AdminLoginPage() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await adminLogin(username, password);

      if (!result.success) {
        setError(result.message);
        return;
      }

      navigate("/admin");
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* LOGO */}
        <Link to="/admin/login" className="auth-brand">
          🛒 Smart Grocery
        </Link>

        {/* TIÊU ĐỀ */}
        <div className="auth-heading">
          <span className="auth-eyebrow">ADMIN</span>

          <h1>Đăng nhập Quản trị</h1>

          <p>Khu vực dành riêng cho Quản trị viên hệ thống.</p>
        </div>

        {/* FORM */}
        <form className="auth-form" onSubmit={handleLogin}>
          <label htmlFor="admin-username">Username Quản trị viên</label>

          <input
            id="admin-username"
            type="text"
            placeholder="Nhập username Admin"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            disabled={loading}
            required
          />

          <label htmlFor="admin-password">Mật khẩu</label>

          <div className="password-input-wrapper">
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu Admin"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
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
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
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
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
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
            {loading ? "Đang xác thực..." : "Đăng nhập Admin"}
          </button>
        </form>

        {/* QUAY VỀ ĐĂNG NHẬP KHÁCH HÀNG */}
        <div className="auth-switch">
          <span>Không phải Admin?</span>

          <Link to="/login">Đăng nhập khách hàng</Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;
