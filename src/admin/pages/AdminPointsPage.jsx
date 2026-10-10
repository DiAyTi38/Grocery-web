import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../admin.css";

const money = (value) => `${(Number(value) || 0).toLocaleString("vi-VN")} ₫`;

function getTier(spent) {
  const amount = Number(spent) || 0;

  if (amount >= 5000000) {
    return {
      name: "Kim cương",
      icon: "💎",
      className: "diamond",
    };
  }

  if (amount >= 2000000) {
    return {
      name: "Vàng",
      icon: "🥇",
      className: "gold",
    };
  }

  if (amount >= 500000) {
    return {
      name: "Bạc",
      icon: "🥈",
      className: "silver",
    };
  }

  return {
    name: "Chưa xếp hạng",
    icon: "⭐",
    className: "default",
  };
}

export default function AdminPointsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!token) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      const response = await fetch("http://localhost:8081/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      let result = null;

      try {
        result = text ? JSON.parse(text) : null;
      } catch {
        result = text;
      }

      if (!response.ok) {
        throw new Error(
          typeof result === "string"
            ? result
            : result?.message ||
                result?.error ||
                `Yêu cầu thất bại (HTTP ${response.status})`,
        );
      }

      setUsers(
        Array.isArray(result)
          ? result
          : result?.content || result?.users || result?.data || [],
      );
    } catch (err) {
      setError(err.message || "Không tải được thông tin thành viên.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const members = users.map((account) => ({
    ...account,
    spent: Number(account.totalSpent ?? account.total_spent ?? 0),
  }));

  const filtered = members.filter((account) => {
    const search = keyword.toLowerCase().trim();
    const tier = getTier(account.spent).name;

    const searchableText = [
      account.username,
      account.fullName,
      account.name,
      account.email,
      account.id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      searchableText.includes(search) &&
      (tierFilter === "ALL" || tier === tierFilter)
    );
  });

  const totalSpent = members.reduce((sum, account) => sum + account.spent, 0);

  const tierCounts = {
    diamond: members.filter(
      (account) => getTier(account.spent).className === "diamond",
    ).length,
    gold: members.filter(
      (account) => getTier(account.spent).className === "gold",
    ).length,
    silver: members.filter(
      (account) => getTier(account.spent).className === "silver",
    ).length,
  };

  return (
    <main className="admin-page">
      <header className="admin-page__header">
        <div>
          <button
            className="admin-page__button admin-page__button--secondary"
            type="button"
            onClick={() => navigate("/admin")}
            style={{ marginBottom: 20 }}
          >
            ← Quay lại Dashboard
          </button>

          <p className="admin-page__eyebrow">SMART GROCERY / QUẢN TRỊ</p>

          <h1 className="admin-page__title">Quản lý điểm thành viên</h1>

          <p className="admin-page__subtitle">
            Theo dõi tổng chi tiêu và phân hạng khách hàng thân thiết.
          </p>
        </div>

        <button
          className="admin-page__button admin-page__button--secondary"
          type="button"
          onClick={loadUsers}
          disabled={loading}
        >
          ↻ {loading ? "Đang tải..." : "Làm mới dữ liệu"}
        </button>
      </header>

      <section className="admin-page__stats">
        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Tổng thành viên</span>
          <strong className="admin-page__stat-value">
            {users.length.toLocaleString("vi-VN")}
          </strong>
          <span className="admin-page__stat-note">
            Tài khoản được tải từ hệ thống
          </span>
        </article>

        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Tổng chi tiêu ghi nhận</span>
          <strong className="admin-page__stat-value admin-points-money">
            {money(totalSpent)}
          </strong>
          <span className="admin-page__stat-note">
            Tổng giá trị từ dữ liệu thành viên
          </span>
        </article>

        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Hạng vàng trở lên</span>
          <strong className="admin-page__stat-value">
            {(tierCounts.gold + tierCounts.diamond).toLocaleString("vi-VN")}
          </strong>
          <span className="admin-page__stat-note">
            Thành viên chi tiêu từ 2 triệu đồng
          </span>
        </article>

        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Hạng kim cương</span>
          <strong className="admin-page__stat-value">
            {tierCounts.diamond.toLocaleString("vi-VN")}
          </strong>
          <span className="admin-page__stat-note">
            Thành viên chi tiêu từ 5 triệu đồng
          </span>
        </article>
      </section>

      <section className="admin-page__panel admin-points-tier-panel">
        <div className="admin-page__panel-header">
          <div>
            <h2 className="admin-page__panel-title">Các hạng thành viên</h2>
            <p className="admin-page__panel-subtitle">
              Hạng được xác định theo tổng chi tiêu ghi nhận.
            </p>
          </div>
        </div>

        <div className="admin-points-tier-grid">
          <article className="admin-points-tier-card admin-points-tier-card--diamond">
            <span className="admin-points-tier-icon">💎</span>
            <div>
              <strong>Kim cương</strong>
              <p>Từ 5.000.000 ₫</p>
              <span>{tierCounts.diamond} thành viên</span>
            </div>
          </article>

          <article className="admin-points-tier-card admin-points-tier-card--gold">
            <span className="admin-points-tier-icon">🥇</span>
            <div>
              <strong>Vàng</strong>
              <p>Từ 2.000.000 ₫ đến dưới 5.000.000 ₫</p>
              <span>{tierCounts.gold} thành viên</span>
            </div>
          </article>

          <article className="admin-points-tier-card admin-points-tier-card--silver">
            <span className="admin-points-tier-icon">🥈</span>
            <div>
              <strong>Bạc</strong>
              <p>Từ 500.000 ₫ đến dưới 2.000.000 ₫</p>
              <span>{tierCounts.silver} thành viên</span>
            </div>
          </article>
        </div>
      </section>

      <div className="admin-page__message admin-points-notice">
        <strong>Lưu ý về dữ liệu:</strong> Hạng thành viên được tính từ trường{" "}
        <code>totalSpent</code> hoặc <code>total_spent</code> do backend trả về.
        Nếu API chưa lưu tổng chi tiêu, các thành viên có thể đều hiển thị hạng
        chưa xếp hạng. Trang này chỉ xem dữ liệu, chưa thay đổi điểm hoặc chi
        tiêu trong database.
      </div>

      {error && (
        <div
          className="admin-page__message admin-page__message--error"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className="admin-page__panel">
        <div className="admin-page__panel-header">
          <div>
            <h2 className="admin-page__panel-title">Danh sách thành viên</h2>
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
              placeholder="⌕  Tìm theo tên, username hoặc email..."
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
              <option value="Chưa xếp hạng">Chưa xếp hạng</option>
              <option value="Bạc">Bạc</option>
              <option value="Vàng">Vàng</option>
              <option value="Kim cương">Kim cương</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-page__empty">
            <div className="admin-page__empty-icon">⏳</div>
            <h3>Đang tải thành viên</h3>
            <p>Đang lấy thông tin khách hàng từ hệ thống...</p>
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
                  <th>Email</th>
                  <th>Tổng chi tiêu</th>
                  <th>Hạng thành viên</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((account, index) => {
                  const tier = getTier(account.spent);
                  const displayName =
                    account.fullName ||
                    account.name ||
                    account.username ||
                    "Chưa cập nhật";

                  return (
                    <tr key={account.id ?? account.userId ?? index}>
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
                              @{account.username || "chưa có username"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>{account.email || "—"}</td>

                      <td>
                        <strong>{money(account.spent)}</strong>
                      </td>

                      <td>
                        <span
                          className={`admin-points-tier-badge admin-points-tier-badge--${tier.className}`}
                        >
                          <span aria-hidden="true">{tier.icon}</span>
                          {tier.name}
                        </span>
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
