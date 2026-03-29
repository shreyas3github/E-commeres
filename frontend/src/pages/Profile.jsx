import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active'); // 'active', 'completed', 'cancelled'

    const [newAddress, setNewAddress] = useState({ street: '', city: '', state: '', country: '', postal_code: '' });
    const [showAddressForm, setShowAddressForm] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/auth');
            return;
        }

        const fetchData = async () => {
            try {
                const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
                const resOrders = await axios.get('http://localhost:8000/api/orders/', cfg);
                setOrders(resOrders.data.results || resOrders.data);
                
                const resAddr = await axios.get('http://localhost:8000/api/addresses/', cfg);
                setAddresses(resAddr.data.results || resAddr.data);
            } catch (err) {
                console.error("Failed to fetch profile data:", err);
                if (err.response && err.response.status === 401) {
                    alert("Your session has expired. Please log in again.");
                    logout();
                    navigate('/auth');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, navigate]);

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:8000/api/addresses/', newAddress, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setAddresses([res.data, ...addresses]);
            setNewAddress({ street: '', city: '', state: '', country: '', postal_code: '' });
            setShowAddressForm(false);
            alert("Address added successfully!");
        } catch (err) {
            console.error("Failed to add address", err);
            alert("Error adding address.");
        }
    };

    const { cart, addToCart } = useCart();
    
    const [editingAddressId, setEditingAddressId] = useState(null);

    const handleDeleteAddress = async (addrId) => {
        if (!window.confirm("Remove this address?")) return;
        try {
            await axios.delete(`http://localhost:8000/api/addresses/${addrId}/`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setAddresses(addresses.filter(a => a.id !== addrId));
        } catch (err) {
            console.error("Failed to delete address", err);
        }
    };

    const handleBuyAgain = (item) => {
        // Mock item structure for cart: {id, name, price, image}
        // Note: bit of a mismatch since cart expects specific fields. 
        // We'll map product_variant to id for the cart logic.
        addToCart({
            id: item.product_variant,
            name: item.product_name,
            price: item.price,
            image: item.product_image
        });
        alert(`${item.product_name} added to cart!`);
    };

    const handleEditAddress = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.patch(`http://localhost:8000/api/addresses/${editingAddressId}/`, newAddress, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setAddresses(addresses.map(a => a.id === editingAddressId ? res.data : a));
            setNewAddress({ street: '', city: '', state: '', country: '', postal_code: '' });
            setEditingAddressId(null);
            setShowAddressForm(false);
        } catch (err) {
            console.error("Edit failed", err);
        }
    };

    const startEditing = (addr) => {
        setNewAddress({ 
            street: addr.street, 
            city: addr.city, 
            state: addr.state, 
            country: addr.country, 
            postal_code: addr.postal_code 
        });
        setEditingAddressId(addr.id);
        setShowAddressForm(true);
    };

    const handleSignOut = () => {
        if (window.confirm("Are you sure you want to sign out?")) {
            logout();
            navigate('/');
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        
        try {
            await axios.patch(`http://localhost:8000/api/orders/${orderId}/`, {
                status: 'cancelled'
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            
            // Update UI state
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
            alert("Order cancelled successfully.");
        } catch (err) {
            console.error("Failed to cancel order", err);
            alert("Could not cancel the order at this time.");
        }
    };

    if (!user) return null;

    return (
        <div className="container profile-main">
            <h1 className="profile-header">Your Account</h1>
            
            <div className="profile-grid">
                <div className="profile-card" onClick={() => document.getElementById('orders-sec').scrollIntoView({behavior: 'smooth'})}>
                    <div className="p-icon">📦</div>
                    <div className="p-info">
                        <h3>Your Orders</h3>
                        <p>Track, return, or buy things again</p>
                    </div>
                </div>
                
                <div className="profile-card" onClick={() => document.getElementById('addresses-sec').scrollIntoView({behavior: 'smooth'})}>
                    <div className="p-icon">📍</div>
                    <div className="p-info">
                        <h3>Your Addresses</h3>
                        <p>Edit addresses for orders and gifts</p>
                    </div>
                </div>
                
                <div className="profile-card" onClick={handleSignOut}>
                    <div className="p-icon">🚪</div>
                    <div className="p-info">
                        <h3 style={{ color: '#c40000' }}>Sign Out</h3>
                        <p>Safely log out of your account</p>
                    </div>
                </div>
            </div>

            <div className="addresses-section" id="addresses-sec" style={{ marginTop: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.5rem' }}>Your Addresses</h2>
                    <button className="btn btn-primary" onClick={() => setShowAddressForm(!showAddressForm)}>
                        {showAddressForm ? 'Cancel' : 'Add New Address'}
                    </button>
                </div>

                {showAddressForm && (
                    <div className="address-form-box">
                        <form onSubmit={editingAddressId ? handleEditAddress : handleAddAddress}>
                            <h3 style={{ marginBottom: '15px' }}>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
                            <div className="form-row">
                                <input type="text" placeholder="Street Address" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} required />
                                <input type="text" placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} required />
                            </div>
                            <div className="form-row">
                                <input type="text" placeholder="State" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} required />
                                <input type="text" placeholder="Postal Code" value={newAddress.postal_code} onChange={e => setNewAddress({...newAddress, postal_code: e.target.value})} required />
                            </div>
                            <div className="form-row">
                                <input type="text" placeholder="Country" value={newAddress.country} onChange={e => setNewAddress({...newAddress, country: e.target.value})} required />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-primary">{editingAddressId ? 'Update' : 'Save'} Address</button>
                                <button type="button" className="btn btn-outline" onClick={() => { setShowAddressForm(false); setEditingAddressId(null); }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div className="skeleton-grid">
                        {[1,2,3].map(i => <div key={i} className="address-card skeleton" style={{ height: '150px' }}></div>)}
                    </div>
                ) : addresses.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>You have no saved addresses yet.</p>
                ) : (
                    <div className="addresses-container">
                        {addresses.map(addr => (
                            <div className="address-card" key={addr.id}>
                                <strong>{user.name || user.email.split('@')[0]}</strong>
                                <p>{addr.street}</p>
                                <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                                <p>{addr.country}</p>
                                <div className="addr-actions" style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                                    <button onClick={() => startEditing(addr)} style={{ background: 'none', border: 'none', color: '#007185', cursor: 'pointer', marginRight: '15px', fontSize: '0.85rem' }}>Edit</button>
                                    <button onClick={() => handleDeleteAddress(addr.id)} style={{ background: 'none', border: 'none', color: '#c40000', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="orders-section" id="orders-sec" style={{ marginTop: '48px' }}>
                <div className="orders-header-row">
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Your Orders</h2>
                    <div className="order-tabs">
                        <button 
                            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                            onClick={() => setActiveTab('active')}
                        >
                            Active
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                            onClick={() => setActiveTab('completed')}
                        >
                            Completed
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`}
                            onClick={() => setActiveTab('cancelled')}
                        >
                            Cancelled
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="skeleton-list">
                        {[1,2,3].map(i => <div key={i} className="order-card skeleton" style={{ height: '200px', marginBottom: '20px' }}></div>)}
                    </div>
                ) : (
                    <div className="orders-container">
                        {orders
                            .filter(order => {
                                if (activeTab === 'active') return ['pending', 'confirmed', 'shipped'].includes(order.status);
                                if (activeTab === 'completed') return order.status === 'delivered';
                                if (activeTab === 'cancelled') return order.status === 'cancelled';
                                return true;
                            })
                            .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
                            .map(order => (
                            <div className="order-card" key={order.id}>
                                <div className="order-header">
                                    <div className="order-meta">
                                        <div className="meta-item">
                                            <span>ORDER PLACED</span>
                                            <strong>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                                        </div>
                                        <div className="meta-item">
                                            <span>TOTAL</span>
                                            <strong style={{ color: 'var(--text-main)' }}>₹{parseFloat(order.total_price).toLocaleString('en-IN')}</strong>
                                        </div>
                                        <div className="meta-item ship-to">
                                            <span>SHIP TO</span>
                                            <strong style={{ color: 'var(--accent)', cursor: 'pointer' }}>{user.name || 'User'} ▾</strong>
                                        </div>
                                    </div>
                                    <div className="order-id">
                                        <span>ORDER # {order.id.split('-')[0].toUpperCase()}</span>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                            <Link to={`/order/${order.id}`}>Order Details</Link>
                                            <a href="#">Invoice</a>
                                        </div>
                                    </div>
                                </div>
                                <div className="order-body">
                                    <div className="order-items-list">
                                        {order.items && order.items.map(item => (
                                            <div className="order-item-row" key={item.id}>
                                                <div className="item-thumb">
                                                    <img src={item.product_image || 'https://placehold.co/100x100/png?text=Product'} alt={item.product_name} />
                                                </div>
                                                <div className="item-details">
                                                    <div className="status-flex">
                                                        <div className="order-status-badge" data-status={order.status}>{order.status.toUpperCase()}</div>
                                                        {order.status === 'delivered' && <span className="delivery-date">Delivered on {new Date(order.updated_at || order.created_at).toLocaleDateString()}</span>}
                                                    </div>
                                                    <strong className="item-name">{item.product_name}</strong>
                                                    <p className="item-meta">Quantity: {item.quantity} | ₹{parseFloat(item.price).toLocaleString('en-IN')}</p>
                                                    <button className="btn btn-primary buy-again-btn" onClick={() => handleBuyAgain(item)}>
                                                        <span style={{ marginRight: '8px' }}>🔄</span> Buy it again
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!order.items || order.items.length === 0) && (
                                            <div className="order-item-row">
                                                <div className="order-status-badge" data-status={order.status}>{order.status.toUpperCase()}</div>
                                                <div style={{ marginLeft: '16px' }}>
                                                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>Processing Order</strong>
                                                    <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>We're preparing your items for shipment.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="order-actions">
                                        <button className="btn btn-outline action-sq">Track package</button>
                                        <button className="btn btn-outline action-sq">Return or replace items</button>
                                        <button className="btn btn-outline action-sq">Share gift receipt</button>
                                        <button className="btn btn-outline action-sq">Write a product review</button>
                                        {(order.status === 'pending' || order.status === 'confirmed') && (
                                            <button 
                                                className="btn btn-outline action-sq" 
                                                style={{ color: '#ef4444', borderColor: '#fee2e2' }}
                                                onClick={() => handleCancelOrder(order.id)}
                                            >
                                                Cancel Order
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="order-footer">
                                    <a href="#">Archive order</a>
                                </div>
                            </div>
                        ))}
                        {orders.filter(order => {
                                if (activeTab === 'active') return ['pending', 'confirmed', 'shipped'].includes(order.status);
                                if (activeTab === 'completed') return order.status === 'delivered';
                                if (activeTab === 'cancelled') return order.status === 'cancelled';
                                return true;
                            }).length === 0 && (
                            <div className="empty-orders">
                                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>Empty</div>
                                <h3>No {activeTab} orders found</h3>
                                <p>Looks like you haven't placed any orders that match this category yet.</p>
                                <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/store')}>Go Shopping</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
