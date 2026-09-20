import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

/*
 * Unified item shape — har page (Dashboard, Cart, Checkout, ServiceDetail)
 * kisi bhi shape m item bhejy, ye dono shapes support karta hai:
 * { id, name, price, img, desc }  AND  { _id, title, price, image, category }
 */
const normalize = (item, qty = 1) => {
  const id = item.id ?? item._id;
  const title = item.title ?? item.name ?? 'Service';
  const price = Number(item.price) || 0;
  const img = item.img ?? item.image ?? '';
  return {
    id,
    _id: id,
    title,
    name: title,
    price,
    img,
    image: img,
    category: item.category || 'Service',
    desc: item.desc || item.description || '',
    qty: Math.max(1, Number(qty) || 1),
  };
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('cart') || '[]');
      return Array.isArray(raw) ? raw.map((i) => normalize(i, i.qty || 1)) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item, qty = 1) =>
    setCartItems((prev) => {
      const next = normalize(item, qty);
      const idx = prev.findIndex((i) => String(i.id) === String(next.id));
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: (copy[idx].qty || 1) + qty };
        return copy;
      }
      return [...prev, next];
    });

  const removeFromCart = (id) =>
    setCartItems((prev) => prev.filter((i) => String(i.id) !== String(id)));

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce(
    (s, i) => s + (Number(i.price) || 0) * (i.qty || 1),
    0
  );
  const cartCount = cartItems.reduce((s, i) => s + (i.qty || 1), 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, clearCart, cartTotal, cartCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
export default CartProvider;