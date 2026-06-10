import { createContext, useContext, useReducer, useState, useEffect } from 'react';

const CartContext = createContext(null);

function getCartKey() {
  try {
    const data = JSON.parse(localStorage.getItem('clienteData') || 'null');
    return data?.id ? `carrito_${data.id}` : null;
  } catch {
    return null;
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find(i => i.id === action.item.id);
      if (existing) {
        return state.map(i =>
          i.id === action.item.id
            ? { ...i, cantidad: Math.min(i.cantidad + 1, i.stock) }
            : i
        );
      }
      return [...state, { ...action.item, cantidad: 1 }];
    }
    case 'REMOVE':
      return state.filter(i => i.id !== action.id);
    case 'UPDATE_QTY':
      return state.map(i =>
        i.id === action.id
          ? { ...i, cantidad: Math.max(1, Math.min(action.cantidad, i.stock)) }
          : i
      );
    case 'LOAD':
      return Array.isArray(action.items) ? action.items : [];
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

function loadCart() {
  const key = getCartKey();
  if (!key) return [];
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, null, loadCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const key = getCartKey();
    if (key) localStorage.setItem(key, JSON.stringify(items));
  }, [items]);

  const total = items.reduce((sum, i) => sum + Number(i.precio) * i.cantidad, 0);
  const count = items.reduce((sum, i) => sum + i.cantidad, 0);

  return (
    <CartContext.Provider value={{ items, dispatch, total, count, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
