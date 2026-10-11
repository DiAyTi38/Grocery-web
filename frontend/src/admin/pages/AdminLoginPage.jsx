import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AdminLoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(event) {
    event.preventDefault();

    setError("");

    // Tài khoản Admin demo
    const ADMIN_USERNAME = "admin";
    const ADMIN_EMAIL = "admin@smartgrocery.com";
    const ADMIN_PASSWORD = "admin123";

    // Cho phép đăng nhập bằng username hoặc email
    const loginInput = username.trim().toLowerCase();

    const isValidAccount =
      loginInput === ADMIN_USERNAME || loginInput === ADMIN_EMAIL;

    if (!isValidAccount || password !== ADMIN_PASSWORD) {
      setError("Username/email hoặc mật khẩu Admin không chính xác.");
      return;
    }

    // Lưu trạng thái đăng nhập Admin trong phiên hiện tại
    sessionStorage.setItem("smart-grocery-admin", "true");

    navigate("/admin");
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

          <h1>Đăng nhập</h1>

          <p>Đăng nhập vào khu vực quản trị Smart Grocery.</p>
        </div>

        {/* FORM */}
        <form className="auth-form" onSubmit={handleLogin}>
          <label htmlFor="admin-username">Username hoặc Email Admin</label>

          <input
            id="admin-username"
            type="text"
            placeholder="Nhập username hoặc email Admin"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="admin-password">Mật khẩu</label>

          <input
            id="admin-password"
            type="password"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-primary auth-submit">
            Đăng nhập Admin
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
