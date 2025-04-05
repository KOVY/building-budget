const File = require('../models/File');
const ExtractedData = require('../models/ExtractedData');
const path = require('path');
const fs = require('fs');

// Kontroler pro soubory
const fileController = {
  // Získání detailu souboru
  getFileById: async (req, res) => {
    try {
      const fileId = req.params.id;
      
      // Získání souboru včetně projektu pro kontrolu vlastnictví
      const file = await File.findOne({
        where: { id: fileId },
        include: [{
          model: require('../models/Project'),
          where: { user_id: req.user.id },
          attributes: ['id', 'name', 'user_id']
        }]
      });
      
      if (!file) {
        return res.status(404).json({ message: 'Soubor nebyl nalezen nebo k němu nemáte přístup.' });
      }
      
      res.json(file);
    } catch (error) {
      console.error('Chyba při získávání detailu souboru:', error);
      res.status(500).json({ message: 'Došlo k chybě při získávání detailu souboru.' });
    }
  },
  
  // Stažení souboru
  downloadFile: async (req, res) => {
    try {
      const fileId = req.params.id;
      
      // Získání souboru včetně projektu pro kontrolu vlastnictví
      const file = await File.findOne({
        where: { id: fileId },
        include: [{
          model: require('../models/Project'),
          where: { user_id: req.user.id },
          attributes: ['id', 'name', 'user_id']
        }]
      });
      
      if (!file) {
        return res.status(404).json({ message: 'Soubor nebyl nalezen nebo k němu nemáte přístup.' });
      }
      
      const filePath = file.file_path;
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Fyzický soubor nebyl nalezen na serveru.' });
      }
      
      res.download(filePath, file.original_name);
    } catch (error) {
      console.error('Chyba při stahování souboru:', error);
      res.status(500).json({ message: 'Došlo k chybě při stahování souboru.' });
    }
  },
  
  // Smazání souboru
  deleteFile: async (req, res) => {
    const transaction = await require('../config/database').sequelize.transaction();
    
    try {
      const fileId = req.params.id;
      
      // Získání souboru včetně projektu pro kontrolu vlastnictví
      const file = await File.findOne({
        where: { id: fileId },
        include: [{
          model: require('../models/Project'),
          where: { user_id: req.user.id },
          attributes: ['id', 'name', 'user_id']
        }]
      });
      
      if (!file) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Soubor nebyl nalezen nebo k němu nemáte přístup.' });
      }
      
      // Smazání fyzického souboru
      const filePath = file.file_path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Smazání souboru z databáze
      await file.destroy({ transaction });
      
      // Aktualizace komplexnosti projektu
      const projectController = require('./projectController');
      await projectController.updateProject({
        params: { id: file.Project.id },
        body: {},
        user: req.user
      }, { json: () => {} });
      
      await transaction.commit();
      
      res.json({ message: 'Soubor byl úspěšně smazán.' });
    } catch (error) {
      await transaction.rollback();
      console.error('Chyba při mazání souboru:', error);
      res.status(500).json({ message: 'Došlo k chybě při mazání souboru.' });
    }
  },
  
  // Získání extrahovaných dat ze souboru
  getExtractedData: async (req, res) => {
    try {
      const fileId = req.params.id;
      
      // Získání souboru včetně projektu pro kontrolu vlastnictví
      const file = await File.findOne({
        where: { id: fileId },
        include: [{
          model: require('../models/Project'),
          where: { user_id: req.user.id },
          attributes: ['id', 'name', 'user_id']
        }]
      });
      
      if (!file) {
        return res.status(404).json({ message: 'Soubor nebyl nalezen nebo k němu nemáte přístup.' });
      }
      
      // Kontrola, zda je soubor zpracovaný
      if (file.status !== 'processed') {
        return res.status(400).json({ 
          message: 'Soubor ještě nebyl zpracován. Počkejte na dokončení zpracování nebo spusťte extrakci dat manuálně.'
        });
      }
      
      // Získání extrahovaných dat
      const extractedData = await ExtractedData.findAll({
        where: { file_id: fileId },
        order: [['data_type', 'ASC'], ['data_key', 'ASC']]
      });
      
      res.json(extractedData);
    } catch (error) {
      console.error('Chyba při získávání extrahovaných dat:', error);
      res.status(500).json({ message: 'Došlo k chybě při získávání extrahovaných dat.' });
    }
  },
  
  // Manuální spuštění extrakce dat ze souboru
  extractData: async (req, res) => {
    const transaction = await require('../config/database').sequelize.transaction();
    
    try {
      const fileId = req.params.id;
      
      // Získání souboru včetně projektu pro kontrolu vlastnictví
      const file = await File.findOne({
        where: { id: fileId },
        include: [{
          model: require('../models/Project'),
          where: { user_id: req.user.id },
          attributes: ['id', 'name', 'user_id']
        }]
      });
      
      if (!file) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Soubor nebyl nalezen nebo k němu nemáte přístup.' });
      }
      
      // Aktualizace stavu souboru na "processing"
      file.status = 'processing';
      await file.save({ transaction });
      
      await transaction.commit();
      
      // Spuštění zpracování souboru v n8n (asynchronně)
      // Toto by bylo implementováno později při integraci s n8n
      
      // Pro účely demonstrace simulujeme úspěšné zpracování
      setTimeout(async () => {
        try {
          const newTransaction = await require('../config/database').sequelize.transaction();
          
          // Aktualizace stavu souboru na "processed"
          file.status = 'processed';
          await file.save({ transaction: newTransaction });
          
          // Simulace extrahovaných dat
          const mockData = [
            { data_type: 'dimension', data_key: 'width', data_value: '10.5', confidence: 0.95 },
            { data_type: 'dimension', data_key: 'height', data_value: '3.2', confidence: 0.95 },
            { data_type: 'dimension', data_key: 'length', data_value: '15.0', confidence: 0.95 },
            { data_type: 'material', data_key: 'wall', data_value: 'brick', confidence: 0.85 },
            { data_type: 'material', data_key: 'floor', data_value: 'concrete', confidence: 0.9 }
          ];
          
          // Uložení simulovaných dat
          for (const data of mockData) {
            await ExtractedData.create({
              file_id: fileId,
              data_type: data.data_type,
              data_key: data.data_key,
              data_value: data.data_value,
              confidence: data.confidence
            }, { transaction: newTransaction });
          }
          
          await newTransaction.commit();
        } catch (error) {
          console.error('Chyba při simulaci zpracování souboru:', error);
        }
      }, 5000); // Simulace 5 sekund zpracování
      
      res.json({ 
        message: 'Extrakce dat byla úspěšně spuštěna. Zpracování probíhá na pozadí.',
        file
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Chyba při spouštění extrakce dat:', error);
      res.status(500).json({ message: 'Došlo k chybě při spouštění extrakce dat.' });
    }
  }
};

module.exports = fileController;
