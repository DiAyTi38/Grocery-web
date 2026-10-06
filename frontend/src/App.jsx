import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";


// ==================================================
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
// ROUTER
// ==================================================
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==============================
            ĐĂNG NHẬP
        ============================== */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />


        {/* ==============================
            ĐĂNG KÝ
        ============================== */}
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />


        {/* ==============================
            QUÊN MẬT KHẨU
        ============================== */}
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />


        {/* ==============================
            TRANG CHỦ
            BẮT BUỘC PHẢI ĐĂNG NHẬP
        ============================== */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />


        {/* ==============================
            404
        ============================== */}
        <Route
          path="*"
          element={<NotFoundPage />}
        />

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