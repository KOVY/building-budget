# Nasazení aplikace Building Budget

Tento dokument obsahuje podrobné instrukce pro nasazení aplikace Building Budget v produkčním prostředí.

## Nasazení frontendu na Vercel

### Příprava

1. Vytvořte účet na [Vercel](https://vercel.com) (pokud jej ještě nemáte)
2. Propojte svůj GitHub účet s Vercel
3. Importujte repozitář Building Budget do Vercel

### Konfigurace

1. V nastavení projektu na Vercel nakonfigurujte následující proměnné prostředí:
   - `NEXT_PUBLIC_API_URL`: URL vašeho backend API (např. `https://api.building-budget.com`)
   - `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`: Veřejný klíč Stripe pro zpracování plateb

2. Nastavte framework preset na Next.js
3. Nastavte root directory na `frontend`
4. Nastavte build command na `npm run build`
5. Nastavte output directory na `.next`

### Nasazení

1. Klikněte na tlačítko "Deploy" v Vercel dashboardu
2. Po úspěšném nasazení bude frontend dostupný na přidělené doméně (např. `building-budget.vercel.app`)
3. Můžete nakonfigurovat vlastní doménu v nastavení projektu

## Nasazení backendu

### Možnost 1: Nasazení na Heroku

1. Vytvořte účet na [Heroku](https://heroku.com) (pokud jej ještě nemáte)
2. Nainstalujte Heroku CLI: `npm install -g heroku`
3. Přihlaste se do Heroku: `heroku login`
4. Vytvořte novou aplikaci: `heroku create building-budget-api`
5. Přidejte MongoDB add-on: `heroku addons:create mongolab`
6. Nastavte proměnné prostředí:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set FRONTEND_URL=https://building-budget.vercel.app
   heroku config:set JWT_SECRET=vaše_tajné_heslo
   heroku config:set STRIPE_SECRET_KEY=váš_stripe_tajný_klíč
   heroku config:set STRIPE_WEBHOOK_SECRET=váš_stripe_webhook_secret
   heroku config:set N8N_BASE_URL=https://vaše-n8n-instance.com
   heroku config:set N8N_API_KEY=váš_n8n_api_klíč
   ```
7. Nasaďte backend:
   ```bash
   git subtree push --prefix backend heroku main
   ```

### Možnost 2: Nasazení na vlastní server

1. Připravte server s Node.js (minimálně verze 16)
2. Nainstalujte PM2: `npm install -g pm2`
3. Nakopírujte backend složku na server
4. Nastavte proměnné prostředí v souboru `.env`:
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/building-budget
   FRONTEND_URL=https://building-budget.vercel.app
   JWT_SECRET=vaše_tajné_heslo
   JWT_EXPIRE=30d
   STRIPE_SECRET_KEY=váš_stripe_tajný_klíč
   STRIPE_WEBHOOK_SECRET=váš_stripe_webhook_secret
   N8N_BASE_URL=https://vaše-n8n-instance.com
   N8N_API_KEY=váš_n8n_api_klíč
   ```
5. Nainstalujte závislosti: `npm install --production`
6. Spusťte aplikaci pomocí PM2: `pm2 start src/server.js --name building-budget-api`
7. Nastavte automatický restart: `pm2 startup` a následujte instrukce
8. Uložte konfiguraci PM2: `pm2 save`

## Nasazení n8n

### Možnost 1: n8n Cloud

1. Zaregistrujte se na [n8n.cloud](https://n8n.cloud)
2. Vytvořte novou instanci n8n
3. Importujte workflow šablony z adresáře `n8n-workflows`
4. Nakonfigurujte proměnné prostředí v n8n:
   - `BUILDING_BUDGET_API_URL`: URL vašeho backend API
   - `BUILDING_BUDGET_API_KEY`: API klíč pro přístup k vašemu API

### Možnost 2: Vlastní n8n instance

1. Nainstalujte n8n: `npm install -g n8n`
2. Vytvořte složku pro n8n data: `mkdir ~/.n8n`
3. Nastavte proměnné prostředí:
   ```bash
   export N8N_ENCRYPTION_KEY=vaše_tajné_heslo
   export N8N_PORT=5678
   export BUILDING_BUDGET_API_URL=https://api.building-budget.com
   export BUILDING_BUDGET_API_KEY=váš_api_klíč
   ```
4. Spusťte n8n: `n8n start`
5. Importujte workflow šablony z adresáře `n8n-workflows`
6. Pro produkční nasazení použijte PM2:
   ```bash
   pm2 start n8n --name n8n -- start
   pm2 startup
   pm2 save
   ```

## Konfigurace Stripe

1. Vytvořte účet na [Stripe](https://stripe.com)
2. V Stripe dashboardu vytvořte produkty a cenové plány odpovídající vašim předplatným a balíčkům
3. Aktualizujte ID cenových plánů v modelech `SubscriptionPlan` a `ProjectPackage`
4. Nastavte webhook endpoint v Stripe dashboardu na `https://api.building-budget.com/api/subscriptions/webhook`
5. Zkopírujte webhook secret a nastavte jej jako `STRIPE_WEBHOOK_SECRET` v proměnných prostředí backendu

## Inicializace databáze

Po prvním spuštění backendu se automaticky vytvoří výchozí předplatné plány a projektové balíčky. Pokud potřebujete vytvořit administrátorský účet, použijte následující skript:

```javascript
// Uložte jako scripts/create-admin.js
const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const adminPassword = 'admin123'; // Změňte na bezpečné heslo
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@building-budget.com',
      password: hashedPassword,
      role: 'admin'
    });
    
    console.log('Admin user created:', admin);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
```

Spusťte skript příkazem: `node scripts/create-admin.js`

## Údržba a monitoring

Pro monitoring aplikace doporučujeme:

1. Nastavit Sentry.io pro sledování chyb
2. Použít PM2 monitoring pro sledování výkonu Node.js
3. Nastavit pravidelné zálohování MongoDB databáze
4. Implementovat health check endpointy pro kontrolu stavu služeb

## Řešení problémů

### Frontend se nenačítá
- Zkontrolujte, zda je správně nastavena proměnná `NEXT_PUBLIC_API_URL`
- Ověřte, zda backend API je dostupné a funkční

### Backend API vrací chyby
- Zkontrolujte logy pomocí `heroku logs` nebo `pm2 logs`
- Ověřte připojení k MongoDB
- Zkontrolujte, zda jsou správně nastaveny všechny proměnné prostředí

### n8n workflow nefungují
- Zkontrolujte, zda je n8n instance dostupná
- Ověřte, zda jsou workflow aktivovány
- Zkontrolujte logy n8n pro detailnější informace o chybách
