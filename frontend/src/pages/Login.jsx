import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const { api, login } = useContext(AppContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const { data } = await api.post('/auth/login', { email, password });
            login(data);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Welcome Back</h2>
                {error && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email</label>
                        <input 
                            type="email" 
                            className="input-field"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
                        <input 
                            type="password" 
                            className="input-field"
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                        Login
                    </button>
                </form>
                
                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--color-primary)' }}>Register</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
