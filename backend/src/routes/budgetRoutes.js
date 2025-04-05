const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');

// Všechny routy jsou chráněny autentizací
router.use(authMiddleware);

// Získání detailu rozpočtu
router.get('/:id', budgetController.getBudgetById);

// Aktualizace rozpočtu
router.put('/:id', budgetController.updateBudget);

// Smazání rozpočtu
router.delete('/:id', budgetController.deleteBudget);

// Získání položek rozpočtu
router.get('/:id/items', budgetController.getBudgetItems);

// Export rozpočtu do PDF
router.get('/:id/export/pdf', budgetController.exportToPdf);

// Export rozpočtu do Excel
router.get('/:id/export/excel', budgetController.exportToExcel);

module.exports = router;
