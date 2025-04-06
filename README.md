# Building Budget - Vylepšená verze

Toto je vylepšená verze aplikace Building Budget pro automatizované generování stavebních rozpočtů z různých typů souborů (PDF, DWG, IFC).

## Funkce

- Moderní, responzivní uživatelské rozhraní
- Zpracování různých typů souborů (PDF, DWG, IFC)
- Automatická extrakce dat z nahraných souborů
- Generování detailních rozpočtů na základě extrahovaných dat
- Správa projektů a rozpočtů
- Uživatelské účty a týmová spolupráce
- Integrace s n8n pro automatizované zpracování souborů
- Různé úrovně předplatného a projektové balíčky

## Technologie

### Frontend
- Next.js
- React
- Tailwind CSS
- Axios pro API volání

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JWT pro autentizaci

### Integrace
- n8n pro automatizaci workflow
- Stripe pro zpracování plateb

## Struktura projektu

```
building-budget-enhanced/
├── frontend/           # Next.js frontend
│   ├── public/         # Statické soubory
│   └── src/            # Zdrojový kód
│       ├── components/ # React komponenty
│       ├── pages/      # Stránky aplikace
│       ├── hooks/      # Custom React hooks
│       ├── context/    # React context pro state management
│       ├── utils/      # Pomocné funkce
│       └── styles/     # CSS styly
├── backend/            # Node.js backend
│   └── src/
│       ├── controllers/  # Kontrolery pro API endpointy
│       ├── models/       # Datové modely
│       ├── routes/       # API routy
│       ├── services/     # Byznys logika
│       ├── middleware/   # Middleware funkce
│       └── utils/        # Pomocné funkce
└── n8n-workflows/      # n8n workflow šablony
```

## Instalace a spuštění

### Požadavky
- Node.js 16+
- MongoDB
- n8n instance

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

### Nastavení n8n

1. Nainstalujte n8n: `npm install -g n8n`
2. Spusťte n8n: `n8n start`
3. Importujte workflow šablony z adresáře `n8n-workflows`

## Cenové plány

### Předplatné
- **Free**: Zdarma, 1 projekt
- **Standard**: 2 490 Kč/měsíc nebo 23 900 Kč/rok, 5 projektů
- **Professional**: 4 990 Kč/měsíc nebo 47 900 Kč/rok, 15 projektů
- **Enterprise**: 9 990 Kč/měsíc nebo 95 900 Kč/rok, neomezený počet projektů

### Projektové balíčky
- **Malý projekt**: 1 990 Kč, 1 projekt, platnost 3 měsíce
- **Střední projekt**: 4 990 Kč, 3 projekty, platnost 6 měsíců
- **Velký projekt**: 9 990 Kč, 5 projektů, platnost 12 měsíců

## Licence

Tento projekt je licencován pod [MIT licencí](LICENSE).
