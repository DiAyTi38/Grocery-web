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
  const isAdmin = sessionStorage.getItem("smart-grocery-admin") === "true";

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
            GIAI ĐOẠN 1
            ADMIN - ĐĂNG NHẬP
            Không cần Customer đăng nhập
        ================================================== */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* ==================================================
            GIAI ĐOẠN 2
            ADMIN - DASHBOARD
        ================================================== */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminDashboardPage />
            </AdminProtectedRoute>
          }
        />

        {/* ==================================================
            GIAI ĐOẠN 3
            QUẢN LÝ TÀI KHOẢN
        ================================================== */}
        <Route
          path="/admin/users"
          element={
            <AdminProtectedRoute>
              <AdminUsersPage />
            </AdminProtectedRoute>
          }
        />

        {/* ==================================================
            GIAI ĐOẠN 4
            QUẢN LÝ ĐIỂM
        ================================================== */}
        <Route
          path="/admin/points"
          element={
            <AdminProtectedRoute>
              <AdminPointsPage />
            </AdminProtectedRoute>
          }
        />

        {/* ==================================================
            GIAI ĐOẠN 5
            QUẢN LÝ SẢN PHẨM
        ================================================== */}
        <Route
          path="/admin/products"
          element={
            <AdminProtectedRoute>
              <AdminProductsPage />
            </AdminProtectedRoute>
          }
        />

        {/* ==================================================
            GIAI ĐOẠN 6
            QUẢN LÝ DANH MỤC
        ================================================== */}
        <Route
          path="/admin/categories"
          element={
            <AdminProtectedRoute>
              <AdminCategoriesPage />
            </AdminProtectedRoute>
          }
        />

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
