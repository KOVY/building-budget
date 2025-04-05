const Budget = require('../models/Budget');
const BudgetItem = require('../models/BudgetItem');
const { sequelize } = require('../config/database');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Kontroler pro rozpočty
const budgetController = {
  // Získání detailu rozpočtu
  getBudgetById: async (req, res) => {
    try {
      const budgetId = req.params.id;
      
      // Získání rozpočtu včetně projektu pro kontrolu vlastnictví
      const budget = await Budget.findOne({
        where: { id: budgetId },
        include: [{
          model: require('../models/Project'),
          where: { user_id: req.user.id },
          attributes: ['id', 'name', 'user_id']
        }]
      });
      
      if (!budget) {
        return res.status(404).json({ message: 'Rozpočet nebyl nalezen nebo k němu nemáte přístup.' });
      }
      
      res.json(budget);
    } catch (error) {
      console.error('Chyba při získávání detailu rozpočtu:', error);
      res.status(500).json({ message: 'Došlo k chybě při získávání detailu rozpočtu.' });
    }
  },
  
  // Aktualizace rozpočtu
  updateBudget: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const budgetId = req.params.id;
      const { name, description, status } = req.body;
      
      // Získání rozpočtu včetně projektu pro kontrolu vlastnictví
      const budget = await Budget.findOne({
        where: { id: budgetId },
        include: [{
          model: require('../models/Project'),
          where: { user_id: req.user.id },
          attributes: ['id', 'name', 'user_id']
        }]
      });
      
      if (!budget) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Rozpočet nebyl nalezen nebo k němu nemáte přístup.' });
      }
      
      // Aktualizace rozpočtu
      if (name) budget.name = name;
      if (description !== undefined) budget.description = description;
      if (status) budget.status = status;
      
      await budget.save({ transaction });
      
      await transaction.commit();
      
      res.json(budget);
    } catch (error) {
      await transaction.rollback();
      console.error('Chyba při aktualizaci rozpočtu:', error);
      res.status(500).json({ message: 'Došlo k chybě při aktualizaci rozpočtu.' });
    }
  },
  
  // Smazání rozpočtu
  deleteBudget: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const budgetId = req.params.id;
      
      // Získání rozpočtu včetně projektu pro kontrolu vlastnictví
      const budget = await Budget.findOne({
        where: { id: budgetId },
        include: [{
          model: require('../models/Project'),
          where: { user_id: req.user.id },
          attributes: ['id', 'name', 'user_id']
        }]
      });
      
      if (!budget) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Rozpočet nebyl nalezen nebo k němu nemáte přístup.' });
      }
      
      // Smazání rozpočtu
      await budget.destroy({ transaction });
      
      await transaction.commit();
      
      res.json({ message: 'Rozpočet byl úspěšně smazán.' });
    } catch (error) {
      await transaction.rollback();
      console.error('Chyba při mazání rozpočtu:', error);
      res.status(500).json({ message: 'Došlo k chybě při mazání rozpočtu.' });
    }
  },
  
  // Získání položek rozpočtu
  getBudgetItems: async (req, res) => {
    try {
      const budgetId = req.params.id;
      
      // Získání rozpočtu včetně projektu pro kontrolu vlastnictví
      const budget = await Budget.findOne({
        where: { id: budgetId },
        include: [{
          model: require('../models/Project'),
          where: { user_id: req.user.id },
          attributes: ['id', 'name', 'user_id']
        }]
      });
      
      if (!budget) {
        return res.status(404).json({ message: 'Rozpočet nebyl nalezen nebo k němu nemáte přístup.' });
      }
      
      // Získání položek rozpočtu
      const budgetItems = await BudgetItem.findAll({
        where: { budget_id: budgetId },
        order: [['category', 'ASC'], ['name', 'ASC']]
      });
      
      res.json(budgetItems);
    } catch (error) {
      console.error('Chyba při získávání položek rozpočtu:', error);
      res.status(500).json({ message: 'Došlo k chybě při získávání položek rozpočtu.' });
    }
  },
  
  // Export rozpočtu do PDF
  exportToPdf: async (req, res) => {
    try {
      const budgetId = req.params.id;
      
      // Získání rozpočtu včetně projektu pro kontrolu vlastnictví
      const budget = await Budget.findOne({
        where: { id: budgetId },
        include: [{
          model: require('../models/Project'),
          where: { user_id: req.user.id },
          attributes: ['id', 'name', 'user_id', 'building_type', 'location']
        }]
      });
      
      if (!budget) {
        return res.status(404).json({ message: 'Rozpočet nebyl nalezen nebo k němu nemáte přístup.' });
      }
      
      // Kontrola předplatného pro export celého rozpočtu
      const subscription = req.user.subscription_type;
      
      // Získání položek rozpočtu
      const budgetItems = await BudgetItem.findAll({
        where: { budget_id: budgetId },
        order: [['category', 'ASC'], ['name', 'ASC']]
      });
      
      // Vytvoření adresáře pro exporty, pokud neexistuje
      const exportsDir = path.join(__dirname, '../../exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }
      
      // Vytvoření PDF souboru
      const pdfPath = path.join(exportsDir, `rozpocet_${budgetId}_${Date.now()}.pdf`);
      const doc = new PDFDocument({ margin: 50 });
      
      // Pipe PDF do souboru
      const pdfStream = fs.createWriteStream(pdfPath);
      doc.pipe(pdfStream);
      
      // Hlavička PDF
      doc.fontSize(25).text('Položkový rozpočet stavby', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(14).text(`Název projektu: ${budget.Project.name}`);
      doc.fontSize(12).text(`Typ budovy: ${getBuildingTypeText(budget.Project.building_type)}`);
      doc.fontSize(12).text(`Lokalita: ${budget.Project.location || 'Neuvedeno'}`);
      doc.fontSize(12).text(`Datum vytvoření: ${new Date(budget.created_at).toLocaleDateString('cs-CZ')}`);
      doc.moveDown();
      
      // Tabulka položek
      doc.fontSize(14).text('Položky rozpočtu:', { underline: true });
      doc.moveDown();
      
      // Záhlaví tabulky
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidths = [200, 60, 60, 60, 70];
      
      doc.fontSize(10).text('Položka', tableLeft, tableTop);
      doc.text('Množství', tableLeft + colWidths[0], tableTop);
      doc.text('Jednotka', tableLeft + colWidths[0] + colWidths[1], tableTop);
      doc.text('Cena/j', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
      doc.text('Celkem', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop);
      
      doc.moveTo(tableLeft, tableTop - 5)
         .lineTo(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableTop - 5)
         .stroke();
      
      doc.moveTo(tableLeft, tableTop + 15)
         .lineTo(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableTop + 15)
         .stroke();
      
      // Omezení počtu položek pro zkušební verzi
      const itemLimit = subscription === 'trial' ? 5 : budgetItems.length;
      const displayItems = budgetItems.slice(0, itemLimit);
      
      // Položky tabulky
      let y = tableTop + 25;
      let currentCategory = '';
      
      for (let i = 0; i < displayItems.length; i++) {
        const item = displayItems[i];
        
        // Přidání kategorie, pokud se změnila
        if (item.category !== currentCategory) {
          currentCategory = item.category;
          doc.fontSize(11).text(currentCategory, tableLeft, y, { bold: true });
          y += 20;
        }
        
        // Kontrola, zda je potřeba nová stránka
        if (y > doc.page.height - 100) {
          doc.addPage();
          y = 50;
        }
        
        doc.fontSize(10).text(item.name, tableLeft, y, { width: colWidths[0] });
        doc.text(item.quantity.toString(), tableLeft + colWidths[0], y);
        doc.text(item.unit, tableLeft + colWidths[0] + colWidths[1], y);
        doc.text(formatPrice(item.unit_price), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
        doc.text(formatPrice(item.total_price), tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
        
        y += 20;
      }
      
      // Přidání informace o omezení pro zkušební verzi
      if (subscription === 'trial' && budgetItems.length > itemLimit) {
        doc.moveDown();
        doc.fontSize(12).text('Toto je ukázková verze rozpočtu. Pro zobrazení kompletního rozpočtu si prosím aktivujte placené předplatné.', { color: 'red', align: 'center' });
      }
      
      // Souhrn
      doc.moveDown(2);
      doc.fontSize(12).text(`Celková cena bez DPH: ${formatPrice(budget.total_price)} Kč`, { align: 'right' });
      doc.fontSize(12).text(`DPH (${budget.vat_rate}%): ${formatPrice(budget.total_price_with_vat - budget.total_price)} Kč`, { align: 'right' });
      doc.fontSize(14).text(`Celková cena s DPH: ${formatPrice(budget.total_price_with_vat)} Kč`, { align: 'right' });
      
      // Zápatí
      doc.moveDown(2);
      doc.fontSize(10).text('Vygenerováno aplikací Building Budget', { align: 'center', color: 'gray' });
      
      // Finalizace PDF
      doc.end();
      
      // Počkat na dokončení zápisu do souboru
      pdfStream.on('finish', () => {
        // Odeslání souboru
        res.download(pdfPath, `Rozpocet_${budget.Project.name.replace(/[^a-z0-9]/gi, '_')}.pdf`, (err) => {
          if (err) {
            console.error('Chyba při odesílání PDF souboru:', err);
          }
          
          // Smazání dočasného souboru po odeslání
          fs.unlink(pdfPath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Chyba při mazání dočasného PDF souboru:', unlinkErr);
            }
          });
        });
      });
    } catch (error) {
      console.error('Chyba při exportu rozpočtu do PDF:', error);
      res.status(500).json({ message: 'Došlo k chybě při exportu rozpočtu do PDF.' });
    }
  },
  
  // Export rozpočtu do Excel
  exportToExcel: async (req, res) => {
    try {
      const budgetId = req.params.id;
      
      // Získání rozpočtu včetně projektu pro kontrolu vlastnictví
      const budget = await Budget.findOne({
        where: { id: budgetId },
        include: [{
          model: require('../models/Project'),
          where: { user_id: req.user.id },
          attributes: ['id', 'name', 'user_id', 'building_type', 'location']
        }]
      });
      
      if (!budget) {
        return res.status(404).json({ message: 'Rozpočet nebyl nalezen nebo k němu nemáte přístup.' });
      }
      
      // Kontrola předplatného pro export celého rozpočtu
      const subscription = req.user.subscription_type;
      if (subscription === 'trial') {
        return res.status(403).json({ 
          message: 'Export do Excelu je dostupný pouze pro placená předplatná. Upgradujte své předplatné.'
        });
      }
      
      // Získání položek rozpočtu
      const budgetItems = await BudgetItem.findAll({
        where: { budget_id: budgetId },
        order: [['category', 'ASC'], ['name', 'ASC']]
      });
      
      // Vytvoření adresáře pro exporty, pokud neexistuje
      const exportsDir = path.join(__dirname, '../../exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }
      
      // Vytvoření Excel souboru
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Building Budget';
      workbook.created = new Date();
      
      // Přidání listu s rozpočtem
      const worksheet = workbook.addWorksheet('Rozpočet');
      
      // Styly
      const headerStyle = {
        font: { bold: true, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } },
        alignment: { horizontal: 'center' }
      };
      
      const categoryStyle = {
        font: { bold: true, size: 11 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } }
      };
      
      // Hlavička
      worksheet.mergeCells('A1:E1');
      worksheet.getCell('A1').value = 'POLOŽKOVÝ ROZPOČET STAVBY';
      worksheet.getCell('A1').font = { bold: true, size: 16 };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };
      
      worksheet.mergeCells('A2:E2');
      worksheet.getCell('A2').value = budget.Project.name;
      worksheet.getCell('A2').font = { bold: true, size: 14 };
      worksheet.getCell('A2').alignment = { horizontal: 'center' };
      
      worksheet.getCell('A4').value = 'Typ budovy:';
      worksheet.getCell('B4').value = getBuildingTypeText(budget.Project.building_type);
      
      worksheet.getCell('A5').value = 'Lokalita:';
      worksheet.getCell('B5').value = budget.Project.location || 'Neuvedeno';
      
      worksheet.getCell('A6').value = 'Datum vytvoření:';
      worksheet.getCell('B6').value = new Date(budget.created_at).toLocaleDateString('cs-CZ');
      
      // Záhlaví tabulky položek
      worksheet.getCell('A8').value = 'Položka';
      worksheet.getCell('B8').value = 'Množství';
      worksheet.getCell('C8').value = 'Jednotka';
      worksheet.getCell('D8').value = 'Cena/j';
      worksheet.getCell('E8').value = 'Celkem';
      
      // Aplikace stylu na záhlaví
      ['A8', 'B8', 'C8', 'D8', 'E8'].forEach(cell => {
        worksheet.getCell(cell).style = headerStyle;
      });
      
      // Nastavení šířky sloupců
      worksheet.getColumn('A').width = 50;
      worksheet.getColumn('B').width = 15;
      worksheet.getColumn('C').width = 15;
      worksheet.getColumn('D').width = 15;
      worksheet.getColumn('E').width = 15;
      
      // Položky rozpočtu
      let rowIndex = 9;
      let currentCategory = '';
      
      for (const item of budgetItems) {
        // Přidání kategorie, pokud se změnila
        if (item.category !== currentCategory) {
          currentCategory = item.category;
          worksheet.mergeCells(`A${rowIndex}:E${rowIndex}`);
          worksheet.getCell(`A${rowIndex}`).value = currentCategory;
          worksheet.getCell(`A${rowIndex}`).style = categoryStyle;
          rowIndex++;
        }
        
        worksheet.getCell(`A${rowIndex}`).value = item.name;
        worksheet.getCell(`B${rowIndex}`).value = item.quantity;
        worksheet.getCell(`C${rowIndex}`).value = item.unit;
        worksheet.getCell(`D${rowIndex}`).value = item.unit_price;
        worksheet.getCell(`E${rowIndex}`).value = item.total_price;
        
        // Formátování čísel
        worksheet.getCell(`D${rowIndex}`).numFmt = '#,##0.00 Kč';
        worksheet.getCell(`E${rowIndex}`).numFmt = '#,##0.00 Kč';
        
        rowIndex++;
      }
      
      // Souhrn
      rowIndex += 1;
      worksheet.getCell(`D${rowIndex}`).value = 'Celkem bez DPH:';
      worksheet.getCell(`D${rowIndex}`).font = { bold: true };
      worksheet.getCell(`E${rowIndex}`).value = budget.total_price;
      worksheet.getCell(`E${rowIndex}`).numFmt = '#,##0.00 Kč';
      
      rowIndex++;
      worksheet.getCell(`D${rowIndex}`).value = `DPH (${budget.vat_rate}%):`;
      worksheet.getCell(`D${rowIndex}`).font = { bold: true };
      worksheet.getCell(`E${rowIndex}`).value = budget.total_price_with_vat - budget.total_price;
      worksheet.getCell(`E${rowIndex}`).numFmt = '#,##0.00 Kč';
      
      rowIndex++;
      worksheet.getCell(`D${rowIndex}`).value = 'Celkem s DPH:';
      worksheet.getCell(`D${rowIndex}`).font = { bold: true };
      worksheet.getCell(`E${rowIndex}`).value = budget.total_price_with_vat;
      worksheet.getCell(`E${rowIndex}`).numFmt = '#,##0.00 Kč';
      worksheet.getCell(`E${rowIndex}`).font = { bold: true };
      
      // Zápatí
      rowIndex += 2;
      worksheet.mergeCells(`A${rowIndex}:E${rowIndex}`);
      worksheet.getCell(`A${rowIndex}`).value = 'Vygenerováno aplikací Building Budget';
      worksheet.getCell(`A${rowIndex}`).alignment = { horizontal: 'center' };
      worksheet.getCell(`A${rowIndex}`).font = { color: { argb: 'FF808080' } };
      
      // Uložení souboru
      const excelPath = path.join(exportsDir, `rozpocet_${budgetId}_${Date.now()}.xlsx`);
      await workbook.xlsx.writeFile(excelPath);
      
      // Odeslání souboru
      res.download(excelPath, `Rozpocet_${budget.Project.name.replace(/[^a-z0-9]/gi, '_')}.xlsx`, (err) => {
        if (err) {
          console.error('Chyba při odesílání Excel souboru:', err);
        }
        
        // Smazání dočasného souboru po odeslání
        fs.unlink(excelPath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Chyba při mazání dočasného Excel souboru:', unlinkErr);
          }
        });
      });
    } catch (error) {
      console.error('Chyba při exportu rozpočtu do Excel:', error);
      res.status(500).json({ message: 'Došlo k chybě při exportu rozpočtu do Excel.' });
    }
  }
};

// Pomocné funkce
function getBuildingTypeText(type) {
  const types = {
    'residential': 'Obytná budova',
    'commercial': 'Komerční budova',
    'industrial': 'Průmyslová budova',
    'other': 'Jiný typ budovy'
  };
  
  return types[type] || 'Neuvedeno';
}

function formatPrice(price) {
  return new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
}

module.exports = budgetController;
