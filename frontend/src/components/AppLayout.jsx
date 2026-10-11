
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="app-shell">
      <header className="shell-header">
        <Link to="/" className="shell-brand">
          <span className="shell-brand-icon">🛒</span>
          <span>
            <strong>Smart Grocery</strong>
            <small>GROCERY STORE</small>
          </span>
        </Link>

        <nav className="shell-nav">
          <NavLink to="/" end>
            Trang chủ
          </NavLink>
          <a href="/#categories">Danh mục</a>
          <a href="/#products">Sản phẩm</a>
        </nav>

        <div className="shell-account">
          {user ? (
            <>
              <span className="account-name">Xin chào, {user.name}</span>
              <button className="shell-button" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link className="shell-login" to="/login">
                Đăng nhập
              </Link>
              <Link className="shell-button" to="/register">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="shell-content">
        <Outlet />
      </main>

      <footer className="shell-footer">
        © 2026 Smart Grocery · Mua sắm tiện lợi mỗi ngày
      </footer>
    </div>
  );
}
