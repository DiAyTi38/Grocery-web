import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../admin.css";

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { user, token, getAdminUsers, updateAdminUserStatus } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getAdminUsers();

      // Hỗ trợ API trả về mảng hoặc Spring Page.
      const list = Array.isArray(result)
        ? result
        : result?.content || result?.users || result?.data || [];

      if (!Array.isArray(list)) {
        throw new Error("Dữ liệu tài khoản từ backend không hợp lệ.");
      }

      setUsers(list);
    } catch (err) {
      setError(
        err.message ||
          "Không tải được danh sách tài khoản. Hãy kiểm tra API backend.",
      );
    } finally {
      setLoading(false);
    }
  }, [getAdminUsers]);

  useEffect(() => {
    if (!token || !user) {
      setError("Phiên đăng nhập không tồn tại. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    loadUsers();
  }, [token, user, loadUsers]);

  const getRole = (account) =>
    String(account.role || account.roles?.[0] || "ROLE_USER")
      .replace(/^ROLE_/, "")
      .toUpperCase();

  const isEnabled = (account) =>
    account.enabled !== false &&
    account.active !== false &&
    account.locked !== true &&
    account.status !== "LOCKED" &&
    account.status !== "DISABLED";

  const filteredUsers = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return users.filter((account) => {
      const matchesKeyword = [
        account.id,
        account.username,
        account.fullName,
        account.name,
        account.email,
        account.phone,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(search),
      );

      const matchesRole =
        roleFilter === "ALL" || getRole(account) === roleFilter;

      const enabled = isEnabled(account);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && enabled) ||
        (statusFilter === "LOCKED" && !enabled);

      return matchesKeyword && matchesRole && matchesStatus;
    });
  }, [users, keyword, roleFilter, statusFilter]);

  const activeCount = users.filter(isEnabled).length;
  const lockedCount = users.length - activeCount;
  const adminCount = users.filter(
    (account) =>
      ["ADMIN", "ROLE_ADMIN"].includes(
        String(account.role || "").toUpperCase(),
      ) ||
      (account.roles || []).some(
        (role) => String(role).toUpperCase() === "ROLE_ADMIN",
      ),
  ).length;

  async function handleToggleStatus(account) {
    const id = account.id ?? account.userId;

    if (id == null) {
      setError("Tài khoản không có ID nên không thể cập nhật.");
      return;
    }

    const currentlyEnabled = isEnabled(account);
    const nextEnabled = !currentlyEnabled;
    const label = account.username || account.email || `ID ${id}`;

    if (
      !window.confirm(
        `Bạn có chắc muốn ${nextEnabled ? "mở khóa" : "khóa"} tài khoản ${label}?`,
      )
    ) {
      return;
    }

    setUpdatingId(id);
    setError("");

    try {
      await updateAdminUserStatus(id, nextEnabled);
      await loadUsers();
    } catch (err) {
      setError(
        err.message ||
          "Không cập nhật được trạng thái. Hãy kiểm tra API backend.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="admin-users-page">
      <header className="admin-users-header">
        <div>
          <button
            className="admin-users-back"
            type="button"
            onClick={() => navigate("/admin")}
          >
            ← Quay lại Dashboard
          </button>

          <p className="admin-users-eyebrow">SMART GROCERY · ADMIN</p>
          <h1>👥 Quản lý tài khoản</h1>
          <p className="admin-users-subtitle">
            Theo dõi, tìm kiếm và quản lý tài khoản người dùng trong hệ thống.
          </p>
        </div>

        <button
          className="admin-users-refresh"
          type="button"
          onClick={loadUsers}
          disabled={loading}
        >
          ↻ {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </header>

      <section className="admin-users-stats">
        <article className="admin-users-stat">
          <span>Tổng tài khoản</span>
          <strong>{users.length}</strong>
          <small>Tất cả tài khoản</small>
        </article>

        <article className="admin-users-stat">
          <span>Đang hoạt động</span>
          <strong>{activeCount}</strong>
          <small>Tài khoản chưa bị khóa</small>
        </article>

        <article className="admin-users-stat">
          <span>Đã khóa</span>
          <strong>{lockedCount}</strong>
          <small>Tài khoản không hoạt động</small>
        </article>

        <article className="admin-users-stat">
          <span>Quản trị viên</span>
          <strong>{adminCount}</strong>
          <small>Tài khoản có quyền Admin</small>
        </article>
      </section>

      {error && (
        <div className="admin-users-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            Đóng
          </button>
        </div>
      )}

      <section className="admin-users-panel">
        <div className="admin-users-panel-heading">
          <div>
            <h2>Danh sách tài khoản</h2>
            <p>
              Hiển thị {filteredUsers.length} / {users.length} tài khoản
            </p>
          </div>
        </div>

        <div className="admin-users-toolbar">
          <input
            type="search"
            placeholder="Tìm theo tên, username, email, số điện thoại..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            aria-label="Tìm kiếm tài khoản"
          />

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="Lọc theo vai trò"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">Khách hàng</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Lọc theo trạng thái"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
          </select>
        </div>

        {loading ? (
          <div className="admin-users-empty">
            Đang tải danh sách tài khoản...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-users-empty">
            <span>🔎</span>
            <h3>Không tìm thấy tài khoản</h3>
            <p>Thử thay đổi từ khóa hoặc bộ lọc.</p>
            <button
              type="button"
              onClick={() => {
                setKeyword("");
                setRoleFilter("ALL");
                setStatusFilter("ALL");
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Tài khoản</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th className="admin-users-action-col">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((account, index) => {
                  const id = account.id ?? account.userId ?? index;
                  const role = getRole(account);
                  const enabled = isEnabled(account);
                  const name =
                    account.fullName ||
                    account.name ||
                    account.username ||
                    "Chưa cập nhật";
                  const username = account.username || `ID ${id}`;

                  return (
                    <tr key={id}>
                      <td>
                        <div className="admin-users-identity">
                          <div className="admin-users-avatar">
                            {String(name).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{name}</strong>
                            <span>@{username}</span>
                          </div>
                        </div>
                      </td>

                      <td>{account.email || "—"}</td>

                      <td>
                        <span
                          className={`admin-users-role ${
                            role === "ADMIN" ? "role-admin" : "role-user"
                          }`}
                        >
                          {role === "ADMIN" ? "Quản trị viên" : "Khách hàng"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-users-status ${
                            enabled ? "status-active" : "status-locked"
                          }`}
                        >
                          <span />
                          {enabled ? "Hoạt động" : "Đã khóa"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={`admin-users-toggle ${
                            enabled ? "toggle-lock" : "toggle-unlock"
                          }`}
                          disabled={
                            updatingId === (account.id ?? account.userId) ||
                            String(account.id ?? account.userId) ===
                              String(user?.id)
                          }
                          title={
                            String(account.id ?? account.userId) ===
                            String(user?.id)
                              ? "Không thể tự khóa tài khoản đang đăng nhập"
                              : ""
                          }
                          onClick={() => handleToggleStatus(account)}
                        >
                          {updatingId === (account.id ?? account.userId)
                            ? "Đang lưu..."
                            : enabled
                              ? "Khóa"
                              : "Mở khóa"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="admin-users-note">
        Lưu ý: thao tác khóa/mở khóa cần được backend xác thực quyền Admin.
        Trang này không tự thay đổi vai trò hoặc xóa tài khoản.
      </p>
    </main>
  );
}
