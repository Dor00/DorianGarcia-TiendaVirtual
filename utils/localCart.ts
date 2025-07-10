export const getLocalCart = () => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
};

export const setLocalCart = (cart: any[]) => {
  localStorage.setItem("cart", JSON.stringify(cart));
};

export const clearLocalCart = () => {
  localStorage.removeItem("cart");
};

