import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const API_BASE_URL = "http://localhost:8081/api";

// Gọi API đăng nhập và đăng ký.
async function postAuth(path, body) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "Kết nối backend quá thời gian chờ. Hãy kiểm tra backend cổng 8081.",
      );
    }

    throw new Error(
      "Không thể kết nối backend. Hãy kiểm tra backend cổng 8081.",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message ||
          data?.error ||
          `Yêu cầu thất bại (HTTP ${response.status})`;

    throw new Error(message);
  }

  return data;
}

// Gọi API cần đăng nhập bằng JWT.
async function adminRequest(path, token, options = {}) {
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Không thể kết nối backend. Hãy kiểm tra backend cổng 8081.",
    );
  }

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message ||
          data?.error ||
          `Yêu cầu thất bại (HTTP ${response.status})`;

    throw new Error(message);
  }

  return data;
}

// Xếp hạng theo tổng số tiền mua hàng.
function getLoyaltyTier(totalSpent = 0) {
  const amount = Number(totalSpent) || 0;

  if (amount >= 5000000) {
    return {
      name: "Kim cương",
      key: "diamond",
      min: 5000000,
      max: null,
      icon: "💎",
    };
  }

  if (amount >= 2000000) {
    return {
      name: "Vàng",
      key: "gold",
      min: 2000000,
      max: 5000000,
      icon: "🥇",
    };
  }

  if (amount >= 500000) {
    return {
      name: "Bạc",
      key: "silver",
      min: 500000,
      max: 2000000,
      icon: "🥈",
    };
  }

  return {
    name: "Chưa xếp hạng",
    key: "none",
    min: 0,
    max: 500000,
    icon: "⭐",
  };
}

export function AuthProvider({ children }) {
  // Không lưu phiên đăng nhập vào localStorage.
  // Tải lại trang sẽ yêu cầu đăng nhập lại.
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  function buildCurrentUser(account) {
    const totalSpent = Number(account.totalSpent) || 0;

    return {
      id: account.id,
      username: account.username || "",
      name: account.name || account.fullName || account.username || "",
      email: account.email || "",
      role: account.role || "ROLE_USER",
      avatar: account.avatar || "",
      gender: account.gender || "",
      birthDate: account.birthDate || "",
      phone: account.phone || "",
      totalSpent,
      loyaltyTier: getLoyaltyTier(totalSpent),
    };
  }

  // ĐĂNG KÝ.
  async function register(name, email, password, username) {
    const cleanName = String(name || "").trim();
    const cleanUsername = String(username || "").trim();
    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!cleanName) {
      return {
        success: false,
        message: "Vui lòng nhập họ và tên.",
      };
    }

    if (cleanUsername.length < 3) {
      return {
        success: false,
        message: "Tên đăng nhập phải có ít nhất 3 ký tự.",
      };
    }

    if (!cleanEmail) {
      return {
        success: false,
        message: "Vui lòng nhập email.",
      };
    }

    if (!password || password.length < 6) {
      return {
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự.",
      };
    }

    try {
      const result = await postAuth("register", {
        username: cleanUsername,
        email: cleanEmail,
        password,
        fullName: cleanName,
      });

      return {
        success: true,
        message: typeof result === "string" ? result : "Đăng ký thành công.",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Không thể đăng ký tài khoản.",
      };
    }
  }

  // ĐĂNG NHẬP.
  async function login(username, password) {
    const cleanUsername = String(username || "").trim();

    if (!cleanUsername || !password) {
      return {
        success: false,
        message: "Vui lòng nhập tên đăng nhập và mật khẩu.",
      };
    }

    try {
      const result = await postAuth("login", {
        username: cleanUsername,
        password,
      });

      if (!result?.token) {
        return {
          success: false,
          message: "Backend không trả về JWT token.",
        };
      }

      const currentUser = buildCurrentUser({
        id: result.id,
        username: result.username || cleanUsername,
        name: result.fullName || result.username || cleanUsername,
        email: result.email,
        role: result.role,
        phone: result.phone,
      });

      setToken(result.token);
      setUser(currentUser);

      return {
        success: true,
        user: currentUser,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Tên đăng nhập hoặc mật khẩu không đúng.",
      };
    }
  }

  // ĐĂNG XUẤT.
  function logout() {
    setUser(null);
    setToken(null);
  }

  // ==============================
  // QUẢN LÝ TÀI KHOẢN ADMIN
  // ==============================

  // Lấy danh sách tài khoản từ MySQL qua backend.
  async function getAdminUsers() {
    return adminRequest("/users", token);
  }

  // Khóa hoặc mở khóa tài khoản và lưu vào database.
  async function updateAdminUserStatus(id, enabled) {
    return adminRequest(`/users/${id}/status`, token, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });
  }

  // Lấy thông tin hồ sơ khách hàng.
  async function fetchProfile() {
    return adminRequest("/users/profile", token);
  }

  // Các chức năng này cần API backend tương ứng.
  async function resetPassword() {
    return {
      success: false,
      message: "Chức năng quên mật khẩu cần được bổ sung API ở backend.",
    };
  }

  async function changePassword() {
    return {
      success: false,
      message: "Chức năng đổi mật khẩu cần được bổ sung API ở backend.",
    };
  }

  async function updateProfile() {
    return {
      success: false,
      message: "Chức năng cập nhật hồ sơ cần được bổ sung API ở backend.",
    };
  }

  // Tạm tính tổng chi tiêu trong phiên hiện tại.
  // Chưa lưu điểm vào MySQL.
  function addSpent(amount) {
    if (!user) {
      return {
        success: false,
        message: "Bạn chưa đăng nhập.",
      };
    }

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      return {
        success: false,
        message: "Số tiền tích điểm không hợp lệ.",
      };
    }

    const updatedUser = buildCurrentUser({
      ...user,
      totalSpent: user.totalSpent + value,
    });

    setUser(updatedUser);

    return {
      success: true,
      message: "Đã cập nhật trong phiên hiện tại.",
      user: updatedUser,
    };
  }

  function getUserLoyaltyTier() {
    return getLoyaltyTier(user?.totalSpent || 0);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        resetPassword,
        changePassword,
        updateProfile,
        addSpent,
        getUserLoyaltyTier,

        // Các hàm quản trị mới.
        getAdminUsers,
        updateAdminUserStatus,
        fetchProfile,

        isAuthenticated: Boolean(user && token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
