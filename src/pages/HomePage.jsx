import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "../App.css";

const categories = [
  { name: "Tất cả", icon: "🛒" },
  { name: "Bánh kẹo", icon: "🍪" },
  { name: "Đồ uống", icon: "🥤" },
  { name: "Mì & thực phẩm", icon: "🍜" },
  { name: "Gia vị", icon: "🧂" },
  { name: "Hóa mỹ phẩm", icon: "🧴" },
  { name: "Đồ gia dụng", icon: "🧻" },
  { name: "Thực phẩm tươi", icon: "🥚" },
];

const products = [
  {
    id: 1,
    name: "Khoai tây chiên Lay's",
    category: "Bánh kẹo",
    price: 32000,
    oldPrice: 38000,
    unit: "Gói 52g",
    emoji: "🍟",
    tag: "SALE",
    color: "#fff1df",
  },
  {
    id: 2,
    name: "Nước ngọt Coca-Cola",
    category: "Đồ uống",
    price: 12000,
    oldPrice: 15000,
    unit: "Lon 330ml",
    emoji: "🥤",
    tag: "HOT",
    color: "#ffe5e5",
  },
  {
    id: 3,
    name: "Mì Hảo Hảo tôm chua cay",
    category: "Mì & thực phẩm",
    price: 4500,
    oldPrice: 5000,
    unit: "Gói 75g",
    emoji: "🍜",
    tag: "HOT",
    color: "#fff0db",
  },
  {
    id: 4,
    name: "Dầu ăn thực vật",
    category: "Gia vị",
    price: 45000,
    oldPrice: 52000,
    unit: "Chai 1 lít",
    emoji: "🫒",
    tag: "SALE",
    color: "#fff4d5",
  },
  {
    id: 5,
    name: "Sữa tươi tiệt trùng",
    category: "Đồ uống",
    price: 32000,
    oldPrice: 36000,
    unit: "Lốc 4 hộp",
    emoji: "🥛",
    tag: "",
    color: "#e7f5ff",
  },
  {
    id: 6,
    name: "Dầu gội dưỡng tóc",
    category: "Hóa mỹ phẩm",
    price: 68000,
    oldPrice: 79000,
    unit: "Chai 650ml",
    emoji: "🧴",
    tag: "SALE",
    color: "#f2eaff",
  },
  {
    id: 7,
    name: "Trứng gà tươi",
    category: "Thực phẩm tươi",
    price: 32000,
    oldPrice: 35000,
    unit: "Vỉ 10 quả",
    emoji: "🥚",
    tag: "",
    color: "#fff0df",
  },
  {
    id: 8,
    name: "Khăn giấy tiện dụng",
    category: "Đồ gia dụng",
    price: 18000,
    oldPrice: 22000,
    unit: "Gói",
    emoji: "🧻",
    tag: "",
    color: "#e8f8f0",
  },
  {
    id: 9,
    name: "Bánh quy bơ",
    category: "Bánh kẹo",
    price: 28000,
    oldPrice: 32000,
    unit: "Hộp 200g",
    emoji: "🍪",
    tag: "HOT",
    color: "#fff1df",
  },
  {
    id: 10,
    name: "Nước suối tinh khiết",
    category: "Đồ uống",
    price: 5000,
    oldPrice: 6000,
    unit: "Chai 500ml",
    emoji: "💧",
    tag: "",
    color: "#e7f5ff",
  },
  {
    id: 11,
    name: "Nước mắm truyền thống",
    category: "Gia vị",
    price: 35000,
    oldPrice: 40000,
    unit: "Chai 500ml",
    emoji: "🧂",
    tag: "",
    color: "#fff0db",
  },
  {
    id: 12,
    name: "Nước rửa chén",
    category: "Hóa mỹ phẩm",
    price: 29000,
    oldPrice: 34000,
    unit: "Chai 750ml",
    emoji: "🧼",
    tag: "SALE",
    color: "#e6f9f2",
  },
  {
    id: 13,
    name: "Cà phê hòa tan",
    category: "Đồ uống",
    price: 42000,
    oldPrice: 48000,
    unit: "Hộp",
    emoji: "☕",
    tag: "",
    color: "#f4e9df",
  },
  {
    id: 14,
    name: "Bánh snack phô mai",
    category: "Bánh kẹo",
    price: 15000,
    oldPrice: 18000,
    unit: "Gói",
    emoji: "🍿",
    tag: "",
    color: "#fff4d5",
  },
  {
    id: 15,
    name: "Gạo thơm",
    category: "Mì & thực phẩm",
    price: 85000,
    oldPrice: 95000,
    unit: "Túi 5kg",
    emoji: "🍚",
    tag: "",
    color: "#f5f2e9",
  },
  {
    id: 16,
    name: "Cà chua tươi",
    category: "Thực phẩm tươi",
    price: 18000,
    oldPrice: 22000,
    unit: "500g",
    emoji: "🍅",
    tag: "FRESH",
    color: "#ffe8e6",
  },
  {
    id: 17,
    name: "Bàn chải đánh răng",
    category: "Hóa mỹ phẩm",
    price: 18000,
    oldPrice: 22000,
    unit: "Cây",
    emoji: "🪥",
    tag: "",
    color: "#e8f5ff",
  },
  {
    id: 18,
    name: "Nước lau sàn",
    category: "Đồ gia dụng",
    price: 39000,
    oldPrice: 45000,
    unit: "Chai 1 lít",
    emoji: "🧹",
    tag: "",
    color: "#e8f8f0",
  },
];
const money = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

function ProductCard({ product, onAdd, favorite, onFavorite }) {
  const navigate = useNavigate();

  function handleProductClick() {
    navigate(`/product/${product.id}`, {
      state: {
        product: product,
      },
    });
  }

  return (
    <article className="product-card" onClick={handleProductClick}>
      {product.tag && <span className="product-tag">{product.tag}</span>}

      <button
        className={`favorite-button ${favorite ? "is-favorite" : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          onFavorite(product.id);
        }}
        aria-label="Yêu thích sản phẩm"
      >
        {favorite ? "♥" : "♡"}
      </button>

      <div
        className="product-image"
        style={{
          backgroundColor: product.color,
        }}
      >
        <span>{product.emoji}</span>
      </div>

      <div className="product-info">
        <span className="product-category">{product.category}</span>

        <h3>{product.name}</h3>

        <p className="product-unit">{product.unit}</p>

        <div className="product-rating">
          <span>★★★★★</span>
          <small>(24)</small>
        </div>

        <div className="product-prices">
          <strong>{money(product.price)}</strong>

          <del>{money(product.oldPrice)}</del>
        </div>

        <button
          className="add-button"
          onClick={(event) => {
            event.stopPropagation();
            onAdd(product);
          }}
        >
          <span>＋</span> Thêm vào giỏ
        </button>
      </div>
    </article>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  /*
   * ============================================================
   * 2 Ô TÌM KIẾM ĐỘC LẬP
   * ============================================================
   *
   * headerSearch:
   *   Ô tìm kiếm trên thanh header.
   *
   * heroSearch:
   *   Ô tìm kiếm lớn trong banner.
   *
   * activeSearch:
   *   Từ khóa tìm kiếm đang được áp dụng cho danh sách sản phẩm.
   *
   * Vì vậy:
   * - Nhập ở header KHÔNG làm thay đổi ô hero.
   * - Nhập ở hero KHÔNG làm thay đổi ô header.
   * - Chỉ khi bấm nút tìm kiếm thì từ khóa của ô đó mới được áp dụng.
   */

  const [headerSearch, setHeaderSearch] = useState("");
  const [heroSearch, setHeroSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [category, setCategory] = useState("Tất cả");

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("smart-grocery-cart");

    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [favorites, setFavorites] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [notice, setNotice] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        category === "Tất cả" || product.category === category;

      const matchesSearch = product.name
        .toLowerCase()
        .includes(activeSearch.trim().toLowerCase());

      const matchesFavorite = !showFavorites || favorites.includes(product.id);

      return matchesCategory && matchesSearch && matchesFavorite;
    });
  }, [category, activeSearch, showFavorites, favorites]);

  const featuredProducts = filteredProducts.slice(0, 5);
  const dailyProducts = filteredProducts.slice(5, 9);
  const bestProducts = filteredProducts.slice(9, 13);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  function searchFromHeader() {
    setActiveSearch(headerSearch);

    setShowFavorites(false);

    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  }

  function searchFromHero() {
    setActiveSearch(heroSearch);

    setShowFavorites(false);

    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  }

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      const newCart = existing
        ? current.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                }
              : item,
          )
        : [
            ...current,
            {
              ...product,
              quantity: 1,
            },
          ];

      localStorage.setItem("smart-grocery-cart", JSON.stringify(newCart));

      return newCart;
    });

    setNotice(`Đã thêm "${product.name}" vào giỏ hàng`);

    window.setTimeout(() => {
      setNotice("");
    }, 2200);
  }

  function changeQuantity(id, amount) {
    setCart((current) => {
      const newCart = current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity + amount,
              }
            : item,
        )
        .filter((item) => item.quantity > 0);

      localStorage.setItem("smart-grocery-cart", JSON.stringify(newCart));

      return newCart;
    });
  }

  function toggleFavorite(id) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function selectCategory(name) {
    setCategory(name);
    setShowFavorites(false);
  }

  function clearSearchAndFilters() {
    setHeaderSearch("");
    setHeroSearch("");
    setActiveSearch("");
    setShowFavorites(false);
    setCategory("Tất cả");
  }

  return (
    <div className="grocery-app">
      {/* ======================================================
          TOP STRIP
      ====================================================== */}
      <div className="top-strip">
        <div className="container top-strip-inner">
          <span className="top-strip-delivery">
            🚚 Miễn phí giao hàng cho đơn từ 500.000đ
          </span>

          <div className="top-strip-right">
            {user && (
              <div className="top-strip-account">
                <button
                  type="button"
                  className="top-strip-user"
                  onClick={() => navigate("/profile")}
                  title="Xem trang cá nhân"
                >
                  👤 {user.name}
                </button>

                <span className="top-strip-divider">|</span>

                <button
                  type="button"
                  className="top-strip-logout"
                  onClick={handleLogout}
                  title="Đăng xuất"
                >
                  Đăng xuất
                </button>
              </div>
            )}

            <span className="top-strip-support">
              Hỗ trợ khách hàng: 1233-7777
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          HEADER
      ====================================================== */}
      <header className="main-header container">
        <a className="brand" href="#home" aria-label="Smart Grocery">
          <span className="brand-icon">🛒</span>

          <span>
            <strong>Smart Grocery</strong>
            <small>GROCERY STORE</small>
          </span>
        </a>

        {/* SEARCH HEADER - ĐỘC LẬP */}
        <div className="search-box">
          <input
            value={headerSearch}
            onChange={(event) => setHeaderSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                searchFromHeader();
              }
            }}
            placeholder="Tìm bánh kẹo, đồ uống, mì..."
            aria-label="Tìm kiếm sản phẩm trên header"
          />

          <button
            type="button"
            aria-label="Tìm kiếm"
            onClick={searchFromHeader}
          >
            <span>⌕</span>
          </button>
        </div>

        <div className="header-actions">
          <button
            className={`header-action ${showFavorites ? "action-active" : ""}`}
            onClick={() => {
              setShowFavorites((value) => !value);
              setShowCart(false);
            }}
          >
            <span>♡</span>
            <small>Yêu thích</small>
          </button>

          <button
            className="header-action cart-action"
            onClick={() => {
              setShowCart((value) => !value);
              setShowFavorites(false);
            }}
          >
            <span>🛒</span>
            <small>Giỏ hàng</small>
            <b>{cartCount}</b>
          </button>
        </div>
      </header>

      {/* ======================================================
          NAVBAR
      ====================================================== */}
      <nav className="navbar container">
        <div className="category-menu">
          <button
            type="button"
            className={`browse-button ${
              showCategories ? "browse-button-active" : ""
            }`}
            onClick={() => setShowCategories((value) => !value)}
            aria-expanded={showCategories}
          >
            ☰ &nbsp; Tất cả danh mục <span className="category-arrow"></span>
          </button>

          {showCategories && (
            <div className="category-dropdown">
              {categories.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  className={
                    category === item.name
                      ? "category-menu-item active"
                      : "category-menu-item"
                  }
                  onClick={() => {
                    selectCategory(item.name);
                    setShowCategories(false);

                    document
                      .getElementById("products")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <span>{item.icon}</span>

                  <span>{item.name}</span>

                  {category === item.name && <strong>✓</strong>}
                </button>
              ))}
            </div>
          )}
        </div>

        <a className="hotline" href="tel:12337777">
          ☎ 1233-7777
        </a>
      </nav>

      {/* ======================================================
          CART
      ====================================================== */}
      {showCart && (
        <div className="cart-panel">
          <div className="cart-heading">
            <h3>Giỏ hàng của bạn</h3>

            <button onClick={() => setShowCart(false)}>✕</button>
          </div>

          {cart.length === 0 ? (
            <div className="cart-empty">
              <span>🛒</span>

              <p>Giỏ hàng đang trống.</p>

              <button className="add-button" onClick={() => setShowCart(false)}>
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  <span className="cart-item-emoji">{item.emoji}</span>

                  <div className="cart-item-info">
                    <strong>{item.name}</strong>

                    <span>{money(item.price)}</span>

                    <div className="quantity-controls">
                      <button onClick={() => changeQuantity(item.id, -1)}>
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button onClick={() => changeQuantity(item.id, 1)}>
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="cart-total">
                <span>Tổng cộng</span>

                <strong>{money(cartTotal)}</strong>
              </div>

              <button
                className="checkout-button"
                onClick={() =>
                  setNotice(
                    "Giỏ hàng đã sẵn sàng! Chức năng đặt hàng cần kết nối backend.",
                  )
                }
              >
                Tiến hành đặt hàng →
              </button>
            </>
          )}
        </div>
      )}

      <main>
        {/* ======================================================
            HERO - FULL WIDTH
        ====================================================== */}
        <section
          className="hero hero-fullwidth"
          id="home"
          style={{
            width: "100%",
            maxWidth: "none",
            marginLeft: 0,
            marginRight: 0,
            borderRadius: 0,
          }}
        >
          <div className="hero-copy">
            <span className="eyebrow">FRESH FOOD, FRESH LIFE</span>

            <h1>Đừng bỏ lỡ những ưu đãi mỗi ngày!</h1>

            <p>Tiết kiệm đến 60% cho đơn hàng đầu tiên của bạn.</p>

            {/* SEARCH HERO - HOÀN TOÀN ĐỘC LẬP */}
            <div className="hero-search">
              <input
                aria-label="Tìm kiếm sản phẩm"
                placeholder="Bạn đang tìm sản phẩm gì?"
                value={heroSearch}
                onChange={(event) => setHeroSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    searchFromHero();
                  }
                }}
              />

              <button type="button" onClick={searchFromHero}>
                Tìm ngay
              </button>
            </div>

            <a className="hero-cta" href="#categories">
              Mua sắm ngay
            </a>

            {/* ĐÃ XÓA 3 DẤU CHẤM */}
          </div>

          <div className="hero-visual">
            <div className="hero-orbit orbit-one" />

            <div className="hero-orbit orbit-two" />

            <span className="hero-leaf leaf-one">🌿</span>

            <span className="hero-leaf leaf-two">🍃</span>

            <div className="hero-grocery-bag">
              <span>🥬</span>
              <span>🥕</span>
              <span>🥦</span>
              <span>🫑</span>
              <span>🍅</span>
              <span>🍌</span>
              <span>🥚</span>
              <span>🥛</span>
              <span>🍊</span>
            </div>

            <div className="hero-sticker">
              TƯƠI NGON
              <br />
              MỖI NGÀY
            </div>
          </div>
        </section>

        {/* ======================================================
            CATEGORIES
        ====================================================== */}
        <section className="section container" id="categories">
          <div className="section-heading">
            <div>
              <span className="section-kicker">KHÁM PHÁ</span>

              <h2>Danh mục sản phẩm</h2>
            </div>

            <button
              className="text-link"
              onClick={() => selectCategory("Tất cả")}
            >
              Xem tất cả →
            </button>
          </div>

          <div className="category-grid">
            {categories.slice(1).map((item, index) => (
              <button
                key={item.name}
                className={`category-card ${
                  category === item.name ? "category-selected" : ""
                }`}
                onClick={() => selectCategory(item.name)}
              >
                <span
                  className={`category-illustration category-color-${index}`}
                >
                  {item.icon}
                </span>

                <strong>{item.name}</strong>

                <small>
                  {["120+", "85+", "64+", "45+", "78+", "62+", "95+"][index]}{" "}
                  sản phẩm
                </small>
              </button>
            ))}
          </div>
        </section>

        {/* ======================================================
            FEATURED
        ====================================================== */}
        <section className="section container" id="featured">
          <div className="section-heading">
            <div>
              <span className="section-kicker">LỰA CHỌN HÔM NAY</span>

              <h2>Sản phẩm nổi bật</h2>
            </div>

            <button
              className="text-link"
              onClick={() => selectCategory("Tất cả")}
            >
              Xem tất cả →
            </button>
          </div>

          {showFavorites && (
            <p className="filter-notice">♡ Đang hiển thị sản phẩm yêu thích</p>
          )}

          {activeSearch && (
            <p className="filter-notice">
              🔎 Kết quả tìm kiếm cho: <strong>"{activeSearch}"</strong>
            </p>
          )}

          {featuredProducts.length ? (
            <div className="product-grid product-grid-featured">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                  favorite={favorites.includes(product.id)}
                  onFavorite={toggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="empty-results">
              <span>🔎</span>

              <h3>Không tìm thấy sản phẩm</h3>

              <p>Thử tìm với từ khóa khác hoặc chọn danh mục khác.</p>

              <button className="add-button" onClick={clearSearchAndFilters}>
                Xóa bộ lọc
              </button>
            </div>
          )}
        </section>

        {/* ======================================================
            PROMO
        ====================================================== */}
        <section className="promo-grid container" id="deals">
          <div className="promo-card promo-delivery">
            <div className="promo-copy">
              <span className="promo-label">ƯU ĐÃI ĐẶC BIỆT</span>

              <h2>Miễn phí giao hàng từ 500K</h2>

              <p>Mua sắm thỏa thích, nhận hàng tận nhà.</p>

              <a href="#products">Mua ngay →</a>
            </div>

            <span className="promo-illustration">🛵</span>

            <span className="promo-decoration">📦 🥬</span>
          </div>

          <div className="promo-card promo-organic">
            <div className="promo-copy">
              <span className="promo-label">TƯƠI NGON MỖI NGÀY</span>

              <h2>Thực phẩm chất lượng</h2>

              <p>Chọn sản phẩm tốt cho cả gia đình.</p>

              <a href="#categories">Khám phá →</a>
            </div>

            <span className="promo-illustration">🥦</span>

            <span className="promo-decoration">🍅 🍊 🥕</span>
          </div>
        </section>

        {/* ======================================================
            PRODUCTS
        ====================================================== */}
        <section className="section container" id="products">
          <div className="section-heading">
            <div>
              <span className="section-kicker">MUA SẮM THÔNG MINH</span>

              <h2>
                {showFavorites
                  ? "Sản phẩm yêu thích"
                  : category === "Tất cả"
                    ? "Sản phẩm bán chạy"
                    : category}
              </h2>
            </div>

            <div className="section-filters">
              {["Tất cả", "Bánh kẹo", "Đồ uống", "Mì & thực phẩm"].map(
                (item) => (
                  <button
                    key={item}
                    className={category === item ? "filter-active" : ""}
                    onClick={() => selectCategory(item)}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </div>

          {filteredProducts.length ? (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                  favorite={favorites.includes(product.id)}
                  onFavorite={toggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="empty-results">
              <span>🛍️</span>

              <h3>Chưa có sản phẩm phù hợp</h3>

              <p>Hãy thử từ khóa khác hoặc bỏ bộ lọc yêu thích.</p>

              <button className="add-button" onClick={clearSearchAndFilters}>
                Xem tất cả sản phẩm
              </button>
            </div>
          )}
        </section>

        {/* ======================================================
            SUGGESTIONS
        ====================================================== */}
        <section className="section container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">GỢI Ý CHO BẠN</span>

              <h2>Có thể bạn sẽ thích</h2>
            </div>
          </div>

          <div className="product-grid product-grid-compact">
            {(bestProducts.length ? bestProducts : products.slice(0, 4)).map(
              (product) => (
                <ProductCard
                  key={`suggest-${product.id}`}
                  product={product}
                  onAdd={addToCart}
                  favorite={favorites.includes(product.id)}
                  onFavorite={toggleFavorite}
                />
              ),
            )}
          </div>
        </section>

        {/* ======================================================
            APP BANNER
        ====================================================== */}
        <section className="app-banner">
          <div className="container app-banner-inner">
            <div>
              <span className="section-kicker">MUA SẮM MỌI LÚC</span>

              <h2>
                Mua sắm tiện lợi
                <br />
                cùng Smart Grocery
              </h2>

              <p>Theo dõi đơn hàng và săn ưu đãi ngay trên điện thoại.</p>

              <div className="app-downloads">
                <a href="#footer"> App Store</a>

                <a href="#footer">▶ Google Play</a>
              </div>
            </div>

            <div className="phone-mockups">
              <div className="phone phone-back">
                <span>Smart Grocery</span>

                <div className="phone-art">🛒</div>

                <p>Danh mục sản phẩm</p>

                <div className="phone-mini-grid">
                  🍪　🥤
                  <br />
                  <br />
                  🍜　🧴
                </div>
              </div>

              <div className="phone phone-front">
                <span>Smart Grocery</span>

                <div className="phone-art">🥦</div>

                <p>Giỏ hàng của bạn</p>

                <div className="phone-mini-row">🥛 Sữa tươi</div>

                <div className="phone-mini-row">🍜 Mì ăn liền</div>

                <div className="phone-mini-button">Thanh toán</div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            BENEFITS
        ====================================================== */}
        <section className="benefits container">
          <div className="benefit">
            <span>🏷️</span>

            <div>
              <strong>Giá tốt mỗi ngày</strong>
              <small>Ưu đãi hấp dẫn mỗi ngày</small>
            </div>
          </div>

          <div className="benefit">
            <span>◉</span>

            <div>
              <strong>Hỗ trợ 24/7</strong>
              <small>Luôn sẵn sàng hỗ trợ bạn</small>
            </div>
          </div>

          <div className="benefit">
            <span>🚚</span>

            <div>
              <strong>Giao hàng nhanh</strong>
              <small>Giao tận nơi tiện lợi</small>
            </div>
          </div>

          <div className="benefit">
            <span>🔒</span>

            <div>
              <strong>Thanh toán an toàn</strong>
              <small>Bảo mật thông tin mua hàng</small>
            </div>
          </div>
        </section>
      </main>

      {/* ======================================================
          FOOTER
      ====================================================== */}
      <footer className="footer" id="footer">
        <div className="container footer-main">
          <div className="footer-about">
            <a className="brand footer-brand" href="#home">
              <span className="brand-icon">🛒</span>

              <span>
                <strong>Smart Grocery</strong>
                <small>GROCERY STORE</small>
              </span>
            </a>

            <p>
              Đa dạng hàng hóa, giá cả hợp lý, mua sắm tiện lợi cho mọi gia
              đình.
            </p>

            <small>📍 Hà Nội, Việt Nam</small>

            <small>☎ 1233-7777</small>

            <small>✉ support@smartgrocery.vn</small>
          </div>

          <div className="footer-column">
            <h3>Về chúng tôi</h3>

            <a href="#home">Câu chuyện của chúng tôi</a>

            <a href="#home">Tuyển dụng</a>

            <a href="#home">Tin tức</a>

            <a href="#home">Cửa hàng</a>
          </div>

          <div className="footer-column">
            <h3>Liên kết hữu ích</h3>

            <a href="#footer">Trung tâm hỗ trợ</a>

            <a href="#footer">Thông tin giao hàng</a>

            <a href="#footer">Chính sách đổi trả</a>

            <a href="#footer">Điều khoản sử dụng</a>
          </div>

          <div className="footer-column">
            <h3>Chăm sóc khách hàng</h3>

            <a href="#footer">Liên hệ</a>

            <a href="#footer">Câu hỏi thường gặp</a>

            <a href="#footer">Chính sách bảo mật</a>

            <a href="#footer">Hỗ trợ mua hàng</a>
          </div>
        </div>

        <div className="container footer-bottom">
          <span>© 2026 Smart Grocery. All rights reserved.</span>

          <span className="payment-methods">VISA　💳　PayPal　💳</span>

          <div className="social-links">
            <a href="#footer" aria-label="Facebook">
              f
            </a>

            <a href="#footer" aria-label="Instagram">
              ◎
            </a>

            <a href="#footer" aria-label="YouTube">
              ▶
            </a>
          </div>
        </div>
      </footer>

      {/* ======================================================
          TOAST
      ====================================================== */}
      {notice && (
        <div className="toast-message" role="status">
          <span>✓</span>

          {notice}

          <button onClick={() => setNotice("")}>✕</button>
        </div>
      )}
    </div>
  );
}
