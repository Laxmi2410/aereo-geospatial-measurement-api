import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Analytics = () => {
    const { api } = useContext(AppContext);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const { data } = await api.get('/transactions');
                setTransactions(data);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [api]);

    if (loading) return <div>Loading analytics...</div>;

    // Process data for charts
    const expenses = transactions.filter(t => t.type === 'expense');
    
    // Category Pie Chart Data
    const categoryDataMap = expenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {});
    const categoryData = Object.keys(categoryDataMap).map(key => ({ name: key, value: categoryDataMap[key] }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];

    // Monthly Bar Chart Data (Income vs Expense)
    const monthlyDataMap = transactions.reduce((acc, t) => {
        const month = new Date(t.date).toLocaleString('default', { month: 'short' });
        if (!acc[month]) acc[month] = { name: month, Income: 0, Expense: 0 };
        if (t.type === 'income') acc[month].Income += t.amount;
        if (t.type === 'expense') acc[month].Expense += t.amount;
        return acc;
    }, {});
    const monthlyData = Object.values(monthlyDataMap);

    return (
        <div>
            <h1 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Analytics & Reports</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                <div className="card">
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Expenses by Category</h2>
                    <div style={{ height: '300px' }}>
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                                No expense data available
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Income vs Expenses (Monthly)</h2>
                    <div style={{ height: '300px' }}>
                        {monthlyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                    <XAxis dataKey="name" stroke="var(--color-text-secondary)" />
                                    <YAxis stroke="var(--color-text-secondary)" />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                                        itemStyle={{ color: 'var(--color-text-primary)' }}
                                        formatter={(value) => `$${value.toFixed(2)}`}
                                    />
                                    <Legend />
                                    <Bar dataKey="Income" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Expense" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                                No transaction data available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
