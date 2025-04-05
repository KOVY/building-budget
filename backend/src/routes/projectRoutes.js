const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');

// Všechny routy jsou chráněny autentizací
router.use(authMiddleware);

// Získání seznamu projektů uživatele
router.get('/', projectController.getProjects);

// Získání detailu projektu
router.get('/:id', projectController.getProjectById);

// Vytvoření nového projektu
router.post('/', projectController.createProject);

// Aktualizace projektu
router.put('/:id', projectController.updateProject);

// Smazání projektu
router.delete('/:id', projectController.deleteProject);

// Nahrání souborů do projektu
router.post('/:id/files', projectController.uploadFiles);

// Získání seznamu souborů v projektu
router.get('/:id/files', projectController.getProjectFiles);

// Generování rozpočtu pro projekt
router.post('/:id/budgets', projectController.generateBudget);

// Získání seznamu rozpočtů projektu
router.get('/:id/budgets', projectController.getProjectBudgets);

module.exports = router;
