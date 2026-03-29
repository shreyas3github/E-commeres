import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                Back to top
            </div>
            
            <div className="footer-main container">
                <div className="footer-column">
                    <h3>Get to Know Us</h3>
                    <ul>
                        <li><a href="#">About Us</a></li>
                        <li><a href="#">Careers</a></li>
                        <li><a href="#">Press Releases</a></li>
                        <li><a href="#">ShopX Science</a></li>
                    </ul>
                </div>
                
                <div className="footer-column">
                    <h3>Connect with Us</h3>
                    <ul>
                        <li><a href="#">Facebook</a></li>
                        <li><a href="#">Twitter</a></li>
                        <li><a href="#">Instagram</a></li>
                    </ul>
                </div>
                
                <div className="footer-column">
                    <h3>Let Us Help You</h3>
                    <ul>
                        <li><Link to="/profile">Your Account</Link></li>
                        <li><Link to="/profile#orders-sec">Returns Centre</Link></li>
                        <li><a href="#">Recalls and Product Safety Alerts</a></li>
                        <li><a href="#">Help</a></li>
                    </ul>
                </div>

                <div className="footer-column">
                    <h3>Legal</h3>
                    <ul>
                        <li><a href="#">Conditions of Use</a></li>
                        <li><a href="#">Privacy Notice</a></li>
                        <li><a href="#">Interest-Based Ads</a></li>
                    </ul>
                </div>
            </div>

            <div className="footer-divider"></div>

            <div className="footer-bottom">
                <div className="footer-logo">
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--white)', letterSpacing: '-0.02em' }}>ShopX.in</span>
                </div>
                
                <div className="footer-legal-links">
                    <a href="#">Conditions of Use</a>
                    <a href="#">Privacy Notice</a>
                    <a href="#">Your Ads Privacy Choices</a>
                </div>
                
                <div className="copyright">
                    &copy; 1996-2026, ShopX.in, Inc. or its affiliates
                </div>
                <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#475569' }}>
                    Professionally designed via Antigravity Matrix
                </div>
            </div>
        </footer>
    );
};

export default Footer;
