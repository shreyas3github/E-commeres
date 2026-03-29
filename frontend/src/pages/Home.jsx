import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const deals = [
        { id: 1, name: "Premium Wireless Headphones - Noise Cancelling", oldPrice: "14,999", price: "8,999", image: "🎧", discount: "40%" },
        { id: 2, name: "Smart Fitness Watch Series 9", oldPrice: "9,999", price: "5,499", image: "⌚", discount: "45%" },
        { id: 3, name: "Ultra HD 4K OLED Smart TV", oldPrice: "64,999", price: "42,999", image: "📺", discount: "34%" },
        { id: 4, name: "Creator Pro Laptop - M3 Max", oldPrice: "1,10,000", price: "84,990", image: "💻", discount: "23%" },
        { id: 5, name: "Mirrorless Camera Kit - 4K Video", oldPrice: "85,000", price: "72,500", image: "📷", discount: "15%" },
    ];

    return (
        <div className="home-page">
            <div className="hero-banner">
                <div className="hero-content">
                    <h1 className="hero-title">Tech that accelerates your potential.</h1>
                    <p className="hero-subtitle">
                        Discover a curated collection of premium electronics, designed to elevate your workflow, lifestyle, and creativity.
                    </p>
                    <Link to="/store" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem', borderRadius: '30px' }}>
                        Shop the Collection
                    </Link>
                </div>
            </div>

            <div className="container" style={{ position: 'relative', marginTop: '-60px', zIndex: 10 }}>
                <div className="quad-grid-container">
                    <div className="quad-card">
                        <h3>Elevate your wardrobe</h3>
                        <div className="quad-items">
                            <div className="quad-item"><div className="quad-img">👕</div><span>Apparel</span></div>
                            <div className="quad-item"><div className="quad-img">👟</div><span>Sneakers</span></div>
                            <div className="quad-item"><div className="quad-img">⌚</div><span>Watches</span></div>
                            <div className="quad-item"><div className="quad-img">🎒</div><span>Accessories</span></div>
                        </div>
                        <Link to="/store" className="explore-link">Explore all categories &rarr;</Link>
                    </div>

                    <div className="quad-card">
                        <h3>Smart Home Essentials</h3>
                        <div className="quad-items">
                            <div className="quad-item"><div className="quad-img">📺</div><span>Displays</span></div>
                            <div className="quad-item"><div className="quad-img">🛋️</div><span>Furniture</span></div>
                            <div className="quad-item"><div className="quad-img">💡</div><span>Lighting</span></div>
                            <div className="quad-item"><div className="quad-img">🔊</div><span>Audio</span></div>
                        </div>
                        <Link to="/store" className="explore-link">Shop Smart Home &rarr;</Link>
                    </div>

                    <div className="quad-card">
                        <h3>Fitness & Health Tracking</h3>
                        <div className="quad-items" style={{ gridTemplateColumns: '1fr' }}>
                             <div className="quad-item" style={{ height: '100%' }}>
                                <div className="quad-img" style={{ height:'100%', fontSize:'6rem', backgroundColor: '#f8fafc' }}>🏃‍♀️</div>
                            </div>
                        </div>
                        <Link to="/store" className="explore-link">Explore Wearables &rarr;</Link>
                    </div>

                    <div className="quad-card" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'var(--white)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👋</div>
                        <h3 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Personalize your experience</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>Sign in to see personalized recommendations and fast checkout.</p>
                        <Link to="/auth" className="btn btn-primary" style={{ width: '100%' }}>Sign In securely</Link>
                    </div>
                </div>

                <div className="deals-section">
                    <div className="deals-header">
                        <h2 className="deals-title">Trending Deals</h2>
                        <Link to="/store" className="explore-link" style={{ marginTop: 0 }}>View all &rarr;</Link>
                    </div>
                    
                    <div className="deals-scroll">
                        {deals.map(deal => (
                            <Link to="/store" key={deal.id} style={{textDecoration: 'none', display: 'block'}}>
                                <div className="deal-card">
                                    <div className="deal-img">
                                        <span>{deal.image}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <span className="deal-badge">{deal.discount} OFF</span>
                                        <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Limited Time</span>
                                    </div>
                                    <div className="deal-price">₹{deal.price} <span className="deal-old">₹{deal.oldPrice}</span></div>
                                    <div className="deal-name">{deal.name}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
