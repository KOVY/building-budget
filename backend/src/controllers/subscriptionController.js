const User = require('../models/User');
const { sequelize } = require('../config/database');

// Kontroler pro správu předplatného
const subscriptionController = {
  // Získání informací o předplatném uživatele
  getSubscriptionStatus: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Vyhledání uživatele podle ID
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'Uživatel nebyl nalezen.' });
      }
      
      // Kontrola platnosti předplatného
      const now = new Date();
      const isExpired = user.subscription_expires_at && new Date(user.subscription_expires_at) < now;
      
      // Informace o předplatném
      const subscriptionInfo = {
        type: user.subscription_type,
        expires_at: user.subscription_expires_at,
        is_active: !isExpired,
        days_remaining: isExpired ? 0 : Math.ceil((new Date(user.subscription_expires_at) - now) / (1000 * 60 * 60 * 24))
      };
      
      // Limity podle typu předplatného
      let limits = {};
      
      switch (user.subscription_type) {
        case 'trial':
          limits = {
            max_projects: 3,
            max_files_per_project: 3,
            max_complexity: 5,
            export_pdf_preview: true,
            export_excel: false
          };
          break;
        case 'basic':
          limits = {
            max_projects: 10,
            max_files_per_project: 10,
            max_complexity: 5,
            export_pdf_preview: true,
            export_excel: true
          };
          break;
        case 'professional':
          limits = {
            max_projects: 50,
            max_files_per_project: 30,
            max_complexity: 8,
            export_pdf_preview: true,
            export_excel: true
          };
          break;
        case 'enterprise':
          limits = {
            max_projects: -1, // neomezeno
            max_files_per_project: -1, // neomezeno
            max_complexity: 10,
            export_pdf_preview: true,
            export_excel: true
          };
          break;
        default:
          limits = {
            max_projects: 0,
            max_files_per_project: 0,
            max_complexity: 0,
            export_pdf_preview: false,
            export_excel: false
          };
      }
      
      res.json({
        subscription: subscriptionInfo,
        limits
      });
    } catch (error) {
      console.error('Chyba při získávání informací o předplatném:', error);
      res.status(500).json({ message: 'Došlo k chybě při získávání informací o předplatném.' });
    }
  },
  
  // Aktivace zkušební verze
  activateTrial: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const userId = req.user.id;
      
      // Vyhledání uživatele podle ID
      const user = await User.findByPk(userId);
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Uživatel nebyl nalezen.' });
      }
      
      // Kontrola, zda uživatel již nemá aktivní předplatné
      if (user.subscription_type !== 'trial' && new Date(user.subscription_expires_at) > new Date()) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Uživatel již má aktivní předplatné.' });
      }
      
      // Aktivace zkušební verze na 30 dní
      user.subscription_type = 'trial';
      user.subscription_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dní
      
      await user.save({ transaction });
      
      await transaction.commit();
      
      res.json({
        message: 'Zkušební verze byla úspěšně aktivována.',
        subscription: {
          type: user.subscription_type,
          expires_at: user.subscription_expires_at
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Chyba při aktivaci zkušební verze:', error);
      res.status(500).json({ message: 'Došlo k chybě při aktivaci zkušební verze.' });
    }
  },
  
  // Aktivace placeného předplatného
  activateSubscription: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const userId = req.user.id;
      const { subscription_type, payment_method, payment_details } = req.body;
      
      // Validace vstupních dat
      if (!subscription_type || !['basic', 'professional', 'enterprise'].includes(subscription_type)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Neplatný typ předplatného.' });
      }
      
      if (!payment_method) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Platební metoda je povinný údaj.' });
      }
      
      // Vyhledání uživatele podle ID
      const user = await User.findByPk(userId);
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Uživatel nebyl nalezen.' });
      }
      
      // Simulace zpracování platby
      // V reálné aplikaci by zde byla integrace s platební bránou
      console.log(`Simulace zpracování platby pro uživatele ${userId}:`, {
        subscription_type,
        payment_method,
        payment_details
      });
      
      // Nastavení doby platnosti předplatného podle typu
      let duration = 30; // výchozí 30 dní
      
      switch (subscription_type) {
        case 'basic':
          duration = 30; // 1 měsíc
          break;
        case 'professional':
          duration = 30; // 1 měsíc
          break;
        case 'enterprise':
          duration = 30; // 1 měsíc
          break;
      }
      
      // Aktualizace předplatného uživatele
      user.subscription_type = subscription_type;
      
      // Pokud má uživatel stále platné předplatné, prodloužíme ho
      if (user.subscription_expires_at && new Date(user.subscription_expires_at) > new Date()) {
        user.subscription_expires_at = new Date(new Date(user.subscription_expires_at).getTime() + duration * 24 * 60 * 60 * 1000);
      } else {
        user.subscription_expires_at = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
      }
      
      await user.save({ transaction });
      
      // Simulace uložení platby do historie plateb
      // V reálné aplikaci by zde bylo uložení do databáze
      const payment = {
        user_id: userId,
        subscription_type,
        amount: getSubscriptionPrice(subscription_type),
        payment_method,
        payment_date: new Date(),
        status: 'completed'
      };
      
      console.log('Simulace uložení platby:', payment);
      
      await transaction.commit();
      
      res.json({
        message: 'Předplatné bylo úspěšně aktivováno.',
        subscription: {
          type: user.subscription_type,
          expires_at: user.subscription_expires_at
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Chyba při aktivaci předplatného:', error);
      res.status(500).json({ message: 'Došlo k chybě při aktivaci předplatného.' });
    }
  },
  
  // Zrušení předplatného
  cancelSubscription: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const userId = req.user.id;
      
      // Vyhledání uživatele podle ID
      const user = await User.findByPk(userId);
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Uživatel nebyl nalezen.' });
      }
      
      // Kontrola, zda uživatel má aktivní předplatné
      if (user.subscription_type === 'trial' || !user.subscription_expires_at || new Date(user.subscription_expires_at) < new Date()) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Uživatel nemá aktivní placené předplatné.' });
      }
      
      // Uživatel bude moci využívat předplatné do konce aktuálního období
      // Po vypršení se automaticky přepne na zkušební verzi
      
      // Nastavení příznaku pro automatické neprodloužení
      // V reálné aplikaci by zde byla integrace s platební bránou pro zrušení opakovaných plateb
      console.log(`Simulace zrušení automatického prodloužení předplatného pro uživatele ${userId}`);
      
      await transaction.commit();
      
      res.json({
        message: 'Předplatné bylo úspěšně zrušeno. Můžete ho využívat do konce aktuálního období.',
        subscription: {
          type: user.subscription_type,
          expires_at: user.subscription_expires_at,
          auto_renew: false
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Chyba při rušení předplatného:', error);
      res.status(500).json({ message: 'Došlo k chybě při rušení předplatného.' });
    }
  },
  
  // Získání historie plateb
  getPaymentHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Vyhledání uživatele podle ID
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'Uživatel nebyl nalezen.' });
      }
      
      // Simulace získání historie plateb
      // V reálné aplikaci by zde bylo načtení z databáze
      const mockPaymentHistory = [
        {
          id: 1,
          user_id: userId,
          subscription_type: user.subscription_type,
          amount: getSubscriptionPrice(user.subscription_type),
          payment_method: 'credit_card',
          payment_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 dní zpět
          status: 'completed'
        }
      ];
      
      res.json(mockPaymentHistory);
    } catch (error) {
      console.error('Chyba při získávání historie plateb:', error);
      res.status(500).json({ message: 'Došlo k chybě při získávání historie plateb.' });
    }
  }
};

// Pomocná funkce pro získání ceny předplatného
function getSubscriptionPrice(subscriptionType) {
  switch (subscriptionType) {
    case 'basic':
      return 1000; // 1000 Kč
    case 'professional':
      return 3000; // 3000 Kč
    case 'enterprise':
      return 8000; // 8000 Kč
    default:
      return 0;
  }
}

module.exports = subscriptionController;
