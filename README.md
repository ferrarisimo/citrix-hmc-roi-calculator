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

## Assessment condiviso e scenari economici

La navigazione inizia da **Assessment cliente**, unica fonte dei volumi, dei costi
unitari e dell'adozione attuale. I totali comprendono anche la quota già migrata:
8 host totali e 2 già su XenServer lasciano 6 host da migrare. I valori iniziali
sono esempi modificabili; l'adozione e gli obiettivi non hanno valori preimpostati.
I dati rimangono disponibili cambiando vista durante la sessione (non sono
salvati automaticamente dopo un ricaricamento della pagina).

- **Profilo New Business**: durata, prezzo HMC per utente/mese, migrazione base e
  costi residui. Gli eventuali costi per singolo intervento sono aggiuntivi al
  progetto base. Il confronto TCO parte dalla spesa residua dopo i benefici
  già conseguiti.
- **Profilo rinnovo**: offerta CPC/HMC, licenze, durata, costo proposto e rinnovo
  precedente. Il saving netto aggiuntivo viene confrontato sia con il costo
  totale sia con l'aumento del rinnovo.
- Ogni scenario ha obiettivi, fattibilità, percentuale di costo eliminabile,
  tempi e costi di completamento indipendenti. Il target è una quantità totale,
  inclusa la parte già implementata, non una quantità aggiuntiva.

### Base economica e formule

I costi comuni rappresentano il riferimento **prima** dei saving già conseguiti.
Per gli asset si inseriscono separatamente quantità implementate e beneficio
annuo verificato: una migrazione tecnica non comporta necessariamente la
cessazione del contratto precedente. Per l'effort IT il beneficio è valorizzato
come giorni risparmiati × costo giornata; rappresenta capacità liberata. Per le
voci espresse in €/anno il beneficio deriva direttamente dall'importo inserito.

Il saving aggiuntivo annuo è:

```
(target totale − già implementato) × costo unitario evitabile × quota eliminabile
```

Il risultato è limitato alla spesa residua dichiarata. Il beneficio sul periodo
considera i mesi successivi all'attivazione, sottraendo i costi di completamento.
Un dato mancante è distinto da zero; input incoerenti non producono saving. I
riepiloghi segnalano gli scenari parziali. Modificare il perimetro condiviso può
rendere non validi target precedentemente inseriti: non vengono corretti in modo
silenzioso.

- XenServer usa core medi per host e costo per core/anno; la quota eliminabile
  deve riflettere i costi effettivamente cancellabili sul contratto.
- NetScaler considera la manutenzione ricorrente. Un acquisto futuro evitato è
  esplicito e contato una volta; gli acquisti passati non generano saving.
- Unicon/eLux e lifecycle sono una sola leva. Il costo annuo target per endpoint
  può essere ricavato da costo di sostituzione / nuovo ciclo di vita.
- MFA, ZTNA, EDR, posture, SOC, remediation ed effort sono voci distinte: le basi
  economiche inserite non devono contenere gli stessi costi due volte.
- Le opportunità CPC manuali richiedono una base economica documentata separata;
  nessun valore monetario viene attribuito automaticamente al rischio.

Il modello attivo è `src/models/customerAssessmentModel.js`, condiviso da
entrambe le analisi. I moduli dei precedenti assessment rimangono nel repository,
ma non alimentano la nuova UI. I lettori e i CSV di compatibilità XenServer,
eLux e NetScaler sono indipendenti da questo flusso.

Verifiche locali: `npm test`, `npm run build`, `npm run validate:i18n-data`.
