import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const Budgets = () => {
    const { api } = useContext(AppContext);
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        category: '',
        limit: '',
        month: new Date().toISOString().slice(0, 7) // YYYY-MM
    });
    
    const categories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Other'];

    const fetchBudgets = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/budgets');
            setBudgets(data);
        } catch (error) {
            console.error('Error fetching budgets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgets();
    }, [api]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/budgets', formData);
            setShowForm(false);
            fetchBudgets();
            setFormData({ category: '', limit: '', month: new Date().toISOString().slice(0, 7) });
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving budget');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this budget?')) {
            try {
                await api.delete(`/budgets/${id}`);
                fetchBudgets();
            } catch (error) {
                console.error('Error deleting budget:', error);
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Budget Management</h1>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    <FiPlus style={{ marginRight: '0.5rem' }} /> Set Budget
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>New Budget Limit</h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Category</label>
                            <select name="category" className="input-field" value={formData.category} onChange={handleInputChange} required style={{ marginBottom: 0 }}>
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Monthly Limit ($)</label>
                            <input type="number" name="limit" step="0.01" className="input-field" value={formData.limit} onChange={handleInputChange} required style={{ marginBottom: 0 }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Month</label>
                            <input type="month" name="month" className="input-field" value={formData.month} onChange={handleInputChange} required style={{ marginBottom: 0 }} />
                        </div>
                        <button type="button" className="btn" onClick={() => setShowForm(false)} style={{ backgroundColor: 'var(--color-border)', height: '42px' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>Save</button>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {loading ? (
                    <div>Loading budgets...</div>
                ) : budgets.length > 0 ? (
                    budgets.map((budget) => {
                        const progress = Math.min((budget.spent / budget.limit) * 100, 100);
                        const isOverBudget = budget.spent > budget.limit;

                        return (
                            <div key={budget._id} className="card" style={{ position: 'relative' }}>
                                <button onClick={() => handleDelete(budget._id)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--color-danger)' }}>
                                    <FiTrash2 />
                                </button>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{budget.category}</h3>
                                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{budget.month}</span>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                    <span>Spent: ${budget.spent.toFixed(2)}</span>
                                    <span>Limit: ${budget.limit.toFixed(2)}</span>
                                </div>
                                
                                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                                    <div style={{ 
                                        height: '100%', 
                                        width: `${progress}%`, 
                                        backgroundColor: isOverBudget ? 'var(--color-danger)' : 'var(--color-primary)',
                                        transition: 'width var(--transition-normal)'
                                    }}></div>
                                </div>
                                
                                {isOverBudget && (
                                    <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: '500' }}>
                                        ⚠️ You have exceeded your budget by ${(budget.spent - budget.limit).toFixed(2)}
                                    </p>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div style={{ color: 'var(--color-text-secondary)' }}>No budgets set yet.</div>
                )}
            </div>
        </div>
    );
};

export default Budgets;
