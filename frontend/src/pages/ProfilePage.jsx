import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../App.css";

function getMembership(totalSpent) {
  if (totalSpent >= 5000000) {
    return {
      name: "Kim cương",
      icon: "💎",
      className: "diamond",
      min: 5000000,
      next: null,
    };
  }

  if (totalSpent >= 2000000) {
    return {
      name: "Vàng",
      icon: "🥇",
      className: "gold",
      min: 2000000,
      next: 5000000,
    };
  }

  if (totalSpent >= 500000) {
    return {
      name: "Bạc",
      icon: "🥈",
      className: "silver",
      min: 500000,
      next: 2000000,
    };
  }

  return {
    name: "Chưa đạt hạng",
    icon: "⭐",
    className: "none",
    min: 0,
    next: 500000,
  };
}

function money(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ProfilePage() {
  const navigate = useNavigate();

  const { user, updateProfile, changePassword } = useAuth();

  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    gender: user?.gender || "",
    birthDate: user?.birthDate || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
    totalSpent: Number(user?.totalSpent) || 0,
  });

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [activeSection, setActiveSection] = useState("profile");

  const membership = useMemo(
    () => getMembership(profile.totalSpent),
    [profile.totalSpent],
  );

  const progress = useMemo(() => {
    const spent = profile.totalSpent;

    if (spent >= 5000000) {
      return 100;
    }

    if (spent >= 2000000) {
      return ((spent - 2000000) / 3000000) * 100;
    }

    if (spent >= 500000) {
      return ((spent - 500000) / 1500000) * 100;
    }

    return (spent / 500000) * 100;
  }, [profile.totalSpent]);

  function handleChange(event) {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file hình ảnh.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh không được lớn hơn 5MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setProfile((current) => ({
        ...current,
        avatar: reader.result,
      }));

      setError("");
      setMessage("Đã chọn ảnh đại diện mới.");
    };

    reader.readAsDataURL(file);
  }

  function handleSaveProfile(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    const result = updateProfile(profile);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setMessage(result.message);
  }

  function handleChangePassword(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    const result = changePassword(currentPassword, newPassword);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setMessage(result.message);
  }

  function goHome() {
    navigate("/");
  }

  return (
    <div className="profile-page">
      <div className="profile-topbar">
        <div className="container profile-topbar-inner">
          <button
            type="button"
            className="profile-back-button"
            onClick={goHome}
          >
            Quay lại trang chủ
          </button>

          <span>Hỗ trợ khách hàng: 1233-7777</span>
        </div>
      </div>

      <main className="profile-container container">
        <div className="profile-breadcrumb">
          Trang chủ / <strong>Tài khoản của tôi</strong>
        </div>

        <div className="profile-layout">
          <aside className="profile-sidebar">
            <div className="profile-user-mini">
              <div className="profile-mini-avatar">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Ảnh đại diện" />
                ) : (
                  <span>👤</span>
                )}
              </div>

              <div>
                <strong>{profile.name || "Người dùng"}</strong>
                <small>{profile.email}</small>
              </div>
            </div>

            <div className="profile-menu">
              <button
                type="button"
                className={
                  activeSection === "profile"
                    ? "profile-menu-item active"
                    : "profile-menu-item"
                }
                onClick={() => setActiveSection("profile")}
              >
                <span>👤</span>
                Thông tin cá nhân
              </button>

              <button
                type="button"
                className={
                  activeSection === "password"
                    ? "profile-menu-item active"
                    : "profile-menu-item"
                }
                onClick={() => setActiveSection("password")}
              >
                <span>🔐</span>
                Đổi mật khẩu
              </button>

              <button
                type="button"
                className={
                  activeSection === "points"
                    ? "profile-menu-item active"
                    : "profile-menu-item"
                }
                onClick={() => setActiveSection("points")}
              >
                <span>⭐</span>
                Xem tích điểm
              </button>
            </div>
          </aside>

          <section className="profile-content">
            {message && <div className="profile-success">✓ {message}</div>}

            {error && <div className="profile-error">! {error}</div>}

            {activeSection === "profile" && (
              <div className="profile-card">
                <div className="profile-card-header">
                  <div>
                    <h1>Thông tin cá nhân</h1>
                    <p>Quản lý thông tin tài khoản của bạn.</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile}>
                  <div className="profile-avatar-section">
                    <div className="profile-avatar-large">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="Ảnh đại diện" />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>

                    <div className="profile-avatar-actions">
                      <h3>Ảnh đại diện</h3>

                      <p>Hỗ trợ JPG, PNG hoặc WEBP. Tối đa 5MB.</p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        hidden
                      />

                      <button
                        type="button"
                        className="profile-upload-button"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        🖼️ Chọn ảnh
                      </button>
                    </div>
                  </div>

                  <div className="profile-divider" />

                  <div className="profile-form-grid">
                    <div className="profile-field profile-field-full">
                      <label htmlFor="name">Họ và tên</label>

                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={profile.name}
                        onChange={handleChange}
                        placeholder="Nhập họ và tên"
                      />
                    </div>

                    <div className="profile-field">
                      <label htmlFor="gender">Giới tính</label>

                      <select
                        id="gender"
                        name="gender"
                        value={profile.gender}
                        onChange={handleChange}
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>

                    <div className="profile-field">
                      <label htmlFor="birthDate">Ngày sinh</label>

                      <input
                        id="birthDate"
                        name="birthDate"
                        type="date"
                        value={profile.birthDate}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="profile-field">
                      <label htmlFor="phone">Số điện thoại</label>

                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={profile.phone}
                        onChange={handleChange}
                        placeholder="Nhập số điện thoại"
                      />
                    </div>

                    <div className="profile-field">
                      <label htmlFor="email">Email</label>

                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={profile.email}
                        onChange={handleChange}
                        placeholder="Nhập email"
                      />
                    </div>
                  </div>

                  <div className="profile-form-footer">
                    <button type="submit" className="profile-save-button">
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeSection === "password" && (
              <div className="profile-card">
                <div className="profile-card-header">
                  <div>
                    <h1>Đổi mật khẩu</h1>
                    <p>Cập nhật mật khẩu để bảo vệ tài khoản.</p>
                  </div>
                </div>

                <form className="password-form" onSubmit={handleChangePassword}>
                  <div className="profile-field">
                    <label htmlFor="currentPassword">Mật khẩu hiện tại</label>

                    <input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="newPassword">Mật khẩu mới</label>

                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Ít nhất 6 ký tự"
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="confirmPassword">
                      Xác nhận mật khẩu mới
                    </label>

                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>

                  <button type="submit" className="profile-save-button">
                    Đổi mật khẩu
                  </button>
                </form>
              </div>
            )}

            {activeSection === "points" && (
              <div className="profile-card">
                <div className="profile-card-header">
                  <div>
                    <h1>⭐ Tích điểm thành viên</h1>
                    <p>Mua sắm càng nhiều, hạng thành viên càng cao.</p>
                  </div>
                </div>

                <div className={`membership-current ${membership.className}`}>
                  <div className="membership-icon">{membership.icon}</div>

                  <div className="membership-current-info">
                    <span>Hạng thành viên hiện tại</span>

                    <strong>{membership.name}</strong>

                    <small>
                      Tổng chi tiêu: <b>{money(profile.totalSpent)}</b>
                    </small>
                  </div>
                </div>

                <div className="membership-progress-box">
                  <div className="membership-progress-header">
                    <span>Tiến trình tích điểm</span>

                    <strong>{money(profile.totalSpent)}</strong>
                  </div>

                  <div className="membership-progress">
                    <div
                      className={`membership-progress-fill ${membership.className}`}
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                      }}
                    />
                  </div>

                  {membership.next ? (
                    <p className="membership-next">
                      Còn{" "}
                      <strong>
                        {money(
                          Math.max(membership.next - profile.totalSpent, 0),
                        )}
                      </strong>{" "}
                      để đạt hạng tiếp theo.
                    </p>
                  ) : (
                    <p className="membership-next">
                      🎉 Bạn đã đạt hạng cao nhất!
                    </p>
                  )}
                </div>

                <div className="membership-levels">
                  <div
                    className={`membership-level silver ${
                      membership.name === "Bạc" ? "current" : ""
                    }`}
                  >
                    <div className="membership-level-icon">🥈</div>

                    <div>
                      <strong>Bạc</strong>

                      <span>500.000đ – dưới 2.000.000đ</span>
                    </div>
                  </div>

                  <div
                    className={`membership-level gold ${
                      membership.name === "Vàng" ? "current" : ""
                    }`}
                  >
                    <div className="membership-level-icon">🥇</div>

                    <div>
                      <strong>Vàng</strong>

                      <span>2.000.000đ – dưới 5.000.000đ</span>
                    </div>
                  </div>

                  <div
                    className={`membership-level diamond ${
                      membership.name === "Kim cương" ? "current" : ""
                    }`}
                  >
                    <div className="membership-level-icon">💎</div>

                    <div>
                      <strong>Kim cương</strong>

                      <span>Từ 5.000.000đ trở lên</span>
                    </div>
                  </div>
                </div>

                <div className="membership-note">
                  <strong>💡 Cách tính hạng</strong>

                  <p>
                    Hạng thành viên được xác định dựa trên tổng giá trị mua hàng
                    tích lũy của bạn.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
