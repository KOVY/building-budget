# Dokumentace pro nasazení aplikace Building Budget

Tato dokumentace poskytuje podrobné instrukce pro nasazení aplikace Building Budget, která umožňuje vytváření stavebních rozpočtů na základě souborů různých formátů (PDF, DWG, IFC).

## Obsah

1. [Přehled architektury](#přehled-architektury)
2. [Požadavky](#požadavky)
3. [Nasazení na GitHub](#nasazení-na-github)
4. [Nasazení na Replit](#nasazení-na-replit)
5. [Konfigurace n8n](#konfigurace-n8n)
6. [Propojení komponent](#propojení-komponent)
7. [Testování](#testování)
8. [Řešení problémů](#řešení-problémů)

## Přehled architektury

Aplikace Building Budget se skládá z následujících komponent:

- **Backend**: Node.js aplikace s Express.js, která poskytuje API pro správu projektů, souborů a rozpočtů
- **Frontend**: Webové rozhraní pro interakci s aplikací
- **Databáze**: SQL databáze pro ukládání dat
- **n8n**: Workflow automatizační nástroj pro zpracování souborů a generování rozpočtů

Architektura podporuje nahrávání více souborů v rámci jednoho projektu, extrakci dat z různých typů souborů a generování položkových rozpočtů.

## Požadavky

Pro nasazení aplikace budete potřebovat:

- **GitHub účet** pro správu kódu
- **Replit účet** pro hostování aplikace
- **n8n účet** pro automatizaci workflow
- **Node.js** (verze 14 nebo vyšší)
- **SQL databáze** (MySQL, PostgreSQL nebo SQLite)

## Nasazení na GitHub

### 1. Vytvoření repozitáře

1. Přihlaste se do svého GitHub účtu
2. Vytvořte nový repozitář s názvem "building-budget"
3. Naklonujte repozitář do lokálního prostředí:

```bash
git clone https://github.com/[vaše-uživatelské-jméno]/building-budget.git
cd building-budget
```

### 2. Nahrání kódu do repozitáře

1. Zkopírujte všechny soubory z lokální implementace do adresáře repozitáře
2. Přidejte soubory do Git, vytvořte commit a nahrajte na GitHub:

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

## Nasazení na Replit

### 1. Vytvoření nového projektu na Replit

1. Přihlaste se do svého Replit účtu
2. Klikněte na "Create" a vyberte "Import from GitHub"
3. Zadejte URL vašeho GitHub repozitáře
4. Vyberte "Node.js" jako jazyk projektu
5. Klikněte na "Import from GitHub"

### 2. Konfigurace projektu na Replit

1. Po importu projektu otevřete soubor `.replit` a upravte ho následovně:

```
language = "nodejs"
run = "npm start"
```

2. Vytvořte soubor `.env` pro konfiguraci prostředí:

```
# Databázová konfigurace
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=building_budget
DB_DIALECT=sqlite

# JWT konfigurace
JWT_SECRET=building-budget-secret
JWT_EXPIRATION=86400

# n8n konfigurace
N8N_BASE_URL=https://[vaše-n8n-instance].n8n.cloud
N8N_API_KEY=[váš-n8n-api-klíč]

# Port aplikace
PORT=3000
```

3. Nainstalujte závislosti a spusťte aplikaci:

```bash
npm install
npm start
```

### 3. Nastavení databáze

Pro SQLite (výchozí konfigurace):

1. Databáze bude automaticky vytvořena při prvním spuštění aplikace
2. Není potřeba žádná další konfigurace

Pro MySQL nebo PostgreSQL:

1. Vytvořte databázi na vašem databázovém serveru
2. Upravte konfiguraci v souboru `.env` podle vašeho databázového serveru

## Konfigurace n8n

### 1. Vytvoření n8n účtu

1. Zaregistrujte se na [n8n.io](https://n8n.io/)
2. Vytvořte novou instanci n8n

### 2. Import workflow

1. Přihlaste se do n8n
2. Klikněte na "Workflows" a poté na "Import from File"
3. Nahrajte soubor `n8n-workflow.json`, který jste poskytli
4. Uložte workflow

### 3. Konfigurace workflow

1. Otevřete importovaný workflow
2. Upravte HTTP Request nody tak, aby směřovaly na vaši Replit aplikaci:
   - Nahraďte URL `http://localhost:3000` za URL vaší Replit aplikace
3. Nastavte API klíč pro komunikaci mezi n8n a aplikací:
   - Vygenerujte náhodný řetězec jako API klíč
   - Přidejte tento klíč do hlaviček HTTP Request nodů
   - Stejný klíč nastavte v souboru `.env` na Replitu (N8N_API_KEY)
4. Aktivujte workflow kliknutím na "Active" přepínač

## Propojení komponent

### 1. Propojení Replit s n8n

1. V Replit aplikaci otevřete soubor `src/services/n8nIntegration.js`
2. Upravte konstanty `N8N_BASE_URL` a `N8N_WORKFLOW_IDS` podle vaší n8n instance:

```javascript
const N8N_BASE_URL = 'https://[vaše-n8n-instance].n8n.cloud';
const N8N_WORKFLOW_IDS = {
  FILE_PROCESSING: '[id-workflow-pro-zpracování-souborů]',
  BUDGET_GENERATION: '[id-workflow-pro-generování-rozpočtů]'
};
```

3. ID workflow najdete v URL při otevření workflow v n8n

### 2. Nastavení webhooků v n8n

1. V n8n otevřete workflow pro zpracování souborů
2. Najděte Webhook nody a zkopírujte jejich URL
3. V Replit aplikaci otevřete soubor `src/routes/n8nRoutes.js`
4. Upravte cesty pro webhooky tak, aby odpovídaly cestám v n8n

## Testování

### 1. Testování backend API

1. Použijte nástroj jako Postman nebo cURL pro testování API endpointů
2. Otestujte registraci a přihlášení uživatele
3. Otestujte vytvoření projektu
4. Otestujte nahrání souborů
5. Otestujte generování rozpočtu

### 2. Testování frontend rozhraní

1. Otevřete URL vaší Replit aplikace v prohlížeči
2. Zaregistrujte nového uživatele
3. Vytvořte nový projekt
4. Nahrajte soubory různých typů (PDF, DWG, IFC)
5. Vygenerujte rozpočet
6. Otestujte export rozpočtu

### 3. Testování n8n integrace

1. Nahrajte soubor do aplikace
2. Zkontrolujte, zda se v n8n spustil workflow pro zpracování souboru
3. Zkontrolujte, zda byla extrahovaná data uložena v aplikaci
4. Vygenerujte rozpočet a zkontrolujte, zda se spustil workflow pro generování rozpočtu

## Řešení problémů

### Problémy s připojením k databázi

- Zkontrolujte konfiguraci v souboru `.env`
- Ujistěte se, že databázový server je spuštěný a dostupný
- Zkontrolujte přístupová práva k databázi

### Problémy s n8n integrací

- Zkontrolujte, zda jsou workflow v n8n aktivní
- Zkontrolujte, zda URL a API klíče jsou správně nakonfigurovány
- Zkontrolujte logy v n8n pro případné chyby

### Problémy s Replit

- Restartujte Replit projekt
- Zkontrolujte logy v konzoli
- Ujistěte se, že všechny závislosti jsou správně nainstalovány

---

V případě dalších problémů nebo dotazů se obraťte na podporu nebo vytvořte issue v GitHub repozitáři.
