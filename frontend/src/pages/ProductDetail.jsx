import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, toggleCart } = useCart();
    
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mainImage, setMainImage] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/api/products/${id}/`);
                setProduct(res.data);
                if (res.data.images && res.data.images.length > 0) {
                    setMainImage(res.data.images[0].image);
                } else {
                    setMainImage('https://placehold.co/500x500/png?text=ShopX+Product');
                }
            } catch (err) {
                console.error("Failed to fetch product detail:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
        window.scrollTo(0, 0);
    }, [id]);

    if (loading) return <div className="container" style={{ padding: '40px' }}>Loading product details...</div>;
    if (!product) return <div className="container" style={{ padding: '40px' }}>Product not found.</div>;

    const generateStarsHTML = () => {
        // Mock rating based on ID deterministically or randomly
        return '⭐⭐⭐⭐☆';
    };

    const handleAddToCart = () => {
        addToCart({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price)
        });
    };

    const handleBuyNow = () => {
        handleAddToCart();
        navigate('/checkout'); // Instantly go to checkout
    };

    // Calculate generic mock discount
    const originalPrice = (parseFloat(product.price) * 1.25).toFixed(2);
    const discountPercent = 20;

    return (
        <div className="container pdt-page">
            <div className="pdt-nav-breadcrumb">
                <Link to="/">Home</Link> &rsaquo; <Link to="/store">Products</Link> &rsaquo; <span>{product.name}</span>
            </div>

            <div className="pdt-layout">
                {/* Left Side: Images */}
                <div className="pdt-images">
                    <div className="main-image-container">
                        <img src={mainImage} alt={product.name} className="main-image" />
                    </div>
                    {product.images && product.images.length > 1 && (
                        <div className="thumbnail-list">
                            {product.images.map(img => (
                                <img 
                                    key={img.id} 
                                    src={img.image} 
                                    className={`thumbnail ${mainImage === img.image ? 'active' : ''}`}
                                    onMouseEnter={() => setMainImage(img.image)}
                                    alt="thumbnail"
                                    style={{ mixBlendMode: 'multiply' }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Center: Info */}
                <div className="pdt-info">
                    <h1 className="pdt-title">{product.name}</h1>
                    
                    <div className="pdt-rating">
                        {generateStarsHTML()} <span className="rating-count">1,245 reviews</span>
                    </div>

                    <div className="pdt-price-box">
                        <div className="discount-tag">-{discountPercent}%</div>
                        <div className="pdt-price">
                            <span className="currency">₹</span>
                            {product.price.split('.')[0]}
                            <span className="cents">{product.price.split('.')[1] || '00'}</span>
                        </div>
                    </div>
                    <div className="pdt-mrp">
                        M.R.P.: <span>₹{originalPrice}</span>
                    </div>

                    <p className="inclusive-taxes">Inclusive of all taxes</p>

                    <div className="offers-box">
                        <h3>Available Offers</h3>
                        <ul>
                            <li><strong>Bank Offer:</strong> 10% instant discount on participating Credit Cards.</li>
                            <li><strong>Partner Offer:</strong> Get GST invoice and save up to 28% on business purchases.</li>
                            <li><strong>No Cost EMI:</strong> Avail No Cost EMI on select cards for orders above ₹3000.</li>
                        </ul>
                    </div>

                    <div className="pdt-description-block">
                        <h3>About this item</h3>
                        <p>{product.description}</p>
                    </div>
                </div>

                {/* Right Side: Buy Box */}
                <div className="pdt-buybox">
                    <div className="buybox-inner">
                        <div className="buybox-price">₹{product.price.split('.')[0]}</div>
                        <div className="delivery-info">
                            <span style={{ color: 'var(--accent)', fontWeight: 500 }}>FREE delivery</span> <strong>Tomorrow, 8 AM - 12 PM</strong>. Order within 10 hrs 30 mins.
                        </div>
                        <div className="stock-status">In stock</div>
                        
                        <div className="ships-sold">
                            <span>Ships from</span> <strong>ShopX</strong>
                            <span>Sold by</span> <strong>ShopX Retail</strong>
                        </div>

                        <div className="buy-actions">
                            <button className="btn pdt-btn pdt-addcart" onClick={handleAddToCart}>Add to Cart</button>
                            <button className="btn pdt-btn pdt-buynow" onClick={handleBuyNow}>Buy Now</button>
                        </div>
                        
                        <div className="secure-tx">
                            <span style={{ fontSize: '1.2rem' }}>🔒</span> Secure transaction
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="pdt-reviews">
                <h2>Customer reviews</h2>
                <div style={{ display: 'flex', gap: '40px', marginTop: '20px', flexWrap: 'wrap' }}>
                    <div className="review-snapshot" style={{ width: '300px', flexShrink: 0 }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '16px', fontWeight: 600 }}>{generateStarsHTML()} 4.3 out of 5</div>
                        <div className="bar-row"><span className="bar-label">5 star</span><div className="bar"><div className="bar-inner" style={{width: '60%'}}></div></div><span className="bar-pct">60%</span></div>
                        <div className="bar-row"><span className="bar-label">4 star</span><div className="bar"><div className="bar-inner" style={{width: '20%'}}></div></div><span className="bar-pct">20%</span></div>
                        <div className="bar-row"><span className="bar-label">3 star</span><div className="bar"><div className="bar-inner" style={{width: '10%'}}></div></div><span className="bar-pct">10%</span></div>
                        <div className="bar-row"><span className="bar-label">2 star</span><div className="bar"><div className="bar-inner" style={{width: '5%'}}></div></div><span className="bar-pct">5%</span></div>
                        <div className="bar-row"><span className="bar-label">1 star</span><div className="bar"><div className="bar-inner" style={{width: '5%'}}></div></div><span className="bar-pct">5%</span></div>
                    </div>
                    <div className="review-list" style={{ flex: 1, minWidth: '300px' }}>
                        <h3 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>Top reviews from India</h3>
                        <div className="review-item" style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ background: 'var(--border)', borderRadius: '50%', width:'36px', height:'36px'}}></div>
                                <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>Verified Purchaser</span>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '8px' }}>{generateStarsHTML()} <span style={{ marginLeft: '4px' }}>Excellent product and fast delivery!</span></div>
                            <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6 }}>I was skeptical at first, but the quality of this item is astounding. Matches the description perfectly. Highly recommended if you are looking for something durable.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
