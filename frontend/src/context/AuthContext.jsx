import { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "../services/api";

const AuthContext = createContext(null);


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
        "Kết nối backend quá thời gian chờ. Hãy kiểm tra backend cổng 8080.",
      );
    }

    throw new Error(
      "Không thể kết nối backend. Hãy kiểm tra backend cổng 8080.",
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
      "Không thể kết nối backend. Hãy kiểm tra backend cổng 8080.",
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

  if (amount >= 20000000) {
    return {
      name: "Vàng (GOLD)",
      key: "gold",
      min: 20000000,
      max: null,
      icon: "🥇",
    };
  }

  if (amount >= 5000000) {
    return {
      name: "Bạc (SILVER)",
      key: "silver",
      min: 5000000,
      max: 20000000,
      icon: "🥈",
    };
  }

  return {
    name: "Thành viên (MEMBER)",
    key: "member",
    min: 0,
    max: 5000000,
    icon: "⭐",
  };
}

export function AuthProvider({ children }) {
  // Khởi tạo phiên đăng nhập từ localStorage để khi F5 không bị văng
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("smart-grocery-user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("smart-grocery-token") || null;
  });

  function buildCurrentUser(account) {
    if (!account) return null;
    const totalSpent = Number(account.totalSpent) || 0;
    const roles = Array.isArray(account.roles)
      ? account.roles
      : [account.role || "ROLE_USER"];
    const role = roles.includes("ROLE_ADMIN")
      ? "ROLE_ADMIN"
      : account.role || "ROLE_USER";

    const avatar = account.avatarUrl || account.avatar || "";

    return {
      id: account.id,
      username: account.username || "",
      name: account.fullName || account.name || account.username || "",
      fullName: account.fullName || account.name || account.username || "",
      email: account.email || "",
      role: role,
      roles: roles,
      isAdmin: roles.includes("ROLE_ADMIN") || role === "ROLE_ADMIN",
      avatar: avatar,
      avatarUrl: avatar,
      gender: account.gender || "",
      birthDate: account.birthDate || "",
      phone: account.phone || "",
      address: account.address || "",
      totalSpent,
      loyaltyTier: getLoyaltyTier(totalSpent),
    };
  }

  // Tự động đồng bộ thông tin hồ sơ mới nhất từ CSDL khi khởi động hoặc F5
  useEffect(() => {
    if (!token) return;

    adminRequest("/users/profile", token)
      .then((profileData) => {
        if (profileData) {
          setUser((prev) => {
            const merged = buildCurrentUser({
              ...(prev || {}),
              ...profileData,
            });
            localStorage.setItem("smart-grocery-user", JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch((err) => {
        console.warn("Lỗi đồng bộ hồ sơ cá nhân:", err.message);
      });
  }, [token]);

  function saveSession(jwtToken, currentUser) {
    setToken(jwtToken);
    setUser(currentUser);
    localStorage.setItem("smart-grocery-token", jwtToken);
    localStorage.setItem("smart-grocery-user", JSON.stringify(currentUser));
    if (currentUser.isAdmin) {
      sessionStorage.setItem("smart-grocery-admin", "true");
    } else {
      sessionStorage.removeItem("smart-grocery-admin");
    }
  }

  // ĐĂNG KÝ
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

  // ĐĂNG NHẬP KHÁCH HÀNG
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
        roles: result.roles,
        role: result.role,
        phone: result.phone,
      });

      saveSession(result.token, currentUser);

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

  // ĐĂNG NHẬP ADMIN (Xác thực quyền ROLE_ADMIN thật từ Backend)
  async function adminLogin(username, password) {
    const cleanUsername = String(username || "").trim();

    if (!cleanUsername || !password) {
      return {
        success: false,
        message: "Vui lòng nhập tên đăng nhập và mật khẩu Admin.",
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

      const roles = Array.isArray(result.roles)
        ? result.roles
        : [result.role || ""];

      const isAdmin =
        roles.includes("ROLE_ADMIN") ||
        roles.includes("ADMIN") ||
        result.role === "ROLE_ADMIN";

      if (!isAdmin) {
        return {
          success: false,
          message: "Tài khoản của bạn không có quyền Quản trị viên (Admin).",
        };
      }

      const currentUser = buildCurrentUser({
        id: result.id,
        username: result.username || cleanUsername,
        name: result.fullName || result.username || cleanUsername,
        email: result.email,
        roles: roles,
        role: "ROLE_ADMIN",
        phone: result.phone,
      });

      saveSession(result.token, currentUser);

      return {
        success: true,
        user: currentUser,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Tên đăng nhập hoặc mật khẩu Admin không đúng.",
      };
    }
  }

  // ĐĂNG XUẤT
  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("smart-grocery-user");
    localStorage.removeItem("smart-grocery-token");
    sessionStorage.removeItem("smart-grocery-admin");
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

  // Lấy thông tin hồ sơ khách hàng từ CSDL.
  async function fetchProfile() {
    if (!token) return null;
    try {
      const profileData = await adminRequest("/users/profile", token);
      if (profileData) {
        const currentUser = buildCurrentUser({
          ...(user || {}),
          ...profileData,
        });
        setUser(currentUser);
        localStorage.setItem("smart-grocery-user", JSON.stringify(currentUser));
        return currentUser;
      }
      return null;
    } catch (err) {
      console.warn("Lỗi fetchProfile:", err.message);
      return null;
    }
  }

  // Cập nhật thông tin hồ sơ khách hàng (nối API PUT /api/users/profile)
  async function updateProfile(profileData) {
    try {
      const data = await adminRequest("/users/profile", token, {
        method: "PUT",
        body: JSON.stringify({
          fullName: profileData.name || profileData.fullName,
          phone: profileData.phone,
          address: profileData.address,
          avatarUrl: profileData.avatar || profileData.avatarUrl,
          gender: profileData.gender,
          birthDate: profileData.birthDate,
        }),
      });

      const updatedUser = buildCurrentUser({
        ...(user || {}),
        ...data,
        name: data.fullName || profileData.name || profileData.fullName,
        fullName: data.fullName || profileData.name || profileData.fullName,
        avatar: data.avatarUrl || profileData.avatar || user?.avatar || "",
        avatarUrl: data.avatarUrl || profileData.avatar || user?.avatar || "",
        gender: data.gender || profileData.gender || user?.gender || "",
        birthDate: data.birthDate || profileData.birthDate || user?.birthDate || "",
        phone: data.phone || profileData.phone || user?.phone || "",
        address: data.address || profileData.address || user?.address || "",
      });

      setUser(updatedUser);
      localStorage.setItem("smart-grocery-user", JSON.stringify(updatedUser));

      return {
        success: true,
        message: "Cập nhật hồ sơ thành công.",
        user: updatedUser,
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || "Không thể cập nhật hồ sơ.",
      };
    }
  }

  // Quên mật khẩu (nối API POST /api/auth/forgot-password)
  async function resetPassword(email, newPassword) {
    try {
      const result = await postAuth("forgot-password", {
        email: String(email || "").trim().toLowerCase(),
        newPassword,
      });

      return {
        success: true,
        message: typeof result === "string" ? result : result?.message || "Đặt lại mật khẩu thành công!",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Không thể đặt lại mật khẩu.",
      };
    }
  }

  // Đổi mật khẩu tài khoản (nối API PUT /api/users/change-password)
  async function changePassword(currentPassword, newPassword) {
    try {
      const result = await adminRequest("/users/change-password", token, {
        method: "PUT",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      return {
        success: true,
        message: typeof result === "string" ? result : result?.message || "Đổi mật khẩu thành công!",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Không thể đổi mật khẩu.",
      };
    }
  }

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
    localStorage.setItem("smart-grocery-user", JSON.stringify(updatedUser));

    return {
      success: true,
      message: "Đã cập nhật chi tiêu.",
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
        adminLogin,
        register,
        logout,
        resetPassword,
        changePassword,
        updateProfile,
        addSpent,
        getUserLoyaltyTier,

        // Các hàm quản trị
        getAdminUsers,
        updateAdminUserStatus,
        fetchProfile,

        isAuthenticated: Boolean(user && token),
        isAdmin: Boolean(user?.isAdmin || user?.role === "ROLE_ADMIN"),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
