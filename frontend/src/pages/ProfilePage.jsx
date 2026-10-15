import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getMyLoyaltyApi,
  getLoyaltyTransactionsApi,
  getMyOrdersApi,
  receiveOrderApi,
  cancelOrderApi,
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

function getTransactionMeta(type, points) {
  switch (type) {
    case "EARN":
      return {
        label: "Tích điểm đơn hàng",
        icon: "🛒",
        bg: "#ecfdf5",
        color: "#059669",
        badgeBg: "#d1fae5",
        badgeColor: "#065f46",
      };
    case "UPGRADE":
      return {
        label: "Thưởng thăng hạng",
        icon: "🎁",
        bg: "#fef3c7",
        color: "#d97706",
        badgeBg: "#fde68a",
        badgeColor: "#92400e",
      };
    case "ADJUSTMENT":
      return {
        label: "Admin điều chỉnh",
        icon: "⚖️",
        bg: "#ede9fe",
        color: "#7c3aed",
        badgeBg: "#ddd6fe",
        badgeColor: "#5b21b6",
      };
    case "REDEEM":
      return {
        label: "Đổi / Tiêu điểm",
        icon: "🏷️",
        bg: "#fee2e2",
        color: "#dc2626",
        badgeBg: "#fecaca",
        badgeColor: "#991b1b",
      };
    default:
      return {
        label: points >= 0 ? "Cộng điểm" : "Trừ điểm",
        icon: points >= 0 ? "⭐" : "🏷️",
        bg: points >= 0 ? "#ecfdf5" : "#fee2e2",
        color: points >= 0 ? "#059669" : "#dc2626",
        badgeBg: points >= 0 ? "#d1fae5" : "#fecaca",
        badgeColor: points >= 0 ? "#065f46" : "#991b1b",
      };
  }
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, updateProfile, changePassword, fetchProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: user?.name || user?.fullName || "",
    email: user?.email || "",
    gender: user?.gender || "",
    birthDate: user?.birthDate || "",
    phone: user?.phone || "",
    address: user?.address || "",
    avatar: user?.avatarUrl || user?.avatar || "",
    totalSpent: Number(user?.totalSpent) || 0,
  });

  // Đồng bộ state profile khi dữ liệu user trong AuthContext được cập nhật hoặc nạp từ API
  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        name: user.fullName || user.name || prev.name,
        email: user.email || prev.email,
        gender: user.gender ?? prev.gender,
        birthDate: user.birthDate ?? prev.birthDate,
        phone: user.phone ?? prev.phone,
        address: user.address ?? prev.address,
        avatar: user.avatarUrl || user.avatar || prev.avatar,
        totalSpent: Number(user.totalSpent) || prev.totalSpent,
      }));
    }
  }, [user]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  // Dữ liệu Loyalty từ Backend
  const [loyalty, setLoyalty] = useState({
    tier: "MEMBER",
    points: 0,
    totalSpend: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [myOrders, setMyOrders] = useState([]);

  const loadLoyaltyAndOrders = useCallback(async () => {
    if (!token) return;

    try {
      if (typeof fetchProfile === "function") {
        fetchProfile().catch(() => {});
      }
      const [loyaltyData, transData, ordersData] = await Promise.all([
        getMyLoyaltyApi(token).catch((err) => {
          console.warn("Lỗi tải thông tin điểm:", err);
          return null;
        }),
        getLoyaltyTransactionsApi(token).catch((err) => {
          console.warn("Lỗi tải lịch sử giao dịch:", err);
          return [];
        }),
        getMyOrdersApi(token).catch((err) => {
          console.warn("Lỗi tải đơn hàng:", err);
          return [];
        }),
      ]);

      if (loyaltyData) {
        setLoyalty({
          tier: loyaltyData.tier || "MEMBER",
          points: loyaltyData.points || 0,
          totalSpend: Number(loyaltyData.totalSpend) || 0,
        });
      }

      if (Array.isArray(transData)) setTransactions(transData);
      if (Array.isArray(ordersData)) setMyOrders(ordersData);
    } catch (err) {
      console.warn("Lỗi nạp dữ liệu Profile:", err);
    }
  }, [token]);

  useEffect(() => {
    loadLoyaltyAndOrders();
  }, [loadLoyaltyAndOrders]);

  async function handleReceiveOrder(orderId) {
    if (!token) return;
    if (
      !window.confirm(
        `Xác nhận bạn đã nhận được hàng cho đơn #${orderId}?\n\nĐiểm thưởng Loyalty sẽ được tích vào tài khoản của bạn ngay lập tức!`
      )
    ) {
      return;
    }

    try {
      await receiveOrderApi(token, orderId);
      setMessage(`Đơn hàng #${orderId} đã hoàn tất. Điểm thưởng đã được tích vào ví của bạn!`);
      await loadLoyaltyAndOrders();
    } catch (err) {
      setError(`Không thể xác nhận nhận hàng: ${err.message}`);
    }
  }

  async function handleCancelOrder(orderId) {
    if (!token) return;
    if (
      !window.confirm(
        `Bạn có chắc muốn hủy đơn hàng #${orderId}?\n\nSố lượng sản phẩm sẽ được hoàn lại kho.`
      )
    ) {
      return;
    }

    try {
      await cancelOrderApi(token, orderId);
      setMessage(`Đã hủy đơn hàng #${orderId} thành công.`);
      await loadLoyaltyAndOrders();
    } catch (err) {
      setError(`Không thể hủy đơn: ${err.message}`);
    }
  }

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

    if (file.size > 10 * 1024 * 1024) {
      setError("Ảnh không được lớn hơn 10MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const rawResult = reader.result;
      const img = new Image();

      img.onload = () => {
        try {
          const maxDim = 600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);

          setProfile((current) => ({
            ...current,
            avatar: optimizedDataUrl,
          }));
        } catch {
          setProfile((current) => ({
            ...current,
            avatar: rawResult,
          }));
        }

        setError("");
        setMessage("Đã chọn ảnh đại diện mới.");
      };

      img.onerror = () => {
        setProfile((current) => ({
          ...current,
          avatar: rawResult,
        }));
        setError("");
        setMessage("Đã chọn ảnh đại diện mới.");
      };

      img.src = rawResult;
    };

    reader.readAsDataURL(file);
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setIsSavingProfile(true);

    try {
      const result = await updateProfile(profile);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
    } catch (err) {
      setError(err.message || "Không thể cập nhật hồ sơ.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changePassword(currentPassword, newPassword);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage(result.message);
    } catch (err) {
      setError(err.message || "Không thể đổi mật khẩu.");
    } finally {
      setIsChangingPassword(false);
    }
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

                      <p>Hỗ trợ JPG, PNG hoặc WEBP. Tối đa 10MB.</p>

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
                    <button
                      type="submit"
                      className="profile-save-button"
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
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

                  <button
                    type="submit"
                    className="profile-save-button"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
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
                <div className="loyalty-history-box">
                  <div className="loyalty-history-header">
                    <div className="loyalty-history-title-group">
                      <h3>📜 Lịch sử tích & tiêu điểm</h3>
                      <span className="loyalty-history-count">
                        {transactions.length} giao dịch
                      </span>
                    </div>

                    {transactions.length > 0 && (
                      <div className="loyalty-history-summary">
                        Điểm hiện có: <strong>{loyalty.points} ⭐</strong>
                      </div>
                    )}
                  </div>

                  {transactions.length === 0 ? (
                    <div className="loyalty-history-empty">
                      <div className="loyalty-history-empty-icon">🎁</div>
                      <h4>Chưa có giao dịch tích điểm nào</h4>
                      <p>
                        Mỗi đơn hàng hoàn thành sẽ tự động tích điểm vào tài khoản của bạn để đổi quà và thăng hạng!
                      </p>
                      <button
                        type="button"
                        className="loyalty-history-empty-btn"
                        onClick={() => navigate("/")}
                      >
                        🛒 Bắt đầu mua sắm ngay
                      </button>
                    </div>
                  ) : (
                    <div className="loyalty-history-list">
                      {transactions.map((t) => {
                        const isPositive = (t.points || 0) >= 0;
                        const meta = getTransactionMeta(t.type, t.points);
                        return (
                          <div key={t.id} className="loyalty-history-item">
                            <div className="loyalty-history-left">
                              <div
                                className="loyalty-history-icon"
                                style={{ background: meta.bg, color: meta.color }}
                              >
                                {meta.icon}
                              </div>

                              <div className="loyalty-history-info">
                                <div className="loyalty-history-name-row">
                                  <strong className="loyalty-history-desc" title={t.description || (t.orderId ? `Tích điểm từ đơn hàng #${t.orderId}` : meta.label)}>
                                    {t.description || (t.orderId ? `Tích điểm từ đơn hàng #${t.orderId}` : meta.label)}
                                  </strong>
                                  <span
                                    className="loyalty-history-badge"
                                    style={{ background: meta.badgeBg, color: meta.badgeColor }}
                                  >
                                    {meta.label}
                                  </span>
                                </div>

                                <div className="loyalty-history-meta">
                                  <span className="loyalty-history-time">
                                    🕒 {t.createdAt ? new Date(t.createdAt).toLocaleString("vi-VN", {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }) : "Gần đây"}
                                  </span>

                                  {t.orderId && (
                                    <span className="loyalty-history-order-tag">
                                      Đơn hàng #{t.orderId}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="loyalty-history-right">
                              <span className={`loyalty-history-points ${isPositive ? "is-plus" : "is-minus"}`}>
                                {isPositive ? `+${t.points}` : t.points} <small>điểm</small>
                              </span>
                            </div>
                          </div>
                        );
                      })}
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

                        {/* Nút hành động đơn hàng cho khách */}
                        {(order.status === "PENDING" || order.status === "SHIPPED") && (
                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              marginTop: "12px",
                              justifyContent: "flex-end",
                              borderTop: "1px dashed #e2e8f0",
                              paddingTop: "10px",
                            }}
                          >
                            {order.status === "PENDING" && (
                              <button
                                type="button"
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: "8px",
                                  border: "1px solid #ef4444",
                                  background: "#ffffff",
                                  color: "#ef4444",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                }}
                                onClick={() => handleCancelOrder(order.id)}
                              >
                                ❌ Hủy đơn
                              </button>
                            )}
                            <button
                              type="button"
                              style={{
                                padding: "6px 14px",
                                borderRadius: "8px",
                                border: "none",
                                background: "#10b981",
                                color: "#ffffff",
                                fontSize: "13px",
                                fontWeight: "700",
                                cursor: "pointer",
                              }}
                              onClick={() => handleReceiveOrder(order.id)}
                            >
                              ✅ Đã nhận được hàng (Tích điểm ngay)
                            </button>
                          </div>
                        )}
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
