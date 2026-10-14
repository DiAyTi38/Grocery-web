import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAllOrdersAdminApi,
  updateOrderStatusAdminApi,
} from "../../services/api";
import "../admin.css";

const money = (value) => `${(Number(value) || 0).toLocaleString("vi-VN")} ₫`;

const STATUS_MAP = {
  PENDING: { label: "Đang chờ xử lý", color: "#d97706", bg: "#fef3c7" },
  PAID: { label: "Đã thanh toán", color: "#2563eb", bg: "#eff6ff" },
  SHIPPED: { label: "Đang giao hàng", color: "#0284c7", bg: "#e0f2fe" },
  DELIVERED: { label: "Giao thành công", color: "#059669", bg: "#ecfdf5" },
  CANCELLED: { label: "Đã hủy đơn", color: "#dc2626", bg: "#fee2e2" },
};

export default function AdminOrdersPage() {
  const { token } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      const data = await getAllOrdersAdminApi(token);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Không tải được danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleUpdateStatus(orderId, newStatus) {
    if (!token) return;
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    let confirmMsg = `Bạn có chắc muốn chuyển đơn #${orderId} sang trạng thái "${STATUS_MAP[newStatus]?.label || newStatus}"?`;
    if (newStatus === "DELIVERED") {
      confirmMsg += "\n\n💡 Hệ thống sẽ tự động kích hoạt cộng điểm Loyalty và nâng hạng cho khách hàng!";
    } else if (newStatus === "CANCELLED") {
      confirmMsg += "\n\n⚠️ Hệ thống sẽ tự động hoàn trả số lượng hàng vào kho!";
    }

    if (!window.confirm(confirmMsg)) return;

    setUpdatingId(orderId);
    setError("");
    setSuccess("");

    try {
      await updateOrderStatusAdminApi(token, orderId, newStatus);
      setSuccess(
        newStatus === "DELIVERED"
          ? `Đơn hàng #${orderId} đã giao thành công và cộng điểm Loyalty cho khách!`
          : newStatus === "CANCELLED"
          ? `Đã hủy đơn #${orderId} và hoàn trả số lượng tồn kho thành công!`
          : `Đã cập nhật trạng thái đơn #${orderId} thành công.`
      );
      await loadOrders();
    } catch (err) {
      setError(err.message || "Cập nhật trạng thái đơn hàng thất bại.");
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredOrders = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch = [
        order.id,
        order.username,
        order.customerName,
        order.totalAmount,
      ].some((val) => String(val ?? "").toLowerCase().includes(search));

      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, keyword, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "PENDING").length,
      shipped: orders.filter((o) => o.status === "SHIPPED").length,
      delivered: orders.filter((o) => o.status === "DELIVERED").length,
      cancelled: orders.filter((o) => o.status === "CANCELLED").length,
      totalRevenue: orders
        .filter((o) => o.status === "DELIVERED")
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0),
    };
  }, [orders]);

  return (
    <main className="admin-page">
      <header className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">SMART GROCERY / QUẢN TRỊ</p>
          <h1 className="admin-page__title">📋 Quản lý đơn hàng</h1>
          <p className="admin-page__subtitle">
            Theo dõi đơn đặt hàng, cập nhật trạng thái giao nhận và kích hoạt điểm thưởng thành viên.
          </p>
        </div>

        <button
          className="admin-page__button admin-page__button--secondary"
          onClick={loadOrders}
          disabled={loading}
          type="button"
        >
          ↻ {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </header>

      {/* THỐNG KÊ ĐƠN HÀNG */}
      <section className="admin-page__stats">
        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Tổng đơn hàng</span>
          <strong className="admin-page__stat-value">{stats.total}</strong>
          <span className="admin-page__stat-note">Tất cả đơn đặt</span>
        </article>

        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Chờ xử lý</span>
          <strong className="admin-page__stat-value" style={{ color: "#d97706" }}>
            {stats.pending}
          </strong>
          <span className="admin-page__stat-note">Cần duyệt & xuất kho</span>
        </article>

        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Giao thành công</span>
          <strong className="admin-page__stat-value" style={{ color: "#059669" }}>
            {stats.delivered}
          </strong>
          <span className="admin-page__stat-note">Đã tích điểm thưởng</span>
        </article>

        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Doanh thu hoàn tất</span>
          <strong className="admin-page__stat-value" style={{ fontSize: "20px" }}>
            {money(stats.totalRevenue)}
          </strong>
          <span className="admin-page__stat-note">Từ các đơn DELIVERED</span>
        </article>
      </section>

      {error && (
        <div className="admin-page__message admin-page__message--error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-page__message admin-page__message--success" role="status">
          {success}
        </div>
      )}

      {/* DANH SÁCH ĐƠN HÀNG */}
      <section className="admin-page__panel">
        <div className="admin-page__panel-header">
          <div>
            <h2 className="admin-page__panel-title">Danh sách đơn hàng</h2>
            <p className="admin-page__panel-subtitle">
              Hiển thị {filteredOrders.length} / {orders.length} đơn hàng.
            </p>
          </div>
        </div>

        <div className="admin-page__toolbar">
          <div className="admin-page__search">
            <input
              className="admin-page__input"
              aria-label="Tìm đơn hàng"
              placeholder="⌕  Tìm theo mã đơn (#...), tên khách, username..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div style={{ flex: "0 1 240px" }}>
            <select
              className="admin-page__select"
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý (PENDING)</option>
              <option value="SHIPPED">Đang giao hàng (SHIPPED)</option>
              <option value="DELIVERED">Đã giao thành công (DELIVERED)</option>
              <option value="CANCELLED">Đã hủy đơn (CANCELLED)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-page__empty">
            <div className="admin-page__empty-icon">⏳</div>
            <h3>Đang tải danh sách đơn hàng...</h3>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="admin-page__empty">
            <div className="admin-page__empty-icon">📦</div>
            <h3>Không tìm thấy đơn hàng nào</h3>
            <p>Thử đổi từ khóa hoặc bộ lọc trạng thái.</p>
          </div>
        ) : (
          <div className="admin-page__table-wrap">
            <table className="admin-page__table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Sản phẩm đặt</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thao tác vận hành</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || {
                    label: order.status,
                    color: "#64748b",
                    bg: "#f1f5f9",
                  };
                  const isUpdating = updatingId === order.id;

                  return (
                    <tr key={order.id}>
                      {/* Cột 1: Mã đơn & Ngày */}
                      <td>
                        <strong>#{order.id}</strong>
                        <div className="admin-page__muted" style={{ fontSize: "12px", marginTop: "4px" }}>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString("vi-VN")
                            : "—"}
                        </div>
                      </td>

                      {/* Cột 2: Khách hàng */}
                      <td>
                        <strong>{order.customerName || "Khách vãng lai"}</strong>
                        <div className="admin-page__muted" style={{ fontSize: "12px" }}>
                          @{order.username || `ID ${order.userId}`}
                        </div>
                      </td>

                      {/* Cột 3: Chi tiết món */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px" }}>
                          {order.items && order.items.length > 0 ? (
                            order.items.map((it) => (
                              <div key={it.id || it.productName}>
                                • <strong>{it.productName}</strong> × {it.quantity}{" "}
                                <span style={{ color: "#64748b" }}>({money(it.subtotal)})</span>
                              </div>
                            ))
                          ) : (
                            <span className="admin-page__muted">Không có chi tiết</span>
                          )}
                        </div>
                      </td>

                      {/* Cột 4: Tổng tiền */}
                      <td>
                        <strong style={{ color: "#10b981", fontSize: "15px" }}>
                          {money(order.totalAmount)}
                        </strong>
                      </td>

                      {/* Cột 5: Trạng thái */}
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 12px",
                            borderRadius: "16px",
                            fontSize: "12px",
                            fontWeight: "700",
                            backgroundColor: statusInfo.bg,
                            color: statusInfo.color,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Cột 6: Thao tác vận hành */}
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {order.status === "PENDING" && (
                            <>
                              <button
                                type="button"
                                className="admin-page__button"
                                style={{
                                  padding: "6px 10px",
                                  fontSize: "12px",
                                  backgroundColor: "#0284c7",
                                }}
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(order.id, "SHIPPED")}
                              >
                                🚚 Giao hàng
                              </button>

                              <button
                                type="button"
                                className="admin-page__button"
                                style={{
                                  padding: "6px 10px",
                                  fontSize: "12px",
                                  backgroundColor: "#059669",
                                }}
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                                title="Giao thành công & kích hoạt cộng điểm Loyalty"
                              >
                                ✅ Giao & Tích điểm
                              </button>

                              <button
                                type="button"
                                className="admin-page__button"
                                style={{
                                  padding: "6px 10px",
                                  fontSize: "12px",
                                  backgroundColor: "#ef4444",
                                }}
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                                title="Hủy đơn & tự động hoàn kho"
                              >
                                ❌ Hủy & Hoàn kho
                              </button>
                            </>
                          )}

                          {order.status === "SHIPPED" && (
                            <>
                              <button
                                type="button"
                                className="admin-page__button"
                                style={{
                                  padding: "6px 10px",
                                  fontSize: "12px",
                                  backgroundColor: "#059669",
                                }}
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                                title="Xác nhận khách đã nhận hàng & cộng điểm Loyalty"
                              >
                                ✅ Đã nhận & Tích điểm
                              </button>

                              <button
                                type="button"
                                className="admin-page__button"
                                style={{
                                  padding: "6px 10px",
                                  fontSize: "12px",
                                  backgroundColor: "#ef4444",
                                }}
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                              >
                                ❌ Hủy & Hoàn kho
                              </button>
                            </>
                          )}

                          {order.status === "DELIVERED" && (
                            <span style={{ fontSize: "13px", color: "#059669", fontWeight: "600" }}>
                              ✨ Đã hoàn tất (Đã cộng điểm)
                            </span>
                          )}

                          {order.status === "CANCELLED" && (
                            <span style={{ fontSize: "13px", color: "#dc2626", fontWeight: "600" }}>
                              Đã hủy (Đã hoàn kho)
                            </span>
                          )}
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
    </main>
  );
}
