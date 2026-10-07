const express = require('express');
const router = express.Router();
const {
    getBudgets,
    addBudget,
    updateBudget,
    deleteBudget
} = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getBudgets)
    .post(protect, addBudget);

router.route('/:id')
    .put(protect, updateBudget)
    .delete(protect, deleteBudget);

module.exports = router;
