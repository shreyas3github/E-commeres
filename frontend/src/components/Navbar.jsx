import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
    const { user } = useAuth();
    const { getCartCount, toggleCart } = useCart();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = () => {
        if (searchQuery.trim() !== '') {
            navigate(`/store?q=${encodeURIComponent(searchQuery)}`);
        } else {
            navigate('/store');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <header className="main-header">
            <div className="header-top">
                <div className="container header-container">
                    <div className="logo-area">
                        <Link to="/" className="logo-text">ShopX<span>.in</span></Link>
                    </div>
                    
                    <div className="search-bar">
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search for products, brands and more..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button className="search-btn" onClick={handleSearch}>Search</button>
                    </div>

                    <div className="user-actions">
                        <div className="action-item" onClick={() => navigate(user ? '/profile' : '/auth')}>
                            <span style={{ fontSize: '1.4rem' }}>👤</span>
                            <div className="action-text">
                                <span className="action-label">Hello, {user ? user.name || user.username : 'Sign in'}</span>
                                <span className="action-title">Account</span>
                            </div>
                        </div>
                        <div className="action-item" onClick={() => navigate('/profile')}>
                            <span style={{ fontSize: '1.4rem' }}>📦</span>
                            <div className="action-text">
                                <span className="action-label">Returns</span>
                                <span className="action-title">& Orders</span>
                            </div>
                        </div>
                        <div className="action-item cart-action" onClick={toggleCart}>
                            <div className="cart-icon-wrapper">
                                <span className="cart-icon">🛒</span>
                                <span className="cart-count-badge">{getCartCount()}</span>
                            </div>
                            <div className="action-text">
                                <span className="action-title">Cart</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="header-bottom">
                <div className="container sub-nav">
                    <a href="#" style={{ fontWeight: 700 }}>☰ All Categories</a>
                    <Link to="/store">Mobiles</Link>
                    <Link to="/store">Electronics</Link>
                    <Link to="/store">Fashion</Link>
                    <Link to="/store">New Releases</Link>
                    <Link to="/store">Today's Deals</Link>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
