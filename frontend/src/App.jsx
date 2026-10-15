import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

// ==================================================
// CUSTOMER PAGES
// ==================================================
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import ProductDetailPage from "./pages/ProductDetailPage";

// ==================================================
// ADMIN PAGES
// ==================================================
import AdminLoginPage from "./admin/pages/AdminLoginPage";
import AdminDashboardPage from "./admin/pages/AdminDashboardPage";
import AdminUsersPage from "./admin/pages/AdminUsersPage";
import AdminPointsPage from "./admin/pages/AdminPointsPage";
import AdminProductsPage from "./admin/pages/AdminProductsPage";
import AdminCategoriesPage from "./admin/pages/AdminCategoriesPage";
import AdminOrdersPage from "./admin/pages/AdminOrdersPage";
import AdminLayout from "./admin/AdminLayout";

// ==================================================
// ADMIN CSS
// ==================================================
import "./admin/Admin.css";

// ==================================================
// CUSTOMER
// BẢO VỆ TRANG CẦN ĐĂNG NHẬP
// ==================================================
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ==================================================
// CUSTOMER
// CHỈ CHO NGƯỜI CHƯA ĐĂNG NHẬP
// ==================================================
function GuestRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ==================================================
// ADMIN
// BẢO VỆ CÁC TRANG ADMIN
// ==================================================
function AdminProtectedRoute({ children }) {
  const { user, token } = useAuth();
  const isAdmin =
    (sessionStorage.getItem("smart-grocery-admin") === "true" ||
      user?.isAdmin ||
      user?.role === "ROLE_ADMIN" ||
      user?.roles?.includes("ROLE_ADMIN")) &&
    Boolean(token);

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

// ==================================================
// ROUTER
// ==================================================
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==================================================
            ================= CUSTOMER ======================
            ================================================== */}

        {/* CUSTOMER - ĐĂNG NHẬP */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />

        {/* CUSTOMER - ĐĂNG KÝ */}
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />

        {/* CUSTOMER - QUÊN MẬT KHẨU */}
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />

        {/* CUSTOMER - TRANG CHỦ */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        {/* CUSTOMER - CHI TIẾT SẢN PHẨM */}
        <Route
          path="/product/:id"
          element={
            <ProtectedRoute>
              <ProductDetailPage />
            </ProtectedRoute>
          }
        />

        {/* CUSTOMER - TRANG CÁ NHÂN */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            ================= ADMIN =========================
            ================================================== */}

        {/* ==================================================
            ADMIN - ĐĂNG NHẬP
            Không cần Customer đăng nhập
        ================================================== */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* ==================================================
            ADMIN - KHU VỰC QUẢN TRỊ (MENU CỐ ĐỊNH GIỮ NGUYÊN)
        ================================================== */}
        <Route
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          {/* TỔNG QUAN */}
          <Route path="/admin" element={<AdminDashboardPage />} />

          {/* QUẢN LÝ ĐƠN HÀNG */}
          <Route path="/admin/orders" element={<AdminOrdersPage />} />

          {/* QUẢN LÝ TÀI KHOẢN */}
          <Route path="/admin/users" element={<AdminUsersPage />} />

          {/* QUẢN LÝ ĐIỂM */}
          <Route path="/admin/points" element={<AdminPointsPage />} />

          {/* QUẢN LÝ SẢN PHẨM */}
          <Route path="/admin/products" element={<AdminProductsPage />} />

          {/* QUẢN LÝ DANH MỤC */}
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
        </Route>

        {/* ==================================================
            404
        ================================================== */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

// ==================================================
// APP
// ==================================================
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
