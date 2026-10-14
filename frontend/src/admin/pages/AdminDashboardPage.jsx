import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function AdminDashboardPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [stats, setStats] = useState({
    usersCount: 0,
    productsCount: 0,
    categoriesCount: 0,
    ordersCount: 0,
    pendingOrdersCount: 0,
    totalStock: 0,
  });

  useEffect(() => {
    if (!token) return;

    async function loadStats() {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const [usersRes, productsRes, categoriesRes, ordersRes] = await Promise.all([
          fetch("http://localhost:8080/api/users", { headers }),
          fetch("http://localhost:8080/api/products", { headers }),
          fetch("http://localhost:8080/api/categories", { headers }),
          fetch("http://localhost:8080/api/orders/admin", { headers }),
        ]);

        const usersData = usersRes.ok ? await usersRes.json() : [];
        const productsData = productsRes.ok ? await productsRes.json() : [];
        const categoriesData = categoriesRes.ok ? await categoriesRes.json() : [];
        const ordersData = ordersRes.ok ? await ordersRes.json() : [];

        const usersList = Array.isArray(usersData) ? usersData : usersData?.content || [];
        const productsList = Array.isArray(productsData) ? productsData : productsData?.content || [];
        const categoriesList = Array.isArray(categoriesData) ? categoriesData : categoriesData?.content || [];
        const ordersList = Array.isArray(ordersData) ? ordersData : [];

        const totalStock = productsList.reduce((acc, p) => {
          return acc + (Number(p.availableQuantity ?? p.stockQuantity ?? p.stock ?? 0) || 0);
        }, 0);

        const pendingOrders = ordersList.filter((o) => o.status === "PENDING").length;

        setStats({
          usersCount: usersList.length,
          productsCount: productsList.length,
          categoriesCount: categoriesList.length,
          ordersCount: ordersList.length,
          pendingOrdersCount: pendingOrders,
          totalStock,
        });
      } catch (err) {
        console.warn("Lỗi tải thống kê Dashboard:", err);
      }
    }

    loadStats();
  }, [token]);

  return (
    <main style={styles.main}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>

            <p style={styles.subtitle}>
              Chào mừng bạn đến với trang quản trị Smart Grocery
            </p>
          </div>

          <div style={styles.adminAccount}>👤 Admin</div>
        </div>

        {/* ==================================================
            THỐNG KÊ
        ================================================== */}
        <div style={styles.stats}>
          {/* TÀI KHOẢN */}
          <div
            style={styles.card}
            onClick={() => navigate("/admin/users")}
            role="button"
            tabIndex={0}
          >
            <div style={styles.cardIcon}>👥</div>

            <div>
              <p style={styles.cardLabel}>Tài khoản</p>

              <h2 style={styles.cardNumber}>{stats.usersCount}</h2>
            </div>
          </div>

          {/* ĐƠN HÀNG */}
          <div
            style={styles.card}
            onClick={() => navigate("/admin/orders")}
            role="button"
            tabIndex={0}
          >
            <div style={styles.cardIcon}>📋</div>

            <div>
              <p style={styles.cardLabel}>
                Đơn hàng {stats.pendingOrdersCount > 0 ? `(${stats.pendingOrdersCount} chờ)` : ""}
              </p>

              <h2 style={styles.cardNumber}>{stats.ordersCount}</h2>
            </div>
          </div>

          {/* SẢN PHẨM */}
          <div
            style={styles.card}
            onClick={() => navigate("/admin/products")}
            role="button"
            tabIndex={0}
          >
            <div style={styles.cardIcon}>📦</div>

            <div>
              <p style={styles.cardLabel}>Sản phẩm</p>

              <h2 style={styles.cardNumber}>{stats.productsCount}</h2>
            </div>
          </div>

          {/* DANH MỤC */}
          <div
            style={styles.card}
            onClick={() => navigate("/admin/categories")}
            role="button"
            tabIndex={0}
          >
            <div style={styles.cardIcon}>🗂️</div>

            <div>
              <p style={styles.cardLabel}>Danh mục</p>

              <h2 style={styles.cardNumber}>{stats.categoriesCount}</h2>
            </div>
          </div>

          {/* TỒN KHO HỆ THỐNG */}
          <div
            style={styles.card}
            onClick={() => navigate("/admin/products")}
            role="button"
            tabIndex={0}
          >
            <div style={styles.cardIcon}>📊</div>

            <div>
              <p style={styles.cardLabel}>Tổng tồn kho</p>

              <h2 style={styles.cardNumber}>{stats.totalStock}</h2>
            </div>
          </div>
        </div>

        {/* ==================================================
            WELCOME
        ================================================== */}
        <div style={styles.welcomeBox}>
          <h2 style={styles.welcomeTitle}>👋 Chào mừng Admin</h2>

          <p style={styles.welcomeText}>
            Từ đây bạn có thể quản lý tài khoản khách hàng, tích điểm thành
            viên, sản phẩm và danh mục của cửa hàng Smart Grocery.
          </p>

          {/* CÁC CHỨC NĂNG */}
          <div style={styles.quickActions}>
            <button
              type="button"
              style={styles.quickButton}
              onClick={() => navigate("/admin/orders")}
            >
              📋
              <span>Quản lý đơn hàng</span>
            </button>

            <button
              type="button"
              style={styles.quickButton}
              onClick={() => navigate("/admin/users")}
            >
              👥
              <span>Quản lý tài khoản</span>
            </button>

            <button
              type="button"
              style={styles.quickButton}
              onClick={() => navigate("/admin/points")}
            >
              ⭐<span>Quản lý tích điểm</span>
            </button>

            <button
              type="button"
              style={styles.quickButton}
              onClick={() => navigate("/admin/products")}
            >
              📦
              <span>Quản lý sản phẩm</span>
            </button>

            <button
              type="button"
              style={styles.quickButton}
              onClick={() => navigate("/admin/categories")}
            >
              🗂️
              <span>Quản lý danh mục</span>
            </button>
          </div>
        </div>
      </main>
  );
}

// ==================================================
// STYLE
// ==================================================

const styles = {
  // ==============================
  // MAIN
  // ==============================
  main: {
    flex: 1,
    padding: "35px",
    boxSizing: "border-box",
    overflow: "auto",
  },

  // ==============================
  // HEADER
  // ==============================
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  title: {
    margin: 0,
    color: "#253f50",
    fontSize: "28px",
  },

  subtitle: {
    marginTop: "8px",
    marginBottom: 0,
    color: "#777",
    fontSize: "14px",
  },

  adminAccount: {
    background: "#ffffff",
    padding: "11px 18px",
    borderRadius: "8px",
    color: "#253f50",
    fontWeight: "700",
    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
  },

  // ==============================
  // STATS
  // ==============================
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "22px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow: "0 3px 15px rgba(0,0,0,0.05)",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },

  cardIcon: {
    fontSize: "28px",
  },

  cardLabel: {
    margin: 0,
    color: "#777",
    fontSize: "13px",
  },

  cardNumber: {
    margin: "5px 0 0",
    color: "#253f50",
    fontSize: "24px",
  },

  // ==============================
  // WELCOME
  // ==============================
  welcomeBox: {
    marginTop: "30px",
    background: "#ffffff",
    borderRadius: "12px",
    padding: "30px",
    boxShadow: "0 3px 15px rgba(0,0,0,0.05)",
  },

  welcomeTitle: {
    margin: "0 0 15px",
    color: "#253f50",
    fontSize: "22px",
  },

  welcomeText: {
    margin: 0,
    color: "#294653",
    fontSize: "15px",
    lineHeight: "1.7",
  },

  // ==============================
  // QUICK ACTIONS
  // ==============================
  quickActions: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "15px",
    marginTop: "25px",
  },

  quickButton: {
    border: "1px solid #e4e9eb",
    background: "#f9fbfb",
    borderRadius: "10px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    color: "#253f50",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};

export default AdminDashboardPage;
