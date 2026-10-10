import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../admin.css";

const EMPTY_FORM = {
  name: "",
  price: "",
  description: "",
  imageUrl: "",
  categoryId: "",
  stock: "0",
};

const money = (value) => `${(Number(value) || 0).toLocaleString("vi-VN")} ₫`;

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [productResult, categoryResult] = await Promise.all([
        request("/products"),
        request("/categories"),
      ]);

      setProducts(
        Array.isArray(productResult)
          ? productResult
          : productResult?.content || productResult?.data || [],
      );

      setCategories(
        Array.isArray(categoryResult)
          ? categoryResult
          : categoryResult?.content || categoryResult?.data || [],
      );
    } catch (err) {
      setError(err.message || "Không tải được dữ liệu sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProducts = products.filter((product) => {
    const text = [
      product.name,
      product.description,
      product.id,
      product.category?.name,
      product.categoryName,
    ]
      .join(" ")
      .toLowerCase();

    const categoryId = product.category?.id ?? product.categoryId;

    return (
      text.includes(keyword.toLowerCase().trim()) &&
      (categoryFilter === "ALL" || String(categoryId ?? "") === categoryFilter)
    );
  });

  const totalStock = products.reduce(
    (total, product) =>
      total + (Number(product.stock ?? product.quantity) || 0),
    0,
  );

  const lowStockCount = products.filter((product) => {
    const stock = Number(product.stock ?? product.quantity) || 0;
    return stock <= 5;
  }).length;

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      price: String(product.price ?? ""),
      description: product.description || "",
      imageUrl: product.imageUrl || product.image || "",
      categoryId: String(product.category?.id ?? product.categoryId ?? ""),
      stock: String(product.stock ?? product.quantity ?? 0),
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Vui lòng nhập tên sản phẩm.");
      return;
    }

    if (
      form.price === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      setError("Giá sản phẩm không hợp lệ.");
      return;
    }

    if (!form.categoryId) {
      setError("Vui lòng chọn danh mục.");
      return;
    }

    if (!Number.isFinite(Number(form.stock)) || Number(form.stock) < 0) {
      setError("Số lượng tồn kho không hợp lệ.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      categoryId: Number(form.categoryId),
      stock: Number(form.stock),
    };

    setSaving(true);

    try {
      await request(
        editingId != null ? `/products/${editingId}` : "/products",
        {
          method: editingId != null ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );

      setShowForm(false);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });
      setSuccess(
        editingId != null
          ? "Cập nhật sản phẩm thành công."
          : "Thêm sản phẩm mới thành công.",
      );

      await loadData();
    } catch (err) {
      setError(err.message || "Không lưu được sản phẩm.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa sản phẩm "${product.name}" không?`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(product.id);

    try {
      await request(`/products/${product.id}`, {
        method: "DELETE",
      });

      setSuccess(`Đã xóa sản phẩm "${product.name}".`);
      await loadData();
    } catch (err) {
      setError(err.message || "Không xóa được sản phẩm.");
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
            onClick={() => navigate("/admin")}
            type="button"
            style={{ marginBottom: 20 }}
          >
            ← Quay lại Dashboard
          </button>

          <p className="admin-page__eyebrow">SMART GROCERY / QUẢN TRỊ</p>
          <h1 className="admin-page__title">Quản lý sản phẩm</h1>
          <p className="admin-page__subtitle">
            Quản lý danh mục hàng hóa, giá bán và tình trạng tồn kho.
          </p>
        </div>

        <button
          className="admin-page__button"
          onClick={openCreate}
          type="button"
        >
          <span aria-hidden="true">＋</span> Thêm sản phẩm
        </button>
      </header>

      <section className="admin-page__stats">
        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Tổng sản phẩm</span>
          <strong className="admin-page__stat-value">
            {products.length.toLocaleString("vi-VN")}
          </strong>
          <span className="admin-page__stat-note">Sản phẩm trong hệ thống</span>
        </article>

        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Kết quả đang hiển thị</span>
          <strong className="admin-page__stat-value">
            {filteredProducts.length.toLocaleString("vi-VN")}
          </strong>
          <span className="admin-page__stat-note">Theo bộ lọc hiện tại</span>
        </article>

        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Tổng danh mục</span>
          <strong className="admin-page__stat-value">
            {categories.length.toLocaleString("vi-VN")}
          </strong>
          <span className="admin-page__stat-note">Danh mục hàng hóa</span>
        </article>

        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Sản phẩm sắp hết</span>
          <strong className="admin-page__stat-value">
            {lowStockCount.toLocaleString("vi-VN")}
          </strong>
          <span className="admin-page__stat-note">
            Còn không quá 5 sản phẩm
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
            aria-labelledby="product-form-title"
          >
            <h2 id="product-form-title">
              {editingId != null ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
            </h2>

            <p className="admin-page__modal-description">
              Điền thông tin hàng hóa bên dưới. Các trường có dấu * là bắt buộc.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="admin-page__form-grid">
                <div className="admin-page__field admin-page__field--full">
                  <label htmlFor="product-name">Tên sản phẩm *</label>
                  <input
                    id="product-name"
                    className="admin-page__input"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ví dụ: Sữa tươi không đường"
                  />
                </div>

                <div className="admin-page__field">
                  <label htmlFor="product-price">Giá bán (VNĐ) *</label>
                  <input
                    id="product-price"
                    className="admin-page__input"
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    placeholder="Ví dụ: 25000"
                  />
                </div>

                <div className="admin-page__field">
                  <label htmlFor="product-stock">Tồn kho *</label>
                  <input
                    id="product-stock"
                    className="admin-page__input"
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: e.target.value })
                    }
                    placeholder="Số lượng hiện có"
                  />
                </div>

                <div className="admin-page__field admin-page__field--full">
                  <label htmlFor="product-category">Danh mục *</label>
                  <select
                    id="product-category"
                    className="admin-page__select"
                    required
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({ ...form, categoryId: e.target.value })
                    }
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-page__field admin-page__field--full">
                  <label htmlFor="product-image">Đường dẫn ảnh</label>
                  <input
                    id="product-image"
                    className="admin-page__input"
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) =>
                      setForm({ ...form, imageUrl: e.target.value })
                    }
                    placeholder="https://example.com/product.jpg"
                  />
                  {form.imageUrl.trim() && (
                    <div className="admin-product-preview">
                      <img
                        src={form.imageUrl}
                        alt="Xem trước sản phẩm"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        onLoad={(e) => {
                          e.currentTarget.style.display = "block";
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="admin-page__field admin-page__field--full">
                  <label htmlFor="product-description">Mô tả</label>
                  <textarea
                    id="product-description"
                    className="admin-page__input admin-page__textarea"
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Mô tả thông tin sản phẩm..."
                  />
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
                  disabled={saving}
                  type="submit"
                >
                  {saving
                    ? "Đang lưu..."
                    : editingId != null
                      ? "Lưu thay đổi"
                      : "Thêm sản phẩm"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <section className="admin-page__panel">
        <div className="admin-page__panel-header">
          <div>
            <h2 className="admin-page__panel-title">Danh sách sản phẩm</h2>
            <p className="admin-page__panel-subtitle">
              Tra cứu, lọc và cập nhật hàng hóa trong cửa hàng.
            </p>
          </div>

          <button
            className="admin-page__button admin-page__button--secondary"
            type="button"
            onClick={loadData}
            disabled={loading}
          >
            ↻ {loading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        <div className="admin-page__toolbar">
          <div className="admin-page__search">
            <input
              className="admin-page__input"
              aria-label="Tìm kiếm sản phẩm"
              placeholder="⌕  Tìm theo tên, mã hoặc mô tả..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div style={{ flex: "0 1 240px" }}>
            <select
              className="admin-page__select"
              aria-label="Lọc theo danh mục"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-page__empty">
            <div className="admin-page__empty-icon">⏳</div>
            <h3>Đang tải dữ liệu</h3>
            <p>Vui lòng chờ trong giây lát...</p>
          </div>
        ) : (
          <div className="admin-page__table-wrap">
            <table className="admin-page__table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Giá bán</th>
                  <th>Tồn kho</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const stock = Number(product.stock ?? product.quantity ?? 0);
                  const image = product.imageUrl || product.image;
                  const categoryName =
                    product.category?.name || product.categoryName || "—";

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="admin-page__product">
                          <div className="admin-page__product-image">
                            {image ? (
                              <img
                                src={image}
                                alt={product.name || "Sản phẩm"}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <span aria-hidden="true">🛒</span>
                            )}
                          </div>

                          <div>
                            <div className="admin-page__product-name">
                              {product.name || "Chưa đặt tên"}
                            </div>
                            <div className="admin-page__muted">
                              Mã SP: {product.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>{categoryName}</td>
                      <td>
                        <strong>{money(product.price)}</strong>
                      </td>
                      <td>{stock.toLocaleString("vi-VN")}</td>

                      <td>
                        <span
                          className={`admin-page__badge ${
                            stock <= 0
                              ? "admin-page__badge--danger"
                              : stock <= 5
                                ? "admin-page__badge--warning"
                                : ""
                          }`}
                        >
                          {stock <= 0
                            ? "Hết hàng"
                            : stock <= 5
                              ? "Sắp hết"
                              : "Còn hàng"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-page__actions">
                          <button
                            className="admin-page__action"
                            type="button"
                            onClick={() => openEdit(product)}
                          >
                            Sửa
                          </button>

                          <button
                            className="admin-page__action admin-page__action--delete"
                            type="button"
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.id}
                          >
                            {deletingId === product.id ? "Đang xóa..." : "Xóa"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="admin-page__empty">
                <div className="admin-page__empty-icon">📦</div>
                <h3>Không tìm thấy sản phẩm</h3>
                <p>
                  Thử thay đổi từ khóa hoặc bộ lọc danh mục để xem kết quả khác.
                </p>
                {keyword || categoryFilter !== "ALL" ? (
                  <button
                    className="admin-page__button admin-page__button--secondary"
                    type="button"
                    onClick={() => {
                      setKeyword("");
                      setCategoryFilter("ALL");
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                ) : (
                  <button
                    className="admin-page__button"
                    type="button"
                    onClick={openCreate}
                  >
                    ＋ Thêm sản phẩm đầu tiên
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
