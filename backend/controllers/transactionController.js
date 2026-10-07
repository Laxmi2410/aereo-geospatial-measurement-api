const Transaction = require('../models/Transaction');

// @desc    Get all transactions for a user
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
    try {
        const { type, category, startDate, endDate } = req.query;
        let query = { userId: req.user._id };

        if (type) query.type = type;
        if (category) query.category = category;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(query).sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a new transaction
// @route   POST /api/transactions
// @access  Private
const addTransaction = async (req, res) => {
    const { title, amount, type, category, date, notes } = req.body;

    try {
        const transaction = await Transaction.create({
            userId: req.user._id,
            title,
            amount,
            type,
            category,
            date,
            notes
        });
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res) => {
    try {
        let transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        transaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await transaction.deleteOne();

        res.json({ message: 'Transaction removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard summary
// @route   GET /api/transactions/summary
// @access  Private
const getSummary = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id });
        
        const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        const balance = income - expense;

        res.json({
            totalIncome: income,
            totalExpense: expense,
            currentBalance: balance,
            recentTransactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getSummary
};
