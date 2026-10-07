import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Expense Tracker Pro</h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem', maxWidth: '600px', color: 'var(--color-text-secondary)' }}>
                Take control of your personal finances. Securely track your income, monitor expenses, and set budgets to achieve your financial goals.
            </p>
            <div>
                <Link to="/login" className="btn btn-primary" style={{ marginRight: '1rem', padding: '0.75rem 1.5rem', fontSize: '1.1rem' }}>
                    Login
                </Link>
                <Link to="/register" className="btn" style={{ padding: '0.75rem 1.5rem', fontSize: '1.1rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    Register
                </Link>
            </div>
        </div>
    );
};

export default Landing;
