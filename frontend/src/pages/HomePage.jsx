import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
  getProducts,
  getCategories,
  getCart,
  addToCartApi,
  updateCartItemApi,
  removeCartItemApi,
  checkoutOrderApi,
  getAiRecommendationsApi,
  refreshAiPredictionsApi,
} from "../services/api";
import "../App.css";

const DEFAULT_CATEGORIES = [
  { name: "Tất cả", icon: "🛒" },
  { name: "Rau củ quả sạch", icon: "🥬" },
  { name: "Thịt - hải sản", icon: "🥩" },
  { name: "Sữa & trứng", icon: "🥛" },
  { name: "Đồ khô", icon: "🍚" },
  { name: "Sắc đẹp", icon: "🧴" },
];

// Flag điều khiển hiển thị độ tin cậy AI (Đang bật để kiểm thử, sau này đổi thành false để ẩn)
const SHOW_AI_CONFIDENCE = true;

function getProductEmoji(name = "", category = "") {
  const n = String(name || "").toLowerCase();
  if (n.includes("cải") || n.includes("rau") || n.includes("bắp cải")) return "🥬";
  if (n.includes("cà chua")) return "🍅";
  if (n.includes("thịt") || n.includes("heo") || n.includes("bò")) return "🥩";
  if (n.includes("sữa")) return "🥛";
  if (n.includes("gạo")) return "🍚";
  if (n.includes("khoai")) return "🍟";
  if (n.includes("coca") || n.includes("nước")) return "🥤";
  if (n.includes("mì")) return "🍜";
  if (n.includes("trứng")) return "🥚";
  if (n.includes("dầu")) return "🫒";
  if (category.includes("Rau")) return "🥦";
  if (category.includes("Thịt")) return "🍗";
  if (category.includes("Sữa")) return "🧀";
  if (category.includes("Khô")) return "🌾";
  return "🛒";
}

function getProductColor(category = "") {
  if (category.includes("Rau")) return "#e8f8f0";
  if (category.includes("Thịt")) return "#ffe5e5";
  if (category.includes("Sữa")) return "#e7f5ff";
  if (category.includes("Khô")) return "#fff4d5";
  return "#fff0df";
}

function formatProduct(p) {
  const categoryName = p.categoryName || "Khác";
  const stock = p.availableQuantity ?? p.stockQuantity ?? 0;
  return {
    id: p.id,
    name: p.name,
    category: categoryName,
    price: Number(p.price) || 0,
    oldPrice: p.price ? Math.round(Number(p.price) * 1.15) : null,
    unit: p.unit || "Phần",
    stock: stock,
    emoji: getProductEmoji(p.name, categoryName),
    tag: stock <= 10 ? "SẮP HẾT" : (p.price > 100000 ? "HOT" : "FRESH"),
    color: getProductColor(categoryName),
    description: p.description,
  };
}

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

        <p className="product-unit">
          {product.unit} {product.stock !== undefined ? `• Kho: ${product.stock}` : ""}
        </p>

        <div className="product-rating">
          <span>★★★★★</span>
          <small>(24)</small>
        </div>

        <div className="product-prices">
          <strong>{money(product.price)}</strong>

          {product.oldPrice ? <del>{money(product.oldPrice)}</del> : null}
        </div>

        <button
          className="add-button"
          disabled={product.stock !== undefined && product.stock <= 0}
          onClick={(event) => {
            event.stopPropagation();
            onAdd(product);
          }}
        >
          <span>＋</span> {product.stock !== undefined && product.stock <= 0 ? "Hết hàng" : "Thêm vào giỏ"}
        </button>
      </div>
    </article>
  );
}

function getConfidencePercent(item) {
  const c = Number(item?.confidence);
  if (isNaN(c)) return 0;
  const p = c <= 1 ? c * 100 : c;
  return Math.round(p);
}

function formatPredictionDate(dateStr) {
  if (!dateStr) return "";
  try {
    const parts = String(dateStr).split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function AiReplenishmentRow({
  title,
  tierClass,
  badgeStyle,
  items,
  onAddToCart,
  productsList,
}) {
  const sliderRef = useRef(null);

  const handleScroll = (offset) => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className={`ai-row-container ${tierClass}`}>
      <div className="ai-row-header">
        <h3 className="ai-row-title" style={{ color: badgeStyle.kickerColor, margin: 0, fontSize: "14px", fontWeight: "700" }}>
          {title}
        </h3>
        {items.length > 2 && (
          <div className="ai-row-controls">
            <button
              type="button"
              className="ai-row-arrow"
              onClick={() => handleScroll(-205)}
              aria-label="Cuộn sang trái"
              title="Cuộn sang trái"
            >
              ◀
            </button>
            <button
              type="button"
              className="ai-row-arrow"
              onClick={() => handleScroll(205)}
              aria-label="Cuộn sang phải"
              title="Cuộn sang phải"
            >
              ▶
            </button>
          </div>
        )}
      </div>

      <div className="ai-row-slider" ref={sliderRef}>
        {items.map((item) => {
          const prod =
            productsList.find((p) => p.id === item.productId) || {
              id: item.productId,
              name: item.productName,
            };
          const price = prod?.price;

          return (
            <div key={item.productId} className="ai-product-card">
              <div className="ai-card-image-wrap">
                {item.productImageUrl ? (
                  <img src={item.productImageUrl} alt={item.productName} />
                ) : (
                  <span>{getProductEmoji(item.productName)}</span>
                )}
              </div>

              <div className="ai-card-body">
                <h4 className="ai-card-name" title={item.productName}>
                  {item.productName}
                </h4>

                <p className="ai-card-prediction">
                  {item.predictedDays !== null && item.predictedDays !== undefined ? (
                    item.predictedDays <= 0 ? (
                      <span style={{ color: "#ef4444", fontWeight: "700" }}>
                        ⚠️ Cần mua ngay {item.predictedNextDate ? `(${formatPredictionDate(item.predictedNextDate)})` : "(Hôm nay)"}
                      </span>
                    ) : (
                      <span>
                        Dự kiến mua sau: <b>{Math.round(item.predictedDays)} ngày</b> {item.predictedNextDate ? `(${formatPredictionDate(item.predictedNextDate)})` : ""}
                      </span>
                    )
                  ) : (
                    <span>Dự kiến: <b>{item.predictedNextDate ? formatPredictionDate(item.predictedNextDate) : "Hôm nay"}</b></span>
                  )}
                </p>

                {price ? (
                  <div className="ai-card-price-row">
                    <span className="ai-card-price">{money(price)}</span>
                    {prod?.unit && <span className="ai-card-unit">/{prod.unit}</span>}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                className="ai-card-button"
                onClick={() => onAddToCart(prod)}
              >
                🛒 Mua lại ngay
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const [headerSearch, setHeaderSearch] = useState("");
  const [heroSearch, setHeroSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [category, setCategory] = useState("Tất cả");
  const [categoriesList, setCategoriesList] = useState(DEFAULT_CATEGORIES);

  // Danh sách sản phẩm từ backend MySQL
  const [productsList, setProductsList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Giỏ hàng thực tế từ backend
  const [cart, setCart] = useState([]);
  const [cartTotalAmount, setCartTotalAmount] = useState(0);
  const [checkingOut, setCheckingOut] = useState(false);

  // Gợi ý chu kỳ mua lại thông minh từ AI
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [refreshingAi, setRefreshingAi] = useState(false);

  const [favorites, setFavorites] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [notice, setNotice] = useState("");

  function formatCartItems(cartDto) {
    if (!cartDto || !cartDto.items) return [];
    return cartDto.items.map((item) => ({
      id: item.id, // ID chi tiết giỏ hàng (CartItem) để update/delete
      productId: item.productId,
      name: item.productName,
      price: Number(item.unitPrice),
      quantity: item.quantity,
      subtotal: Number(item.subtotal),
      emoji: getProductEmoji(item.productName),
    }));
  }

  // Tải danh mục từ backend
  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = [
          { name: "Tất cả", icon: "🛒" },
          ...data.map((c) => ({
            name: c.name,
            icon: c.name.includes("Rau")
              ? "🥬"
              : c.name.includes("Thịt")
              ? "🥩"
              : c.name.includes("Sữa")
              ? "🥛"
              : c.name.includes("Khô")
              ? "🍚"
              : "🧴",
          })),
        ];
        setCategoriesList(mapped);
      }
    } catch (err) {
      console.warn("Dùng danh mục mặc định:", err);
    }
  }, []);

  // Tải sản phẩm từ backend
  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const data = await getProducts();
      if (Array.isArray(data) && data.length > 0) {
        setProductsList(data.map(formatProduct));
      }
    } catch (err) {
      console.warn("Không tải được sản phẩm từ backend:", err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Tải giỏ hàng từ backend
  const loadCart = useCallback(async () => {
    if (!token) {
      setCart([]);
      setCartTotalAmount(0);
      return;
    }
    try {
      const cartDto = await getCart(token);
      setCart(formatCartItems(cartDto));
      setCartTotalAmount(Number(cartDto?.totalAmount) || 0);
    } catch (err) {
      console.warn("Không tải được giỏ hàng:", err);
    }
  }, [token]);

  // Tải dự đoán mua lại bằng AI
  const loadAiRecommendations = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getAiRecommendationsApi(token);
      if (Array.isArray(data)) {
        setAiRecommendations(data);
      }
    } catch (err) {
      console.warn("Không tải được gợi ý AI:", err);
    }
  }, [token]);

  async function handleRefreshAi() {
    if (!token) return;
    setRefreshingAi(true);
    try {
      const data = await refreshAiPredictionsApi(token);
      if (Array.isArray(data)) {
        setAiRecommendations(data);
        setNotice("🤖 Đã làm mới dự đoán AI dựa trên dữ liệu mua hàng mới nhất!");
        window.setTimeout(() => setNotice(""), 3000);
      }
    } catch (err) {
      setNotice(`❌ Lỗi cập nhật AI: ${err.message}`);
    } finally {
      setRefreshingAi(false);
    }
  }

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [loadCategories, loadProducts]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    loadAiRecommendations();
  }, [loadAiRecommendations]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setShowCart(false);
      }
    }
    if (showCart) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [showCart]);

  const filteredProducts = useMemo(() => {
    const listToFilter = productsList.length > 0 ? productsList : products;
    return listToFilter.filter((product) => {
      const matchesCategory =
        category === "Tất cả" || product.category === category;

      const matchesSearch = product.name
        .toLowerCase()
        .includes(activeSearch.trim().toLowerCase());

      const matchesFavorite = !showFavorites || favorites.includes(product.id);

      return matchesCategory && matchesSearch && matchesFavorite;
    });
  }, [productsList, category, activeSearch, showFavorites, favorites]);

  // Phân loại gợi ý mua lại AI thành các nhóm:
  // - Hàng 1: từ 85% đến 100% (sắp xếp giảm dần từ lớn đến bé)
  // - Hàng 2: từ 70% đến 85% (sắp xếp giảm dần từ lớn đến bé)
  // - Dưới 70%: không hiển thị
  const tier1AiList = useMemo(() => {
    return (aiRecommendations || [])
      .filter((item) => {
        const p = getConfidencePercent(item);
        return p >= 85 && p <= 100;
      })
      .sort((a, b) => getConfidencePercent(b) - getConfidencePercent(a));
  }, [aiRecommendations]);

  const tier2AiList = useMemo(() => {
    return (aiRecommendations || [])
      .filter((item) => {
        const p = getConfidencePercent(item);
        return p >= 70 && p < 85;
      })
      .sort((a, b) => getConfidencePercent(b) - getConfidencePercent(a));
  }, [aiRecommendations]);

  const hasAiReplenishments = tier1AiList.length > 0 || tier2AiList.length > 0;

  const featuredProducts = filteredProducts;
  const dailyProducts = filteredProducts.slice(0, 4);
  const bestProducts = filteredProducts.slice(0, 4);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal =
    cartTotalAmount ||
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

  // Thêm vào giỏ hàng thật qua API Backend
  async function addToCart(product) {
    if (!token) {
      setNotice("Vui lòng đăng nhập để thêm vào giỏ hàng.");
      return;
    }

    try {
      const updatedCart = await addToCartApi(token, product.id, 1);
      setCart(formatCartItems(updatedCart));
      setCartTotalAmount(Number(updatedCart.totalAmount) || 0);
      setNotice(`Đã thêm "${product.name}" vào giỏ hàng`);
      window.setTimeout(() => setNotice(""), 2200);
    } catch (err) {
      setNotice(`❌ Không thể thêm vào giỏ: ${err.message}`);
    }
  }

  // Thay đổi số lượng món trong giỏ hàng qua API
  async function changeQuantity(cartItem, amount) {
    if (!token) return;
    const newQty = cartItem.quantity + amount;

    try {
      if (newQty <= 0) {
        const updatedCart = await removeCartItemApi(token, cartItem.id);
        setCart(formatCartItems(updatedCart));
        setCartTotalAmount(Number(updatedCart.totalAmount) || 0);
      } else {
        const updatedCart = await updateCartItemApi(token, cartItem.id, newQty);
        setCart(formatCartItems(updatedCart));
        setCartTotalAmount(Number(updatedCart.totalAmount) || 0);
      }
    } catch (err) {
      setNotice(`❌ Lỗi cập nhật giỏ hàng: ${err.message}`);
    }
  }

  // Đặt hàng thật qua API Checkout (Áp dụng Khóa bi quan trừ kho)
  async function handleCheckout() {
    if (!token) {
      setNotice("Vui lòng đăng nhập để tiến hành đặt hàng.");
      return;
    }

    if (cart.length === 0) {
      setNotice("Giỏ hàng của bạn đang trống.");
      return;
    }

    setCheckingOut(true);
    try {
      const order = await checkoutOrderApi(token);
      setCart([]);
      setCartTotalAmount(0);
      setShowCart(false);
      setNotice(
        `🎉 Đặt hàng thành công! Mã đơn: #${order.id} - ${money(order.totalAmount)}. Kho hàng đã được trừ thành công!`
      );
      // Tải lại sản phẩm để cập nhật số lượng tồn kho hiển thị
      loadProducts();
    } catch (err) {
      setNotice(`❌ Đặt hàng thất bại: ${err.message}`);
    } finally {
      setCheckingOut(false);
    }
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
            className={`header-action cart-action ${showCart ? "action-active" : ""}`}
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
              {categoriesList.map((item) => (
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
        <>
          <div
            className="cart-overlay"
            onClick={() => setShowCart(false)}
            aria-hidden="true"
          />
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
                        <button onClick={() => changeQuantity(item, -1)}>
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button onClick={() => changeQuantity(item, 1)}>
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
                  disabled={checkingOut}
                  onClick={handleCheckout}
                >
                  {checkingOut ? "Đang xử lý đơn hàng..." : "Tiến hành đặt hàng →"}
                </button>
              </>
            )}
          </div>
        </>
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
            AI SMART REPLENISHMENT - DỰ ĐOÁN MUA LẠI BẰNG AI (2 HÀNG TRƯỢT NGANG)
        ====================================================== */}
        {hasAiReplenishments && (
          <section className="section container ai-replenishment-section" id="ai-replenishment" style={{ marginBottom: "20px" }}>
            <div className="section-heading">
              <div>
                <span className="section-kicker" style={{ color: "#10b981", fontWeight: "700" }}>
                  🤖 AI THÔNG MINH • CHU KỲ TIÊU DÙNG
                </span>
                <h2>Gợi ý mua lại hôm nay</h2>
              </div>
              <button
                className="text-link"
                disabled={refreshingAi}
                onClick={handleRefreshAi}
                style={{ fontSize: "14px", color: "#10b981", cursor: "pointer", border: "none", background: "none", fontWeight: "600" }}
              >
                {refreshingAi ? "⏳ Đang tính toán..." : "🔄 Làm mới dự đoán AI"}
              </button>
            </div>

            {/* HÀNG 1: ĐỘ TIN CẬY 85% - 100% (Sắp xếp từ lớn đến bé, trượt ngang) */}
            {tier1AiList.length > 0 && (
              <AiReplenishmentRow
                title="Dựa trên chu kỳ tiêu dùng quen thuộc"
                tierClass="tier-1"
                badgeStyle={{
                  kickerColor: "#059669",
                  badgeBg: "#ecfdf5",
                  badgeColor: "#065f46",
                  badgeBorder: "#a7f3d0",
                  meterGradient: "linear-gradient(90deg, #34d399, #059669)",
                }}
                items={tier1AiList}
                onAddToCart={addToCart}
                productsList={productsList}
              />
            )}

            {/* HÀNG 2: ĐỘ TIN CẬY 70% - 85% (Sắp xếp từ lớn đến bé, trượt ngang) */}
            {tier2AiList.length > 0 && (
              <AiReplenishmentRow
                title="Có thể bạn dùng sắp hết"
                tierClass="tier-2"
                badgeStyle={{
                  kickerColor: "#2563eb",
                  badgeBg: "#eff6ff",
                  badgeColor: "#1e40af",
                  badgeBorder: "#bfdbfe",
                  meterGradient: "linear-gradient(90deg, #60a5fa, #2563eb)",
                }}
                items={tier2AiList}
                onAddToCart={addToCart}
                productsList={productsList}
              />
            )}
          </section>
        )}

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
            {categoriesList.slice(1).map((item, index) => (
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
                    type="button"
                    className={`filter-btn ${
                      category === item ? "filter-active" : ""
                    }`}
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

              <button
                className="add-button"
                type="button"
                onClick={clearSearchAndFilters}
              >
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
