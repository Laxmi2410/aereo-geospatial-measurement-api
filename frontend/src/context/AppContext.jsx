import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    
    // Axios instance with default headers
    const api = axios.create({
        baseURL: 'http://localhost:5000/api',
    });

    api.interceptors.request.use((config) => {
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const login = (userData) => {
        setUser({ _id: userData._id, name: userData.name, email: userData.email });
        setToken(userData.token);
        localStorage.setItem('token', userData.token);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };

    return (
        <AppContext.Provider value={{ user, token, theme, toggleTheme, login, logout, api }}>
            {children}
        </AppContext.Provider>
    );
};
