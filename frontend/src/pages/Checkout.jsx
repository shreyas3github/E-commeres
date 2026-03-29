import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Checkout.css';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const Checkout = () => {
    const { cart, getCartTotal, clearCart } = useCart();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('new');
    const [idempotencyKey] = useState(() => crypto.randomUUID());
    
    // Manual form state
    const [location, setLocation] = useState('Home');
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [stateRegion, setStateRegion] = useState('');
    const [country, setCountry] = useState('India');
    const [postalCode, setPostalCode] = useState('');
    
    // Default to card for Razorpay UI test
    const [paymentMode, setPaymentMode] = useState('card');
    const [fetchingLocation, setFetchingLocation] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/auth?redirect=checkout');
            return;
        }

        const fetchAddresses = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const res = await axios.get('http://localhost:8000/api/addresses/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const fetchedAddresses = res.data.results || res.data;
                setAddresses(fetchedAddresses);
                
                if (fetchedAddresses.length > 0) {
                    setSelectedAddressId(fetchedAddresses[0].id);
                }
            } catch (err) {
                console.error("Failed to fetch addresses:", err);
                if (err.response && err.response.status === 401) {
                    logout();
                    navigate('/auth');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchAddresses();
    }, [user, navigate, logout]);

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        if (cart.length === 0) {
            alert('Your cart is empty!');
            return navigate('/store');
        }

        let finalAddressId = selectedAddressId;
        const token = localStorage.getItem('access_token');

        try {
            if (selectedAddressId === 'new') {
                if (!street || !city) {
                    alert("Please fill in Street and City for your delivery address.");
                    return;
                }
                const addrRes = await axios.post('http://localhost:8000/api/addresses/', {
                    street, city, 
                    state: stateRegion || 'N/A', 
                    country, 
                    postal_code: postalCode || '000000',
                    is_default: false
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                finalAddressId = addrRes.data.id;
            }

            const total = getCartTotal().toFixed(2);
            
            // 1. Create eCommerce Base Order (Idempotent)
            setLoading(true); // Reuse loading state for modal overlay
            const res = await axios.post('http://localhost:8000/api/orders/', {
                total_price: total,
                status: 'pending',
                address: finalAddressId 
            }, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Idempotency-Key': idempotencyKey
                }
            });

            if (res.status === 201 || res.status === 200) {
                const createdOrderId = res.data.id;

                // 2. Poll the Backend for Celery Task Completion
                const pollInterval = setInterval(async () => {
                    try {
                        const checkRes = await axios.get(`http://localhost:8000/api/orders/${createdOrderId}/`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const currentStatus = checkRes.data.status;
                        
                        if (currentStatus === 'confirmed') {
                            clearInterval(pollInterval);
                            setLoading(false);
                            alert("Order Confirmed Successfully! Payment and Inventory constraints passed.");
                            clearCart();
                            navigate('/profile');
                        } else if (currentStatus === 'payment_failed') {
                            clearInterval(pollInterval);
                            setLoading(false);
                            alert(`Order Failed: Payment Simulation could not be completed after retries.`);
                        } else if (currentStatus === 'inventory_failed') {
                            clearInterval(pollInterval);
                            setLoading(false);
                            alert(`Order Failed: ${checkRes.data.failure_reason || 'Out of Stock'}`);
                        }
                    } catch (pollErr) {
                        console.error('Polling error', pollErr);
                    }
                }, 1500); // Check every 1.5 seconds

                // Timeout after 30 seconds
                setTimeout(() => {
                    clearInterval(pollInterval);
                    setLoading(false);
                    alert("Order is taking longer than expected. Please check your Profile for updates navigating shortly.");
                    clearCart();
                    navigate('/profile');
                }, 30000);
            }
        } catch (err) {
            console.error('Checkout error', err);
            alert('There was an issue processing your order.');
            setLoading(false);
        }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                if (res.data && res.data.address) {
                    const addr = res.data.address;
                    setCity(addr.city || addr.town || addr.village || addr.county || '');
                    setStreet(`${addr.road || ''} ${addr.suburb || ''} ${addr.neighbourhood || ''}`.trim());
                    setStateRegion(addr.state || '');
                    setCountry(addr.country || 'India');
                    setPostalCode(addr.postcode || '');
                }
            } catch (err) {
                console.error("Failed to fetch address", err);
                alert("Could not pin-point your exact address, please fill it manually.");
            } finally {
                setFetchingLocation(false);
            }
        }, () => {
            setFetchingLocation(false);
            alert("Unable to retrieve your location. Please check browser permissions.");
        });
    };

    if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading Checkout...</div>;

    return (
        <div className="checkout-page container">
            <h1 className="checkout-title">Checkout <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>({cart.length} items)</span></h1>
            
            <div className="checkout-grid">
                <div className="checkout-form-container">
                    <form onSubmit={handlePlaceOrder}>
                        
                        <div className="checkout-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2>1. Delivery Address</h2>
                                {selectedAddressId === 'new' && (
                                    <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={handleGetLocation} disabled={fetchingLocation}>
                                        {fetchingLocation ? 'Locating...' : '📍 Use Live Location'}
                                    </button>
                                )}
                            </div>

                            {/* Saved Addresses List */}
                            <div className="address-selector">
                                {addresses.map(addr => (
                                    <label key={addr.id} className={`address-option ${selectedAddressId === addr.id ? 'selected' : ''}`}>
                                        <input type="radio" name="addressSelect" value={addr.id} checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} />
                                        <div className="address-details">
                                            <strong>{addr.city}, {addr.country}</strong>
                                            <p>{addr.street}</p>
                                        </div>
                                    </label>
                                ))}
                                
                                <label className={`address-option ${selectedAddressId === 'new' ? 'selected' : ''}`}>
                                    <input type="radio" name="addressSelect" value="new" checked={selectedAddressId === 'new'} onChange={() => setSelectedAddressId('new')} />
                                    <div className="address-details">
                                        <strong>+ Add a new delivery address</strong>
                                    </div>
                                </label>
                            </div>

                            {/* Manual New Address Form */}
                            {selectedAddressId === 'new' && (
                                <div className="new-address-form slide-down">
                                    <div className="checkout-group">
                                        <label>Location Type</label>
                                        <select value={location} onChange={(e) => setLocation(e.target.value)}>
                                            <option value="Home">Home (All day delivery)</option>
                                            <option value="Work">Work (Delivery between 10 AM - 5 PM)</option>
                                        </select>
                                    </div>
                                    <div className="checkout-group">
                                        <label>Street Address</label>
                                        <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} required placeholder="House No, Building, Street, Area" />
                                    </div>
                                    <div className="checkout-group">
                                        <label>City</label>
                                        <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="City or Town" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="checkout-section">
                            <h2>2. Payment Method</h2>
                            <div className="payment-options">
                                <label className={`pay-option ${paymentMode === 'card' ? 'selected' : ''}`}>
                                    <input type="radio" name="payment" value="card" checked={paymentMode === 'card'} onChange={() => setPaymentMode('card')} />
                                    <span>Credit or Debit Card</span>
                                </label>
                                <label className={`pay-option ${paymentMode === 'upi' ? 'selected' : ''}`}>
                                    <input type="radio" name="payment" value="upi" checked={paymentMode === 'upi'} onChange={() => setPaymentMode('upi')} />
                                    <span>UPI / Netbanking</span>
                                </label>
                                <label className={`pay-option ${paymentMode === 'cod' ? 'selected' : ''}`}>
                                    <input type="radio" name="payment" value="cod" checked={paymentMode === 'cod'} onChange={() => setPaymentMode('cod')} />
                                    <span>Cash on Delivery (COD)</span>
                                </label>
                            </div>
                        </div>

                        <div className="checkout-section" style={{ borderBottom: 'none' }}>
                            <h2>3. Review items and delivery</h2>
                            <div className="checkout-items">
                                {cart.map(item => (
                                    <div key={item.id} className="checkout-item">
                                        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>{item.name}</div>
                                        <div style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '1.1rem' }}>₹{parseFloat(item.price).toLocaleString()}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>Qty: {item.quantity}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </form>
                </div>

                <div className="checkout-summary-container">
                    <div className="checkout-summary">
                        <button type="button" className="btn btn-primary place-order-btn" onClick={handlePlaceOrder}>Place your order</button>
                        <p style={{ fontSize: '0.75rem', textAlign: 'center', margin: '10px 0', color: 'var(--text-muted)' }}>
                            By placing your order, you agree to ShopX's privacy notice and conditions of use.
                        </p>
                        
                        <div className="summary-details">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Order Summary</h3>
                            <div className="s-row">
                                <span>Items:</span>
                                <span>₹{getCartTotal().toLocaleString()}</span>
                            </div>
                            <div className="s-row">
                                <span>Delivery:</span>
                                <span>₹0.00</span>
                            </div>
                            <div className="s-row total-row">
                                <span>Order Total:</span>
                                <span>₹{getCartTotal().toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
