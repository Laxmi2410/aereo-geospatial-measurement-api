const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// @desc    Get all budgets for a user
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res) => {
    try {
        const budgets = await Budget.find({ userId: req.user._id });
        
        // Enhance budgets with current spending
        const enrichedBudgets = await Promise.all(budgets.map(async (budget) => {
            const [year, month] = budget.month.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            const transactions = await Transaction.find({
                userId: req.user._id,
                category: budget.category,
                type: 'expense',
                date: { $gte: startDate, $lte: endDate }
            });

            const spent = transactions.reduce((acc, t) => acc + t.amount, 0);

            return {
                ...budget._doc,
                spent
            };
        }));

        res.json(enrichedBudgets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new budget
// @route   POST /api/budgets
// @access  Private
const addBudget = async (req, res) => {
    const { category, limit, month } = req.body;

    try {
        const existingBudget = await Budget.findOne({ userId: req.user._id, category, month });
        if (existingBudget) {
            return res.status(400).json({ message: 'Budget for this category and month already exists' });
        }

        const budget = await Budget.create({
            userId: req.user._id,
            category,
            limit,
            month
        });
        res.status(201).json(budget);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a budget
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = async (req, res) => {
    try {
        let budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        if (budget.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        budget = await Budget.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(budget);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        if (budget.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await budget.deleteOne();

        res.json({ message: 'Budget removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getBudgets,
    addBudget,
    updateBudget,
    deleteBudget
};
