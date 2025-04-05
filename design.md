# Building Budget - Multi-File Project Support

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

## Databázový model

### Tabulka `users`
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  subscription_type ENUM('trial', 'basic', 'professional', 'enterprise') DEFAULT 'trial',
  subscription_expires_at TIMESTAMP NULL
);
```

### Tabulka `projects`
```sql
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  building_type ENUM('residential', 'commercial', 'industrial', 'other') DEFAULT 'residential',
  total_area DECIMAL(10,2) DEFAULT 0,
  complexity INT DEFAULT 1,
  status ENUM('draft', 'in_progress', 'completed') DEFAULT 'draft',
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Tabulka `files`
```sql
CREATE TABLE files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_type ENUM('pdf', 'dwg', 'ifc') NOT NULL,
  file_size INT NOT NULL,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('uploaded', 'processing', 'processed', 'error') DEFAULT 'uploaded',
  processing_message TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### Tabulka `extracted_data`
```sql
CREATE TABLE extracted_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_id INT NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  data_key VARCHAR(100) NOT NULL,
  data_value TEXT,
  confidence DECIMAL(5,2) DEFAULT 1.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);
```

### Tabulka `budgets`
```sql
CREATE TABLE budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status ENUM('draft', 'final') DEFAULT 'draft',
  total_price DECIMAL(15,2) DEFAULT 0,
  vat_rate DECIMAL(5,2) DEFAULT 21.00,
  total_price_with_vat DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### Tabulka `budget_items`
```sql
CREATE TABLE budget_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  budget_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  source_file_id INT,
  FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
  FOREIGN KEY (source_file_id) REFERENCES files(id) ON DELETE SET NULL
);
```

## API Endpointy

### Projekty
- `GET /api/projects` - Seznam projektů
- `GET /api/projects/:id` - Detail projektu
- `POST /api/projects` - Vytvoření projektu
- `PUT /api/projects/:id` - Aktualizace projektu
- `DELETE /api/projects/:id` - Smazání projektu

### Soubory
- `POST /api/projects/:id/files` - Nahrání souboru do projektu
- `GET /api/projects/:id/files` - Seznam souborů v projektu
- `GET /api/files/:id` - Detail souboru
- `DELETE /api/files/:id` - Smazání souboru

### Rozpočty
- `POST /api/projects/:id/budgets` - Generování rozpočtu pro projekt
- `GET /api/projects/:id/budgets` - Seznam rozpočtů projektu
- `GET /api/budgets/:id` - Detail rozpočtu
- `GET /api/budgets/:id/export/:format` - Export rozpočtu (PDF, Excel)

### Uživatelé a předplatné
- `POST /api/auth/register` - Registrace uživatele
- `POST /api/auth/login` - Přihlášení uživatele
- `GET /api/auth/me` - Informace o přihlášeném uživateli
- `POST /api/subscription/activate` - Aktivace předplatného
- `GET /api/subscription/status` - Stav předplatného

## Integrace s n8n

### Workflow pro zpracování souborů
1. **Trigger**: Nahrání nového souboru do projektu
2. **Extrakce dat**: Podle typu souboru (PDF, DWG, IFC)
3. **Uložení extrahovaných dat**: Do databáze
4. **Notifikace**: Informování uživatele o dokončení zpracování

### Workflow pro generování rozpočtu
1. **Trigger**: Požadavek na generování rozpočtu
2. **Získání dat**: Z databáze extrahovaných dat
3. **Generování rozpočtu**: Podle typu budovy a extrahovaných dat
4. **Uložení rozpočtu**: Do databáze
5. **Notifikace**: Informování uživatele o dokončení generování

## Uživatelské rozhraní

### Hlavní stránka
- Seznam projektů zobrazený jako karty
- Filtrování a vyhledávání projektů
- Tlačítko pro vytvoření nového projektu

### Detail projektu
- Základní informace o projektu
- Seznam nahraných souborů
- Vizualizace vztahů mezi soubory
- Tlačítko pro nahrání nového souboru
- Tlačítko pro generování rozpočtu

### Nahrávání souborů
- Drag & drop rozhraní
- Podpora pro více souborů najednou
- Zobrazení průběhu nahrávání
- Automatická detekce typu souboru

### Zobrazení rozpočtu
- Přehledná tabulka položek rozpočtu
- Filtrování a vyhledávání v položkách
- Možnost exportu do PDF nebo Excel
- Náhled prvních 2 stran zdarma

### Správa předplatného
- Přehled dostupných plánů
- Aktivace zkušební verze
- Platební brána pro aktivaci placeného předplatného
- Historie využití a fakturace

## Monetizační model

### Zkušební verze (1 měsíc zdarma)
- Maximálně 3 projekty
- Plný přístup ke všem funkcím
- Náhled prvních 2 stran rozpočtu zdarma

### Základní předplatné (1000 Kč/měsíc)
- Maximálně 10 projektů
- Projekty s komplexností do 5
- Export rozpočtů do PDF a Excel

### Profesionální předplatné (3000 Kč/měsíc)
- Maximálně 50 projektů
- Projekty s komplexností do 8
- Prioritní zpracování souborů

### Podnikové předplatné (8000 Kč/měsíc)
- Neomezený počet projektů
- Projekty s libovolnou komplexností
- Dedikovaná podpora

## Výpočet komplexnosti projektu

Komplexnost projektu je vypočítána na základě následujících faktorů:
1. **Typ budovy**: Obytná (1), Komerční (2), Průmyslová (3)
2. **Podlahová plocha**: 0-100m² (1), 101-500m² (2), 501-1000m² (3), 1001m²+ (4)
3. **Počet souborů**: 1-3 (1), 4-10 (2), 11+ (3)
4. **Typy souborů**: PDF (1), DWG (2), IFC (3)

Výsledná komplexnost je vážený průměr těchto faktorů:
```
komplexnost = (typ_budovy * 0.3) + (podlahova_plocha * 0.3) + (pocet_souboru * 0.2) + (max_typ_souboru * 0.2)
```

Výsledek je zaokrouhlen na celé číslo v rozsahu 1-10.
