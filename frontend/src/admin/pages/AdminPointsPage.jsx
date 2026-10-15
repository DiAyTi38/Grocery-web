import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../services/api";
import "../Admin.css";


const money = (value) => `${(Number(value) || 0).toLocaleString("vi-VN")} ₫`;

function getTierInfo(tierName) {
  const code = String(tierName || "").toUpperCase();
  if (code === "GOLD") {
    return {
      code: "GOLD",
      name: "Vàng (GOLD)",
      icon: "🥇",
      className: "gold",
    };
  }
  if (code === "SILVER") {
    return {
      code: "SILVER",
      name: "Bạc (SILVER)",
      icon: "🥈",
      className: "silver",
    };
  }
  return {
    code: "MEMBER",
    name: "Thành viên (MEMBER)",
    icon: "⭐",
    className: "default",
  };
}

function getTxTypeName(type) {
  switch (type) {
    case "EARN":
      return "Tích điểm đơn hàng";
    case "REDEEM":
      return "Quy đổi / Dùng điểm";
    case "UPGRADE":
      return "Thưởng thăng hạng";
    case "ADJUSTMENT":
      return "Admin điều chỉnh";
    default:
      return type || "Giao dịch điểm";
  }
}

export default function AdminPointsPage() {
  const { token } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [keyword, setKeyword] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");

  // Modal Điều chỉnh điểm
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  // Modal Lịch sử giao dịch điểm
  const [historyTarget, setHistoryTarget] = useState(null);
  const [historyTransactions, setHistoryTransactions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const request = useCallback(
    async (path, options = {}) => {
      if (!token) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data?.message ||
                data?.error ||
                `Yêu cầu thất bại (HTTP ${response.status})`,
        );
      }

      return data;
    },
    [token],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await request("/loyalty/admin/accounts");
      const list = Array.isArray(data) ? data : data?.content || data?.data || [];
      setAccounts(list);
    } catch (err) {
      setError(err.message || "Không tải được dữ liệu điểm thành viên.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Bộ lọc tìm kiếm & hạng
  const filtered = accounts.filter((account) => {
    const search = keyword.toLowerCase().trim();
    const tier = getTierInfo(account.tier).code;

    const searchableText = [
      account.username,
      account.fullName,
      account.email,
      account.phone,
      account.userId,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      searchableText.includes(search) &&
      (tierFilter === "ALL" || tier === tierFilter)
    );
  });

  // Thống kê tổng hợp
  const totalSpent = accounts.reduce(
    (sum, a) => sum + (Number(a.totalSpend) || 0),
    0,
  );
  const totalPoints = accounts.reduce(
    (sum, a) => sum + (Number(a.points) || 0),
    0,
  );

  const tierCounts = {
    gold: accounts.filter((a) => (a.tier || "").toUpperCase() === "GOLD").length,
    silver: accounts.filter((a) => (a.tier || "").toUpperCase() === "SILVER").length,
    member: accounts.filter((a) => (a.tier || "").toUpperCase() === "MEMBER").length,
  };

  // Mở modal điều chỉnh điểm
  function openAdjust(account) {
    setAdjustTarget(account);
    setAdjustPoints("");
    setAdjustReason("");
    setAdjustError("");
  }

  function closeAdjust() {
    if (adjusting) return;
    setAdjustTarget(null);
    setAdjustPoints("");
    setAdjustReason("");
    setAdjustError("");
  }

  async function handleAdjustSubmit(e) {
    e.preventDefault();
    if (!adjustTarget) return;

    const delta = Number(adjustPoints);
    if (!Number.isInteger(delta) || delta === 0) {
      setAdjustError("Vui lòng nhập số điểm hợp lệ khác 0 (ví dụ: +50 hoặc -20).");
      return;
    }

    if (!adjustReason.trim()) {
      setAdjustError("Vui lòng nhập lý do điều chỉnh điểm.");
      return;
    }

    setAdjusting(true);
    setAdjustError("");

    try {
      await request("/loyalty/admin/adjust", {
        method: "POST",
        body: JSON.stringify({
          userId: adjustTarget.userId,
          points: delta,
          reason: adjustReason.trim(),
        }),
      });

      setSuccess(
        `Đã điều chỉnh ${delta > 0 ? `+${delta}` : delta} điểm cho thành viên "${adjustTarget.fullName || adjustTarget.username}".`,
      );
      closeAdjust();
      await loadData();
    } catch (err) {
      setAdjustError(err.message || "Không thể điều chỉnh điểm thành viên.");
    } finally {
      setAdjusting(false);
    }
  }

  // Mở modal lịch sử điểm
  async function openHistory(account) {
    setHistoryTarget(account);
    setHistoryTransactions([]);
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const data = await request(`/loyalty/admin/transactions/${account.userId}`);
      setHistoryTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setHistoryError(err.message || "Không tải được lịch sử tích điểm của thành viên.");
    } finally {
      setHistoryLoading(false);
    }
  }

  function closeHistory() {
    setHistoryTarget(null);
    setHistoryTransactions([]);
    setHistoryError("");
  }

  return (
    <main className="admin-page">
      <header className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">SMART GROCERY / QUẢN TRỊ</p>
          <h1 className="admin-page__title">Quản lý điểm & hạng thành viên</h1>
          <p className="admin-page__subtitle">
            Theo dõi điểm tích lũy, tổng chi tiêu thực tế và điều chỉnh điểm khách hàng.
          </p>
        </div>

        <button
          className="admin-page__button admin-page__button--secondary"
          type="button"
          onClick={loadData}
          disabled={loading}
        >
          ↻ {loading ? "Đang tải..." : "Làm mới dữ liệu"}
        </button>
      </header>

      {/* Thẻ thống kê tổng quan */}
      <section className="admin-page__stats">
        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Tổng thành viên</span>
          <strong className="admin-page__stat-value">
            {accounts.length.toLocaleString("vi-VN")}
          </strong>
          <span className="admin-page__stat-note">
            Tài khoản trong hệ thống
          </span>
        </article>

        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Tổng chi tiêu thực tế</span>
          <strong className="admin-page__stat-value admin-points-money">
            {money(totalSpent)}
          </strong>
          <span className="admin-page__stat-note">
            Tích lũy từ các đơn hàng thành công
          </span>
        </article>

        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Tổng điểm lưu hành</span>
          <strong className="admin-page__stat-value" style={{ color: "#176b40" }}>
            {totalPoints.toLocaleString("vi-VN")} ⭐
          </strong>
          <span className="admin-page__stat-note">
            Điểm tích lũy hiện có của khách
          </span>
        </article>

        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Hạng Vàng & Bạc</span>
          <strong className="admin-page__stat-value">
            {(tierCounts.gold + tierCounts.silver).toLocaleString("vi-VN")}
          </strong>
          <span className="admin-page__stat-note">
            🥇 {tierCounts.gold} Vàng • 🥈 {tierCounts.silver} Bạc
          </span>
        </article>
      </section>

      {/* Thẻ thông tin các hạng thành viên */}
      <section className="admin-page__panel admin-points-tier-panel">
        <div className="admin-page__panel-header">
          <div>
            <h2 className="admin-page__panel-title">Phân hạng khách hàng</h2>
            <p className="admin-page__panel-subtitle">
              Hạng được nâng tự động khi chi tiêu đạt mốc: 10.000 ₫ = 1 điểm tích lũy.
            </p>
          </div>
        </div>

        <div className="admin-points-tier-grid">
          <article className="admin-points-tier-card admin-points-tier-card--gold">
            <span className="admin-points-tier-icon">🥇</span>
            <div>
              <strong>Vàng (GOLD)</strong>
              <p>Chi tiêu từ 20.000.000 ₫ • Thưởng 200 điểm</p>
              <span>{tierCounts.gold} thành viên</span>
            </div>
          </article>

          <article className="admin-points-tier-card admin-points-tier-card--silver">
            <span className="admin-points-tier-icon">🥈</span>
            <div>
              <strong>Bạc (SILVER)</strong>
              <p>Chi tiêu từ 5.000.000 ₫ • Thưởng 50 điểm</p>
              <span>{tierCounts.silver} thành viên</span>
            </div>
          </article>

          <article className="admin-points-tier-card">
            <span className="admin-points-tier-icon">⭐</span>
            <div>
              <strong>Thành viên (MEMBER)</strong>
              <p>Chi tiêu dưới 5.000.000 ₫</p>
              <span>{tierCounts.member} thành viên</span>
            </div>
          </article>
        </div>
      </section>

      {error && (
        <div
          className="admin-page__message admin-page__message--error"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && !error && (
        <div
          className="admin-page__message admin-page__message--success"
          role="status"
        >
          {success}
        </div>
      )}

      {/* Bảng danh sách thành viên */}
      <section className="admin-page__panel">
        <div className="admin-page__panel-header">
          <div>
            <h2 className="admin-page__panel-title">Danh sách tài khoản điểm</h2>
            <p className="admin-page__panel-subtitle">
              {filtered.length} kết quả phù hợp với điều kiện tìm kiếm.
            </p>
          </div>
        </div>

        <div className="admin-page__toolbar">
          <div className="admin-page__search">
            <input
              className="admin-page__input"
              aria-label="Tìm thành viên"
              placeholder="⌕  Tìm theo tên, username, email hoặc SĐT..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="admin-points-filter">
            <select
              className="admin-page__select"
              aria-label="Lọc theo hạng thành viên"
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
            >
              <option value="ALL">Tất cả hạng</option>
              <option value="GOLD">🥇 Vàng (GOLD)</option>
              <option value="SILVER">🥈 Bạc (SILVER)</option>
              <option value="MEMBER">⭐ Thành viên (MEMBER)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-page__empty">
            <div className="admin-page__empty-icon">⏳</div>
            <h3>Đang tải dữ liệu điểm</h3>
            <p>Đang đồng bộ thông tin khách hàng từ hệ thống...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-page__empty">
            <div className="admin-page__empty-icon">👥</div>
            <h3>Không tìm thấy thành viên</h3>
            <p>Hãy thử thay đổi từ khóa hoặc chọn một hạng thành viên khác.</p>
            {(keyword || tierFilter !== "ALL") && (
              <button
                className="admin-page__button admin-page__button--secondary"
                type="button"
                onClick={() => {
                  setKeyword("");
                  setTierFilter("ALL");
                }}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="admin-page__table-wrap">
            <table className="admin-page__table">
              <thead>
                <tr>
                  <th>Thành viên</th>
                  <th>Liên hệ</th>
                  <th>Hạng</th>
                  <th>Điểm tích lũy</th>
                  <th>Tổng chi tiêu</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((account) => {
                  const tier = getTierInfo(account.tier);
                  const displayName =
                    account.fullName || account.username || "Chưa cập nhật";
                  const points = Number(account.points) || 0;
                  const spend = Number(account.totalSpend) || 0;

                  return (
                    <tr key={account.userId}>
                      <td>
                        <div className="admin-page__product">
                          <div className="admin-points-avatar">
                            {displayName.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <div className="admin-page__product-name">
                              {displayName}
                            </div>
                            <div className="admin-page__muted">
                              Mã KH: #{account.userId} • @{account.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div>{account.email || "—"}</div>
                        <div className="admin-page__muted">
                          {account.phone ? `SĐT: ${account.phone}` : "Chưa có SĐT"}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-points-tier-badge admin-points-tier-badge--${tier.className}`}
                        >
                          <span aria-hidden="true">{tier.icon}</span>
                          {tier.name}
                        </span>
                      </td>

                      <td>
                        <strong
                          style={{
                            color: points > 0 ? "#176b40" : "#65736b",
                            fontSize: "15px",
                          }}
                        >
                          {points.toLocaleString("vi-VN")} điểm
                        </strong>
                      </td>

                      <td>
                        <strong>{money(spend)}</strong>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div
                          className="admin-page__actions"
                          style={{ justifyContent: "flex-end" }}
                        >
                          <button
                            className="admin-page__action"
                            type="button"
                            onClick={() => openHistory(account)}
                            title="Xem lịch sử tích và dùng điểm"
                          >
                            Lịch sử
                          </button>

                          <button
                            className="admin-page__action"
                            type="button"
                            onClick={() => openAdjust(account)}
                            style={{
                              borderColor: "#176b40",
                              color: "#176b40",
                              background: "#f0fdf4",
                            }}
                            title="Cộng hoặc trừ điểm cho thành viên"
                          >
                            ± Điều chỉnh
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Điều chỉnh điểm */}
      {adjustTarget && (
        <div className="admin-page__modal-backdrop" onClick={closeAdjust}>
          <section
            className="admin-page__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="adjust-points-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520 }}
          >
            <h2 id="adjust-points-title">Điều chỉnh điểm thành viên</h2>
            <p className="admin-page__modal-description">
              Cộng hoặc trừ điểm thưởng/bồi hoàn cho khách hàng{" "}
              <strong>{adjustTarget.fullName || adjustTarget.username}</strong>.
            </p>

            <div
              style={{
                background: "#f7f9f8",
                padding: "12px 16px",
                borderRadius: 8,
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Điểm hiện tại:</span>
              <strong style={{ fontSize: 16, color: "#176b40" }}>
                {(Number(adjustTarget.points) || 0).toLocaleString("vi-VN")} điểm
              </strong>
            </div>

            {adjustError && (
              <div
                className="admin-page__message admin-page__message--error"
                role="alert"
                style={{ marginBottom: 16 }}
              >
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit}>
              <div className="admin-page__form-grid">
                <div className="admin-page__field admin-page__field--full">
                  <label htmlFor="adjust-points-input">
                    Số điểm thay đổi * (nhập số âm để trừ, dương để cộng)
                  </label>
                  <input
                    id="adjust-points-input"
                    className="admin-page__input"
                    type="number"
                    step="1"
                    required
                    placeholder="Ví dụ: 50 hoặc -20"
                    value={adjustPoints}
                    onChange={(e) => setAdjustPoints(e.target.value)}
                  />
                  {adjustPoints !== "" && Number.isInteger(Number(adjustPoints)) && (
                    <small style={{ color: "#637269", marginTop: 4, display: "block" }}>
                      Điểm sau điều chỉnh:{" "}
                      <strong>
                        {Math.max(
                          0,
                          (Number(adjustTarget.points) || 0) + Number(adjustPoints),
                        ).toLocaleString("vi-VN")}{" "}
                        điểm
                      </strong>
                    </small>
                  )}
                </div>

                <div className="admin-page__field admin-page__field--full">
                  <label htmlFor="adjust-reason-input">Lý do điều chỉnh *</label>
                  <input
                    id="adjust-reason-input"
                    className="admin-page__input"
                    type="text"
                    required
                    placeholder="Ví dụ: Bồi hoàn CSKH, Khuyến mãi sinh nhật..."
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-page__form-actions" style={{ marginTop: 24 }}>
                <button
                  className="admin-page__button admin-page__button--secondary"
                  type="button"
                  onClick={closeAdjust}
                  disabled={adjusting}
                >
                  Hủy
                </button>

                <button
                  className="admin-page__button"
                  type="submit"
                  disabled={adjusting}
                >
                  {adjusting ? "Đang xử lý..." : "Xác nhận điều chỉnh"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Modal Lịch sử giao dịch điểm */}
      {historyTarget && (
        <div className="admin-page__modal-backdrop" onClick={closeHistory}>
          <section
            className="admin-page__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-points-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 700 }}
          >
            <h2 id="history-points-title">Lịch sử tích & dùng điểm</h2>
            <p className="admin-page__modal-description">
              Chi tiết các giao dịch điểm của thành viên{" "}
              <strong>{historyTarget.fullName || historyTarget.username}</strong>{" "}
              (Mã KH: #{historyTarget.userId}).
            </p>

            {historyError && (
              <div
                className="admin-page__message admin-page__message--error"
                role="alert"
              >
                {historyError}
              </div>
            )}

            {historyLoading ? (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <p>⏳ Đang tải lịch sử giao dịch...</p>
              </div>
            ) : historyTransactions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#637269" }}>
                <p>Khách hàng chưa có phát sinh giao dịch điểm nào.</p>
              </div>
            ) : (
              <div
                className="admin-page__table-wrap"
                style={{ maxHeight: 380, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 10 }}
              >
                <table className="admin-page__table" style={{ minWidth: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", paddingLeft: 16, width: "170px" }}>Thời gian</th>
                      <th style={{ textAlign: "center", width: "170px" }}>Loại giao dịch</th>
                      <th style={{ textAlign: "right", width: "120px" }}>Biến động</th>
                      <th style={{ textAlign: "left", paddingLeft: 16 }}>Nội dung / Mô tả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyTransactions.map((tx) => {
                      const isPositive = (tx.points || 0) >= 0;
                      return (
                        <tr key={tx.id}>
                          <td style={{ fontSize: 13, whiteSpace: "nowrap", textAlign: "left", paddingLeft: 16 }}>
                            {tx.createdAt
                              ? new Date(tx.createdAt).toLocaleString("vi-VN", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                padding: "4px 10px",
                                borderRadius: 6,
                                display: "inline-block",
                                background:
                                  tx.type === "EARN"
                                    ? "#dcfce7"
                                    : tx.type === "UPGRADE"
                                      ? "#fef3c7"
                                      : tx.type === "ADJUSTMENT"
                                        ? "#e0e7ff"
                                        : "#fee2e2",
                                color:
                                  tx.type === "EARN"
                                    ? "#166534"
                                    : tx.type === "UPGRADE"
                                      ? "#92400e"
                                      : tx.type === "ADJUSTMENT"
                                        ? "#3730a3"
                                        : "#991b1b",
                                border: `1px solid ${
                                  tx.type === "EARN"
                                    ? "#bbf7d0"
                                    : tx.type === "UPGRADE"
                                      ? "#fde68a"
                                      : tx.type === "ADJUSTMENT"
                                        ? "#c7d2fe"
                                        : "#fecaca"
                                }`,
                              }}
                            >
                              {getTxTypeName(tx.type)}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 10px",
                                borderRadius: 16,
                                fontWeight: 800,
                                fontSize: 13,
                                background: isPositive ? "#ecfdf5" : "#fef2f2",
                                color: isPositive ? "#059669" : "#dc2626",
                                border: `1px solid ${isPositive ? "#a7f3d0" : "#fecaca"}`,
                              }}
                            >
                              {isPositive ? `+${tx.points}` : tx.points}
                            </span>
                          </td>
                          <td style={{ fontSize: 13, textAlign: "left", paddingLeft: 16 }}>
                            {tx.description || "—"}
                            {tx.orderId && (
                              <span
                                style={{
                                  display: "inline-block",
                                  marginLeft: 8,
                                  color: "#0369a1",
                                  background: "#f0f9ff",
                                  border: "1px solid #bae6fd",
                                  padding: "2px 7px",
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                Đơn #{tx.orderId}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="admin-page__form-actions" style={{ marginTop: 20 }}>
              <button
                className="admin-page__button admin-page__button--secondary"
                type="button"
                onClick={closeHistory}
              >
                Đóng
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
