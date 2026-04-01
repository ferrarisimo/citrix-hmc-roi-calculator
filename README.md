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

> Se in Azure Portal compare l’errore **“Basic authentication is disabled”** quando clicchi su
> **Download publish profile**, abilita temporaneamente la basic auth per il deployment:
>
> - Portal: **Web App → Deployment Center → FTPS credentials** e abilita
>   **SCM Basic Auth Publishing Credentials** (e, se necessario, **FTP Basic Auth Publishing Credentials**).
>
> Dopo il download del profilo puoi disabilitarla di nuovo per maggiore sicurezza.

1. In Azure Portal apri la tua Web App.
2. Vai su **Download publish profile** e scarica il file.
3. In GitHub: **Settings → Secrets and variables → Actions → New repository secret**.
4. Nome secret: `AZURE_WEBAPP_PUBLISH_PROFILE`.
5. Incolla il contenuto del profilo di pubblicazione.

### 4) Personalizza il nome app nella pipeline

Nel file `.github/workflows/azure-webapp.yml` sostituisci:

- `AZURE_WEBAPP_NAME` con il nome reale della tua web app.

### Troubleshooting: pagina bianca o download di `index.html`

Se il deploy va a buon fine ma la Web App mostra pagina bianca o scarica `index.html`, verifica questi punti:

1. **Startup command su Azure (Linux App Service)**

```bash
az webapp config set \
  --resource-group rg-citrix-roi \
  --name citrix-hmc-roi-webapp \
  --startup-file "pm2 serve /home/site/wwwroot --no-daemon --spa"
```

2. **Deploy del contenuto `dist/` alla root di wwwroot**

La pipeline è configurata per pubblicare esplicitamente `dist/` (non l'intero workspace del job) verso Azure Web App.

3. **Verifica in DevTools (Network/Console)**

Controlla che richieste come `/assets/*.js` e `/assets/*.css` rispondano con `200` e `content-type` corretto.

### 5) Deploy

Fai push su `main`: la pipeline builda la webapp e pubblica `dist/` su Azure Web App.
