import React, { useEffect, useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';

const Dashboard = () => {
    const { api, user } = useContext(AppContext);
    const [summary, setSummary] = useState({
        totalIncome: 0,
        totalExpense: 0,
        currentBalance: 0,
        recentTransactions: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const { data } = await api.get('/transactions/summary');
                setSummary(data);
            } catch (error) {
                console.error('Error fetching summary:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [api]);

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div>
            <h1 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Welcome back, {user?.name.split(' ')[0]}! 👋</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        <FiTrendingUp />
                    </div>
                    <div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Total Income</p>
                        <h3 style={{ fontSize: '1.5rem' }}>${summary.totalIncome.toFixed(2)}</h3>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        <FiTrendingDown />
                    </div>
                    <div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Total Expense</p>
                        <h3 style={{ fontSize: '1.5rem' }}>${summary.totalExpense.toFixed(2)}</h3>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        <FiDollarSign />
                    </div>
                    <div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Current Balance</p>
                        <h3 style={{ fontSize: '1.5rem' }}>${summary.currentBalance.toFixed(2)}</h3>
                    </div>
                </div>
            </div>

            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Recent Transactions</h2>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {summary.recentTransactions.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Title</th>
                                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Category</th>
                                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Date</th>
                                <th style={{ textAlign: 'right', padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summary.recentTransactions.map((tx) => (
                                <tr key={tx._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem' }}>{tx.title}</td>
                                    <td style={{ padding: '1rem' }}>{tx.category}</td>
                                    <td style={{ padding: '1rem' }}>{new Date(tx.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: tx.type === 'income' ? 'var(--color-secondary)' : 'var(--color-danger)', fontWeight: '500' }}>
                                        {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No recent transactions found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
