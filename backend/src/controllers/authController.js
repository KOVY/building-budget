const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/database');

// Kontroler pro autentizaci
const authController = {
  // Registrace nového uživatele
  register: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { username, email, password } = req.body;
      
      // Validace vstupních dat
      if (!username || !email || !password) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Uživatelské jméno, e-mail a heslo jsou povinné údaje.' });
      }
      
      // Kontrola, zda uživatel s daným e-mailem již existuje
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Uživatel s tímto e-mailem již existuje.' });
      }
      
      // Hashování hesla
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Vytvoření nového uživatele
      const user = await User.create({
        username,
        email,
        password_hash: hashedPassword,
        subscription_type: 'trial',
        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dní zkušební doba
      }, { transaction });
      
      await transaction.commit();
      
      // Generování JWT tokenu
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'building-budget-secret',
        { expiresIn: '1d' }
      );
      
      // Odstranění hesla z odpovědi
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        subscription_type: user.subscription_type,
        subscription_expires_at: user.subscription_expires_at
      };
      
      res.status(201).json({
        message: 'Uživatel byl úspěšně zaregistrován.',
        user: userResponse,
        token
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Chyba při registraci uživatele:', error);
      res.status(500).json({ message: 'Došlo k chybě při registraci uživatele.' });
    }
  },
  
  // Přihlášení uživatele
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validace vstupních dat
      if (!email || !password) {
        return res.status(400).json({ message: 'E-mail a heslo jsou povinné údaje.' });
      }
      
      // Vyhledání uživatele podle e-mailu
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Neplatné přihlašovací údaje.' });
      }
      
      // Ověření hesla
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Neplatné přihlašovací údaje.' });
      }
      
      // Generování JWT tokenu
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'building-budget-secret',
        { expiresIn: '1d' }
      );
      
      // Odstranění hesla z odpovědi
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        subscription_type: user.subscription_type,
        subscription_expires_at: user.subscription_expires_at
      };
      
      res.json({
        message: 'Přihlášení bylo úspěšné.',
        user: userResponse,
        token
      });
    } catch (error) {
      console.error('Chyba při přihlášení uživatele:', error);
      res.status(500).json({ message: 'Došlo k chybě při přihlášení uživatele.' });
    }
  },
  
  // Získání informací o přihlášeném uživateli
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Vyhledání uživatele podle ID
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'Uživatel nebyl nalezen.' });
      }
      
      // Odstranění hesla z odpovědi
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        subscription_type: user.subscription_type,
        subscription_expires_at: user.subscription_expires_at,
        created_at: user.created_at
      };
      
      res.json(userResponse);
    } catch (error) {
      console.error('Chyba při získávání profilu uživatele:', error);
      res.status(500).json({ message: 'Došlo k chybě při získávání profilu uživatele.' });
    }
  },
  
  // Odhlášení uživatele
  logout: async (req, res) => {
    // JWT tokeny jsou statické, takže na straně serveru není potřeba nic dělat
    // Klient by měl smazat token ze svého úložiště
    res.json({ message: 'Odhlášení bylo úspěšné.' });
  }
};

module.exports = authController;
