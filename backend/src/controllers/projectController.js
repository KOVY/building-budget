const Project = require('../models/Project');
const File = require('../models/File');
const Budget = require('../models/Budget');
const { sequelize } = require('../config/database');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Konfigurace multer pro nahrávání souborů
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/octet-stream', 'application/x-ifc'];
  const allowedExtensions = ['.pdf', '.dwg', '.ifc'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Nepodporovaný typ souboru. Povolené typy jsou PDF, DWG a IFC.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB limit
});

// Kontroler pro projekty
const projectController = {
  // Získání seznamu projektů uživatele
  getProjects: async (req, res) => {
    try {
      const projects = await Project.findAll({
        where: { user_id: req.user.id },
        order: [['created_at', 'DESC']]
      });
      
      res.json(projects);
    } catch (error) {
      console.error('Chyba při získávání projektů:', error);
      res.status(500).json({ message: 'Došlo k chybě při získávání projektů.' });
    }
  },
  
  // Získání detailu projektu
  getProjectById: async (req, res) => {
    try {
      const project = await Project.findOne({
        where: { 
          id: req.params.id,
          user_id: req.user.id
        }
      });
      
      if (!project) {
        return res.status(404).json({ message: 'Projekt nebyl nalezen.' });
      }
      
      res.json(project);
    } catch (error) {
      console.error('Chyba při získávání detailu projektu:', error);
      res.status(500).json({ message: 'Došlo k chybě při získávání detailu projektu.' });
    }
  },
  
  // Vytvoření nového projektu
  createProject: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { name, description, location, building_type, total_area } = req.body;
      
      // Validace vstupních dat
      if (!name) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Název projektu je povinný.' });
      }
      
      // Výpočet počáteční komplexnosti projektu
      let complexity = 1;
      if (building_type === 'commercial') complexity = 2;
      if (building_type === 'industrial') complexity = 3;
      
      if (total_area > 1000) complexity += 3;
      else if (total_area > 500) complexity += 2;
      else if (total_area > 100) complexity += 1;
      
      // Vytvoření projektu
      const project = await Project.create({
        name,
        description,
        location,
        building_type: building_type || 'residential',
        total_area: total_area || 0,
        complexity,
        status: 'draft',
        user_id: req.user.id
      }, { transaction });
      
      await transaction.commit();
      
      res.status(201).json(project);
    } catch (error) {
      await transaction.rollback();
      console.error('Chyba při vytváření projektu:', error);
      res.status(500).json({ message: 'Došlo k chybě při vytváření projektu.' });
    }
  },
  
  // Aktualizace projektu
  updateProject: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { name, description, location, building_type, total_area, status } = req.body;
      
      const project = await Project.findOne({
        where: { 
          id: req.params.id,
          user_id: req.user.id
        }
      });
      
      if (!project) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Projekt nebyl nalezen.' });
      }
      
      // Aktualizace projektu
      if (name) project.name = name;
      if (description !== undefined) project.description = description;
      if (location !== undefined) project.location = location;
      if (building_type) project.building_type = building_type;
      if (total_area !== undefined) project.total_area = total_area;
      if (status) project.status = status;
      
      // Přepočítání komplexnosti projektu
      let complexity = 1;
      if (project.building_type === 'commercial') complexity = 2;
      if (project.building_type === 'industrial') complexity = 3;
      
      if (project.total_area > 1000) complexity += 3;
      else if (project.total_area > 500) complexity += 2;
      else if (project.total_area > 100) complexity += 1;
      
      // Získání počtu souborů v projektu
      const fileCount = await File.count({ where: { project_id: project.id } });
      if (fileCount > 10) complexity += 2;
      else if (fileCount > 3) complexity += 1;
      
      // Získání typů souborů v projektu
      const files = await File.findAll({ 
        where: { project_id: project.id },
        attributes: ['file_type']
      });
      
      let maxFileTypeComplexity = 0;
      files.forEach(file => {
        let fileTypeComplexity = 0;
        if (file.file_type === 'pdf') fileTypeComplexity = 1;
        if (file.file_type === 'dwg') fileTypeComplexity = 2;
        if (file.file_type === 'ifc') fileTypeComplexity = 3;
        
        maxFileTypeComplexity = Math.max(maxFileTypeComplexity, fileTypeComplexity);
      });
      
      // Výpočet celkové komplexnosti
      const totalComplexity = Math.round(
        (complexity * 0.6) + (fileCount > 0 ? (fileCount > 10 ? 3 : fileCount > 3 ? 2 : 1) * 0.2 : 0) + (maxFileTypeComplexity * 0.2)
      );
      
      project.complexity = Math.min(Math.max(totalComplexity, 1), 10); // Omezení na 1-10
      
      await project.save({ transaction });
      
      await transaction.commit();
      
      res.json(project);
    } catch (error) {
      await transaction.rollback();
      console.error('Chyba při aktualizaci projektu:', error);
      res.status(500).json({ message: 'Došlo k chybě při aktualizaci projektu.' });
    }
  },
  
  // Smazání projektu
  deleteProject: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const project = await Project.findOne({
        where: { 
          id: req.params.id,
          user_id: req.user.id
        }
      });
      
      if (!project) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Projekt nebyl nalezen.' });
      }
      
      // Získání všech souborů projektu pro smazání fyzických souborů
      const files = await File.findAll({
        where: { project_id: project.id }
      });
      
      // Smazání fyzických souborů
      for (const file of files) {
        const filePath = path.join(__dirname, '../../uploads', file.stored_name);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      // Smazání projektu (kaskádově smaže i soubory, rozpočty atd.)
      await project.destroy({ transaction });
      
      await transaction.commit();
      
      res.json({ message: 'Projekt byl úspěšně smazán.' });
    } catch (error) {
      await transaction.rollback();
      console.error('Chyba při mazání projektu:', error);
      res.status(500).json({ message: 'Došlo k chybě při mazání projektu.' });
    }
  },
  
  // Nahrání souborů do projektu
  uploadFiles: async (req, res) => {
    // Middleware pro nahrávání více souborů
    const uploadMiddleware = upload.array('files', 10); // Max 10 souborů najednou
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      
      const transaction = await sequelize.transaction();
      
      try {
        const projectId = req.params.id;
        
        // Kontrola existence projektu
        const project = await Project.findOne({
          where: { 
            id: projectId,
            user_id: req.user.id
          }
        });
        
        if (!project) {
          await transaction.rollback();
          return res.status(404).json({ message: 'Projekt nebyl nalezen.' });
        }
        
        // Kontrola limitů podle předplatného
        const subscription = req.user.subscription_type;
        const fileCount = await File.count({ where: { project_id: projectId } });
        const newFileCount = fileCount + req.files.length;
        
        if (subscription === 'trial' && newFileCount > 3) {
          await transaction.rollback();
          return res.status(403).json({ 
            message: 'Zkušební verze umožňuje maximálně 3 soubory na projekt. Upgradujte své předplatné.'
          });
        }
        
        // Zpracování nahraných souborů
        const savedFiles = [];
        
        for (const file of req.files) {
          // Určení typu souboru podle přípony
          const fileExtension = path.extname(file.originalname).toLowerCase();
          let fileType = 'pdf'; // Výchozí hodnota
          
          if (fileExtension === '.dwg') fileType = 'dwg';
          else if (fileExtension === '.ifc') fileType = 'ifc';
          
          // Uložení informací o souboru do databáze
          const savedFile = await File.create({
            project_id: projectId,
            original_name: file.originalname,
            stored_name: file.filename,
            file_path: file.path,
            file_type: fileType,
            file_size: file.size,
            status: 'uploaded'
          }, { transaction });
          
          savedFiles.push(savedFile);
        }
        
        // Aktualizace komplexnosti projektu
        await projectController.updateProject({
          params: { id: projectId },
          body: {},
          user: req.user
        }, { json: () => {} });
        
        await transaction.commit();
        
        // Spuštění zpracování souborů v n8n (asynchronně)
        // Toto by bylo implementováno později při integraci s n8n
        
        res.status(201).json({
          message: `${savedFiles.length} souborů bylo úspěšně nahráno.`,
          files: savedFiles
        });
      } catch (error) {
        await transaction.rollback();
        console.error('Chyba při nahrávání souborů:', error);
        res.status(500).json({ message: 'Došlo k chybě při nahrávání souborů.' });
      }
    });
  },
  
  // Získání seznamu souborů v projektu
  getProjectFiles: async (req, res) => {
    try {
      const projectId = req.params.id;
      
      // Kontrola existence projektu
      const project = await Project.findOne({
        where: { 
          id: projectId,
          user_id: req.user.id
        }
      });
      
      if (!project) {
        return res.status(404).json({ message: 'Projekt nebyl nalezen.' });
      }
      
      // Získání souborů projektu
      const files = await File.findAll({
        where: { project_id: projectId },
        order: [['upload_date', 'DESC']]
      });
      
      res.json(files);
    } catch (error) {
      console.error('Chyba při získávání souborů projektu:', error);
      res.status(500).json({ message: 'Došlo k chybě při získávání souborů projektu.' });
    }
  },
  
  // Generování rozpočtu pro projekt
  generateBudget: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const projectId = req.params.id;
      const { name, description } = req.body;
      
      // Kontrola existence projektu
      const project = await Project.findOne({
        where: { 
          id: projectId,
          user_id: req.user.id
        }
      });
      
      if (!project) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Projekt nebyl nalezen.' });
      }
      
      // Kontrola existence souborů v projektu
      const fileCount = await File.count({ where: { project_id: projectId } });
      
      if (fileCount === 0) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: 'Projekt neobsahuje žádné soubory. Nahrajte nejprve soubory pro generování rozpočtu.'
        });
      }
      
      // Kontrola, zda jsou soubory zpracované
      const unprocessedFiles = await File.count({ 
        where: { 
          project_id: projectId,
          status: { [sequelize.Op.not]: 'processed' }
        }
      });
      
      if (unprocessedFiles > 0) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: 'Některé soubory v projektu ještě nebyly zpracovány. Počkejte na dokončení zpracování.'
        });
      }
      
      // Vytvoření rozpočtu
      const budget = await Budget.create({
        project_id: projectId,
        name: name || `Rozpočet projektu ${project.name}`,
        description: description || 'Automaticky generovaný rozpočet',
        status: 'draft',
        total_price: 0,
        vat_rate: 21.00,
        total_price_with_vat: 0
      }, { transaction });
      
      // Zde by byla implementována logika pro generování položek rozpočtu
      // na základě extrahovaných dat ze souborů
      // Toto by bylo implementováno později při integraci s n8n
      
      await transaction.commit();
      
      res.status(201).json({
        message: 'Rozpočet byl úspěšně vytvořen.',
        budget
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Chyba při generování rozpočtu:', error);
      res.status(500).json({ message: 'Došlo k chybě při generování rozpočtu.' });
    }
  },
  
  // Získání seznamu rozpočtů projektu
  getProjectBudgets: async (req, res) => {
    try {
      const projectId = req.params.id;
      
      // Kontrola existence projektu
      const project = await Project.findOne({
        where: { 
          id: projectId,
          user_id: req.user.id
        }
      });
      
      if (!project) {
        return res.status(404).json({ message: 'Projekt nebyl nalezen.' });
      }
      
      // Získání rozpočtů projektu
      const budgets = await Budget.findAll({
        where: { project_id: projectId },
        order: [['created_at', 'DESC']]
      });
      
      res.json(budgets);
    } catch (error) {
      console.error('Chyba při získávání rozpočtů projektu:', error);
      res.status(500).json({ message: 'Došlo k chybě při získávání rozpočtů projektu.' });
    }
  }
};

module.exports = projectController;
