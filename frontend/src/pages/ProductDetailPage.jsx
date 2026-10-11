
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function ProductDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(location.state?.product || null);

  // Lấy sản phẩm được truyền từ HomePage
  useEffect(() => {
    if (location.state?.product) {
      setProduct(location.state.product);

      // Lưu tạm để khi F5 vẫn có dữ liệu
      localStorage.setItem(
        "smart-grocery-selected-product",
        JSON.stringify(location.state.product),
      );
    } else {
      // Nếu F5 trang chi tiết thì lấy lại sản phẩm
      const savedProduct = localStorage.getItem(
        "smart-grocery-selected-product",
      );

      if (savedProduct) {
        const parsedProduct = JSON.parse(savedProduct);

        if (String(parsedProduct.id) === String(id)) {
          setProduct(parsedProduct);
        }
      }
    }
  }, [location.state, id]);

  // Nếu không tìm thấy sản phẩm
  if (!product) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px",
          fontFamily: "Nunito Sans, sans-serif",
          background: "#f5faf6",
        }}
      >
        <h2>Không tìm thấy sản phẩm</h2>

        <button
          onClick={() => navigate("/")}
          style={{
            border: "none",
            padding: "12px 24px",
            borderRadius: "10px",
            background: "#4caf50",
            color: "white",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "700",
          }}
        >
          Quay về trang chủ
        </button>
      </div>
    );
  }

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleAddToCart = () => {
    const cartItem = {
      ...product,
      quantity,
    };

    const oldCart =
      JSON.parse(localStorage.getItem("smart-grocery-cart")) || [];

    const existingProduct = oldCart.find(
      (item) => String(item.id) === String(product.id),
    );

    let newCart;

    if (existingProduct) {
      newCart = oldCart.map((item) =>
        String(item.id) === String(product.id)
          ? {
              ...item,
              quantity: item.quantity + quantity,
            }
          : item,
      );
    } else {
      newCart = [...oldCart, cartItem];
    }

    localStorage.setItem(
      "smart-grocery-cart",
      JSON.stringify(newCart),
    );

    // Báo cho HomePage cập nhật số lượng giỏ hàng
    window.dispatchEvent(new Event("cartUpdated"));

    alert(
      `Đã thêm ${quantity} ${product.unit || ""} ${product.name} vào giỏ hàng!`,
    );
  };

  return (
    <div className="product-detail-page">
      {/* HEADER */}
      <header className="product-detail-header">
        {/* NÚT QUAY LẠI */}
        <button
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <span className="back-arrow">←</span>
          Quay lại
        </button>

        {/* LOGO */}
        <div className="detail-logo">
          <div className="detail-logo-icon">🛒</div>

          <div>
            <div className="detail-logo-title">
              Smart Grocery
            </div>

            <div className="detail-logo-subtitle">
              GROCERY STORE
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="product-detail-container">
        <div className="product-detail-card">
          {/* IMAGE */}
          <div
            className="product-detail-image"
            style={{
              backgroundColor: product.color || "#f5f5f5",
            }}
          >
            <span>{product.emoji || "🛒"}</span>

            {product.tag && (
              <div className="product-detail-tag">
                {product.tag}
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="product-detail-info">
            <div className="product-detail-category">
              {product.category || "Sản phẩm"}
            </div>

            <h1>{product.name}</h1>

            <div className="product-detail-rating">
              <span>★★★★★</span>

              <span className="rating-text">
                4.9 (120 đánh giá)
              </span>
            </div>

            <div className="product-detail-price">
              {Number(product.price).toLocaleString("vi-VN")}đ

              {product.oldPrice && (
                <span className="product-detail-old-price">
                  {Number(product.oldPrice).toLocaleString("vi-VN")}đ
                </span>
              )}
            </div>

            <div className="product-detail-unit">
              Đơn vị: {product.unit || "sản phẩm"}
            </div>

            <div className="product-detail-divider" />

            <h3>Mô tả sản phẩm</h3>

            <p className="product-description">
              {product.description ||
                `Sản phẩm ${product.name} chất lượng cao, được lựa chọn kỹ càng và phù hợp cho nhu cầu mua sắm hàng ngày của gia đình.`}
            </p>

            <div className="product-detail-divider" />

            {/* QUANTITY */}
            <div className="quantity-section">
              <span>Số lượng</span>

              <div className="quantity-control">
                <button onClick={decreaseQuantity}>
                  −
                </button>

                <span>{quantity}</span>

                <button onClick={increaseQuantity}>
                  +
                </button>
              </div>
            </div>

            {/* ADD TO CART */}
            <button
              className="add-cart-detail-button"
              onClick={handleAddToCart}
            >
              🛒 Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </main>

      {/* STYLE RIÊNG CHO TRANG CHI TIẾT */}
      <style>{`
        .product-detail-page {
          min-height: 100vh;
          background: #f5faf6;
          font-family: "Nunito Sans", sans-serif;
          color: #253f50;
        }

        /* =========================
           HEADER
        ========================= */

        .product-detail-header {
          height: 76px;
          background: white;
          border-bottom: 1px solid #e4eee5;
          display: flex;
          align-items: center;
          padding: 0 6%;
          gap: 30px;
        }

        /* =========================
           NÚT QUAY LẠI
        ========================= */

        .back-button {
          border: none;
          background: #4caf50;
          color: white;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;

          padding: 10px 18px;
          border-radius: 10px;

          display: flex;
          align-items: center;
          gap: 7px;

          transition: 0.2s;
        }

        .back-button:hover {
          background: #43a047;
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(76, 175, 80, 0.25);
        }

        .back-arrow {
          font-size: 18px;
          line-height: 1;
        }

        /* =========================
           LOGO SMART GROCERY
        ========================= */

        .detail-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .detail-logo-icon {
          width: 42px;
          height: 42px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #eaf7ec;
          border-radius: 12px;

          font-size: 23px;
        }

        .detail-logo-title {
          font-size: 19px;
          font-weight: 900;
          color: #3f9e45;
          line-height: 1.1;
        }

        .detail-logo-subtitle {
          font-size: 9px;
          letter-spacing: 2px;
          color: #8a9890;
          margin-top: 3px;
        }

        /* =========================
           CONTAINER
        ========================= */

        .product-detail-container {
          max-width: 1150px;
          margin: 0 auto;
          padding: 50px 24px;
        }

        /* =========================
           CARD
        ========================= */

        .product-detail-card {
          background: white;
          border-radius: 24px;
          padding: 35px;

          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 55px;

          box-shadow: 0 8px 35px rgba(76, 175, 80, 0.08);

          border: 1px solid #e8f1e9;
        }

        /* =========================
           PRODUCT IMAGE
        ========================= */

        .product-detail-image {
          min-height: 500px;
          border-radius: 20px;

          display: flex;
          align-items: center;
          justify-content: center;

          position: relative;
          overflow: hidden;
        }

        .product-detail-image span {
          font-size: 180px;

          filter: drop-shadow(
            0 15px 15px rgba(0, 0, 0, 0.12)
          );
        }

        .product-detail-tag {
          position: absolute;
          top: 20px;
          left: 20px;

          background: #4caf50;
          color: white;

          padding: 7px 13px;
          border-radius: 20px;

          font-size: 13px;
          font-weight: 800;
        }

        /* =========================
           PRODUCT INFO
        ========================= */

        .product-detail-info {
          padding: 10px 0;
        }

        .product-detail-category {
          color: #5aaa60;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .product-detail-info h1 {
          margin: 0;

          font-size: 34px;
          line-height: 1.2;

          color: #253f50;
        }

        /* =========================
           RATING
        ========================= */

        .product-detail-rating {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 15px;
        }

        .product-detail-rating span:first-child {
          color: #f5b700;
          letter-spacing: 2px;
        }

        .rating-text {
          color: #8b9aa2;
          font-size: 14px;
        }

        /* =========================
           PRICE
        ========================= */

        .product-detail-price {
          margin-top: 25px;

          font-size: 30px;
          font-weight: 900;

          color: #3f9e45;
        }

        .product-detail-old-price {
          font-size: 16px;
          color: #a5afb4;

          text-decoration: line-through;
          margin-left: 12px;

          font-weight: 500;
        }

        .product-detail-unit {
          margin-top: 7px;
          color: #8b9aa2;
          font-size: 14px;
        }

        /* =========================
           DIVIDER
        ========================= */

        .product-detail-divider {
          height: 1px;
          background: #e8f0e9;
          margin: 25px 0;
        }

        .product-detail-info h3 {
          margin-bottom: 10px;
          font-size: 18px;
          color: #253f50;
        }

        .product-description {
          color: #667780;
          line-height: 1.7;
          font-size: 15px;
        }

        /* =========================
           QUANTITY
        ========================= */

        .quantity-section {
          display: flex;
          justify-content: space-between;
          align-items: center;

          margin-bottom: 22px;

          font-weight: 800;
        }

        .quantity-control {
          display: flex;
          align-items: center;

          border: 1px solid #cfe3d1;
          border-radius: 10px;

          overflow: hidden;
        }

        .quantity-control button {
          width: 38px;
          height: 38px;

          border: none;

          background: #edf8ee;

          font-size: 20px;
          cursor: pointer;

          color: #3f9e45;

          font-weight: 800;

          transition: 0.2s;
        }

        .quantity-control button:hover {
          background: #dff1e1;
        }

        .quantity-control span {
          width: 42px;

          text-align: center;

          font-weight: 800;

          color: #253f50;
        }

        /* =========================
           ADD TO CART
        ========================= */

        .add-cart-detail-button {
          width: 100%;
          height: 54px;

          border: none;
          border-radius: 12px;

          background: #4caf50;
          color: white;

          font-size: 16px;
          font-weight: 800;

          cursor: pointer;

          transition: 0.2s;
        }

        .add-cart-detail-button:hover {
          background: #43a047;

          transform: translateY(-2px);

          box-shadow:
            0 8px 20px rgba(76, 175, 80, 0.25);
        }

        .add-cart-detail-button:active {
          transform: translateY(0);
        }

        /* =========================
           MOBILE
        ========================= */

        @media (max-width: 768px) {
          .product-detail-header {
            padding: 0 20px;
            gap: 15px;
          }

          .product-detail-card {
            grid-template-columns: 1fr;
            gap: 30px;
            padding: 20px;
          }

          .product-detail-image {
            min-height: 350px;
          }

          .product-detail-image span {
            font-size: 130px;
          }

          .product-detail-info h1 {
            font-size: 28px;
          }

          .detail-logo-title {
            font-size: 16px;
          }

          .detail-logo-subtitle {
            font-size: 8px;
          }

          .back-button {
            padding: 9px 12px;
          }
        }
      `}</style>
    </div>
  );
}

export default ProductDetailPage;