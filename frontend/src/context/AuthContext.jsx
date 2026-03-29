import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Hydrate from localStorage
        const storedUser = localStorage.getItem('ecom_user');
        const token = localStorage.getItem('access_token');
        
        if (storedUser && token) {
            setUser({ name: storedUser, token });
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const res = await axios.post('http://localhost:8000/api/token/', { email, password });
            const { access, refresh } = res.data;
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            
            const name = email.split('@')[0];
            localStorage.setItem('ecom_user', name);
            
            setUser({ name, token: access });
            return { success: true };
        } catch (err) {
            console.error('Login Error:', err);
            return { success: false, message: 'Invalid credentials. Please try again.' };
        }
    };

    const register = async (name, email, password) => {
        try {
            await axios.post('http://localhost:8000/api/users/', {
                first_name: name,
                username: email.split('@')[0],
                email,
                password
            });
            return await login(email, password);
        } catch (err) {
            console.error('Registration Error:', err);
            return { success: false, message: 'Registration failed. Check your details.' };
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('ecom_user');
        setUser(null);
    };

    const value = { user, login, register, logout, loading };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
