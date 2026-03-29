import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import './Search.css';

const Search = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters State
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [maxPrice, setMaxPrice] = useState(null);
    const [minStars, setMinStars] = useState(0);

    const { addToCart } = useCart();
    const location = useLocation();
    
    // Parse ?q= out of the URL
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('q') || '';

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch Products
                const resProducts = await axios.get('http://localhost:8000/api/products/');
                const rawProducts = resProducts.data.results || resProducts.data;
                const mappedProducts = rawProducts.map(p => {
                    const full = Math.floor(Math.random() * 2) + 3; 
                    const half = Math.random() > 0.5 ? 1 : 0;
                    return { ...p, ratingAvg: full + (half * 0.5), ratingCount: Math.floor(Math.random() * 4000) + 120 };
                });
                setProducts(mappedProducts);

                // Fetch Categories
                const resCats = await axios.get('http://localhost:8000/api/categories/');
                setCategories(resCats.data.results || resCats.data);

            } catch (err) {
                console.error("Failed to fetch initial data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const generateStarsHTML = (rating) => {
        const full = Math.floor(rating);
        const half = rating % 1 !== 0 ? 1 : 0;
        const empty = 5 - full - half;
        return '⭐'.repeat(full) + '🌟'.repeat(half) + '☆'.repeat(empty);
    };

    // Filter Logic
    let filteredProducts = products;

    // Apply String Query Search Filter
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }

    // Apply Sidebar Filters
    if (selectedCategory) {
        filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
    }
    if (maxPrice) {
        if (maxPrice === -1) {
            filteredProducts = filteredProducts.filter(p => parseFloat(p.price) > 10000);
        } else if (maxPrice === 1000) {
            filteredProducts = filteredProducts.filter(p => parseFloat(p.price) <= 1000);
        } else if (maxPrice === 5000) {
            filteredProducts = filteredProducts.filter(p => parseFloat(p.price) > 1000 && parseFloat(p.price) <= 5000);
        } else if (maxPrice === 10000) {
            filteredProducts = filteredProducts.filter(p => parseFloat(p.price) > 5000 && parseFloat(p.price) <= 10000);
        }
    }
    if (minStars > 0) {
        filteredProducts = filteredProducts.filter(p => p.ratingAvg >= minStars);
    }

    // Generate Recommendations based on everything EXCLUDING what's in filteredProducts
    // To ensure recommendations are 'related' but not the exact same items shown.
    const recommendations = products.filter(p => !filteredProducts.some(fp => fp.id === p.id)).slice(0, 4);

    return (
        <div className="search-page">
            <div className="container">
                {searchQuery && (
                    <div className="search-results-header">
                        <strong>{filteredProducts.length} results</strong> for <span style={{ color: 'var(--accent)' }}>"{searchQuery}"</span>
                    </div>
                )}
                
                <div className="search-layout">
                    {/* Sidebar Filters */}
                    <aside className="filter-sidebar">
                        <h3>Category</h3>
                        <ul>
                            <li className={!selectedCategory ? 'active-filter' : ''} onClick={() => setSelectedCategory(null)}>
                                All Categories
                            </li>
                            {categories.map(cat => (
                                <li key={cat.id} 
                                    className={selectedCategory === cat.id ? 'active-filter' : ''} 
                                    onClick={() => setSelectedCategory(cat.id)}>
                                    {cat.name}
                                </li>
                            ))}
                        </ul>

                        <h3>Customer Review</h3>
                        <div className="rating-filter" onClick={() => setMinStars(4)} style={{ color: minStars === 4 ? 'var(--accent)' : '#fbbf24', fontWeight: minStars === 4 ? 'bold' : 'normal' }}>⭐⭐⭐⭐☆ & Up</div>
                        <div className="rating-filter" onClick={() => setMinStars(3)} style={{ color: minStars === 3 ? 'var(--accent)' : '#fbbf24', fontWeight: minStars === 3 ? 'bold' : 'normal' }}>⭐⭐⭐☆☆ & Up</div>
                        <div className="rating-filter" onClick={() => setMinStars(0)} style={{ color: 'var(--text-muted)' }}>Clear Review Filter</div>
                        
                        <h3>Price</h3>
                        <ul>
                            <li className={!maxPrice ? 'active-filter' : ''} onClick={() => setMaxPrice(null)}>Any Price</li>
                            <li className={maxPrice === 1000 ? 'active-filter' : ''} onClick={() => setMaxPrice(1000)}>Under ₹1,000</li>
                            <li className={maxPrice === 5000 ? 'active-filter' : ''} onClick={() => setMaxPrice(5000)}>₹1,000 - ₹5,000</li>
                            <li className={maxPrice === 10000 ? 'active-filter' : ''} onClick={() => setMaxPrice(10000)}>₹5,000 - ₹10,000</li>
                            <li className={maxPrice === -1 ? 'active-filter' : ''} onClick={() => setMaxPrice(-1)}>Over ₹10,000</li>
                        </ul>
                    </aside>

                    {/* Product Grid */}
                    <div className="product-list">
                        {!searchQuery && (
                            <div className="search-results-header" style={{ marginBottom: '24px' }}>
                                <strong>{filteredProducts.length} items</strong> found in your selection
                            </div>
                        )}

                        <div className="product-grid">
                            {loading ? (
                                <p style={{ padding: '20px' }}>Loading products and filters...</p>
                            ) : filteredProducts.length === 0 ? (
                                <p style={{ padding: '20px' }}>No products found matching your filters/search.</p>
                            ) : (
                                filteredProducts.map(product => {
                                    return (
                                        <div className="product-card" key={product.id}>
                                            <div className="product-img">
                                                <Link to={`/product/${product.id}`} style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                                    <img 
                                                        src={product.images?.[0]?.image || 'https://placehold.co/200x200/png?text=ShopX+Product'} 
                                                        alt={product.name} 
                                                    />
                                                </Link>
                                            </div>
                                            <div className="product-info">
                                                <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
                                                    <h2 className="product-title">{product.name}</h2>
                                                </Link>
                                                <div className="product-rating">
                                                    {generateStarsHTML(product.ratingAvg)} <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({product.ratingCount})</span>
                                                </div>
                                                <div className="product-price">
                                                    <span style={{ fontSize: '1rem', position: 'relative', top: '-0.3em' }}>₹</span>
                                                    {product.price.split('.')[0]}
                                                    <span style={{ fontSize: '1rem', position: 'relative', top: '-0.3em' }}>
                                                        {product.price.split('.')[1] ? '.' + product.price.split('.')[1] : ''}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                                    {product.variants?.length > 0 ? `Available in ${product.variants.length} options` : 'Standard edition'}
                                                </p>
                                                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => addToCart({
                                                    id: product.id,
                                                    name: product.name,
                                                    price: parseFloat(product.price)
                                                })}>
                                                    Add to Cart
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Recommendations Block */}
                        {recommendations.length > 0 && (
                            <div style={{ marginTop: '60px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', fontWeight: 700, color: 'var(--text-main)' }}>You might also like</h2>
                                <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                                    {recommendations.map(product => {
                                        return (
                                            <div className="product-card" key={`rec-${product.id}`}>
                                                <div className="product-img" style={{ height: '200px' }}>
                                                    <Link to={`/product/${product.id}`} style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                                        <img 
                                                            src={product.images?.[0]?.image || 'https://placehold.co/200x200/png?text=ShopX+Product'} 
                                                            alt={product.name} 
                                                        />
                                                    </Link>
                                                </div>
                                                <div className="product-info" style={{ padding: '16px' }}>
                                                    <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
                                                        <h2 className="product-title" style={{ fontSize: '1rem' }}>{product.name}</h2>
                                                    </Link>
                                                    <div className="product-rating" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>
                                                        {generateStarsHTML(product.ratingAvg)} <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>({product.ratingCount})</span>
                                                    </div>
                                                    <div className="product-price" style={{ fontSize: '1.25rem', paddingBottom: '12px' }}>
                                                        <span style={{ fontSize: '0.85rem', position: 'relative', top: '-0.3em' }}>₹</span>
                                                        {product.price.split('.')[0]}
                                                    </div>
                                                    <button className="btn btn-outline" style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }} onClick={() => addToCart({
                                                        id: product.id,
                                                        name: product.name,
                                                        price: parseFloat(product.price)
                                                    })}>
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Search;
