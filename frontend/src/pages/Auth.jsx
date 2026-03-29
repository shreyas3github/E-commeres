import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './Auth.css';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const params = new URLSearchParams(location.search);
    const redirectParams = params.get('redirect');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        let res;
        if (isLogin) {
            res = await login(email, password);
        } else {
            res = await register(name, email, password);
        }

        if (res.success) {
            if (redirectParams === 'checkout') {
                navigate('/store'); // Go back to store/checkout
            } else {
                navigate('/profile'); // Show their profile immediately after login/register
            }
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="auth-page">
            <div className="logo-area" style={{ textAlign: 'center' }}>
                <Link to="/" className="logo-text">ShopX<span>.in</span></Link>
            </div>

            <div className="auth-card">
                <h1>{isLogin ? 'Sign in' : 'Create Account'}</h1>
                
                {error && <div style={{ color: '#ef4444', marginBottom: '20px', fontSize: '0.95rem', background: '#fee2e2', padding: '12px', borderRadius: '8px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label>Your name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="First and last name" />
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 6 characters" />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '12px' }}>
                        {isLogin ? 'Continue' : 'Verify email & create account'}
                    </button>
                </form>

                <p style={{ fontSize: '0.85rem', marginTop: '24px', color: 'var(--text-muted)' }}>
                    By continuing, you agree to ShopX's <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Conditions of Use</a> and <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Privacy Notice</a>.
                </p>

                {isLogin ? (
                    <>
                        <div className="divider">New to ShopX?</div>
                        <button type="button" className="btn btn-outline" style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }} onClick={() => { setIsLogin(false); setError(''); }}>
                            Create your ShopX account
                        </button>
                    </>
                ) : (
                    <p style={{ fontSize: '0.9rem', marginTop: '24px' }}>
                        Already have an account? <span onClick={() => { setIsLogin(true); setError(''); }} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>Sign in ▸</span>
                    </p>
                )}
            </div>

            <div className="auth-footer" style={{ marginTop: '40px', borderTop: '1px solid var(--border)', paddingTop: '24px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ marginBottom: '16px', display: 'flex', gap: '20px' }}>
                    <a href="#" style={{ color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none' }}>Conditions of Use</a>
                    <a href="#" style={{ color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none' }}>Privacy Notice</a>
                    <a href="#" style={{ color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none' }}>Help</a>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>© 2026, ShopX.in, Inc. or its affiliates</p>
            </div>
        </div>
    );
};

export default Auth;
