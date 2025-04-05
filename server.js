require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./src/config/database');
const userRoutes = require('./src/routes/userRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const fileRoutes = require('./src/routes/fileRoutes');
const budgetRoutes = require('./src/routes/budgetRoutes');
const authRoutes = require('./src/routes/authRoutes');
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statické soubory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Základní route pro kontrolu, že server běží
app.get('/', (req, res) => {
  res.json({ message: 'Building Budget API je funkční!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Došlo k chybě na serveru',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Spuštění serveru
const startServer = async () => {
  try {
    // Testování připojení k databázi
    await sequelize.authenticate();
    console.log('Připojení k databázi bylo úspěšné.');
    
    // Synchronizace modelů s databází (v produkci by se měly používat migrace)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Databázové modely byly synchronizovány.');
    }
    
    // Spuštění serveru
    app.listen(PORT, () => {
      console.log(`Server běží na portu ${PORT}`);
    });
  } catch (error) {
    console.error('Nelze se připojit k databázi:', error);
  }
};

startServer();

module.exports = app; // Pro testování
