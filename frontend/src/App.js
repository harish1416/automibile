import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [parts, setParts] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    axios.get('/api/parts').then(res => setParts(res.data));
  }, []);

  const addToCart = (part) => {
    setCart(prevCart => [...prevCart, { ...part, quantity: 1 }]);
    axios.post('/cart/add', {
      userId: 1,
      partId: part.id,
      quantity: 1
    });
  };

  const checkout = () => {
    axios.post('/cart/checkout', { userId: 1 }).then(res => {
      alert(`✅ Checkout complete. Total: ₹${res.data.total}`);
      setCart([]);
    });
  };

  // 🧠 Group cart items by part.id
  const groupedCart = useMemo(() => {
    const grouped = {};
    cart.forEach(item => {
      if (grouped[item.id]) {
        grouped[item.id].quantity += item.quantity;
      } else {
        grouped[item.id] = { ...item };
      }
    });
    return Object.values(grouped);
  }, [cart]);

  return (
    <div className="container">
      <h1>🛠️ Spare Parts Catalog</h1>
      <div className="catalog">
        {parts.map(part => (
          <div key={part.id} className="card">
            <h3>{part.name}</h3>
            <p>{part.description}</p>
            <p className="price">₹{part.price}</p>
            <button onClick={() => addToCart(part)}>Add to Cart</button>
          </div>
        ))}
      </div>

      <hr />

      <h2>🛒 Cart</h2>
      <div className="cart">
        {groupedCart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          groupedCart.map(item => (
            <div key={item.id} className="cart-item">
              {item.name} × {item.quantity}
            </div>
          ))
        )}
      </div>
      {groupedCart.length > 0 && (
        <button className="checkout-btn" onClick={checkout}>Checkout</button>
      )}
    </div>
  );
}

export default App;
