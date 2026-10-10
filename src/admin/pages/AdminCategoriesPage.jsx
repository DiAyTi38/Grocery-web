import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../admin.css";

export default function AdminCategoriesPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [keyword, setKeyword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const request = useCallback(
    async (path, options = {}) => {
      if (!token) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      const response = await fetch(`http://localhost:8081/api${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      const text = await response.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
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

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await request("/categories");

      setCategories(
        Array.isArray(result) ? result : result?.content || result?.data || [],
      );
    } catch (err) {
      setError(err.message || "Không tải được danh mục.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const filtered = categories.filter((category) =>
    `${category.name || ""} ${category.description || ""} ${category.id || ""}`
      .toLowerCase()
      .includes(keyword.toLowerCase().trim()),
  );

  function openCreate() {
    setEditingId(null);
    setName("");
    setDescription("");
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEdit(category) {
    setEditingId(category.id);
    setName(category.name || "");
    setDescription(category.description || "");
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setName("");
    setDescription("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Vui lòng nhập tên danh mục.");
      return;
    }

    setSaving(true);

    try {
      const wasEditing = editingId != null;

      await request(wasEditing ? `/categories/${editingId}` : "/categories", {
        method: wasEditing ? "PUT" : "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      setShowForm(false);
      setEditingId(null);
      setName("");
      setDescription("");

      setSuccess(
        wasEditing
          ? "Cập nhật danh mục thành công."
          : "Thêm danh mục mới thành công.",
      );

      await loadCategories();
    } catch (err) {
      setError(err.message || "Không lưu được danh mục.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa danh mục "${category.name}" không?\n\nHãy đảm bảo danh mục không còn sản phẩm liên quan.`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(category.id);

    try {
      await request(`/categories/${category.id}`, {
        method: "DELETE",
      });

      setSuccess(`Đã xóa danh mục "${category.name}".`);
      await loadCategories();
    } catch (err) {
      setError(
        err.message ||
          "Không xóa được danh mục. Hãy kiểm tra các sản phẩm đang sử dụng danh mục này.",
      );
    } finally {
      setDeletingId(null);
    }
  }

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

          <h1 className="admin-page__title">Quản lý danh mục</h1>

          <p className="admin-page__subtitle">
            Tổ chức và phân loại sản phẩm để khách hàng dễ dàng mua sắm.
          </p>
        </div>

        <button
          className="admin-page__button"
          type="button"
          onClick={openCreate}
        >
          ＋ Thêm danh mục
        </button>
      </header>

      <section className="admin-page__stats">
        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Tổng danh mục</span>

          <strong className="admin-page__stat-value">
            {categories.length.toLocaleString("vi-VN")}
          </strong>

          <span className="admin-page__stat-note">Danh mục trong hệ thống</span>
        </article>

        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Kết quả tìm kiếm</span>

          <strong className="admin-page__stat-value">
            {filtered.length.toLocaleString("vi-VN")}
          </strong>

          <span className="admin-page__stat-note">Theo từ khóa hiện tại</span>
        </article>

        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Có mô tả</span>

          <strong className="admin-page__stat-value">
            {
              categories.filter((category) =>
                Boolean(category.description?.trim()),
              ).length
            }
          </strong>

          <span className="admin-page__stat-note">
            Danh mục đã có thông tin mô tả
          </span>
        </article>

        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Chưa có mô tả</span>

          <strong className="admin-page__stat-value">
            {
              categories.filter((category) => !category.description?.trim())
                .length
            }
          </strong>

          <span className="admin-page__stat-note">
            Có thể bổ sung để rõ ràng hơn
          </span>
        </article>
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

      {showForm && (
        <div className="admin-page__modal-backdrop">
          <section
            className="admin-page__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-form-title"
          >
            <h2 id="category-form-title">
              {editingId != null ? "Cập nhật danh mục" : "Thêm danh mục mới"}
            </h2>

            <p className="admin-page__modal-description">
              Nhập tên và mô tả để quản lý nhóm sản phẩm trong cửa hàng.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="admin-page__form-grid">
                <div className="admin-page__field admin-page__field--full">
                  <label htmlFor="category-name">Tên danh mục *</label>

                  <input
                    id="category-name"
                    className="admin-page__input"
                    required
                    maxLength={100}
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Đồ uống, Thực phẩm tươi sống..."
                  />
                </div>

                <div className="admin-page__field admin-page__field--full">
                  <label htmlFor="category-description">Mô tả danh mục</label>

                  <textarea
                    id="category-description"
                    className="admin-page__input admin-categories-textarea"
                    rows={4}
                    maxLength={500}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả các loại sản phẩm thuộc danh mục này..."
                  />

                  <span className="admin-categories-counter">
                    {description.length}/500 ký tự
                  </span>
                </div>
              </div>

              <div className="admin-page__form-actions">
                <button
                  className="admin-page__button admin-page__button--secondary"
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button
                  className="admin-page__button"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Đang lưu..."
                    : editingId != null
                      ? "Lưu thay đổi"
                      : "Tạo danh mục"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <section className="admin-page__panel">
        <div className="admin-page__panel-header">
          <div>
            <h2 className="admin-page__panel-title">Danh sách danh mục</h2>

            <p className="admin-page__panel-subtitle">
              Tìm kiếm, cập nhật hoặc xóa nhóm sản phẩm.
            </p>
          </div>

          <button
            className="admin-page__button admin-page__button--secondary"
            type="button"
            onClick={loadCategories}
            disabled={loading}
          >
            ↻ {loading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        <div className="admin-page__toolbar">
          <div className="admin-page__search">
            <input
              className="admin-page__input"
              aria-label="Tìm kiếm danh mục"
              placeholder="⌕  Tìm theo tên, mô tả hoặc mã danh mục..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          {keyword && (
            <button
              className="admin-page__button admin-page__button--secondary"
              type="button"
              onClick={() => setKeyword("")}
            >
              Xóa tìm kiếm
            </button>
          )}
        </div>

        {loading ? (
          <div className="admin-page__empty">
            <div className="admin-page__empty-icon">⏳</div>
            <h3>Đang tải danh mục</h3>
            <p>Vui lòng chờ trong giây lát...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-page__empty">
            <div className="admin-page__empty-icon">📂</div>
            <h3>Không tìm thấy danh mục</h3>
            <p>Thử thay đổi từ khóa tìm kiếm hoặc tạo danh mục mới.</p>

            {keyword ? (
              <button
                className="admin-page__button admin-page__button--secondary"
                type="button"
                onClick={() => setKeyword("")}
              >
                Xóa bộ lọc
              </button>
            ) : (
              <button
                className="admin-page__button"
                type="button"
                onClick={openCreate}
              >
                ＋ Tạo danh mục đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="admin-page__table-wrap">
            <table className="admin-page__table">
              <thead>
                <tr>
                  <th>Mã danh mục</th>
                  <th>Tên danh mục</th>
                  <th>Mô tả</th>
                  <th>Trạng thái mô tả</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((category) => {
                  const hasDescription = Boolean(category.description?.trim());

                  return (
                    <tr key={category.id}>
                      <td>
                        <span className="admin-category-id">
                          #{category.id}
                        </span>
                      </td>

                      <td>
                        <div className="admin-page__product">
                          <div className="admin-category-icon">
                            <span aria-hidden="true">📂</span>
                          </div>

                          <div className="admin-page__product-name">
                            {category.name || "Chưa đặt tên"}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="admin-category-description">
                          {category.description || "Chưa có mô tả"}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-page__badge ${
                            hasDescription ? "" : "admin-page__badge--warning"
                          }`}
                        >
                          {hasDescription ? "Đã cập nhật" : "Chưa có mô tả"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-page__actions">
                          <button
                            className="admin-page__action"
                            type="button"
                            onClick={() => openEdit(category)}
                          >
                            Sửa
                          </button>

                          <button
                            className="admin-page__action admin-page__action--delete"
                            type="button"
                            onClick={() => handleDelete(category)}
                            disabled={deletingId === category.id}
                          >
                            {deletingId === category.id ? "Đang xóa..." : "Xóa"}
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
    </main>
  );
}
