
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const USERS_KEY = "smart-grocery-users";

export function AuthProvider({ children }) {
  // ==================================================
  // TRẠNG THÁI ĐĂNG NHẬP
  // ==================================================
  // KHÔNG lưu user vào localStorage.
  //
  // Vì vậy:
  // - Đăng nhập -> user được lưu trong React state
  // - Logout -> user = null
  // - Refresh trang -> user = null
  // - Đóng/mở website -> user = null
  //
  // => Người dùng luôn phải đăng nhập lại.
  const [user, setUser] = useState(null);

  // ==================================================
  // LẤY DANH SÁCH TÀI KHOẢN
  // ==================================================
  function getUsers() {
    try {
      const data = localStorage.getItem(USERS_KEY);

      if (!data) {
        return [];
      }

      const users = JSON.parse(data);

      if (!Array.isArray(users)) {
        return [];
      }

      return users;
    } catch (error) {
      console.error(
        "Không thể đọc danh sách tài khoản:",
        error
      );

      return [];
    }
  }

  // ==================================================
  // LƯU DANH SÁCH TÀI KHOẢN
  // ==================================================
  function saveUsers(users) {
    try {
      localStorage.setItem(
        USERS_KEY,
        JSON.stringify(users)
      );

      return true;
    } catch (error) {
      console.error(
        "Không thể lưu danh sách tài khoản:",
        error
      );

      return false;
    }
  }

  // ==================================================
  // ĐĂNG KÝ
  // ==================================================
  function register(name, email, password) {
    const users = getUsers();

    const cleanName = name.trim();
    const normalizedEmail = email
      .trim()
      .toLowerCase();

    // ------------------------------
    // Kiểm tra họ tên
    // ------------------------------
    if (!cleanName) {
      return {
        success: false,
        message: "Vui lòng nhập họ và tên.",
      };
    }

    // ------------------------------
    // Kiểm tra email
    // ------------------------------
    if (!normalizedEmail) {
      return {
        success: false,
        message: "Vui lòng nhập email.",
      };
    }

    // ------------------------------
    // Kiểm tra mật khẩu
    // ------------------------------
    if (!password) {
      return {
        success: false,
        message: "Vui lòng nhập mật khẩu.",
      };
    }

    // ------------------------------
    // Kiểm tra email đã tồn tại
    // ------------------------------
    const existingUser = users.find(
      (item) =>
        String(item.email || "").toLowerCase() ===
        normalizedEmail
    );

    if (existingUser) {
      return {
        success: false,
        message: "Email này đã được đăng ký.",
      };
    }

    // ------------------------------
    // Tạo tài khoản
    // ------------------------------
    const newUser = {
      id: Date.now(),
      name: cleanName,
      email: normalizedEmail,
      password: password,
    };

    users.push(newUser);

    const saved = saveUsers(users);

    if (!saved) {
      return {
        success: false,
        message: "Không thể lưu tài khoản. Vui lòng thử lại.",
      };
    }

    return {
      success: true,
      message: "Đăng ký thành công.",
    };
  }

  // ==================================================
  // ĐĂNG NHẬP
  // ==================================================
  function login(email, password) {
    const users = getUsers();

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    // ------------------------------
    // Kiểm tra email
    // ------------------------------
    if (!normalizedEmail) {
      return {
        success: false,
        message: "Vui lòng nhập email.",
      };
    }

    // ------------------------------
    // Kiểm tra mật khẩu
    // ------------------------------
    if (!password) {
      return {
        success: false,
        message: "Vui lòng nhập mật khẩu.",
      };
    }

    // ------------------------------
    // Tìm tài khoản
    // ------------------------------
    const foundUser = users.find(
      (item) =>
        String(item.email || "").toLowerCase() ===
          normalizedEmail &&
        item.password === password
    );

    // ------------------------------
    // Sai tài khoản
    // ------------------------------
    if (!foundUser) {
      return {
        success: false,
        message: "Email hoặc mật khẩu không đúng.",
      };
    }

    // ------------------------------
    // Thông tin phiên đăng nhập
    // ------------------------------
    const currentUser = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
    };

    // QUAN TRỌNG:
    // Chỉ lưu trong React state.
    // KHÔNG lưu localStorage.
    setUser(currentUser);

    return {
      success: true,
      user: currentUser,
    };
  }

  // ==================================================
  // ĐĂNG XUẤT
  // ==================================================
  function logout() {
    // Xóa phiên đăng nhập hiện tại.
    //
    // Không xóa tài khoản đã đăng ký.
    // Người dùng vẫn có thể đăng nhập lại
    // bằng email + mật khẩu cũ.
    setUser(null);
  }

  // ==================================================
  // ĐỔI / QUÊN MẬT KHẨU
  // ==================================================
  function resetPassword(email, newPassword) {
    const users = getUsers();

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    // ------------------------------
    // Kiểm tra email
    // ------------------------------
    if (!normalizedEmail) {
      return {
        success: false,
        message: "Vui lòng nhập email.",
      };
    }

    // ------------------------------
    // Kiểm tra mật khẩu mới
    // ------------------------------
    if (!newPassword) {
      return {
        success: false,
        message: "Vui lòng nhập mật khẩu mới.",
      };
    }

    // ------------------------------
    // Tìm tài khoản
    // ------------------------------
    const userIndex = users.findIndex(
      (item) =>
        String(item.email || "").toLowerCase() ===
        normalizedEmail
    );

    // ------------------------------
    // Không tìm thấy email
    // ------------------------------
    if (userIndex === -1) {
      return {
        success: false,
        message: "Email chưa được đăng ký.",
      };
    }

    // ------------------------------
    // Cập nhật mật khẩu
    // ------------------------------
    users[userIndex].password = newPassword;

    const saved = saveUsers(users);

    if (!saved) {
      return {
        success: false,
        message: "Không thể cập nhật mật khẩu. Vui lòng thử lại.",
      };
    }

    return {
      success: true,
      message: "Đổi mật khẩu thành công.",
    };
  }

  // ==================================================
  // CONTEXT
  // ==================================================
  return (
    <AuthContext.Provider
      value={{
        // Người dùng hiện tại
        user,

        // Đăng nhập
        login,

        // Đăng ký
        register,

        // Đăng xuất
        logout,

        // Đổi mật khẩu
        resetPassword,

        // Kiểm tra đã đăng nhập chưa
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ==================================================
// HOOK USE AUTH
// ==================================================
export function useAuth() {
  return useContext(AuthContext);
}
