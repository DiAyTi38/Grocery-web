// ======================================================
// ADMIN STORAGE
// Tạm thời lưu dữ liệu bằng localStorage.
// Sau này Giai đoạn 7 sẽ thay bằng Backend + Database.
// ======================================================

const USERS_KEY = "smart-grocery-users";
const POINTS_KEY = "smart-grocery-points";
const PRODUCTS_KEY = "smart-grocery-products";
const CATEGORIES_KEY = "smart-grocery-categories";

// ======================================================
// USERS
// ======================================================

export function getUsers() {
  try {
    const users = JSON.parse(
      localStorage.getItem(USERS_KEY) || "[]"
    );

    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  localStorage.setItem(
    USERS_KEY,
    JSON.stringify(users)
  );
}

// ======================================================
// POINTS
// ======================================================

export function getUserPoints(user) {
  if (!user) return 0;

  if (typeof user.points === "number") {
    return user.points;
  }

  try {
    const points = JSON.parse(
      localStorage.getItem(POINTS_KEY) || "{}"
    );

    return Number(points[user.email] || 0);
  } catch {
    return 0;
  }
}

export function updateUserPoints(email, amount) {
  const users = getUsers();

  const index = users.findIndex(
    (user) =>
      user.email?.toLowerCase() === email.toLowerCase()
  );

  if (index === -1) {
    return {
      success: false,
      message: "Không tìm thấy tài khoản.",
    };
  }

  const currentPoints = getUserPoints(users[index]);

  const newPoints = Math.max(
    0,
    currentPoints + Number(amount)
  );

  users[index] = {
    ...users[index],
    points: newPoints,
  };

  saveUsers(users);

  const pointsMap = JSON.parse(
    localStorage.getItem(POINTS_KEY) || "{}"
  );

  pointsMap[email] = newPoints;

  localStorage.setItem(
    POINTS_KEY,
    JSON.stringify(pointsMap)
  );

  return {
    success: true,
    points: newPoints,
  };
}

// ======================================================
// XẾP HẠNG
// ======================================================

export function getUserRank(points) {
  const value = Number(points) || 0;

  if (value >= 5000) {
    return {
      name: "Kim cương",
      icon: "💎",
      className: "diamond",
    };
  }

  if (value >= 2000) {
    return {
      name: "Vàng",
      icon: "🥇",
      className: "gold",
    };
  }

  if (value >= 500) {
    return {
      name: "Bạc",
      icon: "🥈",
      className: "silver",
    };
  }

  return {
    name: "Chưa đạt hạng",
    icon: "⭐",
    className: "none",
  };
}

// ======================================================
// PRODUCTS
// ======================================================

const defaultProducts = [
  {
    id: "SP001",
    name: "Bánh quy bơ",
    category: "Bánh kẹo",
    price: 45000,
    stock: 100,
  },
  {
    id: "SP002",
    name: "Nước cam",
    category: "Đồ uống",
    price: 30000,
    stock: 80,
  },
  {
    id: "SP003",
    name: "Mì tôm",
    category: "Mì & thực phẩm",
    price: 5000,
    stock: 200,
  },
  {
    id: "SP004",
    name: "Nước mắm",
    category: "Gia vị",
    price: 65000,
    stock: 50,
  },
];

export function getProducts() {
  try {
    const products = JSON.parse(
      localStorage.getItem(PRODUCTS_KEY)
    );

    if (Array.isArray(products)) {
      return products;
    }

    localStorage.setItem(
      PRODUCTS_KEY,
      JSON.stringify(defaultProducts)
    );

    return defaultProducts;
  } catch {
    return defaultProducts;
  }
}

export function saveProducts(products) {
  localStorage.setItem(
    PRODUCTS_KEY,
    JSON.stringify(products)
  );
}

// ======================================================
// CATEGORIES
// ======================================================

const defaultCategories = [
  {
    id: "DM001",
    name: "Bánh kẹo",
    description: "Các loại bánh và đồ ăn vặt",
  },
  {
    id: "DM002",
    name: "Đồ uống",
    description: "Nước uống và đồ uống đóng chai",
  },
  {
    id: "DM003",
    name: "Mì & thực phẩm",
    description: "Mì, cháo và thực phẩm khô",
  },
  {
    id: "DM004",
    name: "Gia vị",
    description: "Các loại gia vị nấu ăn",
  },
  {
    id: "DM005",
    name: "Hóa mỹ phẩm",
    description: "Sản phẩm chăm sóc cá nhân",
  },
  {
    id: "DM006",
    name: "Đồ gia dụng",
    description: "Các sản phẩm sử dụng trong gia đình",
  },
  {
    id: "DM007",
    name: "Thực phẩm tươi",
    description: "Rau củ, thịt, trứng và thực phẩm tươi",
  },
];

export function getCategories() {
  try {
    const categories = JSON.parse(
      localStorage.getItem(CATEGORIES_KEY)
    );

    if (Array.isArray(categories)) {
      return categories;
    }

    localStorage.setItem(
      CATEGORIES_KEY,
      JSON.stringify(defaultCategories)
    );

    return defaultCategories;
  } catch {
    return defaultCategories;
  }
}

export function saveCategories(categories) {
  localStorage.setItem(
    CATEGORIES_KEY,
    JSON.stringify(categories)
  );
}

// ======================================================
// TẠO ID
// ======================================================

export function createId(prefix) {
  return (
    prefix +
    Date.now().toString().slice(-6)
  );
}