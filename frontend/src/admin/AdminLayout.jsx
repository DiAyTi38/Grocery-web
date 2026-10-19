import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MENU_ITEMS = [
  { path: "/admin", label: "Tổng quan", icon: "📊" },
  { path: "/admin/orders", label: "Quản lý đơn hàng", icon: "📋" },
  { path: "/admin/users", label: "Quản lý tài khoản", icon: "👥" },
  { path: "/admin/points", label: "Quản lý tích điểm", icon: "⭐" },
  { path: "/admin/products", label: "Quản lý sản phẩm", icon: "📦" },
  { path: "/admin/categories", label: "Quản lý danh mục", icon: "🗂️" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    sessionStorage.removeItem("smart-grocery-admin");
    navigate("/admin/login", { replace: true });
  }

  const isItemActive = (path) => {
    if (path === "/admin") {
      return location.pathname === "/admin" || location.pathname === "/admin/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-shell">
      {/* ==================================================
          SIDEBAR CỐ ĐỊNH
      ================================================== */}
      <aside className="admin-shell__sidebar">
        {/* LOGO */}
        <div
          className="admin-shell__logo"
          onClick={() => navigate("/admin")}
          role="button"
          tabIndex={0}
        >
          🛒 Smart Grocery
        </div>

        {/* NHÃN ADMIN */}
        <div className="admin-shell__label">ADMIN</div>

        {/* DANH SÁCH MENU */}
        <nav className="admin-shell__nav">
          {MENU_ITEMS.map((item) => {
            const active = isItemActive(item.path);
            return (
              <button
                key={item.path}
                type="button"
                className={`admin-shell__item ${active ? "admin-shell__item--active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <span className="admin-shell__item-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ĐĂNG XUẤT */}
        <button
          type="button"
          className="admin-shell__logout"
          onClick={handleLogout}
        >
          🚪 Đăng xuất
        </button>
      </aside>

      {/* ==================================================
          NỘI DUNG CHÍNH (THAY ĐỔI THEO MENU ĐƯỢC CHỌN)
      ================================================== */}
      <div className="admin-shell__content">
        <Outlet />
      </div>
    </div>
  );
}
