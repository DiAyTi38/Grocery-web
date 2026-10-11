import { useNavigate } from "react-router-dom";

function AdminDashboardPage() {
  const navigate = useNavigate();

  // ==================================================
  // ĐĂNG XUẤT ADMIN
  // ==================================================
  function handleLogout() {
    sessionStorage.removeItem("smart-grocery-admin");

    navigate("/admin/login", {
      replace: true,
    });
  }

  return (
    <div style={styles.page}>
      {/* ==================================================
          SIDEBAR
      ================================================== */}
      <aside style={styles.sidebar}>
        {/* LOGO */}
        <div style={styles.logo}>🛒 Smart Grocery</div>

        {/* NHÃN ADMIN */}
        <div style={styles.adminLabel}>ADMIN</div>

        {/* MENU */}
        <nav style={styles.menu}>
          {/* TỔNG QUAN */}
          <button
            type="button"
            style={{
              ...styles.menuItem,
              ...styles.menuItemActive,
            }}
            onClick={() => navigate("/admin")}
          >
            📊 Tổng quan
          </button>

          {/* QUẢN LÝ TÀI KHOẢN */}
          <button
            type="button"
            style={styles.menuItem}
            onClick={() => navigate("/admin/users")}
          >
            👥 Quản lý tài khoản
          </button>

          {/* QUẢN LÝ ĐIỂM */}
          <button
            type="button"
            style={styles.menuItem}
            onClick={() => navigate("/admin/points")}
          >
            ⭐ Quản lý tích điểm
          </button>

          {/* QUẢN LÝ SẢN PHẨM */}
          <button
            type="button"
            style={styles.menuItem}
            onClick={() => navigate("/admin/products")}
          >
            📦 Quản lý sản phẩm
          </button>

          {/* QUẢN LÝ DANH MỤC */}
          <button
            type="button"
            style={styles.menuItem}
            onClick={() => navigate("/admin/categories")}
          >
            🗂️ Quản lý danh mục
          </button>
        </nav>

        {/* ĐĂNG XUẤT */}
        <button
          type="button"
          style={styles.logoutButton}
          onClick={handleLogout}
        >
          🚪 Đăng xuất
        </button>
      </aside>

      {/* ==================================================
          MAIN
      ================================================== */}
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

              <h2 style={styles.cardNumber}>0</h2>
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

              <h2 style={styles.cardNumber}>0</h2>
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

              <h2 style={styles.cardNumber}>0</h2>
            </div>
          </div>

          {/* ĐIỂM */}
          <div
            style={styles.card}
            onClick={() => navigate("/admin/points")}
            role="button"
            tabIndex={0}
          >
            <div style={styles.cardIcon}>⭐</div>

            <div>
              <p style={styles.cardLabel}>Điểm đã cấp</p>

              <h2 style={styles.cardNumber}>0</h2>
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
    </div>
  );
}

// ==================================================
// STYLE
// ==================================================

const styles = {
  // ==============================
  // PAGE
  // ==============================
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "#f5f7f8",
    fontFamily: "Arial, sans-serif",
  },

  // ==============================
  // SIDEBAR
  // ==============================
  sidebar: {
    width: "250px",
    minHeight: "100vh",
    background: "#253f50",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px",
    boxSizing: "border-box",
  },

  logo: {
    fontSize: "20px",
    fontWeight: "800",
    padding: "10px 12px",
    lineHeight: "1.4",
  },

  adminLabel: {
    marginTop: "25px",
    marginBottom: "10px",
    padding: "0 12px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#aebbc4",
    letterSpacing: "1px",
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  menuItem: {
    border: "none",
    background: "transparent",
    color: "#ffffff",
    textAlign: "left",
    padding: "13px 12px",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  menuItemActive: {
    background: "rgba(255,255,255,0.12)",
    fontWeight: "700",
  },

  logoutButton: {
    marginTop: "auto",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "#ffffff",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },

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
