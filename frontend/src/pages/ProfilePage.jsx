import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getMyLoyaltyApi,
  getLoyaltyTransactionsApi,
  getMyOrdersApi,
} from "../services/api";
import "../App.css";

function getMembership(tier = "MEMBER", totalSpend = 0) {
  const t = String(tier || "MEMBER").toUpperCase();
  if (t === "GOLD" || totalSpend >= 20000000) {
    return {
      name: "Vàng (GOLD)",
      icon: "🥇",
      className: "gold",
      min: 20000000,
      next: null,
      bonus: "Thưởng +200 điểm",
    };
  }

  if (t === "SILVER" || totalSpend >= 5000000) {
    return {
      name: "Bạc (SILVER)",
      icon: "🥈",
      className: "silver",
      min: 5000000,
      next: 20000000,
      bonus: "Thưởng +50 điểm",
    };
  }

  return {
    name: "Thành viên (MEMBER)",
    icon: "⭐",
    className: "none",
    min: 0,
    next: 5000000,
    bonus: "Tích 1 điểm mỗi 10.000đ",
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
  const { user, token, updateProfile, changePassword } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: user?.name || user?.fullName || "",
    email: user?.email || "",
    gender: user?.gender || "",
    birthDate: user?.birthDate || "",
    phone: user?.phone || "",
    address: user?.address || "",
    avatar: user?.avatar || "",
    totalSpent: Number(user?.totalSpent) || 0,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("profile");

  // Dữ liệu Loyalty từ Backend
  const [loyalty, setLoyalty] = useState({
    tier: "MEMBER",
    points: 0,
    totalSpend: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [myOrders, setMyOrders] = useState([]);

  useEffect(() => {
    if (!token) return;

    getMyLoyaltyApi(token)
      .then((data) => {
        if (data) {
          setLoyalty({
            tier: data.tier || "MEMBER",
            points: data.points || 0,
            totalSpend: Number(data.totalSpend) || 0,
          });
        }
      })
      .catch((err) => console.warn("Lỗi tải thông tin điểm:", err));

    getLoyaltyTransactionsApi(token)
      .then((data) => {
        if (Array.isArray(data)) setTransactions(data);
      })
      .catch((err) => console.warn("Lỗi tải lịch sử giao dịch điểm:", err));

    getMyOrdersApi(token)
      .then((data) => {
        if (Array.isArray(data)) setMyOrders(data);
      })
      .catch((err) => console.warn("Lỗi tải đơn hàng:", err));
  }, [token]);

  const membership = useMemo(
    () => getMembership(loyalty.tier, loyalty.totalSpend),
    [loyalty.tier, loyalty.totalSpend],
  );

  const progress = useMemo(() => {
    const spent = loyalty.totalSpend;
    if (membership.name.includes("GOLD") || spent >= 20000000) return 100;
    if (membership.name.includes("SILVER") || spent >= 5000000) {
      return Math.min(100, ((spent - 5000000) / 15000000) * 100);
    }
    return Math.min(100, (spent / 5000000) * 100);
  }, [membership, loyalty.totalSpend]);

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

  async function handleSaveProfile(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    const result = await updateProfile(profile);

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
                Tích điểm & Hạng
              </button>

              <button
                type="button"
                className={
                  activeSection === "orders"
                    ? "profile-menu-item active"
                    : "profile-menu-item"
                }
                onClick={() => setActiveSection("orders")}
              >
                <span>📦</span>
                Đơn hàng của tôi
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
                    <h1>⭐ Ví điểm & Hạng thành viên</h1>
                    <p>Mua sắm 10.000đ = 1 điểm. Nâng hạng nhận thêm điểm thưởng.</p>
                  </div>
                </div>

                <div className={`membership-current ${membership.className}`}>
                  <div className="membership-icon">{membership.icon}</div>

                  <div className="membership-current-info">
                    <span>Hạng thành viên hiện tại</span>
                    <strong>{membership.name}</strong>
                    <div style={{ marginTop: "6px", fontSize: "16px", color: "#10b981", fontWeight: "700" }}>
                      ⭐ Điểm tích lũy: {loyalty.points} điểm
                    </div>
                    <small style={{ marginTop: "4px", display: "block" }}>
                      Tổng chi tiêu thực tế: <b>{money(loyalty.totalSpend)}</b>
                    </small>
                  </div>
                </div>

                <div className="membership-progress-box">
                  <div className="membership-progress-header">
                    <span>Tiến trình nâng hạng</span>
                    <strong>{money(loyalty.totalSpend)}</strong>
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
                        {money(Math.max(membership.next - loyalty.totalSpend, 0))}
                      </strong>{" "}
                      chi tiêu để đạt hạng tiếp theo.
                    </p>
                  ) : (
                    <p className="membership-next">
                      🎉 Chúc mừng bạn đã đạt hạng thành viên cao nhất (VÀNG)!
                    </p>
                  )}
                </div>

                <div className="membership-levels">
                  <div
                    className={`membership-level silver ${
                      membership.name.includes("MEMBER") ? "current" : ""
                    }`}
                  >
                    <div className="membership-level-icon">⭐</div>
                    <div>
                      <strong>Thành viên (MEMBER)</strong>
                      <span>Dưới 5.000.000đ • Tích 1 điểm/10k</span>
                    </div>
                  </div>

                  <div
                    className={`membership-level silver ${
                      membership.name.includes("SILVER") ? "current" : ""
                    }`}
                  >
                    <div className="membership-level-icon">🥈</div>
                    <div>
                      <strong>Bạc (SILVER)</strong>
                      <span>Từ 5.000.000đ • Thưởng +50 điểm</span>
                    </div>
                  </div>

                  <div
                    className={`membership-level gold ${
                      membership.name.includes("GOLD") ? "current" : ""
                    }`}
                  >
                    <div className="membership-level-icon">🥇</div>
                    <div>
                      <strong>Vàng (GOLD)</strong>
                      <span>Từ 20.000.000đ • Thưởng +200 điểm</span>
                    </div>
                  </div>
                </div>

                {/* LỊCH SỬ GIAO DỊCH TÍCH ĐIỂM */}
                <div style={{ marginTop: "30px" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "12px", fontWeight: "700" }}>
                    📜 Lịch sử tích điểm
                  </h3>
                  {transactions.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: "14px" }}>
                      Chưa có giao dịch tích điểm nào. Hãy đặt hàng để tích điểm ngay!
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {transactions.map((t) => (
                        <div
                          key={t.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            background: "#f8fafc",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <div>
                            <strong>{t.description || `Đơn hàng #${t.orderId}`}</strong>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              {t.createdAt ? new Date(t.createdAt).toLocaleString("vi-VN") : "Gần đây"}
                            </div>
                          </div>
                          <span style={{ color: "#10b981", fontWeight: "700", fontSize: "16px" }}>
                            +{t.points} điểm
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ĐƠN HÀNG CỦA TÔI */}
            {activeSection === "orders" && (
              <div className="profile-card">
                <div className="profile-card-header">
                  <div>
                    <h1>📦 Đơn hàng của tôi</h1>
                    <p>Danh sách các đơn hàng bạn đã đặt tại Smart Grocery.</p>
                  </div>
                </div>

                {myOrders.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <span style={{ fontSize: "40px" }}>🛒</span>
                    <p style={{ marginTop: "12px", color: "#64748b" }}>
                      Bạn chưa có đơn hàng nào.
                    </p>
                    <button
                      className="add-button"
                      style={{ marginTop: "12px", padding: "10px 20px" }}
                      onClick={() => navigate("/")}
                    >
                      Bắt đầu mua sắm ngay
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {myOrders.map((order) => (
                      <div
                        key={order.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          padding: "16px",
                          background: "#ffffff",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderBottom: "1px solid #f1f5f9",
                            paddingBottom: "10px",
                            marginBottom: "12px",
                          }}
                        >
                          <div>
                            <strong>Mã đơn: #{order.id}</strong>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "Gần đây"}
                            </div>
                          </div>
                          <span
                            style={{
                              background: order.status === "DELIVERED" ? "#ecfdf5" : "#eff6ff",
                              color: order.status === "DELIVERED" ? "#059669" : "#2563eb",
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "700",
                            }}
                          >
                            {order.status === "PENDING" ? "ĐANG XỬ LÝ" : order.status}
                          </span>
                        </div>

                        {/* Danh sách món */}
                        {order.items && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                            {order.items.map((it) => (
                              <div
                                key={it.id}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: "14px",
                                }}
                              >
                                <span>{it.productName} × {it.quantity}</span>
                                <span style={{ fontWeight: "600" }}>{money(it.subtotal)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            borderTop: "1px solid #f1f5f9",
                            paddingTop: "10px",
                            fontWeight: "700",
                          }}
                        >
                          <span>Tổng thanh toán:</span>
                          <span style={{ color: "#10b981", fontSize: "16px" }}>
                            {money(order.totalAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
