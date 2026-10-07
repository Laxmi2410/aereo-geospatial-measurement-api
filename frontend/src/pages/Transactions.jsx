import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';

const Transactions = () => {
    const { api } = useContext(AppContext);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        type: 'expense',
        category: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Filter state
    const [filters, setFilters] = useState({
        type: '',
        category: '',
        search: ''
    });

    const categories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Salary', 'Investment', 'Other'];

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/transactions');
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [api]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/transactions/${editingId}`, formData);
            } else {
                await api.post('/transactions', formData);
            }
            setShowForm(false);
            setEditingId(null);
            fetchTransactions();
            setFormData({ title: '', amount: '', type: 'expense', category: '', date: new Date().toISOString().split('T')[0], notes: '' });
        } catch (error) {
            console.error('Error saving transaction:', error);
        }
    };

    const handleEdit = (tx) => {
        setFormData({
            title: tx.title,
            amount: tx.amount,
            type: tx.type,
            category: tx.category,
            date: new Date(tx.date).toISOString().split('T')[0],
            notes: tx.notes || ''
        });
        setEditingId(tx._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                await api.delete(`/transactions/${id}`);
                fetchTransactions();
            } catch (error) {
                console.error('Error deleting transaction:', error);
            }
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchType = filters.type ? tx.type === filters.type : true;
        const matchCategory = filters.category ? tx.category === filters.category : true;
        const matchSearch = filters.search ? tx.title.toLowerCase().includes(filters.search.toLowerCase()) : true;
        return matchType && matchCategory && matchSearch;
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Transactions</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingId(null); }}>
                    <FiPlus style={{ marginRight: '0.5rem' }} /> Add Transaction
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>{editingId ? 'Edit Transaction' : 'New Transaction'}</h2>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Title</label>
                            <input type="text" name="title" className="input-field" value={formData.title} onChange={handleInputChange} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Amount</label>
                            <input type="number" name="amount" step="0.01" className="input-field" value={formData.amount} onChange={handleInputChange} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Type</label>
                            <select name="type" className="input-field" value={formData.type} onChange={handleInputChange} required>
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Category</label>
                            <select name="category" className="input-field" value={formData.category} onChange={handleInputChange} required>
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Date</label>
                            <input type="date" name="date" className="input-field" value={formData.date} onChange={handleInputChange} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Notes</label>
                            <input type="text" name="notes" className="input-field" value={formData.notes} onChange={handleInputChange} />
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn" onClick={() => setShowForm(false)} style={{ backgroundColor: 'var(--color-border)' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Save</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                    <input type="text" name="search" placeholder="Search transactions..." className="input-field" style={{ marginBottom: 0, paddingLeft: '2.5rem' }} value={filters.search} onChange={handleFilterChange} />
                </div>
                <select name="type" className="input-field" style={{ width: 'auto', marginBottom: 0 }} value={filters.type} onChange={handleFilterChange}>
                    <option value="">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>
                <select name="category" className="input-field" style={{ width: 'auto', marginBottom: 0 }} value={filters.category} onChange={handleFilterChange}>
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
                ) : filteredTransactions.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Title</th>
                                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Category</th>
                                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Date</th>
                                <th style={{ textAlign: 'right', padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Amount</th>
                                <th style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map((tx) => (
                                <tr key={tx._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem' }}>{tx.title}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', backgroundColor: 'var(--color-background)', color: 'var(--color-text-secondary)' }}>
                                            {tx.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{new Date(tx.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: tx.type === 'income' ? 'var(--color-secondary)' : 'var(--color-danger)', fontWeight: '500' }}>
                                        {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <button onClick={() => handleEdit(tx)} style={{ color: 'var(--color-primary)', marginRight: '1rem' }}><FiEdit2 /></button>
                                        <button onClick={() => handleDelete(tx._id)} style={{ color: 'var(--color-danger)' }}><FiTrash2 /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No transactions found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Transactions;
