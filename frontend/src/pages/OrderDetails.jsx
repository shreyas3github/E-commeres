import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './OrderDetails.css';

const OrderDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/auth');
            return;
        }

        const fetchOrder = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/api/orders/${id}/`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setOrder(res.data);
            } catch (err) {
                console.error("Failed to fetch order details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id, user, navigate]);

    if (loading) return <div className="container order-details-loading">Loading order details...</div>;
    if (!order) return <div className="container order-details-error">Order not found.</div>;

    const getStatusStep = (status) => {
        const statuses = ['pending', 'confirmed', 'shipped', 'delivered'];
        return statuses.indexOf(status);
    };

    const currentStep = getStatusStep(order.status);

    return (
        <div className="container order-detail-page">
            <div className="breadcrumb">
                <Link to="/profile">Your Account</Link> › <Link to="/profile#orders-sec">Your Orders</Link> › <span className="current">Order Details</span>
            </div>

            <div className="order-details-header">
                <h1>Order Details</h1>
                <div className="header-meta">
                    <p>Ordered on {new Date(order.created_at).toLocaleDateString()} <span>|</span> Order # {order.id.split('-')[0].toUpperCase()}</p>
                    <div className="header-actions">
                        <button className="btn-text">View or Print invoice</button>
                    </div>
                </div>
            </div>

            <div className="order-summary-card">
                <div className="summary-grid">
                    <div className="summary-col">
                        <h3>Shipping Address</h3>
                        {order.address_details ? (
                            <>
                                <p><strong>{user.name || 'Recipient'}</strong></p>
                                <p>{order.address_details.street}</p>
                                <p>{order.address_details.city}, {order.address_details.state} {order.address_details.postal_code}</p>
                                <p>{order.address_details.country}</p>
                            </>
                        ) : (
                            <p>Loading address...</p>
                        )}
                    </div>
                    <div className="summary-col">
                        <h3>Payment Methods</h3>
                        <p>💳 Card ending in **** (Mock)</p>
                    </div>
                    <div className="summary-col">
                        <h3>Order Summary</h3>
                        <div className="cost-row">
                            <span>Item(s) Subtotal:</span>
                            <span>₹{parseFloat(order.total_price).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="cost-row">
                            <span>Shipping & Handling:</span>
                            <span>₹0.00</span>
                        </div>
                        <div className="cost-row total">
                            <span><strong>Grand Total:</strong></span>
                            <span><strong>₹{parseFloat(order.total_price).toLocaleString('en-IN')}</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="order-status-tracker">
                <div className="tracker-header">
                    <h2>Shipment Details</h2>
                    <span className={`status-badge-lg ${order.status}`}>{order.status.toUpperCase()}</span>
                </div>
                
                <div className="tracker-viz">
                    {['Ordered', 'Confirmed', 'Shipped', 'Delivered'].map((step, idx) => (
                        <div key={step} className={`tracker-step ${idx <= currentStep ? 'active' : ''} ${idx === currentStep ? 'current' : ''}`}>
                            <div className="step-dot"></div>
                            <div className="step-label">{step}</div>
                        </div>
                    ))}
                    <div className="tracker-line-bg"></div>
                    <div className="tracker-line-fill" style={{ width: `${(currentStep / 3) * 100}%` }}></div>
                </div>
            </div>

            <div className="order-items-card">
                {order.items && order.items.map(item => (
                    <div className="detail-item-row" key={item.id}>
                        <div className="item-img">
                            <img src={item.product_image || 'https://placehold.co/150x150/png?text=Product'} alt={item.product_name} />
                        </div>
                        <div className="item-info">
                            <Link to={`/product/${item.product_variant}`} className="item-link">{item.product_name}</Link>
                            <p className="item-price">₹{parseFloat(item.price).toLocaleString('en-IN')}</p>
                            <div className="item-buttons">
                                <button className="btn btn-primary btn-sm">Buy it again</button>
                                <button className="btn btn-outline btn-sm">Track package</button>
                            </div>
                        </div>
                        <div className="item-actions">
                            <button className="btn btn-outline full-w">Write a product review</button>
                            <button className="btn btn-outline full-w">Archive order</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrderDetails;
