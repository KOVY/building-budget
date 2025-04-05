const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pro ověření JWT tokenu
const authMiddleware = async (req, res, next) => {
  try {
    // Získání tokenu z hlavičky Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Přístup odepřen. Chybí autorizační token.' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Ověření tokenu
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'building-budget-secret');
    
    // Vyhledání uživatele podle ID z tokenu
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Přístup odepřen. Uživatel nebyl nalezen.' });
    }
    
    // Kontrola platnosti předplatného
    const now = new Date();
    if (user.subscription_expires_at && new Date(user.subscription_expires_at) < now) {
      // Pokud předplatné vypršelo, nastavíme typ na 'trial'
      user.subscription_type = 'trial';
      await user.save();
    }
    
    // Přidání informací o uživateli do požadavku
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      subscription_type: user.subscription_type
    };
    
    next();
  } catch (error) {
    console.error('Chyba při ověřování tokenu:', error);
    return res.status(401).json({ message: 'Přístup odepřen. Neplatný token.' });
  }
};

module.exports = authMiddleware;
