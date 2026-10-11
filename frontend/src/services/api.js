const API_BASE_URL = "http://localhost:8080/api";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
    const message =
      typeof data === "string"
        ? data
        : data?.message || data?.error || `Lỗi HTTP ${response.status}`;

    throw new Error(message);
  }

  return data;
}

// ======================================================
// CATALOG APIs
// ======================================================

export async function getProducts() {
  return apiRequest("/products");
}

export async function getProductById(id) {
  return apiRequest(`/products/${id}`);
}

export async function getCategories() {
  return apiRequest("/categories");
}

// ======================================================
// CART APIs (Yêu cầu JWT Token)
// ======================================================

export async function getCart(token) {
  if (!token) return { items: [], totalAmount: 0 };
  return apiRequest("/cart", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function addToCartApi(token, productId, quantity = 1) {
  return apiRequest("/cart/items", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function updateCartItemApi(token, itemId, quantity) {
  return apiRequest(`/cart/items/${itemId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItemApi(token, itemId) {
  return apiRequest(`/cart/items/${itemId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function clearCartApi(token) {
  return apiRequest("/cart", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ======================================================
// ORDER & CHECKOUT APIs
// ======================================================

export async function checkoutOrderApi(token) {
  return apiRequest("/orders/checkout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getMyOrdersApi(token) {
  return apiRequest("/orders", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ======================================================
// LOYALTY & AI APIs
// ======================================================

export async function getMyLoyaltyApi(token) {
  return apiRequest("/loyalty/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getLoyaltyTransactionsApi(token) {
  return apiRequest("/loyalty/transactions", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAiRecommendationsApi(token) {
  return apiRequest("/ai/recommendations", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function refreshAiPredictionsApi(token) {
  return apiRequest("/ai/refresh", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}
