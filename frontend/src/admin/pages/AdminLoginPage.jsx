import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function AdminLoginPage() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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

          <input
            id="admin-password"
            type="password"
            placeholder="Nhập mật khẩu Admin"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            disabled={loading}
            required
          />

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
