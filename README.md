# Citrix HMC ROI Webapp

Webapp React + Vite per simulare il valore economico dell’adozione Citrix HMC con dashboard, scenari, ipotesi di costo e dettaglio dei calcoli.

## Avvio locale

Prerequisiti: Node.js 20+.

```bash
npm install
npm run dev
```

Build produzione:

```bash
npm run build
npm run preview
```

## Deploy su Azure Web App con GitHub Actions

Il repository include una pipeline GitHub Actions in `.github/workflows/azure-webapp.yml`.

### 1) Crea la Web App su Azure

Esempio con Azure CLI:

```bash
az login
az group create --name rg-citrix-roi --location westeurope
az appservice plan create --name plan-citrix-roi --resource-group rg-citrix-roi --sku B1 --is-linux
az webapp create --name <NOME_UNIVOCO_WEBAPP> --resource-group rg-citrix-roi --plan plan-citrix-roi --runtime "NODE:20-lts"
```

### 2) Configura startup command (una sola volta)

```bash
az webapp config set \
  --resource-group rg-citrix-roi \
  --name <NOME_UNIVOCO_WEBAPP> \
  --startup-file "pm2 serve /home/site/wwwroot --no-daemon --spa"
```

### 3) Aggiungi il secret su GitHub

1. In Azure Portal apri la tua Web App.
2. Vai su **Get publish profile** e scarica il file.
3. In GitHub: **Settings → Secrets and variables → Actions → New repository secret**.
4. Nome secret: `AZURE_WEBAPP_PUBLISH_PROFILE`.
5. Incolla il contenuto del profilo di pubblicazione.

### 4) Personalizza il nome app nella pipeline

Nel file `.github/workflows/azure-webapp.yml` sostituisci:

- `AZURE_WEBAPP_NAME` con il nome reale della tua web app.

### 5) Deploy

Fai push su `main`: la pipeline builda la webapp e pubblica `dist/` su Azure Web App.
