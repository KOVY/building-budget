const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const authMiddleware = require('../middleware/authMiddleware');

// Všechny routy jsou chráněny autentizací
router.use(authMiddleware);

// Získání detailu souboru
router.get('/:id', fileController.getFileById);

// Stažení souboru
router.get('/:id/download', fileController.downloadFile);

// Smazání souboru
router.delete('/:id', fileController.deleteFile);

// Získání extrahovaných dat ze souboru
router.get('/:id/extracted-data', fileController.getExtractedData);

// Manuální spuštění extrakce dat ze souboru
router.post('/:id/extract', fileController.extractData);

module.exports = router;
