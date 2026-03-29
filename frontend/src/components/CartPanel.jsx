import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './CartPanel.css';

const CartPanel = () => {
    const { cart, isCartOpen, closeCart, getCartTotal, clearCart, updateQuantity, removeFromCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleCheckout = () => {
        if (cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        closeCart();

        if (!user) {
            navigate('/auth?redirect=checkout');
        } else {
            navigate('/checkout');
        }
    };

    return (
        <>
            <div className={`cart-overlay ${isCartOpen ? 'active' : ''}`} onClick={closeCart}></div>
            <div className={`cart-panel ${isCartOpen ? 'active' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 500 }}>Subtotal</h2>
                    <button onClick={closeCart} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer' }}>&times;</button>
                </div>

                <div className="cart-items" style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '60px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🛒</div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Your Cart is Empty</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Looks like you haven't added anything yet.</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="cart-item">
                                <div className="cart-item-thumb">
                                    <img src={item.image || 'https://placehold.co/80x80/png?text=Product'} alt={item.name} />
                                </div>
                                <div className="cart-item-info">
                                    <h4 className="cart-item-title">{item.name}</h4>
                                    <div className="cart-item-price">₹{parseFloat(item.price).toLocaleString()}</div>
                                    <div className="cart-item-actions">
                                        <div className="qty-controls">
                                            <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>&minus;</button>
                                            <span className="qty-value">{item.quantity}</span>
                                            <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>&#43;</button>
                                        </div>
                                        <div className="cart-item-divider">|</div>
                                        <button className="cart-remove-btn" onClick={() => removeFromCart(item.id)}>Delete</button>
                                    </div>
                                </div>
                                <div className="cart-item-total">
                                    ₹{(item.price * item.quantity).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="cart-total-container" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.2rem', fontWeight: 700 }}>
                            <span>Total:</span>
                            <span>₹{getCartTotal().toFixed(2)}</span>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '12px' }} onClick={handleCheckout}>
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartPanel;
