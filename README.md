# Building Budget - Multi-File Project Support

Tento repozitář obsahuje implementaci aplikace Building Budget s podporou pro více souborů v rámci jednoho projektu.

## Přehled

Building Budget je webová aplikace, která umožňuje nahrávat různé typy stavebních dokumentů (PDF technické zprávy, DWG výkresy, IFC BIM modely) a automaticky z nich generovat položkové rozpočty stavby. Aplikace využívá databáze směrných a položkových cen stavebních prací a materiálů.

Tato verze aplikace přidává podporu pro více souborů v rámci jednoho projektu, což umožňuje:
- Vytvářet projekty s více soubory různých typů
- Extrahovat komplementární data z různých souborů
- Generovat komplexní rozpočty na základě dat ze všech souborů
- Implementovat hybridní monetizační model založený na komplexnosti projektu

## Struktura projektu

```
building-budget-multifile/
├── backend/                  # Backend aplikace (Node.js/Express)
│   ├── src/
│   │   ├── config/           # Konfigurační soubory
│   │   ├── controllers/      # Kontrolery pro API endpointy
│   │   ├── models/           # Databázové modely (SQL)
│   │   ├── routes/           # API routy
│   │   ├── services/         # Business logika
│   │   │   ├── extractors/   # Extraktory dat ze souborů
│   │   │   ├── generators/   # Generátory rozpočtů
│   │   │   └── pricing/      # Přístup k cenovým databázím
│   │   └── utils/            # Pomocné funkce
│   ├── .env.example          # Vzorový konfigurační soubor
│   ├── package.json          # Závislosti backendu
│   └── server.js             # Hlavní soubor serveru
├── frontend/                 # Frontend aplikace
│   ├── public/               # Statické soubory
│   ├── src/
│   │   ├── assets/           # Obrázky, styly, fonty
│   │   ├── components/       # React komponenty
│   │   ├── pages/            # Stránky aplikace
│   │   ├── services/         # API služby
│   │   └── utils/            # Pomocné funkce
│   ├── package.json          # Závislosti frontendu
│   └── index.html            # Hlavní HTML soubor
├── n8n/                      # n8n workflow
│   └── workflows/            # Exportované n8n workflow
├── docs/                     # Dokumentace
│   ├── api/                  # API dokumentace
│   ├── database/             # Databázová dokumentace
│   └── deployment/           # Návod na nasazení
└── README.md                 # Hlavní dokumentace projektu
```

## Instalace a spuštění

### Požadavky
- Node.js (verze 14 nebo vyšší)
- MySQL (verze 5.7 nebo vyšší)
- n8n (volitelné, pro automatizaci workflow)

### Backend

1. Přejděte do adresáře backend:
```
cd backend
```

2. Nainstalujte závislosti:
```
npm install
```

3. Vytvořte soubor .env podle vzoru .env.example a nastavte připojení k databázi.

4. Vytvořte databázi a tabulky:
```
npm run db:setup
```

5. Spusťte server:
```
npm start
```

Server bude dostupný na adrese http://localhost:3000

### Frontend

1. Přejděte do adresáře frontend:
```
cd frontend
```

2. Nainstalujte závislosti:
```
npm install
```

3. Spusťte vývojový server:
```
npm start
```

Frontend bude dostupný na adrese http://localhost:5173

## Integrace s n8n

Pro integraci s n8n je potřeba:

1. Nainstalovat a spustit n8n podle instrukcí na [n8n.io](https://n8n.io/)
2. Importovat workflow ze složky n8n/workflows
3. Nakonfigurovat připojení k API backendu

## Funkce

- Vytváření projektů s více soubory různých typů
- Nahrávání a správa souborů (PDF, DWG, IFC)
- Extrakce dat ze souborů
- Generování položkových rozpočtů
- Export rozpočtů do PDF a Excel
- Správa uživatelů a předplatného

## Monetizační model

Aplikace nabízí několik úrovní předplatného:

- **Zkušební verze** (1 měsíc zdarma): Max. 3 projekty, náhled 2 stran rozpočtu
- **Základní předplatné** (1000 Kč/měsíc): Max. 10 projektů, komplexnost do 5
- **Profesionální předplatné** (3000 Kč/měsíc): Max. 50 projektů, komplexnost do 8
- **Podnikové předplatné** (8000 Kč/měsíc): Neomezený počet projektů, libovolná komplexnost

## Licence

ISC
